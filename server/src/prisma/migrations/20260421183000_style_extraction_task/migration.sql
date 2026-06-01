CREATE TABLE IF NOT EXISTS "StyleExtractionTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "sourceText" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "temperature" REAL,
    "presetKey" TEXT NOT NULL DEFAULT 'balanced',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" REAL NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 1,
    "pendingManualRecovery" BOOLEAN NOT NULL DEFAULT false,
    "heartbeatAt" TIMESTAMP,
    "currentStage" TEXT,
    "currentItemKey" TEXT,
    "currentItemLabel" TEXT,
    "cancelRequestedAt" TIMESTAMP,
    "error" TEXT,
    "summary" TEXT,
    "createdStyleProfileId" TEXT,
    "createdStyleProfileName" TEXT,
    "startedAt" TIMESTAMP,
    "finishedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "StyleExtractionTask_status_updatedAt_idx"
ON "StyleExtractionTask"("status", "updatedAt");

CREATE INDEX IF NOT EXISTS "StyleExtractionTask_createdStyleProfileId_idx"
ON "StyleExtractionTask"("createdStyleProfileId");


