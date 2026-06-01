ALTER TABLE "TimelineHook"
ADD COLUMN IF NOT EXISTS "resolveMode" TEXT NOT NULL DEFAULT 'long_arc';

ALTER TABLE "TimelineHook"
ADD COLUMN IF NOT EXISTS "blocking" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "TimelineHook_novelId_resolveMode_blocking_idx" ON "TimelineHook"("novelId", "resolveMode", "blocking");


