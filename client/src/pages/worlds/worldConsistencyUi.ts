import type { TFunction } from "i18next";
import type { WorldConsistencyIssue, WorldConsistencyReport } from "@ai-novel/shared/types/world";

// i18n-ignore: developer-only code labels
const ISSUE_CODE_LABELS_FALLBACK: Record<string, string> = {
  THEMATIC_INCOHERENCE: "Khung chủ đề không nhất quán",
  REDUNDANT_AXIOM_APPLICATION: "Lặp lại công lý thế giới",
  AXIOM_VIOLATION: "Xung đột với công lý thế giới",
  GENRE_MISMATCH: "Tín hiệu thể loại xung đột",
  AXIOM_MAGIC_CONFLICT: "Công lý và hệ thống sức mạnh xung đột",
  TECH_ERA_MISMATCH: "Công nghệ lệch thời đại",
  CONFLICT_WEAK: "Xung đột cốt lõi còn yếu",
  BASELINE_PASS: "Kiểm tra quy tắc đạt",
  activation_conditions_drift: "Điều kiện kích hoạt bị lệch",
  original_amvat_seal_state_ambiguity: "Trạng thái phong ấn Âm Vật chưa rõ",
};

const ISSUE_MESSAGE_FALLBACK: Record<string, string> = {
  THEMATIC_INCOHERENCE: "Nội dung bổ sung đưa vào khung chủ đề không khớp với thiết định cốt lõi.",
  REDUNDANT_AXIOM_APPLICATION: "Nội dung đang lặp lại công lý đã có mà chưa tạo thêm ràng buộc hữu ích.",
  AXIOM_VIOLATION: "Thiết định hiện tại có điểm xung đột với công lý hoặc nền tảng thế giới đã xác lập.",
  GENRE_MISMATCH: "Tín hiệu thể loại không khớp với ràng buộc hiện tại của thế giới quan.",
  AXIOM_MAGIC_CONFLICT: "Công lý thế giới và hệ thống sức mạnh đang có điểm mâu thuẫn.",
  TECH_ERA_MISMATCH: "Mức công nghệ bị trộn giữa nhiều thời đại nhưng chưa có giải thích đủ rõ.",
  CONFLICT_WEAK: "Thông tin xung đột cốt lõi còn mỏng, chưa đủ sức chống đỡ mạch truyện.",
  BASELINE_PASS: "Không phát hiện xung đột cứng rõ ràng ở tầng quy tắc.",
  activation_conditions_drift: "Điều kiện kích hoạt của hệ thống sức mạnh có nguy cơ lệch khỏi công lý đã đặt.",
  original_amvat_seal_state_ambiguity: "Nguồn gốc hoặc trạng thái phong ấn của Âm Vật chưa đủ rõ.",
};

const ISSUE_DETAIL_FALLBACK: Record<string, string> = {
  activation_conditions_drift: "Hãy đối chiếu lại điều kiện kích hoạt, cái giá thật và cách Âm Vật xuất hiện để tránh hệ thống sức mạnh tự vận hành ngoài luật Chợ Quỷ.",
  original_amvat_seal_state_ambiguity: "Hãy bổ sung trạng thái ban đầu, điều kiện phong ấn và cơ chế suy yếu phong ấn để tránh mâu thuẫn ở tuyến lịch sử.",
  BASELINE_PASS: "Bề mặt quy tắc chưa thấy xung đột rõ, nhưng vẫn nên kiểm tra các trường chưa xác định.",
};

const FIELD_LABEL_FALLBACK: Record<string, string> = {
  description: "Tong quan the gioi",
  background: "Boi canh",
  geography: "Dia ly",
  cultures: "Van hoa",
  magicSystem: "He thong suc manh",
  politics: "Chinh tri",
  races: "Chung toc",
  religions: "Tin nguong",
  technology: "Cong nghe",
  conflicts: "Xung dot cot loi",
  history: "Lich su",
  economy: "Kinh te",
  factions: "Quan he the luc",
};

function hasChinese(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

function isRawI18nKey(text: string): boolean {
  return /^\[![\w.:-]+!\]$/.test(text) || /^\[?[a-z]+:[\w.:-]+\]?$/.test(text) || /^[\w.:-]+$/.test(text);
}

function safeT(t: TFunction, key: string, fallback: string, options?: Record<string, unknown>): string {
  const translated = t(key, options);
  return translated === key || isRawI18nKey(translated) ? fallback : translated;
}

function localizeSummary(summary: string, status: WorldConsistencyReport["status"], issues: WorldConsistencyIssue[], t: TFunction): string {
  if (hasChinese(summary)) {
    if (status === "warn") {
      const warnCount = issues.filter((item) => item.severity === "warn").length;
      return safeT(t, "consistency.summary.hasWarnings", `Phát hiện ${warnCount} cảnh báo, nên tiếp tục chỉnh sửa.`, { warnCount });
    }
    if (status === "error") {
      const errorCount = issues.filter((item) => item.severity === "error").length;
      const warnCount = issues.filter((item) => item.severity === "warn").length;
      return safeT(t, "consistency.summary.hasErrors", `Phát hiện ${errorCount} lỗi nghiêm trọng và ${warnCount} cảnh báo.`, { errorCount, warnCount });
    }
    return safeT(t, "consistency.summary.passed", "Kiểm tra nhất quán đã đạt.");
  }
  if (/Consistency check passed/i.test(summary)) {
    return safeT(t, "consistency.summary.passed", "Kiểm tra nhất quán đã đạt.");
  }
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warnCount = issues.filter((item) => item.severity === "warn").length;
  if (status === "error") {
    return safeT(t, "consistency.summary.hasErrors", `Phát hiện ${errorCount} lỗi nghiêm trọng và ${warnCount} cảnh báo.`, { errorCount, warnCount });
  }
  if (status === "warn") {
    return safeT(t, "consistency.summary.hasWarnings", `Phát hiện ${warnCount} cảnh báo, nên tiếp tục chỉnh sửa.`, { warnCount });
  }
  return safeT(t, "consistency.summary.completed", "Kiểm tra nhất quán đã hoàn tất.");
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
      return safeT(t, "consistency.severity.error", "Lỗi");
    case "warn":
      return safeT(t, "consistency.severity.warn", "Cảnh báo");
    case "pass":
      return safeT(t, "consistency.severity.pass", "Đạt");
    default:
      return severity;
  }
}

export function localizeConsistencyStatus(status: WorldConsistencyIssue["status"] | WorldConsistencyReport["status"], t: TFunction): string {
  switch (status) {
    case "open":
      return safeT(t, "consistency.status.open", "Chờ xử lý");
    case "resolved":
      return safeT(t, "consistency.status.resolved", "Đã giải quyết");
    case "ignored":
      return safeT(t, "consistency.status.ignored", "Đã bỏ qua");
    case "error":
      return safeT(t, "consistency.status.error", "Lỗi");
    case "warn":
      return safeT(t, "consistency.status.warn", "Cảnh báo");
    case "pass":
      return safeT(t, "consistency.status.pass", "Đạt");
    default:
      return status;
  }
}

export function localizeConsistencySource(source: WorldConsistencyIssue["source"], t: TFunction): string {
  return source === "llm"
    ? safeT(t, "consistency.source.llm", "Kiểm tra bằng AI")
    : safeT(t, "consistency.source.rule", "Kiểm tra bằng quy tắc");
}

export function localizeConsistencyField(targetField: string | null | undefined, t: TFunction): string {
  if (!targetField) {
    return safeT(t, "consistency.field.unspecified", "Trường chưa chỉ định");
  }
  const key = `consistency.field.${targetField}`;
  const translated = t(key);
  // If translation key not found, t() returns the key itself — fall back to raw value
  return translated === key || isRawI18nKey(translated) ? (FIELD_LABEL_FALLBACK[targetField] ?? targetField) : translated;
}

export function localizeConsistencyIssueTitle(code: string, t: TFunction): string {
  const key = `consistency.issueCode.${code}`;
  const translated = t(key);
  return translated === key || isRawI18nKey(translated) ? (ISSUE_CODE_LABELS_FALLBACK[code] ?? code) : translated;
}

export function localizeConsistencyIssueMessage(issue: WorldConsistencyIssue, t: TFunction): string {
  if (hasChinese(issue.message) || isRawI18nKey(issue.message)) {
    return ISSUE_MESSAGE_FALLBACK[issue.code] ?? `${localizeConsistencyField(issue.targetField, t)} có rủi ro nhất quán.`;
  }
  const key = `consistency.issueMessage.${issue.code}`;
  const translated = t(key);
  if (translated !== key && !isRawI18nKey(translated)) {
    return translated;
  }
  return safeT(t, "consistency.issueMessage.fallback", `${localizeConsistencyField(issue.targetField, t)} có rủi ro nhất quán.`, { field: localizeConsistencyField(issue.targetField, t) });
}

export function localizeConsistencyIssueDetail(issue: WorldConsistencyIssue, t: TFunction): string | null {
  if (issue.detail && (hasChinese(issue.detail) || isRawI18nKey(issue.detail))) {
    return ISSUE_DETAIL_FALLBACK[issue.code] ?? `Hãy rà lại ${localizeConsistencyField(issue.targetField, t)} theo công lý và thiết định hiện tại.`;
  }
  const key = `consistency.issueDetail.${issue.code}`;
  const translated = t(key);
  if (translated !== key && !isRawI18nKey(translated)) {
    return translated;
  }
  if (ISSUE_DETAIL_FALLBACK[issue.code]) {
    return ISSUE_DETAIL_FALLBACK[issue.code];
  }
  if (issue.detail) {
    return safeT(t, "consistency.issueDetail.fallback", `Hãy rà lại ${localizeConsistencyField(issue.targetField, t)} theo công lý và thiết định hiện tại.`, { field: localizeConsistencyField(issue.targetField, t) });
  }
  return null;
}
