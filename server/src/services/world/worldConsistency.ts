const CONSISTENCY_FIELD_LABELS: Record<string, string> = {
  description: "Tổng quan thế giới",
  background: "Bối cảnh",
  geography: "Địa lý",
  cultures: "Văn hóa",
  magicSystem: "Hệ thống sức mạnh",
  politics: "Chính trị",
  races: "Chủng tộc",
  religions: "Tín ngưỡng",
  technology: "Công nghệ",
  conflicts: "Xung đột cốt lõi",
  history: "Lịch sử",
  economy: "Kinh tế",
  factions: "Quan hệ thế lực",
};

export interface ConsistencyIssueDraft {
  severity: "pass" | "warn" | "error";
  code: string;
  message: string;
  detail?: string;
  source: "rule" | "llm";
  targetField?: string;
}

const ISSUE_LOCALIZATION: Record<
  string,
  {
    title: string;
    message: string;
    detail?: string | ((targetField?: string) => string);
  }
> = {
  AXIOM_MAGIC_CONFLICT: {
    title: "Công lý và hệ thống sức mạnh xung đột",
    message: "Công lý thế giới và hệ thống sức mạnh đang có điểm mâu thuẫn.",
    detail: "Cần thống nhất lại luật nền tảng của thế giới, nhất là phần giới hạn năng lực siêu nhiên và cơ chế giá phải trả.",
  },
  TECH_ERA_MISMATCH: {
    title: "Công nghệ lệch thời đại",
    message: "Mức công nghệ bị trộn giữa nhiều thời đại nhưng chưa có giải thích đủ rõ.",
    detail: "Hãy bổ sung nguồn gốc, giới hạn hoặc logic chuyển tiếp cho các yếu tố công nghệ khác thời đại.",
  },
  CONFLICT_WEAK: {
    title: "Xung đột cốt lõi còn yếu",
    message: "Thông tin xung đột cốt lõi còn mỏng, chưa đủ sức chống đỡ mạch truyện.",
    detail: "Nên bổ sung các bên xung đột, sự kiện kích hoạt, đường leo thang và cái giá khi thất bại.",
  },
  BASELINE_PASS: {
    title: "Kiểm tra quy tắc đạt",
    message: "Không phát hiện xung đột cứng rõ ràng ở tầng quy tắc.",
  },
  THEMATIC_INCOHERENCE: {
    title: "Khung chủ đề không nhất quán",
    message: "Nội dung bổ sung đưa vào khung chủ đề không khớp với thiết định cốt lõi.",
    detail: "Hãy kiểm tra lại để tránh trục chính của thế giới quan bị trôi khỏi thiết định ban đầu.",
  },
  REDUNDANT_AXIOM_APPLICATION: {
    title: "Lặp lại công lý thế giới",
    message: "Nội dung đang lặp lại công lý đã có mà chưa tạo thêm ràng buộc hữu ích.",
    detail: "Nên giữ phần ràng buộc mới thật sự hữu ích và bỏ các đoạn lặp làm nhiễu luật thế giới.",
  },
  AXIOM_VIOLATION: {
    title: "Xung đột với công lý thế giới",
    message: "Thiết định hiện tại có điểm xung đột với công lý hoặc nền tảng thế giới đã xác lập.",
    detail: (targetField) =>
      `Thiết định hiện tại chưa khớp với công lý thế giới${targetField ? `, chủ yếu ở trường ${localizeConsistencyField(targetField)}` : ""}. Cần thống nhất lại tên gọi, cam kết thể loại và luật nền.`,
  },
  GENRE_MISMATCH: {
    title: "Tín hiệu thể loại xung đột",
    message: "Tín hiệu thể loại không khớp với ràng buộc hiện tại của thế giới quan.",
    detail: "Tên gọi, từ khóa hoặc ngữ cảnh truy xuất đang gợi một kỳ vọng thể loại khác với phong cách và luật đã đặt.",
  },
};

function hasChinese(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

function looksMostlyEnglish(text: string): boolean {
  return /[A-Za-z]/.test(text) && !hasChinese(text);
}

export function localizeConsistencyField(targetField?: string | null): string {
  if (!targetField) {
    return "Trường chưa chỉ định";
  }
  return CONSISTENCY_FIELD_LABELS[targetField] ?? targetField;
}

export function localizeConsistencyIssue(issue: ConsistencyIssueDraft): ConsistencyIssueDraft {
  const code = issue.code?.trim() || "LLM_REVIEW";
  const localization = ISSUE_LOCALIZATION[code];
  const message = issue.message?.trim() || "";
  const detail = issue.detail?.trim();

  if (localization) {
    return {
      ...issue,
      code,
      message: hasChinese(message) ? localization.message : (message || localization.message),
      detail: typeof localization.detail === "function"
          ? localization.detail(issue.targetField)
          : (hasChinese(detail ?? "") ? localization.detail : (detail || localization.detail)),
    };
  }

  return {
    ...issue,
    code,
    message: hasChinese(message)
      ? `${localizeConsistencyField(issue.targetField)} có rủi ro nhất quán.`
      : (message || `${localizeConsistencyField(issue.targetField)} có rủi ro nhất quán.`),
    detail: !detail
      ? undefined
      : looksMostlyEnglish(detail)
        ? `Hệ thống phát hiện vấn đề liên quan đến ${localizeConsistencyField(issue.targetField)}. Hãy rà lại theo thiết định hiện tại.`
        : detail,
  };
}

export function buildConsistencySummary(status: "pass" | "warn" | "error", errorCount: number, warnCount: number): string {
  if (status === "pass") {
    return "Kiểm tra nhất quán đã đạt, không phát hiện xung đột cứng rõ ràng.";
  }
  if (status === "error") {
    return `Phát hiện ${errorCount} xung đột nghiêm trọng và ${warnCount} cảnh báo.`;
  }
  return `Phát hiện ${warnCount} cảnh báo, nên tiếp tục chỉnh sửa.`;
}
