ALTER TABLE "ImageGenerationTask" ADD COLUMN IF NOT EXISTS "novelId" TEXT;
ALTER TABLE "ImageAsset" ADD COLUMN IF NOT EXISTS "novelId" TEXT;

CREATE INDEX IF NOT EXISTS "ImageGenerationTask_novelId_createdAt_idx" ON "ImageGenerationTask"("novelId", "createdAt");
CREATE INDEX IF NOT EXISTS "ImageAsset_novelId_isPrimary_createdAt_idx" ON "ImageAsset"("novelId", "isPrimary", "createdAt");

ALTER TABLE "ImageGenerationTask" DROP CONSTRAINT IF EXISTS "ImageGenerationTask_novelId_fkey"; ALTER TABLE "ImageGenerationTask" ADD CONSTRAINT "ImageGenerationTask_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImageAsset" DROP CONSTRAINT IF EXISTS "ImageAsset_novelId_fkey"; ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;



