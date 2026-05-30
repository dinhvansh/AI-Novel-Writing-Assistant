import type { TFunction } from "i18next";
import type { BookAnalysisDetail, BookAnalysisSection, BookAnalysisStatus } from "@ai-novel/shared/types/bookAnalysis";
import type { SectionDraft } from "./bookAnalysis.types";

export function formatStatus(status: BookAnalysisStatus | BookAnalysisSection["status"], t: TFunction): string {
  switch (status) {
    case "draft": return t("bookAnalysis:utils.status.draft");
    case "queued": return t("bookAnalysis:utils.status.queued");
    case "running": return t("bookAnalysis:utils.status.running");
    case "succeeded": return t("bookAnalysis:utils.status.succeeded");
    case "failed": return t("bookAnalysis:utils.status.failed");
    case "archived": return t("bookAnalysis:utils.status.archived");
    case "idle": return t("bookAnalysis:utils.status.idle");
    default: return status;
  }
}

export function formatStage(stage: string | null | undefined, t: TFunction): string {
  switch (stage) {
    case "loading_cache": return t("bookAnalysis:utils.stage.loading_cache");
    case "preparing_notes": return t("bookAnalysis:utils.stage.preparing_notes");
    case "generating_sections": return t("bookAnalysis:utils.stage.generating_sections");
    default: return stage?.trim() || t("bookAnalysis:utils.stage.none");
  }
}

export function formatDate(value: string | null | undefined, t: TFunction): string {
  if (!value) {
    return t("bookAnalysis:utils.date.none");
  }
  return new Date(value).toLocaleString();
}

export function syncDrafts(detail: BookAnalysisDetail): Record<string, SectionDraft> {
  return Object.fromEntries(
    detail.sections.map((section) => [
      section.id,
      {
        editedContent: section.editedContent ?? section.aiContent ?? "",
        notes: section.notes ?? "",
        frozen: section.frozen,
        optimizeInstruction: "",
        optimizePreview: "",
      },
    ]),
  );
}

export function createDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildSectionDraft(section: BookAnalysisSection): SectionDraft {
  return {
    editedContent: section.editedContent ?? section.aiContent ?? "",
    notes: section.notes ?? "",
    frozen: section.frozen,
    optimizeInstruction: "",
    optimizePreview: "",
  };
}
