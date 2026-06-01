import { Router } from "express";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import { z } from "zod";
import { llmProviderSchema } from "../llm/providerSchema";
import { authMiddleware } from "../middleware/auth";
import { tError } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { streamToSSE } from "../llm/streaming";
import { WritingFormulaService } from "../services/writingFormula/WritingFormulaService";

const router = Router();
const writingFormulaService = new WritingFormulaService();

const idSchema = z.object({
  id: z.string().trim().min(1),
});

const extractSchema = z.object({
  name: z.string().trim().min(1),
  sourceText: z.string().trim().min(1),
  extractLevel: z.enum(["basic", "standard", "deep"]),
  focusAreas: z.array(z.string().trim().min(1)).min(1),
  provider: llmProviderSchema.optional(),
  model: z.string().optional(),
});

const applySchema = z
  .object({
    formulaId: z.string().trim().optional(),
    formulaContent: z.string().optional(),
    mode: z.enum(["rewrite", "generate"]),
    sourceText: z.string().optional(),
    topic: z.string().optional(),
    targetLength: z.number().int().min(100).max(8000).optional(),
    provider: llmProviderSchema.optional(),
    model: z.string().optional(),
  })
  .refine((value) => value.formulaId || value.formulaContent, {
    message: "必须提供 formulaId 或 formulaContent。", // i18n-ignore-internal-log: Zod refine message
    path: ["formulaId"],
  });

router.use(authMiddleware);

router.get("/", async (_req, res, next) => {
  try {
    const data = await writingFormulaService.listFormulas();
    res.status(200).json({
      success: true,
      data,
      message: "获取写作公式列表成功。" // i18n-ignore-internal-log: API success message, not user-facing
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validate({ params: idSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idSchema>;
    const data = await writingFormulaService.getFormulaById(id);
    if (!data) {
      res.status(404).json({
        success: false,
        error: tError(res, "writingFormulaNotFound", undefined, "\u5199\u4f5c\u516c\u5f0f\u4e0d\u5b58\u5728\u3002"), // i18n-ignore: tError fallback
      } satisfies ApiResponse<null>);
      return;
    }
    res.status(200).json({
      success: true,
      data,
      message: "获取写作公式详情成功。" // i18n-ignore-internal-log: API success message, not user-facing
    } satisfies ApiResponse<typeof data>);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", validate({ params: idSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idSchema>;
    await writingFormulaService.deleteFormula(id);
    res.status(200).json({
      success: true,
      message: "删除写作公式成功。" // i18n-ignore-internal-log: API success message, not user-facing
    } satisfies ApiResponse<null>);
  } catch (error) {
    next(error);
  }
});

router.post("/extract", validate({ body: extractSchema }), async (req, res, next) => {
  try {
    const { stream, onDone } = await writingFormulaService.createExtractStream(
      req.body as z.infer<typeof extractSchema>,
    );
    await streamToSSE(res, stream, onDone);
  } catch (error) {
    next(error);
  }
});

router.post("/apply", validate({ body: applySchema }), async (req, res, next) => {
  try {
    const { stream } = await writingFormulaService.createApplyStream(
      req.body as z.infer<typeof applySchema>,
    );
    await streamToSSE(res, stream);
  } catch (error) {
    next(error);
  }
});

export default router;
