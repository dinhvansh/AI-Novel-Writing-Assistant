ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "identityLabel" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "factionLabel" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "stanceLabel" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "powerLevel" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "realm" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "currentLocation" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "availability" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "prohibitionsJson" TEXT NOT NULL DEFAULT '[]';

ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "personality" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "background" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "development" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "identityLabel" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "factionLabel" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "stanceLabel" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "powerLevel" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "realm" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "currentLocation" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "availability" TEXT;
ALTER TABLE "CharacterCastOptionMember" ADD COLUMN IF NOT EXISTS "prohibitionsJson" TEXT NOT NULL DEFAULT '[]';

