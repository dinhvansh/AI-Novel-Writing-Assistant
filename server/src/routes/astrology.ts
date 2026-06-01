import { Router } from "express";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import { authMiddleware } from "../middleware/auth";
import { tError } from "../middleware/errorHandler";

const router = Router();

router.use(authMiddleware);

router.get("/", (_req, res) => {
  const response: ApiResponse<null> = {
    success: false,
    error: tError(res, "astrologyNotImplemented", undefined, "\u5360\u661f\u6a21\u5757\u6682\u672a\u5b9e\u73b0\u3002"), // i18n-ignore: tError fallback
  };
  res.status(501).json(response);
});

export default router;
