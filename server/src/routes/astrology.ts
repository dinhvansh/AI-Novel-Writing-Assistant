import { Router } from "express";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import { authMiddleware } from "../middleware/auth";
import { tError } from "../middleware/errorHandler";

const router = Router();

router.use(authMiddleware);

router.get("/", (_req, res) => {
  const response: ApiResponse<null> = {
    success: false,
    error: tError(res, "astrologyNotImplemented", undefined, "占星模块暂未实现。"), // i18n-ignore: TODO Phase 4
  };
  res.status(501).json(response);
});

export default router;
