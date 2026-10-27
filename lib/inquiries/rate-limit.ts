import "server-only";

import { createHmac } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

export class InquiryRateLimitExceededError extends Error {
  constructor() {
    super("Inquiry rate limit exceeded.");
    this.name = "InquiryRateLimitExceededError";
  }
}

function bucketKey(secret: string, scope: "ip" | "email", value: string) {
  const digest = createHmac("sha256", secret).update(value).digest("hex");
  return `${scope}:${digest}`;
}

export async function consumeInquiryRateLimit({
  secret,
  email,
  ipAddress,
}: {
  secret: string;
  email: string;
  ipAddress?: string;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const buckets = [
    ...(ipAddress ? [{ key: bucketKey(secret, "ip", ipAddress), limit: 5 }] : []),
    { key: bucketKey(secret, "email", email.toLowerCase()), limit: 3 },
  ];

  try {
    await getPrisma().$transaction(async (transaction) => {
      await transaction.rateLimitBucket.deleteMany({ where: { expiresAt: { lte: now } } });

      for (const bucket of buckets) {
        const rows = await transaction.$queryRaw<Array<{ attempts: number }>>`
          INSERT INTO "rate_limit_bucket" ("key", "attempts", "windowStartedAt", "expiresAt")
          VALUES (${bucket.key}, 1, ${now}, ${expiresAt})
          ON CONFLICT ("key") DO UPDATE SET
            "attempts" = CASE
              WHEN "rate_limit_bucket"."expiresAt" <= ${now} THEN 1
              ELSE "rate_limit_bucket"."attempts" + 1
            END,
            "windowStartedAt" = CASE
              WHEN "rate_limit_bucket"."expiresAt" <= ${now} THEN ${now}
              ELSE "rate_limit_bucket"."windowStartedAt"
            END,
            "expiresAt" = CASE
              WHEN "rate_limit_bucket"."expiresAt" <= ${now} THEN ${expiresAt}
              ELSE "rate_limit_bucket"."expiresAt"
            END
          WHERE "rate_limit_bucket"."expiresAt" <= ${now}
             OR "rate_limit_bucket"."attempts" < ${bucket.limit}
          RETURNING "attempts"
        `;

        if (rows.length !== 1) throw new InquiryRateLimitExceededError();
      }
    });
  } catch (error) {
    if (error instanceof InquiryRateLimitExceededError) throw error;
    throw error;
  }
}
