CREATE TABLE IF NOT EXISTS "DirectorRun" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "novelId" TEXT,
    "entrypoint" TEXT,
    "policyJson" TEXT NOT NULL,
    "lastWorkspaceAnalysisJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectorRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DirectorStepRun" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "novelId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "producedArtifactsJson" TEXT,
    "policyDecisionJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectorStepRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DirectorEvent" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "taskId" TEXT,
    "novelId" TEXT,
    "type" TEXT NOT NULL,
    "nodeKey" TEXT,
    "artifactId" TEXT,
    "artifactType" TEXT,
    "summary" TEXT NOT NULL,
    "affectedScope" TEXT,
    "severity" TEXT,
    "metadataJson" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectorEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DirectorArtifact" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "novelId" TEXT NOT NULL,
    "taskId" TEXT,
    "artifactType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "contentTable" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentHash" TEXT,
    "schemaVersion" TEXT NOT NULL,
    "promptAssetKey" TEXT,
    "promptVersion" TEXT,
    "modelRoute" TEXT,
    "sourceStepRunId" TEXT,
    "protectedUserContent" BOOLEAN,
    "artifactUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectorArtifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DirectorArtifactDependency" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "dependsOnArtifactId" TEXT NOT NULL,
    "dependsOnVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectorArtifactDependency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DirectorRun_taskId_key" ON "DirectorRun"("taskId");
CREATE INDEX IF NOT EXISTS "DirectorRun_novelId_updatedAt_idx" ON "DirectorRun"("novelId", "updatedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "DirectorStepRun_idempotencyKey_key" ON "DirectorStepRun"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "DirectorStepRun_runId_status_updatedAt_idx" ON "DirectorStepRun"("runId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "DirectorStepRun_taskId_nodeKey_idx" ON "DirectorStepRun"("taskId", "nodeKey");
CREATE INDEX IF NOT EXISTS "DirectorStepRun_novelId_updatedAt_idx" ON "DirectorStepRun"("novelId", "updatedAt");
CREATE INDEX IF NOT EXISTS "DirectorEvent_runId_occurredAt_idx" ON "DirectorEvent"("runId", "occurredAt");
CREATE INDEX IF NOT EXISTS "DirectorEvent_taskId_occurredAt_idx" ON "DirectorEvent"("taskId", "occurredAt");
CREATE INDEX IF NOT EXISTS "DirectorEvent_novelId_occurredAt_idx" ON "DirectorEvent"("novelId", "occurredAt");
CREATE INDEX IF NOT EXISTS "DirectorEvent_type_occurredAt_idx" ON "DirectorEvent"("type", "occurredAt");
CREATE INDEX IF NOT EXISTS "DirectorArtifact_novelId_artifactType_status_idx" ON "DirectorArtifact"("novelId", "artifactType", "status");
CREATE INDEX IF NOT EXISTS "DirectorArtifact_runId_updatedAt_idx" ON "DirectorArtifact"("runId", "updatedAt");
CREATE INDEX IF NOT EXISTS "DirectorArtifact_taskId_updatedAt_idx" ON "DirectorArtifact"("taskId", "updatedAt");
CREATE INDEX IF NOT EXISTS "DirectorArtifact_targetType_targetId_idx" ON "DirectorArtifact"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "DirectorArtifact_sourceStepRunId_idx" ON "DirectorArtifact"("sourceStepRunId");
CREATE UNIQUE INDEX IF NOT EXISTS "DirectorArtifactDependency_artifactId_dependsOnArtifactId_key" ON "DirectorArtifactDependency"("artifactId", "dependsOnArtifactId");
CREATE INDEX IF NOT EXISTS "DirectorArtifactDependency_dependsOnArtifactId_idx" ON "DirectorArtifactDependency"("dependsOnArtifactId");

ALTER TABLE "DirectorRun" DROP CONSTRAINT IF EXISTS "DirectorRun_taskId_fkey"; ALTER TABLE "DirectorRun" ADD CONSTRAINT "DirectorRun_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "NovelWorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorRun" DROP CONSTRAINT IF EXISTS "DirectorRun_novelId_fkey"; ALTER TABLE "DirectorRun" ADD CONSTRAINT "DirectorRun_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectorStepRun" DROP CONSTRAINT IF EXISTS "DirectorStepRun_runId_fkey"; ALTER TABLE "DirectorStepRun" ADD CONSTRAINT "DirectorStepRun_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DirectorRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorStepRun" DROP CONSTRAINT IF EXISTS "DirectorStepRun_taskId_fkey"; ALTER TABLE "DirectorStepRun" ADD CONSTRAINT "DirectorStepRun_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "NovelWorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorEvent" DROP CONSTRAINT IF EXISTS "DirectorEvent_runId_fkey"; ALTER TABLE "DirectorEvent" ADD CONSTRAINT "DirectorEvent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DirectorRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorEvent" DROP CONSTRAINT IF EXISTS "DirectorEvent_taskId_fkey"; ALTER TABLE "DirectorEvent" ADD CONSTRAINT "DirectorEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "NovelWorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorEvent" DROP CONSTRAINT IF EXISTS "DirectorEvent_novelId_fkey"; ALTER TABLE "DirectorEvent" ADD CONSTRAINT "DirectorEvent_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectorArtifact" DROP CONSTRAINT IF EXISTS "DirectorArtifact_runId_fkey"; ALTER TABLE "DirectorArtifact" ADD CONSTRAINT "DirectorArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DirectorRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectorArtifact" DROP CONSTRAINT IF EXISTS "DirectorArtifact_taskId_fkey"; ALTER TABLE "DirectorArtifact" ADD CONSTRAINT "DirectorArtifact_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "NovelWorkflowTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectorArtifact" DROP CONSTRAINT IF EXISTS "DirectorArtifact_novelId_fkey"; ALTER TABLE "DirectorArtifact" ADD CONSTRAINT "DirectorArtifact_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorArtifactDependency" DROP CONSTRAINT IF EXISTS "DirectorArtifactDependency_artifactId_fkey"; ALTER TABLE "DirectorArtifactDependency" ADD CONSTRAINT "DirectorArtifactDependency_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "DirectorArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorArtifactDependency" DROP CONSTRAINT IF EXISTS "DirectorArtifactDependency_dependsOnArtifactId_fkey"; ALTER TABLE "DirectorArtifactDependency" ADD CONSTRAINT "DirectorArtifactDependency_dependsOnArtifactId_fkey" FOREIGN KEY ("dependsOnArtifactId") REFERENCES "DirectorArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;



