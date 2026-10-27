ALTER TABLE "inquiry"
  ADD COLUMN "notificationStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "notificationSentAt" TIMESTAMP(3),
  ADD COLUMN "notificationError" TEXT;
