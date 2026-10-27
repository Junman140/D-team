CREATE TABLE "portfolio_entry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "categories" TEXT[] NOT NULL,
    "clientCredit" TEXT,
    "productionYear" INTEGER,
    "brief" TEXT,
    "approach" TEXT,
    "outcome" TEXT,
    "coverImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_entry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portfolio_entry_organizationId_slug_key" ON "portfolio_entry"("organizationId", "slug");
CREATE INDEX "portfolio_entry_organizationId_status_publishedAt_idx" ON "portfolio_entry"("organizationId", "status", "publishedAt");
ALTER TABLE "portfolio_entry" ADD CONSTRAINT "portfolio_entry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
