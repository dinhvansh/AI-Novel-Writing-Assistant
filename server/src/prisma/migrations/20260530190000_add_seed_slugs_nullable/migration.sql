-- AddColumn: nullable slug to NovelGenre, NovelStoryMode, StyleTemplate, AntiAiRule
-- Migration: add_seed_slugs_nullable
-- Purpose: Adds a stable ASCII slug identifier to seed-data tables so the
--          SeedTranslator service can resolve Vietnamese translations by slug key.
--          All columns are nullable so existing rows are unaffected.

-- AlterTable: NovelGenre
ALTER TABLE "NovelGenre" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "NovelGenre_slug_key" ON "NovelGenre"("slug");

-- AlterTable: NovelStoryMode
ALTER TABLE "NovelStoryMode" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "NovelStoryMode_slug_key" ON "NovelStoryMode"("slug");

-- AlterTable: StyleTemplate
ALTER TABLE "StyleTemplate" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "StyleTemplate_slug_key" ON "StyleTemplate"("slug");

-- AlterTable: AntiAiRule
ALTER TABLE "AntiAiRule" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "AntiAiRule_slug_key" ON "AntiAiRule"("slug");
