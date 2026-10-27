-- CreateTable
CREATE TABLE "inquiry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "serviceSlug" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "details" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_bucket" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_bucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_submissionKey_key" ON "inquiry"("submissionKey");

-- CreateIndex
CREATE INDEX "inquiry_organizationId_status_createdAt_idx" ON "inquiry"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "inquiry_email_createdAt_idx" ON "inquiry"("email", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_bucket_expiresAt_idx" ON "rate_limit_bucket"("expiresAt");

-- AddForeignKey
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
