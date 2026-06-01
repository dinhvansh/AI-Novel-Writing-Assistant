ALTER TABLE "ModelRouteConfig" ADD COLUMN IF NOT EXISTS "requestProtocol" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE "ModelRouteConfig" ADD COLUMN IF NOT EXISTS "structuredResponseFormat" TEXT NOT NULL DEFAULT 'auto';

