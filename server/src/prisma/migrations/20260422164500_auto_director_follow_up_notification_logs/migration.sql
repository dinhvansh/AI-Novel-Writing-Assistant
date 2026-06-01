CREATE TABLE IF NOT EXISTS "AutoDirectorFollowUpNotificationLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "target" TEXT,
    "requestPayload" TEXT,
    "responseBody" TEXT,
    "responseStatus" INTEGER,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "deliveredAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoDirectorFollowUpNotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AutoDirectorFollowUpNotificationLog_taskId_createdAt_idx" ON "AutoDirectorFollowUpNotificationLog"("taskId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutoDirectorFollowUpNotificationLog_eventId_channelType_createdAt_idx" ON "AutoDirectorFollowUpNotificationLog"("eventId", "channelType", "createdAt");


