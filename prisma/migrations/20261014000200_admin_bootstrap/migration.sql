-- Add the constrained Better Auth admin plugin fields used for initial staff provisioning.
ALTER TABLE "user"
    ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user',
    ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "banReason" TEXT,
    ADD COLUMN "banExpires" TIMESTAMP(3);

ALTER TABLE "session"
    ADD COLUMN "impersonatedBy" TEXT;
