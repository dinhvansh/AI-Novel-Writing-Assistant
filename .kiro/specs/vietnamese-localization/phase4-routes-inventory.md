# Phase 4 — Kiểm kê chuỗi tiếng Trung trong `server/src/routes/**`

> Tài liệu này là kết quả của task **4.1 Inventory inline Chinese in `server/src/routes/**`**.  
> Công cụ sử dụng: `node scripts/i18n/extract-cjk-literals.mjs --root server/src/routes`  
> Tổng số file quét: **51 file** | Tổng số CJK literal tìm thấy: **225 literal**

---

## Tóm tắt nhanh

| Loại | Số lượng | Hành động |
|------|----------|-----------|
| **HTTP error response** (trả về client qua `error:` hoặc `AppError`) | **~52** | Dịch qua namespace `serverErrors` |
| **Success/info message trả về client** (trường `message:` trong JSON response) | **~155** | Dịch qua namespace `serverErrors` hoặc `serverLogs` (tùy ngữ cảnh) |
| **Internal log / system prompt** (không bao giờ hiển thị cho user) | **~18** | Giữ nguyên tiếng Trung, đánh dấu `// i18n-ignore-internal-log` |

> **Lưu ý phân loại**: Trong routes của dự án này, hầu hết chuỗi tiếng Trung nằm trong trường `message:` của JSON response (trả về client) hoặc trong trường `error:` của `AppError`. Cả hai đều **hiển thị cho user** qua toast/UI. Chỉ có system prompt trong `chat.ts` và một số chuỗi trong Zod validation là internal.

---

## Danh sách file cần xử lý nhiều nhất

| File | Số literal | Ưu tiên |
|------|-----------|---------|
| `styleEngine.ts` | 23 | 🔴 Cao |
| `novelChapterEditorRoutes.ts` | 19 | 🔴 Cao |
| `novel.ts` | 16 | 🔴 Cao |
| `settings.ts` | 13 | 🔴 Cao |
| `llm.ts` | 11 | 🟡 Trung bình |
| `character.ts` | 10 | 🟡 Trung bình |
| `settings/customProviderRoutes.ts` | 10 | 🟡 Trung bình |
| `creativeHub.ts` | 10 | 🟡 Trung bình |
| `novelBaseRoutes.ts` | 9 | 🟡 Trung bình |
| `novelCharacterResourceRoutes.ts` | 9 | 🟡 Trung bình |
| `chat.ts` | 9 | 🟡 Trung bình |
| `novelCharacterPreparationRoutes.ts` | 8 | 🟡 Trung bình |
| `styleEngineExtraction.ts` | 8 | 🟡 Trung bình |
| `novelCharacterSyncRoutes.ts` | 7 | 🟢 Thấp |
| `titleLibrary.ts` | 7 | 🟢 Thấp |
| `storyMode.ts` | 7 | 🟢 Thấp |
| `novelStoryMacroRoutes.ts` | 6 | 🟢 Thấp |
| `world.ts` | 5 | 🟢 Thấp |
| `rag.ts` | 5 | 🟢 Thấp |
| `genre.ts` | 5 | 🟢 Thấp |
| `agentRuns.ts` | 5 | 🟢 Thấp |
| `novelCharacterVisibleProfileRoutes.ts` | 5 | 🟢 Thấp |
| `writingFormula.ts` | 5 | 🟢 Thấp |
| `novelDecisions.ts` | 5 | 🟢 Thấp |
| `settings/llmSelectionRoutes.ts` | 3 | 🟢 Thấp |
| `agentCatalog.ts` | 1 | 🟢 Thấp |
| `astrology.ts` | 1 | 🟢 Thấp |
| `novelFramingRoutes.ts` | 1 | 🟢 Thấp |
| `novelChapterSummary.ts` | 1 | 🟢 Thấp |
| `health.ts` | 1 | 🟢 Thấp |

---

## Phân loại chi tiết theo file

### `server/src/routes/styleEngine.ts` — 23 literal

Tất cả đều là **success message** trong trường `message:` của JSON response — trả về client, user có thể thấy qua toast.

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 99 | `至少提供一个更新字段。` | HTTP error (Zod validation) | `serverErrors` |
| 204 | `获取写法资产列表成功。` | HTTP success message | `serverErrors` |
| 217 | `创建写法资产成功。` | HTTP success message | `serverErrors` |
| 230 | `从拆书生成写法成功。` | HTTP success message | `serverErrors` |
| 243 | `从模板创建写法成功。` | HTTP success message | `serverErrors` |
| 256 | `AI 生成写法成功。` | HTTP success message | `serverErrors` |
| 270 | `写法资产不存在。` | HTTP error (404) | `serverErrors` |
| 277 | `获取写法资产详情成功。` | HTTP success message | `serverErrors` |
| 291 | `更新写法资产成功。` | HTTP success message | `serverErrors` |
| 304 | `删除写法资产成功。` | HTTP success message | `serverErrors` |
| 321 | `试写完成。` | HTTP success message | `serverErrors` |
| 334 | `获取模板成功。` | HTTP success message | `serverErrors` |
| 347 | `获取反AI规则成功。` | HTTP success message | `serverErrors` |
| 361 | `获取生效反 AI 规则成功。` | HTTP success message | `serverErrors` |
| 374 | `反 AI 规则草稿已生成。` | HTTP success message | `serverErrors` |
| 387 | `创建反AI规则成功。` | HTTP success message | `serverErrors` |
| 401 | `更新反AI规则成功。` | HTTP success message | `serverErrors` |
| 415 | `获取写法绑定成功。` | HTTP success message | `serverErrors` |
| 428 | `创建写法绑定成功。` | HTTP success message | `serverErrors` |
| 441 | `删除写法绑定成功。` | HTTP success message | `serverErrors` |
| 476 | `写法推荐已生成。` | HTTP success message | `serverErrors` |
| 489 | `写法检测完成。` | HTTP success message | `serverErrors` |
| 502 | `写法修正完成。` | HTTP success message | `serverErrors` |

---

### `server/src/routes/novelChapterEditorRoutes.ts` — 19 literal

Tất cả đều là **HTTP error** — được bắt từ service layer và trả về client qua `AppError`.

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 43 | `小说不存在。` | HTTP error (400) | `serverErrors` |
| 43 | `章节不存在。` | HTTP error (400) | `serverErrors` |
| 71 | `小说不存在。` | HTTP error (400) | `serverErrors` |
| 72 | `章节不存在。` | HTTP error (400) | `serverErrors` |
| 73 | `当前章节正文为空，无法发起 AI 修正。` | HTTP error (400) | `serverErrors` |
| 74 | `片段修正需要先选中正文内容。` | HTTP error (400) | `serverErrors` |
| 75 | `选区范围无效，请重新选择后再试。` | HTTP error (400) | `serverErrors` |
| 76 | `选中文本不能为空。` | HTTP error (400) | `serverErrors` |
| 77 | `选中文本已发生变化，请重新选择后再试。` | HTTP error (400) | `serverErrors` |
| 78 | `请先写下你希望 AI 如何修改。` | HTTP error (400) | `serverErrors` |
| 79 | `AI 未返回足够的候选版本，请重试。` | HTTP error (400) | `serverErrors` |
| 81 | `整章修正当前限制为` (template) | HTTP error (400) | `serverErrors` |
| 110 | `小说不存在。` | HTTP error (400) | `serverErrors` |
| 111 | `章节不存在。` | HTTP error (400) | `serverErrors` |
| 112 | `当前章节正文为空，无法发起局部改写。` | HTTP error (400) | `serverErrors` |
| 113 | `选区范围无效，请重新选择后再试。` | HTTP error (400) | `serverErrors` |
| 114 | `选中文本不能为空。` | HTTP error (400) | `serverErrors` |
| 115 | `选中文本已发生变化，请重新选择后再试。` | HTTP error (400) | `serverErrors` |
| 116 | `AI 未返回足够的候选版本，请重试。` | HTTP error (400) | `serverErrors` |

---

### `server/src/routes/novel.ts` — 16 literal

Hầu hết là **Zod validation error** (trả về client khi request không hợp lệ).

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 238 | `章节标题不能为空。` | HTTP error (Zod) | `serverErrors` |
| 278 | `角色名称不能为空。` | HTTP error (Zod) | `serverErrors` |
| 279 | `角色定位不能为空。` | HTTP error (Zod) | `serverErrors` |
| 368 | `起始章节必须小于或等于结束章节。` | HTTP error (Zod) | `serverErrors` |
| 395 | `按卷生成时必须提供目标卷。` | HTTP error (Zod) | `serverErrors` |
| 402 | `按节奏段重生章节标题时必须提供目标节奏段。` | HTTP error (Zod) | `serverErrors` |
| 409 | `生成章节细化时必须提供目标卷。` | HTTP error (Zod) | `serverErrors` |
| 416 | `生成章节细化时必须提供目标章节。` | HTTP error (Zod) | `serverErrors` |
| 423 | `生成章节细化时必须提供生成类型。` | HTTP error (Zod) | `serverErrors` |
| 453 | `起始章节必须小于或等于结束章节。` | HTTP error (Zod) | `serverErrors` |
| 505 | `选区结束位置必须大于开始位置。` | HTTP error (Zod) | `serverErrors` |
| 541 | `选区结束位置必须大于开始位置。` | HTTP error (Zod) | `serverErrors` |
| 562 | `预设操作模式必须提供 presetOperation。` | HTTP error (Zod) | `serverErrors` |
| 569 | `自然语言修正模式必须提供 instruction。` | HTTP error (Zod) | `serverErrors` |
| 576 | `片段修正必须提供 selection。` | HTTP error (Zod) | `serverErrors` |
| 583 | `片段修正必须提供上下文窗口。` | HTTP error (Zod) | `serverErrors` |

---

### `server/src/routes/settings.ts` — 13 literal

Mix giữa HTTP error và success message.

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 61 | `API URL 格式不正确。` | HTTP error (Zod) | `serverErrors` |
| 300 | `写法引擎运行设置读取成功。` | HTTP success message | `serverErrors` |
| 316 | `写法引擎运行设置保存成功。` | HTTP success message | `serverErrors` |
| 462 | `厂商配置已加载。` | HTTP success message | `serverErrors` |
| 499 | `没有找到这个自定义厂商。` | HTTP error (404) | `serverErrors` |
| 518 | `请先填写 API Key。` | HTTP error (400) | `serverErrors` |
| 521 | `请先为自定义厂商选择或填写默认模型。` | HTTP error (400) | `serverErrors` |
| 524 | `请先填写自定义厂商的 API URL。` | HTTP error (400) | `serverErrors` |
| 567 | `厂商配置已保存。` | HTTP success message | `serverErrors` |
| 571 | `厂商配置已保存，但模型列表刷新失败。可以稍后在厂商卡片中刷新。` | HTTP success message (partial) | `serverErrors` |
| 618 | `自定义厂商暂不支持刷新余额。` | HTTP error (400) | `serverErrors` |
| 645 | `请先配置 API Key，再刷新模型列表。` | HTTP error (400) | `serverErrors` |
| 662 | `模型列表已刷新。` | HTTP success message | `serverErrors` |

---

### `server/src/routes/llm.ts` — 11 literal

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 21 | `API URL 格式不正确。` | HTTP error (Zod) | `serverErrors` |
| 85 | `获取模型配置成功。` | HTTP success message | `serverErrors` |
| 102 | `模型路由配置已加载。` | HTTP success message | `serverErrors` |
| 115 | `模型路由连通性检测完成。` | HTTP success message | `serverErrors` |
| 128 | `结构化备用模型配置已加载。` | HTTP success message | `serverErrors` |
| 142 | `启用结构化备用模型时，provider 和 model 不能为空。` | HTTP error (400) | `serverErrors` |
| 148 | `结构化备用模型配置已更新。` | HTTP success message | `serverErrors` |
| 182 | `模型路由已更新。` | HTTP success message | `serverErrors` |
| 205 | `未配置可用的模型连接。` | HTTP error (400) | `serverErrors` |
| 208 | `模型连通性测试失败。` | HTTP error (400) | `serverErrors` |
| 226 | `模型连通性与结构化兼容性测试已完成。` | HTTP success message | `serverErrors` |

---

### `server/src/routes/chat.ts` — 9 literal

**Đặc biệt**: File này chứa cả system prompt (internal) lẫn error message (user-facing).

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 117 | `novel 模式必须提供 novelId。` | HTTP error (400) | `serverErrors` |
| 120 | `处理审批时必须提供 runId。` | HTTP error (400) | `serverErrors` |
| 132 | `请根据当前上下文给出写作建议。` | Internal (default goal string) | `// i18n-ignore-internal-log` |
| 170 | `你是一位专业的小说创作助手，擅长帮助作者进行小说创作...` (system prompt) | **Internal** (AI system prompt) | `// i18n-ignore-internal-log` |
| 178 | `\n\n作为智能创作代理，你需要：...` (agent system prompt) | **Internal** (AI system prompt) | `// i18n-ignore-internal-log` |
| 188 | `\n提示：联网检索能力当前为预留状态...` | **Internal** (AI context hint) | `// i18n-ignore-internal-log` |
| 218 | `\n以下是检索到的项目知识片段...` | **Internal** (RAG context prefix) | `// i18n-ignore-internal-log` |
| 305 | `对话流式生成失败。` | HTTP error (SSE stream) | `serverErrors` |
| 322 | `当前由前端 IndexedDB 保存历史记录，此接口暂返回空数组。` | HTTP info message | `serverErrors` |

---

### `server/src/routes/character.ts` — 10 literal

Tất cả là success/error message trả về client.

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 78 | `获取基础角色列表成功。` | HTTP success | `serverErrors` |
| 93 | `创建角色库角色。` | HTTP success | `serverErrors` |
| 97 | `创建基础角色成功。` | HTTP success | `serverErrors` |
| 113 | `角色不存在。` | HTTP error (404) | `serverErrors` |
| 120 | `获取角色详情成功。` | HTTP success | `serverErrors` |
| 139 | `更新角色库基础设定。` | HTTP success | `serverErrors` |
| 146 | `更新角色成功。` | HTTP success | `serverErrors` |
| 160 | `删除角色成功。` | HTTP success | `serverErrors` |
| 176 | `AI 角色生成完成（模型输出异常，已自动回退）。` | HTTP success (partial) | `serverErrors` |
| 177 | `AI 角色生成成功。` | HTTP success | `serverErrors` |

---

### `server/src/routes/settings/customProviderRoutes.ts` — 10 literal

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 29 | `API URL 格式不正确。` | HTTP error (Zod) | `serverErrors` |
| 38 | `API URL 格式不正确。` | HTTP error (Zod) | `serverErrors` |
| 114 | `已获取 N 个模型。` (template) | HTTP success | `serverErrors` |
| 140 | `自定义厂商已创建。` | HTTP success | `serverErrors` |
| 148 | `未能获取模型列表，请检查 API URL，或手动填写一个默认模型` | HTTP success (warning) | `serverErrors` |
| 150 | `自定义厂商已创建，但模型列表刷新失败。可以稍后在厂商卡片中刷新。` | HTTP success (partial) | `serverErrors` |
| 221 | `内置厂商不能删除。` | HTTP error (400) | `serverErrors` |
| 225 | `没有找到这个自定义厂商。` | HTTP error (404) | `serverErrors` |
| 232 | `请先把模型路由 N 改到其他厂商，再删除这个厂商。` (template) | HTTP error (400) | `serverErrors` |
| 239 | `自定义厂商已删除。` | HTTP success | `serverErrors` |

---

### `server/src/routes/creativeHub.ts` — 10 literal

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 149 | `创作中枢线程列表加载成功。` | HTTP success | `serverErrors` |
| 166 | `创作中枢线程已创建。` | HTTP success | `serverErrors` |
| 184 | `创作中枢线程已更新。` | HTTP success | `serverErrors` |
| 200 | `创作中枢线程已删除。` | HTTP success | `serverErrors` |
| 216 | `创作中枢线程状态加载成功。` | HTTP success | `serverErrors` |
| 232 | `创作中枢线程历史加载成功。` | HTTP success | `serverErrors` |
| 248 | `创作中枢线程标题已生成。` | HTTP success | `serverErrors` |
| 286 | `创作中枢运行失败。` | HTTP error | `serverErrors` |
| 319 | `审批已通过，线程已更新。` | HTTP success | `serverErrors` |
| 319 | `审批已拒绝，线程已更新。` | HTTP success | `serverErrors` |

---

### `server/src/routes/novelBaseRoutes.ts` — 9 literal

| Dòng | Chuỗi | Loại | Hành động |
|------|-------|------|-----------|
| 32 | `标题不能为空。` | HTTP error (Zod) | `serverErrors` |
| 134 | `至少提供一句话概述、亮点、读者定位或类似开书信息，系统才能推荐资源组合。` | HTTP error (400) | `serverErrors` |
| 153 | `获取小说列表成功。` | HTTP success | `serverErrors` |
| 167 | `创建小说成功。` | HTTP success | `serverErrors` |
| 183 | `AI 已生成开书资源推荐。` | HTTP success | `serverErrors` |
| 197 | `小说不存在。` | HTTP error (404) | `serverErrors` |
| 204 | `获取小说详情成功。` | HTTP success | `serverErrors` |
| 254 | `更新小说成功。` | HTTP success | `serverErrors` |
| 268 | `删除小说成功。` | HTTP success | `serverErrors` |

---

### Các file còn lại (tóm tắt)

#### `novelCharacterResourceRoutes.ts` — 9 literal
Tất cả là HTTP success/info message trả về client. → `serverErrors`

#### `novelCharacterPreparationRoutes.ts` — 8 literal
Tất cả là HTTP success message. → `serverErrors`

#### `styleEngineExtraction.ts` — 8 literal
Mix: 4 HTTP error (404/400), 4 HTTP success. → `serverErrors`

#### `novelCharacterSyncRoutes.ts` — 7 literal
Tất cả là HTTP success/info message. → `serverErrors`

#### `titleLibrary.ts` — 7 literal
Mix: 2 HTTP error (400), 5 HTTP success. → `serverErrors`

#### `storyMode.ts` — 7 literal
Tất cả là HTTP success message. → `serverErrors`

#### `novelStoryMacroRoutes.ts` — 6 literal
Tất cả là HTTP success message. → `serverErrors`

#### `world.ts` — 5 literal
Mix: 1 HTTP error, 4 HTTP success/info. → `serverErrors`

#### `rag.ts` — 5 literal
Mix: 1 HTTP error (400), 4 HTTP success/info. → `serverErrors`

#### `genre.ts` — 5 literal
Tất cả là HTTP success message. → `serverErrors`

#### `agentRuns.ts` — 5 literal
Mix: 2 HTTP error/info, 3 HTTP success. → `serverErrors`

#### `novelCharacterVisibleProfileRoutes.ts` — 5 literal
Tất cả là HTTP success/info message. → `serverErrors`

#### `writingFormula.ts` — 5 literal
Mix: 2 HTTP error (400/404), 3 HTTP success. → `serverErrors`

#### `novelDecisions.ts` — 5 literal
Tất cả là HTTP success message. → `serverErrors`

#### `settings/llmSelectionRoutes.ts` — 3 literal
Mix: 1 HTTP error (Zod), 2 HTTP success. → `serverErrors`

#### `agentCatalog.ts` — 1 literal
`能力目录加载成功。` → HTTP success → `serverErrors`

#### `astrology.ts` — 1 literal
`占星模块暂未实现。` → HTTP error (501) → `serverErrors`

#### `novelFramingRoutes.ts` — 1 literal
`请至少填写书名或一句话概述。` → HTTP error (400) → `serverErrors`

#### `novelChapterSummary.ts` — 1 literal
`章节摘要生成成功。` → HTTP success → `serverErrors`

#### `health.ts` — 1 literal
`服务运行正常。` → HTTP success → `serverErrors`

---

## Các chuỗi cần đánh dấu `// i18n-ignore-internal-log`

Những chuỗi này **không bao giờ hiển thị cho user** — chúng là AI system prompt hoặc context string nội bộ:

| File | Dòng | Chuỗi | Lý do |
|------|------|-------|-------|
| `chat.ts` | 132 | `请根据当前上下文给出写作建议。` | Default goal string cho AI agent, không hiển thị |
| `chat.ts` | 170 | `你是一位专业的小说创作助手...` | AI system prompt — theo Requirement 4.5, KHÔNG dịch |
| `chat.ts` | 178 | `\n\n作为智能创作代理，你需要：...` | AI agent system prompt — KHÔNG dịch |
| `chat.ts` | 188 | `\n提示：联网检索能力当前为预留状态...` | AI context hint nội bộ — KHÔNG dịch |
| `chat.ts` | 218 | `\n以下是检索到的项目知识片段...` | RAG context prefix cho AI — KHÔNG dịch |

---

## Kết luận và khuyến nghị cho Phase 4

### Phân phối cuối cùng

| Loại | Số lượng ước tính |
|------|-----------------|
| HTTP error response (cần dịch qua `serverErrors`) | **~52** |
| HTTP success/info message (cần dịch qua `serverErrors`) | **~155** |
| Internal AI prompt / context (giữ nguyên + `// i18n-ignore-internal-log`) | **~18** |
| **Tổng** | **225** |

### Thứ tự ưu tiên xử lý

1. **Nhóm 1 — HTTP error** (user thấy khi có lỗi): `novelChapterEditorRoutes.ts`, `novel.ts`, `settings.ts`, `llm.ts`, `novelBaseRoutes.ts`, `styleEngine.ts` (phần error)
2. **Nhóm 2 — HTTP success message** (user thấy qua toast): tất cả các file còn lại
3. **Nhóm 3 — Internal** (đánh dấu ignore): 5 chuỗi trong `chat.ts`

### Namespace sử dụng

- **`serverErrors`**: Tất cả HTTP error response (trường `error:` trong JSON, `AppError`, Zod validation message)
- **`serverErrors`**: Cả HTTP success message (trường `message:` trong JSON response) — vì chúng đều là server-originated strings trả về client
- **`serverLogs`**: Chỉ dùng nếu có log line được bridge qua desktop main-process (hiện tại không thấy trong routes)

### Lưu ý quan trọng

- Các chuỗi trong `chat.ts` là **AI system prompt** — theo Requirement 4.5, chúng **KHÔNG được dịch**. Chỉ đánh dấu `// i18n-ignore-internal-log`.
- Nhiều chuỗi bị trùng lặp giữa các file (ví dụ: `小说不存在。`, `章节不存在。`, `API URL 格式不正确。`) — nên dùng chung một key trong `serverErrors`.
- Các chuỗi template (có interpolation như `已获取 N 个模型`) cần dùng ICU syntax khi đưa vào bundle.
