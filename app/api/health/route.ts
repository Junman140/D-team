import { getPrisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  if (!process.env.DATABASE_URL) {
    return Response.json({ status: "degraded", database: "unconfigured", timestamp }, { status: 503 });
  }
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "reachable", timestamp });
  } catch {
    return Response.json({ status: "degraded", database: "unreachable", timestamp }, { status: 503 });
  }
}
