-- Add multi-department crew membership while keeping the existing primary department.
ALTER TABLE "crew_profile" ADD COLUMN "departments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Add optimized image derivative metadata.
ALTER TABLE "media_asset" ADD COLUMN "derivativeKey" TEXT;
ALTER TABLE "media_asset" ADD COLUMN "thumbnailKey" TEXT;
ALTER TABLE "media_asset" ADD COLUMN "width" INTEGER;
ALTER TABLE "media_asset" ADD COLUMN "height" INTEGER;

-- Add revocable, expiring external deliverable links.
ALTER TABLE "deliverable" ADD COLUMN "deliveryToken" TEXT;
ALTER TABLE "deliverable" ADD COLUMN "deliveryExpiresAt" TIMESTAMP(3);
ALTER TABLE "deliverable" ADD COLUMN "deliveryRevokedAt" TIMESTAMP(3);
ALTER TABLE "deliverable" ADD COLUMN "deliveryCreatedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "deliverable_deliveryToken_key" ON "deliverable"("deliveryToken");

-- Add project milestones.
CREATE TABLE "project_milestone" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_milestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_milestone_organizationId_status_dueAt_idx" ON "project_milestone"("organizationId", "status", "dueAt");
CREATE INDEX "project_milestone_projectId_sortOrder_idx" ON "project_milestone"("projectId", "sortOrder");

ALTER TABLE "project_milestone" ADD CONSTRAINT "project_milestone_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_milestone" ADD CONSTRAINT "project_milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
