import type { Router } from "express";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import { z } from "zod";
import { initSSE, streamToSSE, writeSSEFrame } from "../../../../llm/streaming";
import { validate } from "../../../../middleware/validate";
import {
  inspirationSchema,
  libraryCreateSchema,
  libraryListQuerySchema,
  libraryUseParamsSchema,
  libraryUseSchema,
  requireWorldWizard,
  worldGenerateSchema,
  worldRefineSchema,
  worldIdSchema,
  worldService,
} from "./worldHttpContext";
import { DEFAULT_LOCALE, type LocaleCode } from "@ai-novel/shared/localization";
import { getI18nServerHandle } from "../../../../i18n";
import { getCurrentRequestLocale } from "../../../../runtime/requestLocaleContext";

function tWorld(key: string, res: { locals: Record<string, unknown> }): string {
  const handle = getI18nServerHandle();
  if (!handle) return key;
  const locale: LocaleCode = (res.locals.locale as LocaleCode) ?? getCurrentRequestLocale() ?? DEFAULT_LOCALE;
  return handle.t("world", key, { lng: locale });
}

export function registerGenerationWorldRoutes(router: Router): void {
  router.get("/templates", requireWorldWizard, async (_req, res, next) => {
    try {
      const data = await worldService.getTemplates();
      const handle = getI18nServerHandle();
      const locale: LocaleCode = (res.locals.locale as LocaleCode) ?? getCurrentRequestLocale() ?? DEFAULT_LOCALE;
      const localizedData = handle ? data.map((template) => ({
        ...template,
        name: handle.t("world", `templates.${template.key}.name`, { lng: locale, defaultValue: template.name }),
        description: handle.t("world", `templates.${template.key}.description`, { lng: locale, defaultValue: template.description }),
        classicElements: template.classicElements.map((el) =>
          handle.t("world", `templates.${template.key}.classicElements.${el}`, { lng: locale, defaultValue: el }),
        ),
        pitfalls: template.pitfalls.map((p) =>
          handle.t("world", `templates.${template.key}.pitfalls.${p}`, { lng: locale, defaultValue: p }),
        ),
      })) : data;
      res.status(200).json({
        success: true,
        data: localizedData,
        message: "Templates loaded.",
      } satisfies ApiResponse<typeof localizedData>);
    } catch (error) {
      next(error);
    }
  });

  router.post("/inspiration/analyze", requireWorldWizard, validate({ body: inspirationSchema }), async (req, res, next) => {
    try {
      const data = await worldService.analyzeInspiration(req.body as z.infer<typeof inspirationSchema>);
      res.status(200).json({
        success: true,
        data,
        message: "Inspiration analyzed.",
      } satisfies ApiResponse<typeof data>);
    } catch (error) {
      next(error);
    }
  });

  router.get("/library", requireWorldWizard, validate({ query: libraryListQuerySchema }), async (req, res, next) => {
    try {
      const query = libraryListQuerySchema.parse(req.query);
      const data = await worldService.listLibrary(query);
      res.status(200).json({
        success: true,
        data,
        message: "Library loaded.",
      } satisfies ApiResponse<typeof data>);
    } catch (error) {
      next(error);
    }
  });

  router.post("/library", requireWorldWizard, validate({ body: libraryCreateSchema }), async (req, res, next) => {
    try {
      const data = await worldService.createLibraryItem(req.body as z.infer<typeof libraryCreateSchema>);
      res.status(201).json({
        success: true,
        data,
        message: "Library item created.",
      } satisfies ApiResponse<typeof data>);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/library/:libraryId/use",
    requireWorldWizard,
    validate({ params: libraryUseParamsSchema, body: libraryUseSchema }),
    async (req, res, next) => {
      try {
        const { libraryId } = req.params as z.infer<typeof libraryUseParamsSchema>;
        const data = await worldService.useLibraryItem(libraryId, req.body as z.infer<typeof libraryUseSchema>);
        res.status(200).json({
          success: true,
          data,
          message: "Library item used.",
        } satisfies ApiResponse<typeof data>);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post("/generate", validate({ body: worldGenerateSchema }), async (req, res, next) => {
    try {
      const { stream, onDone } = await worldService.createWorldGenerateStream(
        req.body as z.infer<typeof worldGenerateSchema>,
      );
      await streamToSSE(res, stream, onDone);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/inspiration/analyze/stream",
    requireWorldWizard,
    validate({ body: inspirationSchema }),
    async (req, res) => {
      const runId = `world-inspiration-${Date.now()}`;
      const disposeHeartbeat = initSSE(res);
      const body = req.body as z.infer<typeof inspirationSchema>;
      const isReferenceMode = body.mode === "reference";

      try {
        writeSSEFrame(res, {
          type: "run_status",
          runId,
          status: "queued",
          message: isReferenceMode ? tWorld("generator.sseStatus.startedReference", res) : tWorld("generator.sseStatus.startedFree", res),
        });

        const data = await worldService.analyzeInspiration(
          body,
          (message) => {
            writeSSEFrame(res, {
              type: "run_status",
              runId,
              status: "running",
              message,
            });
          },
        );

        writeSSEFrame(res, {
          type: "run_status",
          runId,
          status: "succeeded",
          message: isReferenceMode ? tWorld("generator.sseStatus.succeededReference", res) : tWorld("generator.sseStatus.succeededFree", res),
        });
        writeSSEFrame(res, {
          type: "done",
          fullContent: JSON.stringify(data),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : tWorld("generator.sseStatus.failed", res);
        writeSSEFrame(res, {
          type: "run_status",
          runId,
          status: "failed",
          message,
        });
        writeSSEFrame(res, {
          type: "error",
          error: message,
        });
      } finally {
        disposeHeartbeat();
        if (!res.writableEnded) {
          res.end();
        }
      }
    },
  );

  router.post("/:id/refine", validate({ params: worldIdSchema, body: worldRefineSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof worldIdSchema>;
      const { stream, onDone } = await worldService.createRefineStream(
        id,
        req.body as z.infer<typeof worldRefineSchema>,
      );
      await streamToSSE(res, stream, onDone);
    } catch (error) {
      next(error);
    }
  });
}
