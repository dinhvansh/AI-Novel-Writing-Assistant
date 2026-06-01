-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ChapterGenerationState" AS ENUM ('planned', 'drafted', 'reviewed', 'repaired', 'approved', 'published');

-- CreateEnum
CREATE TYPE "PipelineJobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "BeatStatus" AS ENUM ('planned', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "FactCategory" AS ENUM ('world', 'character', 'timeline', 'plot', 'rule');

-- CreateEnum
CREATE TYPE "RagOwnerType" AS ENUM ('novel', 'chapter', 'world', 'character', 'bible', 'chapter_summary', 'consistency_fact', 'character_timeline', 'world_library_item', 'knowledge_document', 'chat_message');

-- CreateEnum
CREATE TYPE "RagJobType" AS ENUM ('upsert', 'delete', 'rebuild');

-- CreateEnum
CREATE TYPE "RagJobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('enabled', 'disabled', 'archived');

-- CreateEnum
CREATE TYPE "KnowledgeIndexStatus" AS ENUM ('idle', 'queued', 'running', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "KnowledgeBindingTargetType" AS ENUM ('novel', 'world');

-- CreateEnum
CREATE TYPE "BookAnalysisStatus" AS ENUM ('draft', 'queued', 'running', 'succeeded', 'failed', 'cancelled', 'archived');

-- CreateEnum
CREATE TYPE "BookAnalysisSectionStatus" AS ENUM ('idle', 'running', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "ImageSceneType" AS ENUM ('character', 'novel_cover', 'chapter_illustration');

-- CreateEnum
CREATE TYPE "ProjectMode" AS ENUM ('ai_led', 'co_pilot', 'draft_mode', 'auto_pipeline');

-- CreateEnum
CREATE TYPE "NarrativePov" AS ENUM ('first_person', 'third_person', 'mixed');

-- CreateEnum
CREATE TYPE "PacePreference" AS ENUM ('slow', 'balanced', 'fast');

-- CreateEnum
CREATE TYPE "EmotionIntensity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "AIFreedom" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ProjectProgressStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'rework', 'blocked');

-- CreateEnum
CREATE TYPE "StorylineVersionStatus" AS ENUM ('draft', 'active', 'frozen');

-- CreateEnum
CREATE TYPE "VolumePlanVersionStatus" AS ENUM ('draft', 'active', 'frozen');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('unplanned', 'pending_generation', 'generating', 'pending_review', 'needs_repair', 'completed');

-- CreateEnum
CREATE TYPE "PipelineRunMode" AS ENUM ('fast', 'polish');

-- CreateEnum
CREATE TYPE "PipelineRepairMode" AS ENUM ('detect_only', 'light_repair', 'heavy_repair', 'continuity_only', 'character_only', 'ending_only');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('queued', 'running', 'waiting_approval', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "NovelWorkflowLane" AS ENUM ('manual_create', 'auto_director');

-- CreateEnum
CREATE TYPE "NovelWorkflowTaskStatus" AS ENUM ('queued', 'running', 'waiting_approval', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "AgentStepType" AS ENUM ('planning', 'tool_call', 'tool_result', 'reasoning', 'write', 'approval', 'answer');

-- CreateEnum
CREATE TYPE "AgentStepStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "AgentApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "CreativeHubThreadStatus" AS ENUM ('idle', 'busy', 'interrupted', 'error');

-- CreateEnum
CREATE TYPE "StoryPlanLevel" AS ENUM ('book', 'arc', 'chapter');

-- CreateEnum
CREATE TYPE "StoryPlanRole" AS ENUM ('setup', 'progress', 'pressure', 'turn', 'payoff', 'cooldown');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('continuity', 'character', 'plot', 'mode_fit');

-- CreateEnum
CREATE TYPE "AuditIssueStatus" AS ENUM ('open', 'resolved', 'ignored');

-- CreateEnum
CREATE TYPE "PayoffLedgerScopeType" AS ENUM ('book', 'volume', 'chapter');

-- CreateEnum
CREATE TYPE "PayoffLedgerStatus" AS ENUM ('setup', 'hinted', 'pending_payoff', 'paid_off', 'failed', 'overdue');

-- CreateEnum
CREATE TYPE "StyleBindingTargetType" AS ENUM ('novel', 'chapter', 'task');

-- CreateEnum
CREATE TYPE "AntiAiRuleType" AS ENUM ('forbidden', 'risk', 'encourage');

-- CreateEnum
CREATE TYPE "AntiAiSeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "CharacterGender" AS ENUM ('male', 'female', 'other', 'unknown');

-- CreateTable
CREATE TABLE IF NOT EXISTS "Novel" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAudience" TEXT,
    "bookSellingPoint" TEXT,
    "competingFeel" TEXT,
    "first30ChapterPromise" TEXT,
    "commercialTagsJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "writingMode" TEXT NOT NULL DEFAULT 'original',
    "projectMode" "ProjectMode",
    "narrativePov" "NarrativePov",
    "pacePreference" "PacePreference",
    "styleTone" TEXT,
    "emotionIntensity" "EmotionIntensity",
    "aiFreedom" "AIFreedom",
    "defaultChapterLength" INTEGER,
    "estimatedChapterCount" INTEGER,
    "projectStatus" "ProjectProgressStatus" DEFAULT 'not_started',
    "storylineStatus" "ProjectProgressStatus" DEFAULT 'not_started',
    "outlineStatus" "ProjectProgressStatus" DEFAULT 'not_started',
    "resourceReadyScore" INTEGER,
    "sourceNovelId" TEXT,
    "sourceKnowledgeDocumentId" TEXT,
    "continuationBookAnalysisId" TEXT,
    "continuationBookAnalysisSections" TEXT,
    "outline" TEXT,
    "structuredOutline" TEXT,
    "storyWorldSliceJson" TEXT,
    "storyWorldSliceOverridesJson" TEXT,
    "storyWorldSliceSchemaVersion" INTEGER NOT NULL DEFAULT 1,
    "genreId" TEXT,
    "primaryStoryModeId" TEXT,
    "secondaryStoryModeId" TEXT,
    "worldId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Novel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CreativeDecision" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "importance" TEXT NOT NULL DEFAULT 'normal',
    "expiresAt" INTEGER,
    "sourceType" TEXT,
    "sourceRefId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NovelSnapshot" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "label" TEXT,
    "snapshotData" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NovelSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT DEFAULT '',
    "order" INTEGER NOT NULL,
    "generationState" "ChapterGenerationState" NOT NULL DEFAULT 'planned',
    "chapterStatus" "ChapterStatus" DEFAULT 'unplanned',
    "targetWordCount" INTEGER,
    "conflictLevel" INTEGER,
    "revealLevel" INTEGER,
    "mustAvoid" TEXT,
    "taskSheet" TEXT,
    "sceneCards" TEXT,
    "repairHistory" TEXT,
    "qualityScore" INTEGER,
    "continuityScore" INTEGER,
    "characterScore" INTEGER,
    "pacingScore" INTEGER,
    "riskFlags" TEXT,
    "hook" TEXT,
    "expectation" TEXT,
    "novelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "gender" "CharacterGender" NOT NULL DEFAULT 'unknown',
    "castRole" TEXT,
    "storyFunction" TEXT,
    "relationToProtagonist" TEXT,
    "personality" TEXT,
    "background" TEXT,
    "development" TEXT,
    "outerGoal" TEXT,
    "innerNeed" TEXT,
    "fear" TEXT,
    "wound" TEXT,
    "misbelief" TEXT,
    "secret" TEXT,
    "moralLine" TEXT,
    "firstImpression" TEXT,
    "arcStart" TEXT,
    "arcMidpoint" TEXT,
    "arcClimax" TEXT,
    "arcEnd" TEXT,
    "currentState" TEXT,
    "currentGoal" TEXT,
    "lastEvolvedAt" TIMESTAMP(3),
    "novelId" TEXT NOT NULL,
    "baseCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterRelation" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "sourceCharacterId" TEXT NOT NULL,
    "targetCharacterId" TEXT NOT NULL,
    "surfaceRelation" TEXT NOT NULL,
    "hiddenTension" TEXT,
    "conflictSource" TEXT,
    "secretAsymmetry" TEXT,
    "dynamicLabel" TEXT,
    "nextTurnPoint" TEXT,
    "trustScore" INTEGER,
    "conflictScore" INTEGER,
    "intimacyScore" INTEGER,
    "dependencyScore" INTEGER,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterCastOption" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "whyItWorks" TEXT,
    "recommendedReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sourceStoryInput" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterCastOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterCastOptionMember" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "gender" "CharacterGender" NOT NULL DEFAULT 'unknown',
    "castRole" TEXT NOT NULL,
    "relationToProtagonist" TEXT,
    "storyFunction" TEXT NOT NULL,
    "shortDescription" TEXT,
    "outerGoal" TEXT,
    "innerNeed" TEXT,
    "fear" TEXT,
    "wound" TEXT,
    "misbelief" TEXT,
    "secret" TEXT,
    "moralLine" TEXT,
    "firstImpression" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterCastOptionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterCastOptionRelation" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "sourceName" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "surfaceRelation" TEXT NOT NULL,
    "hiddenTension" TEXT,
    "conflictSource" TEXT,
    "secretAsymmetry" TEXT,
    "dynamicLabel" TEXT,
    "nextTurnPoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterCastOptionRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterTimeline" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "chapterId" TEXT,
    "chapterOrder" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterCandidate" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "sourceChapterId" TEXT,
    "proposedName" TEXT NOT NULL,
    "proposedRole" TEXT,
    "summary" TEXT,
    "evidenceJson" TEXT,
    "matchedCharacterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterVolumeAssignment" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "roleLabel" TEXT,
    "responsibility" TEXT NOT NULL,
    "appearanceExpectation" TEXT,
    "plannedChapterOrdersJson" TEXT,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "absenceWarningThreshold" INTEGER NOT NULL DEFAULT 3,
    "absenceHighRiskThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterVolumeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterFactionTrack" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "volumeId" TEXT,
    "chapterId" TEXT,
    "chapterOrder" INTEGER,
    "factionLabel" TEXT NOT NULL,
    "stanceLabel" TEXT,
    "summary" TEXT,
    "sourceType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterFactionTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterRelationStage" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "relationId" TEXT,
    "sourceCharacterId" TEXT NOT NULL,
    "targetCharacterId" TEXT NOT NULL,
    "volumeId" TEXT,
    "chapterId" TEXT,
    "chapterOrder" INTEGER,
    "stageLabel" TEXT NOT NULL,
    "stageSummary" TEXT NOT NULL,
    "nextTurnPoint" TEXT,
    "sourceType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterRelationStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BaseCharacter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "development" TEXT NOT NULL,
    "appearance" TEXT,
    "weaknesses" TEXT,
    "interests" TEXT,
    "keyEvents" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaseCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ImageGenerationTask" (
    "id" TEXT NOT NULL,
    "sceneType" "ImageSceneType" NOT NULL DEFAULT 'character',
    "baseCharacterId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "stylePreset" TEXT,
    "size" TEXT NOT NULL DEFAULT '1024x1024',
    "imageCount" INTEGER NOT NULL DEFAULT 1,
    "seed" INTEGER,
    "status" "PipelineJobStatus" NOT NULL DEFAULT 'queued',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "heartbeatAt" TIMESTAMP(3),
    "currentStage" TEXT,
    "currentItemKey" TEXT,
    "currentItemLabel" TEXT,
    "cancelRequestedAt" TIMESTAMP(3),
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageGenerationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ImageAsset" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "sceneType" "ImageSceneType" NOT NULL DEFAULT 'character',
    "baseCharacterId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "seed" INTEGER,
    "prompt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NovelGenre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovelGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NovelStoryMode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT,
    "profileJson" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovelStoryMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "World" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "worldType" TEXT,
    "templateKey" TEXT,
    "axioms" TEXT,
    "background" TEXT,
    "geography" TEXT,
    "cultures" TEXT,
    "magicSystem" TEXT,
    "politics" TEXT,
    "races" TEXT,
    "religions" TEXT,
    "technology" TEXT,
    "conflicts" TEXT,
    "history" TEXT,
    "economy" TEXT,
    "factions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "selectedDimensions" TEXT,
    "selectedElements" TEXT,
    "layerStates" TEXT,
    "consistencyReport" TEXT,
    "overviewSummary" TEXT,
    "structureJson" TEXT,
    "bindingSupportJson" TEXT,
    "structureSchemaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorldPropertyLibrary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "worldType" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "sourceWorldId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldPropertyLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorldSnapshot" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "label" TEXT,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorldDeepeningQA" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'recommended',
    "question" TEXT NOT NULL,
    "targetLayer" TEXT,
    "targetField" TEXT,
    "answer" TEXT,
    "integratedSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldDeepeningQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorldConsistencyIssue" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail" TEXT,
    "source" TEXT NOT NULL DEFAULT 'rule',
    "status" TEXT NOT NULL DEFAULT 'open',
    "targetField" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldConsistencyIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WritingFormula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceText" TEXT,
    "content" TEXT,
    "genre" TEXT,
    "style" TEXT,
    "toneVoice" TEXT,
    "structure" TEXT,
    "pacing" TEXT,
    "paragraphPattern" TEXT,
    "sentenceStructure" TEXT,
    "vocabularyLevel" TEXT,
    "rhetoricalDevices" TEXT,
    "narrativeMode" TEXT,
    "perspectivePoint" TEXT,
    "characterVoice" TEXT,
    "themes" TEXT,
    "motifs" TEXT,
    "emotionalTone" TEXT,
    "uniqueFeatures" TEXT,
    "formulaDescription" TEXT,
    "formulaSteps" TEXT,
    "applicationTips" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StyleProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tagsJson" TEXT,
    "applicableGenresJson" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceRefId" TEXT,
    "sourceContent" TEXT,
    "extractedFeaturesJson" TEXT,
    "analysisMarkdown" TEXT,
    "narrativeRulesJson" TEXT,
    "characterRulesJson" TEXT,
    "languageRulesJson" TEXT,
    "rhythmRulesJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StyleTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagsJson" TEXT,
    "applicableGenresJson" TEXT,
    "analysisMarkdown" TEXT,
    "narrativeRulesJson" TEXT,
    "characterRulesJson" TEXT,
    "languageRulesJson" TEXT,
    "rhythmRulesJson" TEXT,
    "defaultAntiAiRuleKeysJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AntiAiRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AntiAiRuleType" NOT NULL,
    "severity" "AntiAiSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "detectPatternsJson" TEXT,
    "rewriteSuggestion" TEXT,
    "promptInstruction" TEXT,
    "autoRewrite" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AntiAiRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StyleProfileAntiAiRule" (
    "id" TEXT NOT NULL,
    "styleProfileId" TEXT NOT NULL,
    "antiAiRuleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleProfileAntiAiRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StyleBinding" (
    "id" TEXT NOT NULL,
    "styleProfileId" TEXT NOT NULL,
    "targetType" "StyleBindingTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TitleLibrary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "clickRate" DOUBLE PRECISION,
    "keywords" TEXT,
    "genreId" TEXT,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TitleLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "APIKey" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "displayName" TEXT,
    "key" TEXT,
    "model" TEXT,
    "baseURL" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reasoningEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ModelRouteConfig" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelRouteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NovelBible" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "coreSetting" TEXT,
    "forbiddenRules" TEXT,
    "mainPromise" TEXT,
    "characterArcs" TEXT,
    "worldRules" TEXT,
    "rawContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovelBible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlotBeat" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterOrder" INTEGER,
    "beatType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "BeatStatus" NOT NULL DEFAULT 'planned',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlotBeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChapterSummary" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyEvents" TEXT,
    "characterStates" TEXT,
    "hook" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ConsistencyFact" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT,
    "category" "FactCategory" NOT NULL DEFAULT 'plot',
    "content" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsistencyFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GenerationJob" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "startOrder" INTEGER NOT NULL,
    "endOrder" INTEGER NOT NULL,
    "runMode" "PipelineRunMode" DEFAULT 'fast',
    "autoReview" BOOLEAN NOT NULL DEFAULT true,
    "autoRepair" BOOLEAN NOT NULL DEFAULT true,
    "skipCompleted" BOOLEAN NOT NULL DEFAULT true,
    "qualityThreshold" INTEGER,
    "repairMode" "PipelineRepairMode" DEFAULT 'light_repair',
    "status" "PipelineJobStatus" NOT NULL DEFAULT 'queued',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "heartbeatAt" TIMESTAMP(3),
    "currentStage" TEXT,
    "currentItemKey" TEXT,
    "currentItemLabel" TEXT,
    "cancelRequestedAt" TIMESTAMP(3),
    "error" TEXT,
    "lastErrorType" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "llmCallCount" INTEGER NOT NULL DEFAULT 0,
    "lastTokenRecordedAt" TIMESTAMP(3),
    "payload" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentRun" (
    "id" TEXT NOT NULL,
    "novelId" TEXT,
    "chapterId" TEXT,
    "sessionId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "entryAgent" TEXT NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'queued',
    "currentStep" TEXT,
    "currentAgent" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentStep" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "agentName" TEXT NOT NULL,
    "stepType" "AgentStepType" NOT NULL,
    "status" "AgentStepStatus" NOT NULL DEFAULT 'succeeded',
    "parentStepId" TEXT,
    "idempotencyKey" TEXT,
    "inputJson" TEXT,
    "outputJson" TEXT,
    "error" TEXT,
    "errorCode" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "tokenUsageJson" TEXT,
    "costUsd" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentApproval" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepId" TEXT,
    "approvalType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "diffSummary" TEXT NOT NULL,
    "status" "AgentApprovalStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "decider" TEXT,
    "decidedAt" TIMESTAMP(3),
    "payloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CreativeHubThread" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '新对话',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "status" "CreativeHubThreadStatus" NOT NULL DEFAULT 'idle',
    "latestRunId" TEXT,
    "latestError" TEXT,
    "resourceBindingsJson" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeHubThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CreativeHubCheckpoint" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "parentCheckpointId" TEXT,
    "runId" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "preview" TEXT,
    "messagesJson" TEXT NOT NULL,
    "interruptsJson" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeHubCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StorylineVersion" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "StorylineVersionStatus" NOT NULL DEFAULT 'draft',
    "content" TEXT NOT NULL,
    "diffSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorylineVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VolumePlanVersion" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "VolumePlanVersionStatus" NOT NULL DEFAULT 'draft',
    "contentJson" TEXT NOT NULL,
    "diffSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolumePlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VolumePlan" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "mainPromise" TEXT,
    "escalationMode" TEXT,
    "protagonistChange" TEXT,
    "climax" TEXT,
    "nextVolumeHook" TEXT,
    "resetPoint" TEXT,
    "openPayoffsJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sourceVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolumePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VolumeChapterPlan" (
    "id" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "chapterOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "purpose" TEXT,
    "conflictLevel" INTEGER,
    "revealLevel" INTEGER,
    "targetWordCount" INTEGER,
    "mustAvoid" TEXT,
    "taskSheet" TEXT,
    "payoffRefsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolumeChapterPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QualityReport" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT,
    "coherence" INTEGER NOT NULL,
    "repetition" INTEGER NOT NULL,
    "pacing" INTEGER NOT NULL,
    "voice" INTEGER NOT NULL,
    "engagement" INTEGER NOT NULL,
    "overall" INTEGER NOT NULL,
    "issues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StoryMacroPlan" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "storyInput" TEXT,
    "expansionJson" TEXT,
    "decompositionJson" TEXT,
    "issuesJson" TEXT,
    "lockedFieldsJson" TEXT,
    "constraintEngineJson" TEXT,
    "stateJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryMacroPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BookContract" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "readingPromise" TEXT NOT NULL,
    "protagonistFantasy" TEXT NOT NULL,
    "coreSellingPoint" TEXT NOT NULL,
    "chapter3Payoff" TEXT NOT NULL,
    "chapter10Payoff" TEXT NOT NULL,
    "chapter30Payoff" TEXT NOT NULL,
    "escalationLadder" TEXT NOT NULL,
    "relationshipMainline" TEXT NOT NULL,
    "absoluteRedLinesJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NovelWorkflowTask" (
    "id" TEXT NOT NULL,
    "novelId" TEXT,
    "lane" "NovelWorkflowLane" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "NovelWorkflowTaskStatus" NOT NULL DEFAULT 'queued',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStage" TEXT,
    "currentItemKey" TEXT,
    "currentItemLabel" TEXT,
    "checkpointType" TEXT,
    "checkpointSummary" TEXT,
    "resumeTargetJson" TEXT,
    "seedPayloadJson" TEXT,
    "milestonesJson" TEXT,
    "heartbeatAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "cancelRequestedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "llmCallCount" INTEGER NOT NULL DEFAULT 0,
    "lastTokenRecordedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovelWorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StoryStateSnapshot" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "sourceChapterId" TEXT,
    "summary" TEXT,
    "rawStateJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryStateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterState" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "currentGoal" TEXT,
    "emotion" TEXT,
    "stressLevel" INTEGER,
    "secretExposure" TEXT,
    "knownFactsJson" TEXT,
    "misbeliefsJson" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RelationState" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "sourceCharacterId" TEXT NOT NULL,
    "targetCharacterId" TEXT NOT NULL,
    "trustScore" INTEGER,
    "intimacyScore" INTEGER,
    "conflictScore" INTEGER,
    "dependencyScore" INTEGER,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InformationState" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "holderType" TEXT NOT NULL,
    "holderRefId" TEXT,
    "fact" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InformationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ForeshadowState" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL,
    "setupChapterId" TEXT,
    "payoffChapterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForeshadowState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OpenConflict" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT,
    "sourceSnapshotId" TEXT,
    "sourceIssueId" TEXT,
    "sourceType" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "conflictKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "evidenceJson" TEXT,
    "affectedCharacterIdsJson" TEXT,
    "resolutionHint" TEXT,
    "lastSeenChapterOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PayoffLedgerItem" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "ledgerKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "scopeType" "PayoffLedgerScopeType" NOT NULL,
    "currentStatus" "PayoffLedgerStatus" NOT NULL,
    "targetStartChapterOrder" INTEGER,
    "targetEndChapterOrder" INTEGER,
    "firstSeenChapterOrder" INTEGER,
    "lastTouchedChapterOrder" INTEGER,
    "lastTouchedChapterId" TEXT,
    "setupChapterId" TEXT,
    "payoffChapterId" TEXT,
    "lastSnapshotId" TEXT,
    "sourceRefsJson" TEXT,
    "evidenceJson" TEXT,
    "riskSignalsJson" TEXT,
    "statusReason" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoffLedgerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StoryPlan" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT,
    "parentId" TEXT,
    "sourceStateSnapshotId" TEXT,
    "level" "StoryPlanLevel" NOT NULL,
    "planRole" "StoryPlanRole",
    "phaseLabel" TEXT,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "participantsJson" TEXT,
    "revealsJson" TEXT,
    "riskNotesJson" TEXT,
    "mustAdvanceJson" TEXT,
    "mustPreserveJson" TEXT,
    "sourceIssueIdsJson" TEXT,
    "replannedFromPlanId" TEXT,
    "hookTarget" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "externalRef" TEXT,
    "rawPlanJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChapterPlanScene" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "conflict" TEXT,
    "reveal" TEXT,
    "emotionBeat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterPlanScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReplanRun" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT,
    "sourcePlanId" TEXT,
    "triggerType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "outputSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplanRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuditReport" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "auditType" "AuditType" NOT NULL,
    "overallScore" INTEGER,
    "summary" TEXT,
    "legacyScoreJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuditIssue" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "auditType" "AuditType" NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "fixSuggestion" TEXT NOT NULL,
    "status" "AuditIssueStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'enabled',
    "activeVersionId" TEXT,
    "activeVersionNumber" INTEGER NOT NULL DEFAULT 0,
    "latestIndexStatus" "KnowledgeIndexStatus" NOT NULL DEFAULT 'idle',
    "lastIndexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KnowledgeDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KnowledgeBinding" (
    "id" TEXT NOT NULL,
    "targetType" "KnowledgeBindingTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BookAnalysis" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BookAnalysisStatus" NOT NULL DEFAULT 'queued',
    "summary" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heartbeatAt" TIMESTAMP(3),
    "currentStage" TEXT,
    "currentItemKey" TEXT,
    "currentItemLabel" TEXT,
    "cancelRequestedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "publishedDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BookAnalysisSourceCache" (
    "id" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "notesMaxTokens" INTEGER NOT NULL,
    "segmentVersion" INTEGER NOT NULL DEFAULT 1,
    "segmentCount" INTEGER NOT NULL,
    "notesJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookAnalysisSourceCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BookAnalysisSection" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BookAnalysisSectionStatus" NOT NULL DEFAULT 'idle',
    "aiContent" TEXT,
    "editedContent" TEXT,
    "notes" TEXT,
    "structuredDataJson" TEXT,
    "evidenceJson" TEXT,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookAnalysisSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "ownerType" "RagOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "novelId" TEXT,
    "worldId" TEXT,
    "title" TEXT,
    "chunkText" TEXT NOT NULL,
    "chunkHash" TEXT NOT NULL,
    "chunkOrder" INTEGER NOT NULL,
    "tokenEstimate" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'zh',
    "metadataJson" TEXT,
    "embedProvider" TEXT NOT NULL,
    "embedModel" TEXT NOT NULL,
    "embedVersion" INTEGER NOT NULL DEFAULT 1,
    "indexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RagIndexJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "jobType" "RagJobType" NOT NULL,
    "ownerType" "RagOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "RagJobStatus" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payloadJson" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RagIndexJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TaskCenterArchive" (
    "id" TEXT NOT NULL,
    "taskKind" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCenterArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novel_genreId_idx" ON "Novel"("genreId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novel_primaryStoryModeId_idx" ON "Novel"("primaryStoryModeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novel_secondaryStoryModeId_idx" ON "Novel"("secondaryStoryModeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novel_worldId_idx" ON "Novel"("worldId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novel_writingMode_idx" ON "Novel"("writingMode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novel_sourceNovelId_idx" ON "Novel"("sourceNovelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novel_sourceKnowledgeDocumentId_idx" ON "Novel"("sourceKnowledgeDocumentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novel_continuationBookAnalysisId_idx" ON "Novel"("continuationBookAnalysisId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CreativeDecision_novelId_createdAt_idx" ON "CreativeDecision"("novelId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NovelSnapshot_novelId_createdAt_idx" ON "NovelSnapshot"("novelId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Chapter_novelId_order_idx" ON "Chapter"("novelId", "order");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Character_novelId_idx" ON "Character"("novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Character_baseCharacterId_idx" ON "Character"("baseCharacterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterRelation_novelId_updatedAt_idx" ON "CharacterRelation"("novelId", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterRelation_sourceCharacterId_idx" ON "CharacterRelation"("sourceCharacterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterRelation_targetCharacterId_idx" ON "CharacterRelation"("targetCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CharacterRelation_novelId_sourceCharacterId_targetCharacter_key" ON "CharacterRelation"("novelId", "sourceCharacterId", "targetCharacterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterCastOption_novelId_updatedAt_idx" ON "CharacterCastOption"("novelId", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterCastOptionMember_optionId_sortOrder_idx" ON "CharacterCastOptionMember"("optionId", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterCastOptionRelation_optionId_sortOrder_idx" ON "CharacterCastOptionRelation"("optionId", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterTimeline_novelId_characterId_idx" ON "CharacterTimeline"("novelId", "characterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterTimeline_characterId_chapterOrder_idx" ON "CharacterTimeline"("characterId", "chapterOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterTimeline_chapterId_idx" ON "CharacterTimeline"("chapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterCandidate_novelId_status_updatedAt_idx" ON "CharacterCandidate"("novelId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterCandidate_sourceChapterId_idx" ON "CharacterCandidate"("sourceChapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterCandidate_matchedCharacterId_idx" ON "CharacterCandidate"("matchedCharacterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterVolumeAssignment_novelId_volumeId_isCore_idx" ON "CharacterVolumeAssignment"("novelId", "volumeId", "isCore");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterVolumeAssignment_volumeId_characterId_idx" ON "CharacterVolumeAssignment"("volumeId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CharacterVolumeAssignment_characterId_volumeId_key" ON "CharacterVolumeAssignment"("characterId", "volumeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterFactionTrack_novelId_characterId_createdAt_idx" ON "CharacterFactionTrack"("novelId", "characterId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterFactionTrack_volumeId_characterId_createdAt_idx" ON "CharacterFactionTrack"("volumeId", "characterId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterFactionTrack_chapterId_createdAt_idx" ON "CharacterFactionTrack"("chapterId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterRelationStage_novelId_isCurrent_updatedAt_idx" ON "CharacterRelationStage"("novelId", "isCurrent", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterRelationStage_sourceCharacterId_targetCharacterId__idx" ON "CharacterRelationStage"("sourceCharacterId", "targetCharacterId", "isCurrent");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterRelationStage_relationId_idx" ON "CharacterRelationStage"("relationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterRelationStage_chapterId_idx" ON "CharacterRelationStage"("chapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ImageGenerationTask_sceneType_status_idx" ON "ImageGenerationTask"("sceneType", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ImageGenerationTask_baseCharacterId_createdAt_idx" ON "ImageGenerationTask"("baseCharacterId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ImageAsset_taskId_idx" ON "ImageAsset"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ImageAsset_sceneType_createdAt_idx" ON "ImageAsset"("sceneType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ImageAsset_baseCharacterId_isPrimary_createdAt_idx" ON "ImageAsset"("baseCharacterId", "isPrimary", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NovelGenre_parentId_idx" ON "NovelGenre"("parentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NovelStoryMode_parentId_idx" ON "NovelStoryMode"("parentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorldPropertyLibrary_sourceWorldId_idx" ON "WorldPropertyLibrary"("sourceWorldId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorldSnapshot_worldId_createdAt_idx" ON "WorldSnapshot"("worldId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorldDeepeningQA_worldId_status_idx" ON "WorldDeepeningQA"("worldId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorldConsistencyIssue_worldId_status_idx" ON "WorldConsistencyIssue"("worldId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorldConsistencyIssue_worldId_severity_idx" ON "WorldConsistencyIssue"("worldId", "severity");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StyleProfile_status_updatedAt_idx" ON "StyleProfile"("status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StyleProfile_sourceType_sourceRefId_idx" ON "StyleProfile"("sourceType", "sourceRefId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StyleTemplate_key_key" ON "StyleTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AntiAiRule_key_key" ON "AntiAiRule"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AntiAiRule_type_enabled_idx" ON "AntiAiRule"("type", "enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StyleProfileAntiAiRule_antiAiRuleId_idx" ON "StyleProfileAntiAiRule"("antiAiRuleId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StyleProfileAntiAiRule_styleProfileId_antiAiRuleId_key" ON "StyleProfileAntiAiRule"("styleProfileId", "antiAiRuleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StyleBinding_targetType_targetId_enabled_idx" ON "StyleBinding"("targetType", "targetId", "enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StyleBinding_styleProfileId_idx" ON "StyleBinding"("styleProfileId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "APIKey_provider_key" ON "APIKey"("provider");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ModelRouteConfig_taskType_key" ON "ModelRouteConfig"("taskType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NovelBible_novelId_key" ON "NovelBible"("novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlotBeat_novelId_idx" ON "PlotBeat"("novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlotBeat_novelId_chapterOrder_idx" ON "PlotBeat"("novelId", "chapterOrder");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChapterSummary_chapterId_key" ON "ChapterSummary"("chapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChapterSummary_novelId_idx" ON "ChapterSummary"("novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConsistencyFact_novelId_idx" ON "ConsistencyFact"("novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConsistencyFact_chapterId_idx" ON "ConsistencyFact"("chapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConsistencyFact_novelId_category_idx" ON "ConsistencyFact"("novelId", "category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GenerationJob_novelId_idx" ON "GenerationJob"("novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GenerationJob_novelId_status_idx" ON "GenerationJob"("novelId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentRun_status_updatedAt_idx" ON "AgentRun"("status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentRun_novelId_createdAt_idx" ON "AgentRun"("novelId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentRun_novelId_chapterId_createdAt_idx" ON "AgentRun"("novelId", "chapterId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentRun_sessionId_createdAt_idx" ON "AgentRun"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentStep_runId_idempotencyKey_idx" ON "AgentStep"("runId", "idempotencyKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentStep_runId_parentStepId_idx" ON "AgentStep"("runId", "parentStepId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AgentStep_runId_seq_key" ON "AgentStep"("runId", "seq");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentApproval_runId_status_idx" ON "AgentApproval"("runId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentApproval_stepId_idx" ON "AgentApproval"("stepId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentApproval_status_expiresAt_idx" ON "AgentApproval"("status", "expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CreativeHubThread_archived_updatedAt_idx" ON "CreativeHubThread"("archived", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CreativeHubThread_status_updatedAt_idx" ON "CreativeHubThread"("status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CreativeHubCheckpoint_threadId_createdAt_idx" ON "CreativeHubCheckpoint"("threadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CreativeHubCheckpoint_threadId_checkpointId_key" ON "CreativeHubCheckpoint"("threadId", "checkpointId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StorylineVersion_novelId_status_createdAt_idx" ON "StorylineVersion"("novelId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StorylineVersion_novelId_version_key" ON "StorylineVersion"("novelId", "version");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VolumePlanVersion_novelId_status_createdAt_idx" ON "VolumePlanVersion"("novelId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VolumePlanVersion_novelId_version_key" ON "VolumePlanVersion"("novelId", "version");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VolumePlan_novelId_status_sortOrder_idx" ON "VolumePlan"("novelId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VolumePlan_sourceVersionId_idx" ON "VolumePlan"("sourceVersionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VolumePlan_novelId_sortOrder_key" ON "VolumePlan"("novelId", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VolumeChapterPlan_volumeId_chapterOrder_idx" ON "VolumeChapterPlan"("volumeId", "chapterOrder");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VolumeChapterPlan_volumeId_chapterOrder_key" ON "VolumeChapterPlan"("volumeId", "chapterOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QualityReport_novelId_idx" ON "QualityReport"("novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QualityReport_chapterId_idx" ON "QualityReport"("chapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QualityReport_novelId_createdAt_idx" ON "QualityReport"("novelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StoryMacroPlan_novelId_key" ON "StoryMacroPlan"("novelId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BookContract_novelId_key" ON "BookContract"("novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NovelWorkflowTask_novelId_status_updatedAt_idx" ON "NovelWorkflowTask"("novelId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NovelWorkflowTask_status_updatedAt_idx" ON "NovelWorkflowTask"("status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NovelWorkflowTask_lane_updatedAt_idx" ON "NovelWorkflowTask"("lane", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoryStateSnapshot_novelId_createdAt_idx" ON "StoryStateSnapshot"("novelId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoryStateSnapshot_sourceChapterId_idx" ON "StoryStateSnapshot"("sourceChapterId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StoryStateSnapshot_novelId_sourceChapterId_key" ON "StoryStateSnapshot"("novelId", "sourceChapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CharacterState_characterId_createdAt_idx" ON "CharacterState"("characterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CharacterState_snapshotId_characterId_key" ON "CharacterState"("snapshotId", "characterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RelationState_sourceCharacterId_targetCharacterId_idx" ON "RelationState"("sourceCharacterId", "targetCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RelationState_snapshotId_sourceCharacterId_targetCharacterI_key" ON "RelationState"("snapshotId", "sourceCharacterId", "targetCharacterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InformationState_snapshotId_holderType_idx" ON "InformationState"("snapshotId", "holderType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ForeshadowState_snapshotId_status_idx" ON "ForeshadowState"("snapshotId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ForeshadowState_setupChapterId_idx" ON "ForeshadowState"("setupChapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ForeshadowState_payoffChapterId_idx" ON "ForeshadowState"("payoffChapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OpenConflict_novelId_status_updatedAt_idx" ON "OpenConflict"("novelId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OpenConflict_chapterId_status_idx" ON "OpenConflict"("chapterId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OpenConflict_sourceSnapshotId_idx" ON "OpenConflict"("sourceSnapshotId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OpenConflict_sourceIssueId_idx" ON "OpenConflict"("sourceIssueId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OpenConflict_novelId_chapterId_sourceType_conflictKey_key" ON "OpenConflict"("novelId", "chapterId", "sourceType", "conflictKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoffLedgerItem_novelId_currentStatus_updatedAt_idx" ON "PayoffLedgerItem"("novelId", "currentStatus", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoffLedgerItem_novelId_targetEndChapterOrder_idx" ON "PayoffLedgerItem"("novelId", "targetEndChapterOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoffLedgerItem_lastTouchedChapterId_idx" ON "PayoffLedgerItem"("lastTouchedChapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoffLedgerItem_setupChapterId_idx" ON "PayoffLedgerItem"("setupChapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoffLedgerItem_payoffChapterId_idx" ON "PayoffLedgerItem"("payoffChapterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoffLedgerItem_lastSnapshotId_idx" ON "PayoffLedgerItem"("lastSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PayoffLedgerItem_novelId_ledgerKey_key" ON "PayoffLedgerItem"("novelId", "ledgerKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoryPlan_novelId_level_createdAt_idx" ON "StoryPlan"("novelId", "level", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoryPlan_chapterId_createdAt_idx" ON "StoryPlan"("chapterId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoryPlan_externalRef_idx" ON "StoryPlan"("externalRef");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoryPlan_sourceStateSnapshotId_idx" ON "StoryPlan"("sourceStateSnapshotId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChapterPlanScene_planId_sortOrder_idx" ON "ChapterPlanScene"("planId", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReplanRun_novelId_createdAt_idx" ON "ReplanRun"("novelId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReplanRun_chapterId_createdAt_idx" ON "ReplanRun"("chapterId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditReport_novelId_chapterId_auditType_createdAt_idx" ON "AuditReport"("novelId", "chapterId", "auditType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditReport_chapterId_createdAt_idx" ON "AuditReport"("chapterId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditIssue_reportId_status_idx" ON "AuditIssue"("reportId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditIssue_auditType_severity_idx" ON "AuditIssue"("auditType", "severity");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeDocument_status_updatedAt_idx" ON "KnowledgeDocument"("status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeDocument_title_idx" ON "KnowledgeDocument"("title");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeDocumentVersion_documentId_createdAt_idx" ON "KnowledgeDocumentVersion"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeDocumentVersion_contentHash_idx" ON "KnowledgeDocumentVersion"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeDocumentVersion_documentId_versionNumber_key" ON "KnowledgeDocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeBinding_targetType_targetId_idx" ON "KnowledgeBinding"("targetType", "targetId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeBinding_documentId_idx" ON "KnowledgeBinding"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeBinding_targetType_targetId_documentId_key" ON "KnowledgeBinding"("targetType", "targetId", "documentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BookAnalysis_documentId_status_idx" ON "BookAnalysis"("documentId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BookAnalysis_documentVersionId_idx" ON "BookAnalysis"("documentVersionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BookAnalysis_status_updatedAt_idx" ON "BookAnalysis"("status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BookAnalysisSourceCache_documentVersionId_updatedAt_idx" ON "BookAnalysisSourceCache"("documentVersionId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BookAnalysisSourceCache_documentVersionId_provider_model_te_key" ON "BookAnalysisSourceCache"("documentVersionId", "provider", "model", "temperature", "notesMaxTokens", "segmentVersion");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BookAnalysisSection_analysisId_sortOrder_idx" ON "BookAnalysisSection"("analysisId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BookAnalysisSection_analysisId_sectionKey_key" ON "BookAnalysisSection"("analysisId", "sectionKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_tenantId_ownerType_ownerId_idx" ON "KnowledgeChunk"("tenantId", "ownerType", "ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_tenantId_novelId_idx" ON "KnowledgeChunk"("tenantId", "novelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_tenantId_worldId_idx" ON "KnowledgeChunk"("tenantId", "worldId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_chunkHash_idx" ON "KnowledgeChunk"("chunkHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RagIndexJob_status_runAfter_idx" ON "RagIndexJob"("status", "runAfter");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RagIndexJob_tenantId_ownerType_ownerId_idx" ON "RagIndexJob"("tenantId", "ownerType", "ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaskCenterArchive_taskKind_archivedAt_idx" ON "TaskCenterArchive"("taskKind", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TaskCenterArchive_taskKind_taskId_key" ON "TaskCenterArchive"("taskKind", "taskId");

-- AddForeignKey
ALTER TABLE "Novel" DROP CONSTRAINT IF EXISTS "Novel_genreId_fkey"; ALTER TABLE "Novel" ADD CONSTRAINT "Novel_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "NovelGenre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Novel" DROP CONSTRAINT IF EXISTS "Novel_primaryStoryModeId_fkey"; ALTER TABLE "Novel" ADD CONSTRAINT "Novel_primaryStoryModeId_fkey" FOREIGN KEY ("primaryStoryModeId") REFERENCES "NovelStoryMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Novel" DROP CONSTRAINT IF EXISTS "Novel_secondaryStoryModeId_fkey"; ALTER TABLE "Novel" ADD CONSTRAINT "Novel_secondaryStoryModeId_fkey" FOREIGN KEY ("secondaryStoryModeId") REFERENCES "NovelStoryMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Novel" DROP CONSTRAINT IF EXISTS "Novel_worldId_fkey"; ALTER TABLE "Novel" ADD CONSTRAINT "Novel_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Novel" DROP CONSTRAINT IF EXISTS "Novel_sourceNovelId_fkey"; ALTER TABLE "Novel" ADD CONSTRAINT "Novel_sourceNovelId_fkey" FOREIGN KEY ("sourceNovelId") REFERENCES "Novel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Novel" DROP CONSTRAINT IF EXISTS "Novel_sourceKnowledgeDocumentId_fkey"; ALTER TABLE "Novel" ADD CONSTRAINT "Novel_sourceKnowledgeDocumentId_fkey" FOREIGN KEY ("sourceKnowledgeDocumentId") REFERENCES "KnowledgeDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Novel" DROP CONSTRAINT IF EXISTS "Novel_continuationBookAnalysisId_fkey"; ALTER TABLE "Novel" ADD CONSTRAINT "Novel_continuationBookAnalysisId_fkey" FOREIGN KEY ("continuationBookAnalysisId") REFERENCES "BookAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeDecision" DROP CONSTRAINT IF EXISTS "CreativeDecision_novelId_fkey"; ALTER TABLE "CreativeDecision" ADD CONSTRAINT "CreativeDecision_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelSnapshot" DROP CONSTRAINT IF EXISTS "NovelSnapshot_novelId_fkey"; ALTER TABLE "NovelSnapshot" ADD CONSTRAINT "NovelSnapshot_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT IF EXISTS "Chapter_novelId_fkey"; ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" DROP CONSTRAINT IF EXISTS "Character_novelId_fkey"; ALTER TABLE "Character" ADD CONSTRAINT "Character_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelation" DROP CONSTRAINT IF EXISTS "CharacterRelation_novelId_fkey"; ALTER TABLE "CharacterRelation" ADD CONSTRAINT "CharacterRelation_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelation" DROP CONSTRAINT IF EXISTS "CharacterRelation_sourceCharacterId_fkey"; ALTER TABLE "CharacterRelation" ADD CONSTRAINT "CharacterRelation_sourceCharacterId_fkey" FOREIGN KEY ("sourceCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelation" DROP CONSTRAINT IF EXISTS "CharacterRelation_targetCharacterId_fkey"; ALTER TABLE "CharacterRelation" ADD CONSTRAINT "CharacterRelation_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCastOption" DROP CONSTRAINT IF EXISTS "CharacterCastOption_novelId_fkey"; ALTER TABLE "CharacterCastOption" ADD CONSTRAINT "CharacterCastOption_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCastOptionMember" DROP CONSTRAINT IF EXISTS "CharacterCastOptionMember_optionId_fkey"; ALTER TABLE "CharacterCastOptionMember" ADD CONSTRAINT "CharacterCastOptionMember_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CharacterCastOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCastOptionRelation" DROP CONSTRAINT IF EXISTS "CharacterCastOptionRelation_optionId_fkey"; ALTER TABLE "CharacterCastOptionRelation" ADD CONSTRAINT "CharacterCastOptionRelation_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CharacterCastOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTimeline" DROP CONSTRAINT IF EXISTS "CharacterTimeline_novelId_fkey"; ALTER TABLE "CharacterTimeline" ADD CONSTRAINT "CharacterTimeline_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTimeline" DROP CONSTRAINT IF EXISTS "CharacterTimeline_characterId_fkey"; ALTER TABLE "CharacterTimeline" ADD CONSTRAINT "CharacterTimeline_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTimeline" DROP CONSTRAINT IF EXISTS "CharacterTimeline_chapterId_fkey"; ALTER TABLE "CharacterTimeline" ADD CONSTRAINT "CharacterTimeline_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCandidate" DROP CONSTRAINT IF EXISTS "CharacterCandidate_novelId_fkey"; ALTER TABLE "CharacterCandidate" ADD CONSTRAINT "CharacterCandidate_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCandidate" DROP CONSTRAINT IF EXISTS "CharacterCandidate_sourceChapterId_fkey"; ALTER TABLE "CharacterCandidate" ADD CONSTRAINT "CharacterCandidate_sourceChapterId_fkey" FOREIGN KEY ("sourceChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCandidate" DROP CONSTRAINT IF EXISTS "CharacterCandidate_matchedCharacterId_fkey"; ALTER TABLE "CharacterCandidate" ADD CONSTRAINT "CharacterCandidate_matchedCharacterId_fkey" FOREIGN KEY ("matchedCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterVolumeAssignment" DROP CONSTRAINT IF EXISTS "CharacterVolumeAssignment_novelId_fkey"; ALTER TABLE "CharacterVolumeAssignment" ADD CONSTRAINT "CharacterVolumeAssignment_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterVolumeAssignment" DROP CONSTRAINT IF EXISTS "CharacterVolumeAssignment_characterId_fkey"; ALTER TABLE "CharacterVolumeAssignment" ADD CONSTRAINT "CharacterVolumeAssignment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterVolumeAssignment" DROP CONSTRAINT IF EXISTS "CharacterVolumeAssignment_volumeId_fkey"; ALTER TABLE "CharacterVolumeAssignment" ADD CONSTRAINT "CharacterVolumeAssignment_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "VolumePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFactionTrack" DROP CONSTRAINT IF EXISTS "CharacterFactionTrack_novelId_fkey"; ALTER TABLE "CharacterFactionTrack" ADD CONSTRAINT "CharacterFactionTrack_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFactionTrack" DROP CONSTRAINT IF EXISTS "CharacterFactionTrack_characterId_fkey"; ALTER TABLE "CharacterFactionTrack" ADD CONSTRAINT "CharacterFactionTrack_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFactionTrack" DROP CONSTRAINT IF EXISTS "CharacterFactionTrack_volumeId_fkey"; ALTER TABLE "CharacterFactionTrack" ADD CONSTRAINT "CharacterFactionTrack_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "VolumePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFactionTrack" DROP CONSTRAINT IF EXISTS "CharacterFactionTrack_chapterId_fkey"; ALTER TABLE "CharacterFactionTrack" ADD CONSTRAINT "CharacterFactionTrack_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelationStage" DROP CONSTRAINT IF EXISTS "CharacterRelationStage_novelId_fkey"; ALTER TABLE "CharacterRelationStage" ADD CONSTRAINT "CharacterRelationStage_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelationStage" DROP CONSTRAINT IF EXISTS "CharacterRelationStage_relationId_fkey"; ALTER TABLE "CharacterRelationStage" ADD CONSTRAINT "CharacterRelationStage_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "CharacterRelation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelationStage" DROP CONSTRAINT IF EXISTS "CharacterRelationStage_sourceCharacterId_fkey"; ALTER TABLE "CharacterRelationStage" ADD CONSTRAINT "CharacterRelationStage_sourceCharacterId_fkey" FOREIGN KEY ("sourceCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelationStage" DROP CONSTRAINT IF EXISTS "CharacterRelationStage_targetCharacterId_fkey"; ALTER TABLE "CharacterRelationStage" ADD CONSTRAINT "CharacterRelationStage_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelationStage" DROP CONSTRAINT IF EXISTS "CharacterRelationStage_volumeId_fkey"; ALTER TABLE "CharacterRelationStage" ADD CONSTRAINT "CharacterRelationStage_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "VolumePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelationStage" DROP CONSTRAINT IF EXISTS "CharacterRelationStage_chapterId_fkey"; ALTER TABLE "CharacterRelationStage" ADD CONSTRAINT "CharacterRelationStage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageGenerationTask" DROP CONSTRAINT IF EXISTS "ImageGenerationTask_baseCharacterId_fkey"; ALTER TABLE "ImageGenerationTask" ADD CONSTRAINT "ImageGenerationTask_baseCharacterId_fkey" FOREIGN KEY ("baseCharacterId") REFERENCES "BaseCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" DROP CONSTRAINT IF EXISTS "ImageAsset_taskId_fkey"; ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ImageGenerationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" DROP CONSTRAINT IF EXISTS "ImageAsset_baseCharacterId_fkey"; ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_baseCharacterId_fkey" FOREIGN KEY ("baseCharacterId") REFERENCES "BaseCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelGenre" DROP CONSTRAINT IF EXISTS "NovelGenre_parentId_fkey"; ALTER TABLE "NovelGenre" ADD CONSTRAINT "NovelGenre_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NovelGenre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelStoryMode" DROP CONSTRAINT IF EXISTS "NovelStoryMode_parentId_fkey"; ALTER TABLE "NovelStoryMode" ADD CONSTRAINT "NovelStoryMode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NovelStoryMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldPropertyLibrary" DROP CONSTRAINT IF EXISTS "WorldPropertyLibrary_sourceWorldId_fkey"; ALTER TABLE "WorldPropertyLibrary" ADD CONSTRAINT "WorldPropertyLibrary_sourceWorldId_fkey" FOREIGN KEY ("sourceWorldId") REFERENCES "World"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldSnapshot" DROP CONSTRAINT IF EXISTS "WorldSnapshot_worldId_fkey"; ALTER TABLE "WorldSnapshot" ADD CONSTRAINT "WorldSnapshot_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldDeepeningQA" DROP CONSTRAINT IF EXISTS "WorldDeepeningQA_worldId_fkey"; ALTER TABLE "WorldDeepeningQA" ADD CONSTRAINT "WorldDeepeningQA_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldConsistencyIssue" DROP CONSTRAINT IF EXISTS "WorldConsistencyIssue_worldId_fkey"; ALTER TABLE "WorldConsistencyIssue" ADD CONSTRAINT "WorldConsistencyIssue_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StyleProfileAntiAiRule" DROP CONSTRAINT IF EXISTS "StyleProfileAntiAiRule_styleProfileId_fkey"; ALTER TABLE "StyleProfileAntiAiRule" ADD CONSTRAINT "StyleProfileAntiAiRule_styleProfileId_fkey" FOREIGN KEY ("styleProfileId") REFERENCES "StyleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StyleProfileAntiAiRule" DROP CONSTRAINT IF EXISTS "StyleProfileAntiAiRule_antiAiRuleId_fkey"; ALTER TABLE "StyleProfileAntiAiRule" ADD CONSTRAINT "StyleProfileAntiAiRule_antiAiRuleId_fkey" FOREIGN KEY ("antiAiRuleId") REFERENCES "AntiAiRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StyleBinding" DROP CONSTRAINT IF EXISTS "StyleBinding_styleProfileId_fkey"; ALTER TABLE "StyleBinding" ADD CONSTRAINT "StyleBinding_styleProfileId_fkey" FOREIGN KEY ("styleProfileId") REFERENCES "StyleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelBible" DROP CONSTRAINT IF EXISTS "NovelBible_novelId_fkey"; ALTER TABLE "NovelBible" ADD CONSTRAINT "NovelBible_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotBeat" DROP CONSTRAINT IF EXISTS "PlotBeat_novelId_fkey"; ALTER TABLE "PlotBeat" ADD CONSTRAINT "PlotBeat_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterSummary" DROP CONSTRAINT IF EXISTS "ChapterSummary_novelId_fkey"; ALTER TABLE "ChapterSummary" ADD CONSTRAINT "ChapterSummary_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterSummary" DROP CONSTRAINT IF EXISTS "ChapterSummary_chapterId_fkey"; ALTER TABLE "ChapterSummary" ADD CONSTRAINT "ChapterSummary_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsistencyFact" DROP CONSTRAINT IF EXISTS "ConsistencyFact_novelId_fkey"; ALTER TABLE "ConsistencyFact" ADD CONSTRAINT "ConsistencyFact_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsistencyFact" DROP CONSTRAINT IF EXISTS "ConsistencyFact_chapterId_fkey"; ALTER TABLE "ConsistencyFact" ADD CONSTRAINT "ConsistencyFact_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" DROP CONSTRAINT IF EXISTS "GenerationJob_novelId_fkey"; ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" DROP CONSTRAINT IF EXISTS "AgentRun_novelId_fkey"; ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentStep" DROP CONSTRAINT IF EXISTS "AgentStep_runId_fkey"; ALTER TABLE "AgentStep" ADD CONSTRAINT "AgentStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentApproval" DROP CONSTRAINT IF EXISTS "AgentApproval_runId_fkey"; ALTER TABLE "AgentApproval" ADD CONSTRAINT "AgentApproval_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentApproval" DROP CONSTRAINT IF EXISTS "AgentApproval_stepId_fkey"; ALTER TABLE "AgentApproval" ADD CONSTRAINT "AgentApproval_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "AgentStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeHubCheckpoint" DROP CONSTRAINT IF EXISTS "CreativeHubCheckpoint_threadId_fkey"; ALTER TABLE "CreativeHubCheckpoint" ADD CONSTRAINT "CreativeHubCheckpoint_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CreativeHubThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorylineVersion" DROP CONSTRAINT IF EXISTS "StorylineVersion_novelId_fkey"; ALTER TABLE "StorylineVersion" ADD CONSTRAINT "StorylineVersion_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolumePlanVersion" DROP CONSTRAINT IF EXISTS "VolumePlanVersion_novelId_fkey"; ALTER TABLE "VolumePlanVersion" ADD CONSTRAINT "VolumePlanVersion_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolumePlan" DROP CONSTRAINT IF EXISTS "VolumePlan_novelId_fkey"; ALTER TABLE "VolumePlan" ADD CONSTRAINT "VolumePlan_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolumePlan" DROP CONSTRAINT IF EXISTS "VolumePlan_sourceVersionId_fkey"; ALTER TABLE "VolumePlan" ADD CONSTRAINT "VolumePlan_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "VolumePlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolumeChapterPlan" DROP CONSTRAINT IF EXISTS "VolumeChapterPlan_volumeId_fkey"; ALTER TABLE "VolumeChapterPlan" ADD CONSTRAINT "VolumeChapterPlan_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "VolumePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityReport" DROP CONSTRAINT IF EXISTS "QualityReport_novelId_fkey"; ALTER TABLE "QualityReport" ADD CONSTRAINT "QualityReport_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityReport" DROP CONSTRAINT IF EXISTS "QualityReport_chapterId_fkey"; ALTER TABLE "QualityReport" ADD CONSTRAINT "QualityReport_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMacroPlan" DROP CONSTRAINT IF EXISTS "StoryMacroPlan_novelId_fkey"; ALTER TABLE "StoryMacroPlan" ADD CONSTRAINT "StoryMacroPlan_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookContract" DROP CONSTRAINT IF EXISTS "BookContract_novelId_fkey"; ALTER TABLE "BookContract" ADD CONSTRAINT "BookContract_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelWorkflowTask" DROP CONSTRAINT IF EXISTS "NovelWorkflowTask_novelId_fkey"; ALTER TABLE "NovelWorkflowTask" ADD CONSTRAINT "NovelWorkflowTask_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStateSnapshot" DROP CONSTRAINT IF EXISTS "StoryStateSnapshot_novelId_fkey"; ALTER TABLE "StoryStateSnapshot" ADD CONSTRAINT "StoryStateSnapshot_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStateSnapshot" DROP CONSTRAINT IF EXISTS "StoryStateSnapshot_sourceChapterId_fkey"; ALTER TABLE "StoryStateSnapshot" ADD CONSTRAINT "StoryStateSnapshot_sourceChapterId_fkey" FOREIGN KEY ("sourceChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterState" DROP CONSTRAINT IF EXISTS "CharacterState_snapshotId_fkey"; ALTER TABLE "CharacterState" ADD CONSTRAINT "CharacterState_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "StoryStateSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterState" DROP CONSTRAINT IF EXISTS "CharacterState_characterId_fkey"; ALTER TABLE "CharacterState" ADD CONSTRAINT "CharacterState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationState" DROP CONSTRAINT IF EXISTS "RelationState_snapshotId_fkey"; ALTER TABLE "RelationState" ADD CONSTRAINT "RelationState_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "StoryStateSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationState" DROP CONSTRAINT IF EXISTS "RelationState_sourceCharacterId_fkey"; ALTER TABLE "RelationState" ADD CONSTRAINT "RelationState_sourceCharacterId_fkey" FOREIGN KEY ("sourceCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationState" DROP CONSTRAINT IF EXISTS "RelationState_targetCharacterId_fkey"; ALTER TABLE "RelationState" ADD CONSTRAINT "RelationState_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationState" DROP CONSTRAINT IF EXISTS "InformationState_snapshotId_fkey"; ALTER TABLE "InformationState" ADD CONSTRAINT "InformationState_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "StoryStateSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForeshadowState" DROP CONSTRAINT IF EXISTS "ForeshadowState_snapshotId_fkey"; ALTER TABLE "ForeshadowState" ADD CONSTRAINT "ForeshadowState_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "StoryStateSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForeshadowState" DROP CONSTRAINT IF EXISTS "ForeshadowState_setupChapterId_fkey"; ALTER TABLE "ForeshadowState" ADD CONSTRAINT "ForeshadowState_setupChapterId_fkey" FOREIGN KEY ("setupChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForeshadowState" DROP CONSTRAINT IF EXISTS "ForeshadowState_payoffChapterId_fkey"; ALTER TABLE "ForeshadowState" ADD CONSTRAINT "ForeshadowState_payoffChapterId_fkey" FOREIGN KEY ("payoffChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenConflict" DROP CONSTRAINT IF EXISTS "OpenConflict_novelId_fkey"; ALTER TABLE "OpenConflict" ADD CONSTRAINT "OpenConflict_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenConflict" DROP CONSTRAINT IF EXISTS "OpenConflict_chapterId_fkey"; ALTER TABLE "OpenConflict" ADD CONSTRAINT "OpenConflict_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenConflict" DROP CONSTRAINT IF EXISTS "OpenConflict_sourceSnapshotId_fkey"; ALTER TABLE "OpenConflict" ADD CONSTRAINT "OpenConflict_sourceSnapshotId_fkey" FOREIGN KEY ("sourceSnapshotId") REFERENCES "StoryStateSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoffLedgerItem" DROP CONSTRAINT IF EXISTS "PayoffLedgerItem_novelId_fkey"; ALTER TABLE "PayoffLedgerItem" ADD CONSTRAINT "PayoffLedgerItem_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoffLedgerItem" DROP CONSTRAINT IF EXISTS "PayoffLedgerItem_lastTouchedChapterId_fkey"; ALTER TABLE "PayoffLedgerItem" ADD CONSTRAINT "PayoffLedgerItem_lastTouchedChapterId_fkey" FOREIGN KEY ("lastTouchedChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoffLedgerItem" DROP CONSTRAINT IF EXISTS "PayoffLedgerItem_setupChapterId_fkey"; ALTER TABLE "PayoffLedgerItem" ADD CONSTRAINT "PayoffLedgerItem_setupChapterId_fkey" FOREIGN KEY ("setupChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoffLedgerItem" DROP CONSTRAINT IF EXISTS "PayoffLedgerItem_payoffChapterId_fkey"; ALTER TABLE "PayoffLedgerItem" ADD CONSTRAINT "PayoffLedgerItem_payoffChapterId_fkey" FOREIGN KEY ("payoffChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoffLedgerItem" DROP CONSTRAINT IF EXISTS "PayoffLedgerItem_lastSnapshotId_fkey"; ALTER TABLE "PayoffLedgerItem" ADD CONSTRAINT "PayoffLedgerItem_lastSnapshotId_fkey" FOREIGN KEY ("lastSnapshotId") REFERENCES "StoryStateSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPlan" DROP CONSTRAINT IF EXISTS "StoryPlan_novelId_fkey"; ALTER TABLE "StoryPlan" ADD CONSTRAINT "StoryPlan_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPlan" DROP CONSTRAINT IF EXISTS "StoryPlan_chapterId_fkey"; ALTER TABLE "StoryPlan" ADD CONSTRAINT "StoryPlan_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPlan" DROP CONSTRAINT IF EXISTS "StoryPlan_parentId_fkey"; ALTER TABLE "StoryPlan" ADD CONSTRAINT "StoryPlan_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StoryPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPlan" DROP CONSTRAINT IF EXISTS "StoryPlan_sourceStateSnapshotId_fkey"; ALTER TABLE "StoryPlan" ADD CONSTRAINT "StoryPlan_sourceStateSnapshotId_fkey" FOREIGN KEY ("sourceStateSnapshotId") REFERENCES "StoryStateSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterPlanScene" DROP CONSTRAINT IF EXISTS "ChapterPlanScene_planId_fkey"; ALTER TABLE "ChapterPlanScene" ADD CONSTRAINT "ChapterPlanScene_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StoryPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplanRun" DROP CONSTRAINT IF EXISTS "ReplanRun_novelId_fkey"; ALTER TABLE "ReplanRun" ADD CONSTRAINT "ReplanRun_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplanRun" DROP CONSTRAINT IF EXISTS "ReplanRun_chapterId_fkey"; ALTER TABLE "ReplanRun" ADD CONSTRAINT "ReplanRun_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplanRun" DROP CONSTRAINT IF EXISTS "ReplanRun_sourcePlanId_fkey"; ALTER TABLE "ReplanRun" ADD CONSTRAINT "ReplanRun_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "StoryPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditReport" DROP CONSTRAINT IF EXISTS "AuditReport_novelId_fkey"; ALTER TABLE "AuditReport" ADD CONSTRAINT "AuditReport_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditReport" DROP CONSTRAINT IF EXISTS "AuditReport_chapterId_fkey"; ALTER TABLE "AuditReport" ADD CONSTRAINT "AuditReport_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditIssue" DROP CONSTRAINT IF EXISTS "AuditIssue_reportId_fkey"; ALTER TABLE "AuditIssue" ADD CONSTRAINT "AuditIssue_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AuditReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" DROP CONSTRAINT IF EXISTS "KnowledgeDocument_activeVersionId_fkey"; ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_activeVersionId_fkey" FOREIGN KEY ("activeVersionId") REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentVersion" DROP CONSTRAINT IF EXISTS "KnowledgeDocumentVersion_documentId_fkey"; ALTER TABLE "KnowledgeDocumentVersion" ADD CONSTRAINT "KnowledgeDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBinding" DROP CONSTRAINT IF EXISTS "KnowledgeBinding_documentId_fkey"; ALTER TABLE "KnowledgeBinding" ADD CONSTRAINT "KnowledgeBinding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookAnalysis" DROP CONSTRAINT IF EXISTS "BookAnalysis_documentId_fkey"; ALTER TABLE "BookAnalysis" ADD CONSTRAINT "BookAnalysis_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookAnalysis" DROP CONSTRAINT IF EXISTS "BookAnalysis_documentVersionId_fkey"; ALTER TABLE "BookAnalysis" ADD CONSTRAINT "BookAnalysis_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookAnalysis" DROP CONSTRAINT IF EXISTS "BookAnalysis_publishedDocumentId_fkey"; ALTER TABLE "BookAnalysis" ADD CONSTRAINT "BookAnalysis_publishedDocumentId_fkey" FOREIGN KEY ("publishedDocumentId") REFERENCES "KnowledgeDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookAnalysisSourceCache" DROP CONSTRAINT IF EXISTS "BookAnalysisSourceCache_documentVersionId_fkey"; ALTER TABLE "BookAnalysisSourceCache" ADD CONSTRAINT "BookAnalysisSourceCache_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookAnalysisSection" DROP CONSTRAINT IF EXISTS "BookAnalysisSection_analysisId_fkey"; ALTER TABLE "BookAnalysisSection" ADD CONSTRAINT "BookAnalysisSection_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "BookAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;



