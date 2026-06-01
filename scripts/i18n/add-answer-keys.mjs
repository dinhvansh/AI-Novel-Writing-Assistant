#!/usr/bin/env node
/**
 * Adds creativeHub.answers translation keys to zh-CN.json and vi-VN.json
 * for the answerComposer.ts server-side strings.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ZH_PATH = path.join(REPO_ROOT, "shared", "localization", "locales", "zh-CN.json");
const VI_PATH = path.join(REPO_ROOT, "shared", "localization", "locales", "vi-VN.json");

const zhAnswers = {
  social: {
    greetingWithNovel: "你好。我可以继续陪你打磨这本书的设定、大纲、人物、章节，或者先帮你判断当前卡点。你现在想先推进哪一块？",
    greetingGeneral: "你好。我可以帮你一起打磨设定、大纲、人物、章节，或者帮你诊断当前卡点。你现在想先推进哪一块？",
  },
  collaborative: {
    leadGeneral: "我先不把它当成命令执行，先和你一起把问题说清楚：{goal}",
    leadTask: "我理解你现在想推进的是：{goal}",
    modeReview: "这轮更适合先一起诊断和判断。",
    modeCoCreate: "这轮更适合先共创澄清，再决定是否进入执行。",
    missingInfoPrefix: "在继续之前，我还缺这几个关键信息：{items}。",
    missingInfoPrefixWant: "在继续之前，我还想补齐这几个点：{items}。",
    chooseDirection: "你可以直接选一个方向继续：",
    separator: "、",
    questions: {
      produceNovel: "你想先把一句话设定钉牢，还是让我直接给你三套可选方向？",
      writeChapter: "这章你最想先解决的是剧情推进、人物情绪，还是文风节奏？",
      ideateNovelSetup: "你更想先看核心设定、故事承诺，还是题材风格的备选方案？",
      default: "你现在最想先解决哪一个创作问题？",
    },
    options: {
      produceNovel: {
        option1: "我先基于当前信息给你 3 套核心设定方向。",
        option2: "你补一句主角、冲突和目标，我帮你收敛成可执行设定。",
        option3: "如果你已经想清楚，也可以直接说\u201c现在启动整本生产\u201d。",
      },
      writeChapter: {
        option1: "我先帮你判断这一章的问题出在情节、人物还是节奏。",
        option2: "你告诉我这章的目标和想保留的部分，我给你重写方案。",
        option3: "如果你已经确定范围，也可以直接说要改哪一章、往哪个方向改。",
      },
      ideateNovelSetup: {
        option1: "先给你 3 套核心设定备选。",
        option2: "先给你 3 套故事承诺和卖点方向。",
        option3: "先给你 3 套题材风格与叙事配置组合。",
      },
      default: {
        option1: "我先帮你拆清楚这个问题。",
        option2: "我先给你几个可选方向。",
        option3: "你补充最关键的限制条件，我再继续推进。",
      },
    },
  },
  title: {
    notFound: "未获取到标题",
  },
  novelList: {
    empty: "当前还没有小说。",
    summary: "当前共有 {total} 本小说：",
    unnamedNovel: "未命名小说",
    chapterCount: "（{count}章）",
  },
  baseCharacterList: {
    empty: "当前基础角色库还是空的。",
    summary: "当前基础角色库共有 {count} 个角色模板：",
  },
  worldList: {
    empty: "当前还没有世界观。",
    summary: "当前共有 {count} 个世界观：",
    unnamedWorld: "未命名世界观",
  },
  taskList: {
    empty: "当前没有系统任务。",
    summary: "当前共有 {count} 个系统任务：",
    unnamedTask: "未命名任务",
  },
  worldBinding: {
    bound: "已将世界观《{worldName}》绑定到小说《{novelTitle}》。",
    boundGeneric: "已完成世界观绑定。",
    noContext: "没有当前小说上下文，无法设置世界观。",
    notFound: "未找到要绑定的世界观。",
    failed: "未完成世界观绑定。",
  },
  worldUnbinding: {
    unbound: "已将世界观《{previousWorldName}》从小说《{novelTitle}》解绑。",
    unboundUpdated: "已更新小说《{novelTitle}》的世界观绑定状态。",
    unboundGeneric: "已完成世界观解绑。",
    noContext: "没有当前小说上下文，无法解除世界观绑定。",
    failed: "未完成世界观解绑。",
  },
  productionStatus: {
    fallbackTitle: "当前小说",
    unknownStage: "未知阶段",
    factProgress: "《{title}》事实进展：{stage}。",
    planning: "规划：{completed}/{total} 项。",
    draftWithTarget: "正文：{drafted}/{target} 章。",
    draftOnly: "正文：{drafted} 章。",
    chapterDirWithTarget: "章节目录：{count}/{target} 章。",
    chapterDirOnly: "章节目录：{count} 章。",
    reviewed: "审校：{count} 章。",
    committed: "状态提交：{count} 章。",
    needsRepair: "{count} 章待修复。",
    runtimeLabel: "后台补充：{label}。",
    pipelineStatus: "后台补充：{status}。",
    failureSummary: "后台失败原因：{summary}",
    contentUsable: "已产出的事实内容可继续使用。",
    recoveryHint: "建议：{hint}",
  },
  progress: {
    insufficient: "当前信息不足，无法继续",
    draftWithTarget: "正文：{completed}/{total} 章。",
    draftOnly: "正文：{completed} 章。",
    latestChapter: "最近完成到第{order}章。",
    noChapters: "未检测到写入正文的章节。",
  },
  character: {
    notFound: "未获取到角色状态信息",
    empty: "当前小说还没有已规划角色。",
    summary: "当前小说已规划 {count} 个角色：",
    unnamedCharacter: "未命名角色",
  },
  chapter: {
    orderTitle: "第{order}章",
    orderTitleWithName: "第{order}章《{title}》",
    emptyContent: "正文为空",
    notFound: "未获取到章节正文",
  },
  write: {
    previewSingle: "已完成第{start}章执行预览，当前等待审批。",
    previewRange: "已完成第{start}到第{end}章执行预览，当前等待审批。",
    queuedSingle: "已创建第{start}章的写作任务（任务 {jobId}）。",
    queuedSingleNoJob: "已创建第{start}章的写作任务。",
    queuedRange: "已创建第{start}到第{end}章的写作任务（任务 {jobId}）。",
    queuedRangeNoJob: "已创建第{start}到第{end}章的写作任务。",
    noScope: "未获取到可执行范围",
  },
  produce: {
    worldAsset: "世界观《{name}》",
    worldAssetGeneric: "世界观",
    characterCount: "{count} 个核心角色",
    bible: "小说圣经",
    outline: "发展走向",
    structuredOutlineWithCount: "{count} 章结构化大纲",
    structuredOutlineGeneric: "结构化大纲",
    chapterDirWithCount: "{count} 个章节目录",
    chapterDirGeneric: "章节目录",
    assetsWithPreview: "《{title}》的核心资产已生成完成：{assets}。整本写作预览已完成，当前等待审批。",
    assetsWithPreviewNoList: "《{title}》的核心资产已生成完成。整本写作预览已完成，当前等待审批。",
    assetsQueued: "《{title}》的核心资产已生成完成：{assets}。整本写作任务已启动（任务 {jobId}）。",
    assetsQueuedNoJob: "《{title}》的核心资产已生成完成：{assets}。整本写作任务已启动。",
    assetsQueuedNoList: "《{title}》的核心资产已生成完成。整本写作任务已启动。",
    assetsNoQueue: "《{title}》的核心资产已生成完成：{assets}。整本写作未启动。",
    assetsNoQueueNoList: "《{title}》的核心资产已生成完成。整本写作未启动。",
    assetsOnly: "《{title}》的核心资产已生成完成：{assets}。",
    assetsOnlyNoList: "《{title}》的核心资产已生成完成。",
  },
  overallStatus: {
    notFound: "未获取到整本生产状态。",
    noContext: "没有当前小说上下文，无法读取整本生产状态。",
  },
  failure: {
    noDiagnostics: "当前没有可用的失败诊断信息",
    details: "详情：{details}",
    hint: "建议：{hint}",
    step: "失败步骤：{step}",
  },
};

const viAnswers = {
  social: {
    greetingWithNovel: "Xin chào. Tôi có thể tiếp tục giúp bạn hoàn thiện thiết định, đại cương, nhân vật, chương của cuốn sách này, hoặc trước tiên giúp bạn chẩn đoán điểm tắc nghẽn hiện tại. Bạn muốn tiến hành phần nào trước?",
    greetingGeneral: "Xin chào. Tôi có thể giúp bạn cùng hoàn thiện thiết định, đại cương, nhân vật, chương, hoặc giúp bạn chẩn đoán điểm tắc nghẽn hiện tại. Bạn muốn tiến hành phần nào trước?",
  },
  collaborative: {
    leadGeneral: "Tôi sẽ không thực thi ngay như một lệnh, mà cùng bạn làm rõ vấn đề trước: {goal}",
    leadTask: "Tôi hiểu bạn đang muốn tiến hành: {goal}",
    modeReview: "Lượt này phù hợp hơn để cùng chẩn đoán và đánh giá trước.",
    modeCoCreate: "Lượt này phù hợp hơn để cùng sáng tạo và làm rõ, rồi mới quyết định có vào thực thi không.",
    missingInfoPrefix: "Trước khi tiếp tục, tôi còn thiếu một số thông tin quan trọng: {items}.",
    missingInfoPrefixWant: "Trước khi tiếp tục, tôi muốn bổ sung thêm một số điểm: {items}.",
    chooseDirection: "Bạn có thể chọn trực tiếp một hướng để tiếp tục:",
    separator: ", ",
    questions: {
      produceNovel: "Bạn muốn xác định thiết định cốt lõi trước, hay để tôi đưa ra ngay ba hướng lựa chọn?",
      writeChapter: "Điều bạn muốn giải quyết nhất trong chương này là gì: đẩy tình tiết, cảm xúc nhân vật, hay nhịp độ văn phong?",
      ideateNovelSetup: "Bạn muốn xem thiết định cốt lõi, cam kết câu chuyện, hay các phương án thể loại và phong cách trước?",
      default: "Vấn đề sáng tác nào bạn muốn giải quyết nhất lúc này?",
    },
    options: {
      produceNovel: {
        option1: "Tôi sẽ đưa ra 3 hướng thiết định cốt lõi dựa trên thông tin hiện có.",
        option2: "Bạn bổ sung một câu về nhân vật chính, xung đột và mục tiêu, tôi sẽ giúp bạn hội tụ thành thiết định có thể thực thi.",
        option3: "Nếu bạn đã suy nghĩ rõ, cũng có thể nói thẳng \"Bắt đầu sản xuất toàn bộ ngay\".",
      },
      writeChapter: {
        option1: "Tôi sẽ giúp bạn xác định vấn đề của chương này nằm ở tình tiết, nhân vật hay nhịp độ.",
        option2: "Bạn cho tôi biết mục tiêu của chương và phần muốn giữ lại, tôi sẽ đưa ra phương án viết lại.",
        option3: "Nếu bạn đã xác định phạm vi, cũng có thể nói thẳng muốn sửa chương nào, theo hướng nào.",
      },
      ideateNovelSetup: {
        option1: "Đưa ra 3 phương án thiết định cốt lõi.",
        option2: "Đưa ra 3 hướng cam kết câu chuyện và điểm bán.",
        option3: "Đưa ra 3 tổ hợp thể loại, phong cách và cấu hình tự sự.",
      },
      default: {
        option1: "Tôi sẽ giúp bạn phân tích rõ vấn đề này.",
        option2: "Tôi sẽ đưa ra một số hướng lựa chọn.",
        option3: "Bạn bổ sung điều kiện ràng buộc quan trọng nhất, tôi sẽ tiếp tục.",
      },
    },
  },
  title: {
    notFound: "Không lấy được tiêu đề",
  },
  novelList: {
    empty: "Hiện chưa có tiểu thuyết nào.",
    summary: "Hiện có tổng cộng {total} tiểu thuyết:",
    unnamedNovel: "Tiểu thuyết chưa đặt tên",
    chapterCount: "（{count} chương）",
  },
  baseCharacterList: {
    empty: "Kho nhân vật cơ sở hiện đang trống.",
    summary: "Kho nhân vật cơ sở hiện có {count} mẫu nhân vật:",
  },
  worldList: {
    empty: "Hiện chưa có thế giới quan nào.",
    summary: "Hiện có tổng cộng {count} thế giới quan:",
    unnamedWorld: "Thế giới quan chưa đặt tên",
  },
  taskList: {
    empty: "Hiện không có tác vụ hệ thống nào.",
    summary: "Hiện có tổng cộng {count} tác vụ hệ thống:",
    unnamedTask: "Tác vụ chưa đặt tên",
  },
  worldBinding: {
    bound: "Đã gắn thế giới quan《{worldName}》vào tiểu thuyết《{novelTitle}》.",
    boundGeneric: "Đã hoàn tất gắn thế giới quan.",
    noContext: "Không có ngữ cảnh tiểu thuyết hiện tại, không thể thiết lập thế giới quan.",
    notFound: "Không tìm thấy thế giới quan cần gắn.",
    failed: "Chưa hoàn tất gắn thế giới quan.",
  },
  worldUnbinding: {
    unbound: "Đã gỡ thế giới quan《{previousWorldName}》khỏi tiểu thuyết《{novelTitle}》.",
    unboundUpdated: "Đã cập nhật trạng thái gắn thế giới quan của tiểu thuyết《{novelTitle}》.",
    unboundGeneric: "Đã hoàn tất gỡ thế giới quan.",
    noContext: "Không có ngữ cảnh tiểu thuyết hiện tại, không thể gỡ thế giới quan.",
    failed: "Chưa hoàn tất gỡ thế giới quan.",
  },
  productionStatus: {
    fallbackTitle: "Tiểu thuyết hiện tại",
    unknownStage: "Giai đoạn không xác định",
    factProgress: "《{title}》tiến độ thực tế: {stage}.",
    planning: "Quy hoạch: {completed}/{total} mục.",
    draftWithTarget: "Chính văn: {drafted}/{target} chương.",
    draftOnly: "Chính văn: {drafted} chương.",
    chapterDirWithTarget: "Danh mục chương: {count}/{target} chương.",
    chapterDirOnly: "Danh mục chương: {count} chương.",
    reviewed: "Hiệu đính: {count} chương.",
    committed: "Đã xác nhận trạng thái: {count} chương.",
    needsRepair: "{count} chương cần sửa chữa.",
    runtimeLabel: "Bổ sung nền: {label}.",
    pipelineStatus: "Bổ sung nền: {status}.",
    failureSummary: "Nguyên nhân thất bại nền: {summary}",
    contentUsable: "Nội dung thực tế đã tạo ra vẫn có thể sử dụng.",
    recoveryHint: "Gợi ý: {hint}",
  },
  progress: {
    insufficient: "Thông tin hiện tại không đủ để tiếp tục",
    draftWithTarget: "Chính văn: {completed}/{total} chương.",
    draftOnly: "Chính văn: {completed} chương.",
    latestChapter: "Hoàn thành gần nhất đến chương {order}.",
    noChapters: "Không phát hiện chương nào đã được viết vào chính văn.",
  },
  character: {
    notFound: "Không lấy được thông tin trạng thái nhân vật",
    empty: "Tiểu thuyết hiện tại chưa có nhân vật nào được quy hoạch.",
    summary: "Tiểu thuyết hiện tại đã quy hoạch {count} nhân vật:",
    unnamedCharacter: "Nhân vật chưa đặt tên",
  },
  chapter: {
    orderTitle: "Chương {order}",
    orderTitleWithName: "Chương {order}《{title}》",
    emptyContent: "Chính văn trống",
    notFound: "Không lấy được chính văn chương",
  },
  write: {
    previewSingle: "Đã hoàn tất xem trước thực thi chương {start}, đang chờ phê duyệt.",
    previewRange: "Đã hoàn tất xem trước thực thi chương {start} đến chương {end}, đang chờ phê duyệt.",
    queuedSingle: "Đã tạo tác vụ viết chương {start} (tác vụ {jobId}).",
    queuedSingleNoJob: "Đã tạo tác vụ viết chương {start}.",
    queuedRange: "Đã tạo tác vụ viết chương {start} đến chương {end} (tác vụ {jobId}).",
    queuedRangeNoJob: "Đã tạo tác vụ viết chương {start} đến chương {end}.",
    noScope: "Không lấy được phạm vi có thể thực thi",
  },
  produce: {
    worldAsset: "Thế giới quan《{name}》",
    worldAssetGeneric: "Thế giới quan",
    characterCount: "{count} nhân vật cốt lõi",
    bible: "Kinh thánh tiểu thuyết",
    outline: "Hướng phát triển",
    structuredOutlineWithCount: "Đại cương có cấu trúc {count} chương",
    structuredOutlineGeneric: "Đại cương có cấu trúc",
    chapterDirWithCount: "{count} danh mục chương",
    chapterDirGeneric: "Danh mục chương",
    assetsWithPreview: "Tài sản cốt lõi của《{title}》đã tạo xong: {assets}. Xem trước viết toàn bộ đã hoàn tất, đang chờ phê duyệt.",
    assetsWithPreviewNoList: "Tài sản cốt lõi của《{title}》đã tạo xong. Xem trước viết toàn bộ đã hoàn tất, đang chờ phê duyệt.",
    assetsQueued: "Tài sản cốt lõi của《{title}》đã tạo xong: {assets}. Tác vụ viết toàn bộ đã khởi động (tác vụ {jobId}).",
    assetsQueuedNoJob: "Tài sản cốt lõi của《{title}》đã tạo xong: {assets}. Tác vụ viết toàn bộ đã khởi động.",
    assetsQueuedNoList: "Tài sản cốt lõi của《{title}》đã tạo xong. Tác vụ viết toàn bộ đã khởi động.",
    assetsNoQueue: "Tài sản cốt lõi của《{title}》đã tạo xong: {assets}. Chưa khởi động viết toàn bộ.",
    assetsNoQueueNoList: "Tài sản cốt lõi của《{title}》đã tạo xong. Chưa khởi động viết toàn bộ.",
    assetsOnly: "Tài sản cốt lõi của《{title}》đã tạo xong: {assets}.",
    assetsOnlyNoList: "Tài sản cốt lõi của《{title}》đã tạo xong.",
  },
  overallStatus: {
    notFound: "Không lấy được trạng thái sản xuất toàn bộ.",
    noContext: "Không có ngữ cảnh tiểu thuyết hiện tại, không thể đọc trạng thái sản xuất toàn bộ.",
  },
  failure: {
    noDiagnostics: "Hiện không có thông tin chẩn đoán thất bại khả dụng",
    details: "Chi tiết: {details}",
    hint: "Gợi ý: {hint}",
    step: "Bước thất bại: {step}",
  },
};

// Update zh-CN.json
const zh = JSON.parse(fs.readFileSync(ZH_PATH, "utf8"));
zh.creativeHub.answers = zhAnswers;
fs.writeFileSync(ZH_PATH, JSON.stringify(zh, null, 2) + "\n", "utf8");
console.log("zh-CN.json updated with creativeHub.answers");

// Update vi-VN.json
const vi = JSON.parse(fs.readFileSync(VI_PATH, "utf8"));
vi.creativeHub.answers = viAnswers;
fs.writeFileSync(VI_PATH, JSON.stringify(vi, null, 2) + "\n", "utf8");
console.log("vi-VN.json updated with creativeHub.answers");
