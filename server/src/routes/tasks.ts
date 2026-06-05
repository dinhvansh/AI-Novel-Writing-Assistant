import { Router } from "express";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import type { TaskKind, TaskStatus, UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import type { LocaleCode } from "@ai-novel/shared/localization";
import { z } from "zod";
import { llmProviderSchema } from "../llm/providerSchema";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { recoveryTaskService } from "../services/task/RecoveryTaskService";
import { AutoDirectorFollowUpActionExecutor } from "../services/task/autoDirectorFollowUps/AutoDirectorFollowUpActionExecutor";
import { AutoDirectorFollowUpService } from "../services/task/autoDirectorFollowUps/AutoDirectorFollowUpService";
import { taskCenterService } from "../services/task/TaskCenterService";
import { getI18nServerHandle } from "../i18n";
import { localizeDirectorString, localizeTaskPayload } from "../services/localization/DirectorPayloadLocalizer";

function localizeStepLabel(key: string, fallback: string, locale: LocaleCode): string {
  const handle = getI18nServerHandle();
  if (!handle) return fallback;
  const result = handle.t("serverLogs", `workflowStages.${key}`, { lng: locale });
  if (typeof result === "string" && result !== `serverLogs:workflowStages.${key}`) return result;
  return fallback;
}

function localizeTaskDetail(data: UnifiedTaskDetail, locale: LocaleCode): UnifiedTaskDetail {
  // Localize step labels
  const withSteps = data.steps && data.steps.length > 0
    ? {
        ...data,
        steps: data.steps.map((step) => ({
          ...step,
          label: localizeStepLabel(step.key, step.label, locale),
        })),
      }
    : data;
  // Localize user-facing payload fields
  return localizeTaskPayload(withSteps as unknown as Record<string, unknown>, locale) as unknown as UnifiedTaskDetail;
}

function localizeFollowUpDetail<T extends Record<string, unknown>>(data: T, locale: LocaleCode): T {
  const result = { ...data };
  const topLevelFields = [
    "reasonLabel",
    "currentStage",
    "followUpSummary",
    "checkpointSummary",
    "blockingReason",
    "nextStepSuggestion",
    "validationSummary",
    "riskNote",
    "failureDetails",
  ] as const;
  for (const field of topLevelFields) {
    const value = result[field];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[field] = localizeDirectorString(value, locale) ?? value;
    }
  }
  if (Array.isArray(result.availableActions)) {
    (result as Record<string, unknown>).availableActions = result.availableActions.map((action: unknown) => {
      if (!action || typeof action !== "object") return action;
      const record = action as Record<string, unknown>;
      return {
        ...record,
        label: typeof record.label === "string"
          ? (localizeDirectorString(record.label, locale) ?? record.label)
          : record.label,
      };
    });
  }
  if (Array.isArray(result.milestones)) {
    (result as Record<string, unknown>).milestones = result.milestones.map((milestone: unknown) => {
      if (!milestone || typeof milestone !== "object") return milestone;
      const record = milestone as Record<string, unknown>;
      return {
        ...record,
        summary: typeof record.summary === "string"
          ? (localizeDirectorString(record.summary, locale) ?? record.summary)
          : record.summary,
      };
    });
  }
  const validationSummary = result.validationSummary;
  if (validationSummary && typeof validationSummary === "object" && !Array.isArray(validationSummary)) {
    const record = validationSummary as Record<string, unknown>;
    (result as Record<string, unknown>).validationSummary = {
      ...record,
      blockingReasons: Array.isArray(record.blockingReasons)
        ? record.blockingReasons.map((reason) => typeof reason === "string" ? (localizeDirectorString(reason, locale) ?? reason) : reason)
        : record.blockingReasons,
      warnings: Array.isArray(record.warnings)
        ? record.warnings.map((warning) => typeof warning === "string" ? (localizeDirectorString(warning, locale) ?? warning) : warning)
        : record.warnings,
      requiredActions: Array.isArray(record.requiredActions)
        ? record.requiredActions.map((action: unknown) => {
            if (!action || typeof action !== "object") return action;
            const actionRecord = action as Record<string, unknown>;
            return {
              ...actionRecord,
              label: typeof actionRecord.label === "string"
                ? (localizeDirectorString(actionRecord.label, locale) ?? actionRecord.label)
                : actionRecord.label,
            };
          })
        : record.requiredActions,
      affectedScope: record.affectedScope && typeof record.affectedScope === "object" && !Array.isArray(record.affectedScope)
        ? {
            ...(record.affectedScope as Record<string, unknown>),
            label: typeof (record.affectedScope as Record<string, unknown>).label === "string"
              ? (localizeDirectorString((record.affectedScope as Record<string, unknown>).label as string, locale)
                ?? (record.affectedScope as Record<string, unknown>).label)
              : (record.affectedScope as Record<string, unknown>).label,
          }
        : record.affectedScope,
    };
  }
  if (result.task && typeof result.task === "object" && !Array.isArray(result.task)) {
    (result as Record<string, unknown>).task = localizeTaskPayload(result.task as Record<string, unknown>, locale);
  }
  if (Array.isArray(result.steps)) {
    (result as Record<string, unknown>).steps = result.steps.map((step: unknown) => {
      if (!step || typeof step !== "object") return step;
      const record = step as Record<string, unknown>;
      return {
        ...record,
        label: typeof record.label === "string"
          ? (localizeDirectorString(record.label, locale) ?? record.label)
          : record.label,
      };
    });
  }
  return result;
}

const router = Router();
const autoDirectorFollowUpService = new AutoDirectorFollowUpService();
const autoDirectorFollowUpActionExecutor = new AutoDirectorFollowUpActionExecutor();

const kindSchema = z.enum(["book_analysis", "novel_pipeline", "knowledge_document", "image_generation", "agent_run", "novel_workflow", "style_extraction"]);
const statusSchema = z.enum(["queued", "running", "waiting_approval", "succeeded", "failed", "cancelled"]);

const listQuerySchema = z.object({
  kind: kindSchema.optional(),
  status: statusSchema.optional(),
  keyword: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().trim().optional(),
});

const taskParamsSchema = z.object({
  kind: kindSchema,
  id: z.string().trim().min(1),
});

const retryBodySchema = z.object({
  llmOverride: z.object({
    provider: llmProviderSchema.optional(),
    model: z.string().trim().min(1).optional(),
    temperature: z.number().finite().min(0).max(2).optional(),
  }).optional(),
  resume: z.boolean().optional(),
  batchAlreadyStartedCount: z.number().int().min(0).optional(),
});

const recoveryTaskKindSchema = z.enum(["book_analysis", "novel_pipeline", "image_generation", "novel_workflow", "style_extraction"]);

const recoveryTaskParamsSchema = z.object({
  kind: recoveryTaskKindSchema,
  id: z.string().trim().min(1),
});

const autoDirectorFollowUpParamsSchema = z.object({
  taskId: z.string().trim().min(1),
});

const autoDirectorFollowUpActionBodySchema = z.object({
  actionCode: z.enum([
    "continue_auto_execution",
    "continue_generic",
    "retry_with_task_model",
    "retry_with_route_model",
  ]),
  idempotencyKey: z.string().trim().min(1),
});

router.use(authMiddleware);

router.get("/overview", async (_req, res, next) => {
  try {
    const data = await taskCenterService.getOverview();
    res.status(200).json({
      success: true,
      data,
      message: "Task overview loaded.",
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.get("/recovery-candidates", async (_req, res, next) => {
  try {
    const data = await recoveryTaskService.listRecoveryCandidates();
    const locale = (res.locals as { locale?: LocaleCode }).locale ?? "vi-VN";
    const localizedData = {
      ...data,
      items: Array.isArray(data.items)
        ? data.items.map((item: unknown) => localizeTaskPayload(item as Record<string, unknown>, locale))
        : data.items,
    };
    res.status(200).json({
      success: true,
      data: localizedData,
      message: "Recovery candidates loaded.",
    } satisfies ApiResponse<typeof localizedData>);
  } catch (error) {
    next(error);
  }
});

router.post("/recovery-candidates/resume-all", async (_req, res, next) => {
  try {
    const resumed = await recoveryTaskService.startResumeAllRecoveryCandidates();
    res.status(202).json({
      success: true,
      data: { resumed },
      message: "Recovery candidates resume accepted.",
    } satisfies ApiResponse<{ resumed: typeof resumed }>);
  } catch (error) {
    next(error);
  }
});

router.post("/recovery-candidates/:kind/:id/resume", validate({ params: recoveryTaskParamsSchema }), async (req, res, next) => {
  try {
    const { kind, id } = req.params as z.infer<typeof recoveryTaskParamsSchema>;
    const command = await recoveryTaskService.startResumeRecoveryCandidate(kind, id);
    const data = { kind, id, command };
    res.status(202).json({
      success: true,
      data,
      message: "Recovery candidate resume accepted.",
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.get("/auto-director-follow-ups/:taskId", validate({ params: autoDirectorFollowUpParamsSchema }), async (req, res, next) => {
  try {
    const { taskId } = req.params as z.infer<typeof autoDirectorFollowUpParamsSchema>;
    const readonly = req.query.revalidate === "true";
    const data = await autoDirectorFollowUpService.getDetail(taskId, {
      heal: !readonly,
    });
    if (!data) {
      res.status(404).json({
        success: false,
        error: "Auto director follow-up not found.",
      } satisfies ApiResponse<null>);
      return;
    }
    const locale = (res.locals as { locale?: LocaleCode }).locale ?? "vi-VN";
    const localizedData = localizeFollowUpDetail(data as unknown as Record<string, unknown>, locale);
    res.status(200).json({
      success: true,
      data: localizedData,
      message: "Auto director follow-up loaded.",
    } satisfies ApiResponse<typeof localizedData>);
  } catch (error) {
    next(error);
  }
});

router.post("/auto-director-follow-ups/:taskId/actions", validate({
  params: autoDirectorFollowUpParamsSchema,
  body: autoDirectorFollowUpActionBodySchema,
}), async (req, res, next) => {
  try {
    const { taskId } = req.params as z.infer<typeof autoDirectorFollowUpParamsSchema>;
    const body = req.body as z.infer<typeof autoDirectorFollowUpActionBodySchema>;
    const data = await autoDirectorFollowUpActionExecutor.execute({
      directorTaskId: taskId,
      taskId,
      actionCode: body.actionCode,
      source: "web",
      operatorId: "anonymous",
      idempotencyKey: body.idempotencyKey,
    });
    res.status(200).json({
      success: true,
      data,
      message: data.message,
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const data = await taskCenterService.listTasks({
      kind: query.kind as TaskKind | undefined,
      status: query.status as TaskStatus | undefined,
      keyword: query.keyword,
      limit: query.limit,
      cursor: query.cursor,
    });
    const locale = (res.locals as { locale?: LocaleCode }).locale ?? "vi-VN";
    const localizedData = {
      ...data,
      items: Array.isArray(data.items)
        ? data.items.map((item: unknown) => localizeTaskPayload(item as Record<string, unknown>, locale))
        : data.items,
    };
    res.status(200).json({
      success: true,
      data: localizedData,
      message: "Tasks loaded.",
    } satisfies ApiResponse<typeof localizedData>);
  } catch (error) {
    next(error);
  }
});

router.get("/:kind/:id", validate({ params: taskParamsSchema }), async (req, res, next) => {
  try {
    const { kind, id } = req.params as z.infer<typeof taskParamsSchema>;
    const data = await taskCenterService.getTaskDetail(kind, id);
    if (!data) {
      res.status(404).json({
        success: false,
        error: "Task not found.",
      } satisfies ApiResponse<null>);
      return;
    }
    const locale = (res.locals as { locale?: LocaleCode }).locale ?? "vi-VN";
    const localizedData = localizeTaskDetail(data, locale);
    res.status(200).json({
      success: true,
      data: localizedData,
      message: "Task loaded.",
    } satisfies ApiResponse<typeof localizedData>);
  } catch (error) {
    next(error);
  }
});

router.post("/:kind/:id/retry", validate({ params: taskParamsSchema, body: retryBodySchema }), async (req, res, next) => {
  try {
    const { kind, id } = req.params as z.infer<typeof taskParamsSchema>;
    const body = req.body as z.infer<typeof retryBodySchema>;
    const data = await taskCenterService.retryTask(kind, id, {
      llmOverride: body.llmOverride,
      resume: body.resume,
      batchAlreadyStartedCount: body.batchAlreadyStartedCount,
    });
    res.status(200).json({
      success: true,
      data,
      message: "Task retried.",
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.post("/:kind/:id/cancel", validate({ params: taskParamsSchema }), async (req, res, next) => {
  try {
    const { kind, id } = req.params as z.infer<typeof taskParamsSchema>;
    const data = await taskCenterService.cancelTask(kind, id);
    res.status(200).json({
      success: true,
      data,
      message: "Task cancelled.",
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.post("/:kind/:id/archive", validate({ params: taskParamsSchema }), async (req, res, next) => {
  try {
    const { kind, id } = req.params as z.infer<typeof taskParamsSchema>;
    const data = await taskCenterService.archiveTask(kind, id);
    res.status(200).json({
      success: true,
      data,
      message: "Task archived.",
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

export default router;
