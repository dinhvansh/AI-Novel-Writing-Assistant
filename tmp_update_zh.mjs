import fs from 'fs';

const zhFile = 'shared/localization/locales/zh-CN.json';
let content = fs.readFileSync(zhFile, 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
const obj = JSON.parse(content);

if (!obj.novel.character.create) {
  obj.novel.character.create = {
    "triggerBtn": "创建角色",
    "dialogTitle": "创建角色",
    "manualTitle": "手动创建角色",
    "namePlaceholder": "角色名称",
    "rolePlaceholder": "角色定位（主角/反派/配角）",
    "personalityPlaceholder": "性格特征",
    "backgroundPlaceholder": "背景故事",
    "developmentPlaceholder": "成长轨迹",
    "creating": "创建中...",
    "createBtn": "创建角色",
    "aiTitle": "AI 生成角色",
    "aiDescPlaceholder": "输入角色描述，例如：冷静理智但背负家仇的年轻剑士",
    "advancedSettings": "高级设定（可选）",
    "clearAdvanced": "一键清空高级设定",
    "storyFunctionLabel": "角色功能位",
    "notSpecified": "不指定",
    "roleProtagonist": "主角",
    "roleAntagonist": "反派",
    "roleMentor": "导师",
    "roleContrast": "对照组",
    "roleSupporting": "配角",
    "growthStageLabel": "成长阶段",
    "stageStart": "起点",
    "stageSetback": "受挫",
    "stageTurning": "转折",
    "stageAwakening": "觉醒",
    "stageResolution": "收束",
    "externalGoalPlaceholder": "外显目标（想达成什么）",
    "internalNeedPlaceholder": "内在需求（真正渴望）",
    "coreFearPlaceholder": "核心恐惧",
    "moralBottomLinePlaceholder": "道德底线",
    "secretPlaceholder": "不能说的秘密",
    "coreFlawPlaceholder": "核心缺陷",
    "relationshipHooksPlaceholder": "关系钩子（与他人的冲突/纠葛）",
    "toneStylePlaceholder": "语气风格（如冷系克制、幽默辛辣）",
    "knowledgeDocsLabel": "参考知识库（可多选）",
    "loading": "加载中...",
    "noKnowledgeDocs": "暂无可选知识文档。",
    "noKnowledgeHint": "未选择则不引用知识库内容。",
    "bookAnalysisLabel": "参考拆书分析（可多选）",
    "noBookAnalysis": "暂无可选拆书分析。",
    "bookAnalysisHint": "仅展示已完成的拆书分析。",
    "selectedRefs": "已选参考：知识库 {knowledge} 项，拆书 {book} 项。",
    "generating": "生成中...",
    "generateBtn": "生成并入库"
  };
}

if (!obj.storyModes) {
  obj.storyModes = {
    "page": {
      "toastCreated": "推进模式已创建。",
      "toastUpdated": "推进模式已更新。",
      "toastDeleted": "推进模式已删除。",
      "toastBatchCreated": "已批量创建 {count} 个推进模式子类。",
      "toastChildGenerated": "AI 已生成 {count} 个推进模式子类草稿。",
      "toastTreeGenerated": "AI 推进模式树草稿已生成。",
      "errorNoParent": "父级推进模式不存在。",
      "errorNoChildSelected": "请至少选择一个子类候选。",
      "errorNotFound": "推进模式不存在。",
      "deleteConfirm": "确认删除推进模式「{name}」吗？此操作不可恢复。",
      "deleteConfirmWithChildren": "确认删除推进模式「{name}」吗？这会同时删除其下 {count} 个子类，此操作不可恢复。",
      "mountAsRoot": "作为根推进模式创建",
      "createTitle": "新建推进模式",
      "createChildTitle": "新增推进模式子类",
      "createDesc": "先确定挂载位置，再手动填写 profile，或者先让 AI 生成一份两级树草稿。",
      "createChildDesc": "当前会在指定父类下新增子类。你可以手动填写，也可以先让 AI 基于父类和现有兄弟节点生成多个子类候选，再多选批量保存。",
      "mountPosition": "当前挂载位置",
      "aiGenerateTitle": "AI 生成草稿",
      "aiGenerateChildTitle": "AI 生成子类草稿",
      "aiGenerateHint": "AI 会输出一个可直接编辑的推进模式树草稿，保存前仍然会校验 profile 结构。",
      "aiGenerateChildHint": "AI 会基于当前父类和现有兄弟节点输出一个或多个子类节点草稿，不会再生成整棵树。补充方向可以留空。保存前仍然会校验 profile 结构。",
      "derivationCount": "衍生数量",
      "countOption": "{count} 个",
      "treePromptPlaceholder": "请输入你希望生成的推进模式树方向。",
      "childPromptPlaceholder": "可选：补充你想偏向的子类方向。不填则 AI 会直接基于父类和现有兄弟节点衍生。",
      "generating": "生成中...",
      "generateTreeBtn": "生成推进模式草稿",
      "generateChildBtn": "生成子类草稿",
      "resetDraft": "重置草稿",
      "generatedCandidates": "已生成的子类候选",
      "selectedCount": "已选 {selected} / {total}",
      "candidateHint": "勾选后可批量保存；点击候选卡片会切换到下方表单进行单独编辑。",
      "currentEditing": "当前编辑",
      "candidateN": "候选 {n}",
      "fieldName": "名称",
      "fieldDesc": "描述",
      "fieldTemplate": "人工模板补充",
      "cancel": "取消",
      "saving": "保存中...",
      "batchSaving": "批量保存中...",
      "batchSaveBtn": "批量保存选中子类 ({count})",
      "saveBtn": "保存推进模式",
      "saveChildBtn": "保存当前子类",
      "editTitle": "编辑推进模式",
      "editDesc": "可以修改名称、描述、模板和 profile。两级树限制仍会保留。",
      "currentParent": "当前父级",
      "notFound": "未找到",
      "rootNode": "根节点",
      "saveEditBtn": "保存修改",
      "cardTitle": "推进模式库",
      "cardDescription": "这里维护作品的推进模式，例如系统流、无敌流、种田流、治愈日常。它回答的是"这本书靠什么持续推进和兑现"，会作为后续规划和生成的硬约束输入。",
      "totalCount": "当前推进模式数：{count}",
      "createTreeBtn": "新建推进模式树",
      "loading": "正在加载推进模式树...",
      "emptyTitle": "还没有任何推进模式",
      "emptyHint": "可以先手动建一个根推进模式，也可以直接让 AI 生成一份结构化草稿。",
      "startCreate": "开始创建"
    }
  };
}

const newContent = JSON.stringify(obj, null, 2);
fs.writeFileSync(zhFile, newContent, { encoding: 'utf8' });

const bytes = fs.readFileSync(zhFile);
console.log('First 5 bytes:', Array.from(bytes.slice(0, 5)).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('novel.character.create keys:', Object.keys(obj.novel.character.create).length);
console.log('storyModes.page keys:', Object.keys(obj.storyModes.page).length);
console.log('novel.takeover exists:', !!obj.novel.takeover);
console.log('novel.create.title:', obj.novel.create && obj.novel.create.title);
