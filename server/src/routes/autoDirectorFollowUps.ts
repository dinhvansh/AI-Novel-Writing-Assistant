import { Router } from "express";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import type { LocaleCode } from "@ai-novel/shared/localization";
import { z } from "zod";
import {
  AUTO_DIRECTOR_FOLLOW_UP_REASONS,
} from "@ai-novel/shared/types/autoDirectorFollowUp";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AutoDirectorFollowUpActionExecutor } from "../services/task/autoDirectorFollowUps/AutoDirectorFollowUpActionExecutor";
import { AutoDirectorFollowUpService } from "../services/task/autoDirectorFollowUps/AutoDirectorFollowUpService";
import { localizeDirectorString, localizeTaskPayload } from "../services/localization/DirectorPayloadLocalizer";

const router = Router();
const followUpService = new AutoDirectorFollowUpService();
const actionExecutor = new AutoDirectorFollowUpActionExecutor();

const reasonSchema = z.enum(AUTO_DIRECTOR_FOLLOW_UP_REASONS);

const statusSchema = z.enum(["queued", "running", "waiting_approval", "succeeded", "failed", "cancelled"]);

const channelTypeSchema = z.enum(["dingtalk", "wecom"]);

const sectionSchema = z.enum(["pending", "auto_progress", "exception", "replaced", "needs_validation"]);

const listQuerySchema = z.object({
  section: sectionSchema.optional(),
  reason: reasonSchema.optional(),
  status: statusSchema.optional(),
  novelId: z.string().trim().optional(),
  supportsBatch: z.coerce.boolean().optional(),
  channelType: channelTypeSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const taskParamsSchema = z.object({
  taskId: z.string().trim().min(1),
});

const singleActionBodySchema = z.object({
  actionCode: z.enum([
    "continue_auto_execution",
    "continue_generic",
    "retry_with_task_model",
    "retry_with_route_model",
    "safe_fix_validation",
  ]),
  idempotencyKey: z.string().trim().min(1),
});

const batchActionBodySchema = z.object({
  actionCode: z.enum([
    "continue_auto_execution",
    "retry_with_task_model",
  ]),
  taskIds: z.array(z.string().trim().min(1)).min(1),
  batchRequestKey: z.string().trim().min(1),
});

function resolveOperatorId(): string {
  return "anonymous";
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

router.use(authMiddleware);

router.get("/overview", async (_req, res, next) => {
  try {
    const data = await followUpService.getOverview();
    res.status(200).json({
      success: true,
      data,
      message: "Follow-up overview loaded.",
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.post("/batch-actions", validate({ body: batchActionBodySchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof batchActionBodySchema>;
    const data = await actionExecutor.executeBatch({
      actionCode: body.actionCode,
      taskIds: body.taskIds,
      source: "web",
      operatorId: resolveOperatorId(),
      batchRequestKey: body.batchRequestKey,
    });
    res.status(200).json({
      success: true,
      data,
      message: data.code === "partial_success"
        ? "Batch actions partially completed."
        : "Batch actions completed.",
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const data = await followUpService.list(query);
    const locale = (res.locals as { locale?: LocaleCode }).locale ?? "vi-VN";
    const localizedData = {
      ...data,
      items: Array.isArray(data.items)
        ? data.items.map((item) => localizeFollowUpDetail(item as unknown as Record<string, unknown>, locale))
        : data.items,
    };
    res.status(200).json({
      success: true,
      data: localizedData,
      message: "Follow-ups loaded.",
    } satisfies ApiResponse<typeof localizedData>);
  } catch (error) {
    next(error);
  }
});

router.get("/:taskId", validate({ params: taskParamsSchema }), async (req, res, next) => {
  try {
    const { taskId } = req.params as z.infer<typeof taskParamsSchema>;
    const data = await followUpService.getDetail(taskId);
    if (!data) {
      res.status(404).json({
        success: false,
        error: "Follow-up not found.",
      } satisfies ApiResponse<null>);
      return;
    }
    const locale = (res.locals as { locale?: LocaleCode }).locale ?? "vi-VN";
    const localizedData = localizeFollowUpDetail(data as unknown as Record<string, unknown>, locale);
    res.status(200).json({
      success: true,
      data: localizedData,
      message: "Follow-up detail loaded.",
    } satisfies ApiResponse<typeof localizedData>);
  } catch (error) {
    next(error);
  }
});

router.get("/:taskId/revalidation", validate({ params: taskParamsSchema }), async (req, res, next) => {
  try {
    const { taskId } = req.params as z.infer<typeof taskParamsSchema>;
    const data = await followUpService.getDetail(taskId, {
      heal: false,
    });
    if (!data) {
      res.status(404).json({
        success: false,
        error: "Follow-up not found.",
      } satisfies ApiResponse<null>);
      return;
    }
    const locale = (res.locals as { locale?: LocaleCode }).locale ?? "vi-VN";
    const localizedData = localizeFollowUpDetail(data as unknown as Record<string, unknown>, locale);
    res.status(200).json({
      success: true,
      data: localizedData,
      message: "Follow-up validation refreshed.",
    } satisfies ApiResponse<typeof localizedData>);
  } catch (error) {
    next(error);
  }
});

router.post("/:taskId/actions", validate({ params: taskParamsSchema, body: singleActionBodySchema }), async (req, res, next) => {
  try {
    const { taskId } = req.params as z.infer<typeof taskParamsSchema>;
    const body = req.body as z.infer<typeof singleActionBodySchema>;
    const data = await actionExecutor.execute({
      directorTaskId: taskId,
      taskId,
      actionCode: body.actionCode,
      source: "web",
      operatorId: resolveOperatorId(),
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

export default router;
