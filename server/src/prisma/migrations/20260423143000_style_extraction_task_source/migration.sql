ALTER TABLE "StyleExtractionTask"
ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'from_text';

ALTER TABLE "StyleExtractionTask"
ADD COLUMN IF NOT EXISTS "sourceRefId" TEXT;

ALTER TABLE "StyleExtractionTask"
ADD COLUMN IF NOT EXISTS "sourceProcessingMode" TEXT NOT NULL DEFAULT 'full_text';

ALTER TABLE "StyleExtractionTask"
ADD COLUMN IF NOT EXISTS "sourceInputText" TEXT;

ALTER TABLE "StyleExtractionTask"
ADD COLUMN IF NOT EXISTS "sourceInputCharLimit" INTEGER;

ALTER TABLE "StyleExtractionTask"
ADD COLUMN IF NOT EXISTS "sourceInputCharCount" INTEGER;

CREATE INDEX IF NOT EXISTS "StyleExtractionTask_sourceType_sourceRefId_idx"
ON "StyleExtractionTask"("sourceType", "sourceRefId");


