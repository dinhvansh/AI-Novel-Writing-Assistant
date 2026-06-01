CREATE TABLE IF NOT EXISTS "AutoDirectorAutoApprovalRecord" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "approvalPointCode" TEXT NOT NULL,
    "approvalPointLabel" TEXT NOT NULL,
    "checkpointType" TEXT NOT NULL,
    "checkpointSummary" TEXT,
    "summary" TEXT NOT NULL,
    "stage" TEXT,
    "scopeLabel" TEXT,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoDirectorAutoApprovalRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AutoDirectorAutoApprovalRecord_eventId_key" ON "AutoDirectorAutoApprovalRecord"("eventId");
CREATE INDEX IF NOT EXISTS "AutoDirectorAutoApprovalRecord_novelId_createdAt_idx" ON "AutoDirectorAutoApprovalRecord"("novelId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutoDirectorAutoApprovalRecord_taskId_createdAt_idx" ON "AutoDirectorAutoApprovalRecord"("taskId", "createdAt");
ALTER TABLE "AutoDirectorAutoApprovalRecord" DROP CONSTRAINT IF EXISTS "AutoDirectorAutoApprovalRecord_taskId_fkey"; ALTER TABLE "AutoDirectorAutoApprovalRecord" ADD CONSTRAINT "AutoDirectorAutoApprovalRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "NovelWorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutoDirectorAutoApprovalRecord" DROP CONSTRAINT IF EXISTS "AutoDirectorAutoApprovalRecord_novelId_fkey"; ALTER TABLE "AutoDirectorAutoApprovalRecord" ADD CONSTRAINT "AutoDirectorAutoApprovalRecord_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;



