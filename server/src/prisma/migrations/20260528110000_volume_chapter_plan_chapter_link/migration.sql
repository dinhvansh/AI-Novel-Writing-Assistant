ALTER TABLE "VolumeChapterPlan" ADD COLUMN IF NOT EXISTS "chapterId" TEXT;

CREATE INDEX IF NOT EXISTS "VolumeChapterPlan_chapterId_idx" ON "VolumeChapterPlan"("chapterId");

ALTER TABLE "VolumeChapterPlan" DROP CONSTRAINT IF EXISTS "VolumeChapterPlan_chapterId_fkey"; ALTER TABLE "VolumeChapterPlan" ADD CONSTRAINT "VolumeChapterPlan_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;



