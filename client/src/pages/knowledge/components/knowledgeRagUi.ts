import i18n from "i18next";
import type { RagJobSummary } from "@/api/knowledge";

export function formatStatus(status: string): string {
  switch (status) {
    case "enabled":
      return i18n.t("knowledge:ragUi.statusEnabled");
    case "disabled":
      return i18n.t("knowledge:ragUi.statusDisabled");
    case "archived":
      return i18n.t("knowledge:ragUi.statusArchived");
    case "idle":
      return i18n.t("knowledge:ragUi.statusIdle");
    case "queued":
      return i18n.t("knowledge:ragUi.statusQueued");
    case "running":
      return i18n.t("knowledge:ragUi.statusRunning");
    case "succeeded":
      return i18n.t("knowledge:ragUi.statusSucceeded");
    case "failed":
      return i18n.t("knowledge:ragUi.statusFailed");
    default:
      return status;
  }
}

export function getRagJobProgressPercent(job: RagJobSummary): number {
  const raw = job.progress?.percent ?? (job.status === "succeeded" ? 1 : 0);
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export function getRagJobProgressWidth(job: RagJobSummary): string {
  const percent = getRagJobProgressPercent(job);
  if (job.status === "queued" || job.status === "running") {
    return `${Math.max(percent, 6)}%`;
  }
  return `${percent}%`;
}

export function formatRagJobMeta(job: RagJobSummary): string {
  const parts = [job.jobType, i18n.t("knowledge:ragUi.attempts", { current: job.attempts, max: job.maxAttempts })];
  if (job.progress?.current !== undefined && job.progress?.total !== undefined && job.progress.total > 0) {
    parts.push(`${job.progress.current}/${job.progress.total}`);
  }
  if (job.progress?.chunks) {
    parts.push(i18n.t("knowledge:ragUi.chunks", { count: job.progress.chunks }));
  }
  if (job.progress?.documents) {
    parts.push(i18n.t("knowledge:ragUi.documents", { count: job.progress.documents }));
  }
  return parts.join(" | ");
}
