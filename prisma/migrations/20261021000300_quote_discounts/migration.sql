-- Add fixed-amount discounts to quotes.
ALTER TABLE "quote" ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "quote" ADD COLUMN "discountLabel" TEXT;
