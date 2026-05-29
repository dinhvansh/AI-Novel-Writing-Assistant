import type { TFunction } from "i18next";
import type { WorldConsistencyIssue, WorldConsistencyReport } from "@ai-novel/shared/types/world";

// i18n-ignore: developer-only code labels
const ISSUE_CODE_LABELS_FALLBACK: Record<string, string> = {
  THEMATIC_INCOHERENCE: "THEMATIC_INCOHERENCE",
  REDUNDANT_AXIOM_APPLICATION: "REDUNDANT_AXIOM_APPLICATION",
  AXIOM_VIOLATION: "AXIOM_VIOLATION",
  GENRE_MISMATCH: "GENRE_MISMATCH",
  AXIOM_MAGIC_CONFLICT: "AXIOM_MAGIC_CONFLICT",
  TECH_ERA_MISMATCH: "TECH_ERA_MISMATCH",
  CONFLICT_WEAK: "CONFLICT_WEAK",
  BASELINE_PASS: "BASELINE_PASS",
};

function hasChinese(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

function localizeSummary(summary: string, status: WorldConsistencyReport["status"], issues: WorldConsistencyIssue[], t: TFunction): string {
  if (hasChinese(summary)) {
    return summary;
  }
  if (/Consistency check passed/i.test(summary)) {
    return t("novel:world.consistency.summary.passed");
  }
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warnCount = issues.filter((item) => item.severity === "warn").length;
  if (status === "error") {
    return t("novel:world.consistency.summary.hasErrors", { errorCount, warnCount });
  }
  if (status === "warn") {
    return t("novel:world.consistency.summary.hasWarnings", { warnCount });
  }
  return t("novel:world.consistency.summary.completed");
}

export function parseConsistencyReport(raw: string | null | undefined, issues: WorldConsistencyIssue[], t?: TFunction): WorldConsistencyReport | null {
  const tr: TFunction = t ?? ((key: string) => key) as unknown as TFunction;
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<WorldConsistencyReport>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const status = parsed.status === "error" || parsed.status === "warn" || parsed.status === "pass"
      ? parsed.status
      : "pass";
    return {
      worldId: typeof parsed.worldId === "string" ? parsed.worldId : "",
      score: typeof parsed.score === "number" ? parsed.score : 0,
      summary: localizeSummary(typeof parsed.summary === "string" ? parsed.summary : "", status, issues, tr),
      status,
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : undefined,
      issues,
    };
  } catch {
    return null;
  }
}

export function localizeConsistencySeverity(severity: WorldConsistencyIssue["severity"], t: TFunction): string {
  switch (severity) {
    case "error":
      return t("novel:world.consistency.severity.error");
    case "warn":
      return t("novel:world.consistency.severity.warn");
    case "pass":
      return t("novel:world.consistency.severity.pass");
    default:
      return severity;
  }
}

export function localizeConsistencyStatus(status: WorldConsistencyIssue["status"] | WorldConsistencyReport["status"], t: TFunction): string {
  switch (status) {
    case "open":
      return t("novel:world.consistency.status.open");
    case "resolved":
      return t("novel:world.consistency.status.resolved");
    case "ignored":
      return t("novel:world.consistency.status.ignored");
    case "error":
      return t("novel:world.consistency.status.error");
    case "warn":
      return t("novel:world.consistency.status.warn");
    case "pass":
      return t("novel:world.consistency.status.pass");
    default:
      return status;
  }
}

export function localizeConsistencySource(source: WorldConsistencyIssue["source"], t: TFunction): string {
  return source === "llm" ? t("novel:world.consistency.source.llm") : t("novel:world.consistency.source.rule");
}

export function localizeConsistencyField(targetField: string | null | undefined, t: TFunction): string {
  if (!targetField) {
    return t("novel:world.consistency.field.unspecified");
  }
  const key = `world:consistency.field.${targetField}`;
  const translated = t(key);
  // If translation key not found, t() returns the key itself — fall back to raw value
  return translated === key ? targetField : translated;
}

export function localizeConsistencyIssueTitle(code: string, t: TFunction): string {
  const key = `world:consistency.issueCode.${code}`;
  const translated = t(key);
  return translated === key ? (ISSUE_CODE_LABELS_FALLBACK[code] ?? code) : translated;
}

export function localizeConsistencyIssueMessage(issue: WorldConsistencyIssue, t: TFunction): string {
  if (hasChinese(issue.message)) {
    return issue.message;
  }
  const key = `world:consistency.issueMessage.${issue.code}`;
  const translated = t(key);
  if (translated !== key) {
    return translated;
  }
  return t("novel:world.consistency.issueMessage.fallback", { field: localizeConsistencyField(issue.targetField, t) });
}

export function localizeConsistencyIssueDetail(issue: WorldConsistencyIssue, t: TFunction): string | null {
  if (issue.detail && hasChinese(issue.detail)) {
    return issue.detail;
  }
  const key = `world:consistency.issueDetail.${issue.code}`;
  const translated = t(key);
  if (translated !== key) {
    return translated;
  }
  if (issue.detail) {
    return t("novel:world.consistency.issueDetail.fallback", { field: localizeConsistencyField(issue.targetField, t) });
  }
  return null;
}
