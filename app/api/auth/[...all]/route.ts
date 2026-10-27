import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth/server";

async function handleAuthRequest(request: Request) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!process.env.DATABASE_URL || !secret || secret.length < 32) {
    return Response.json({ message: "Studio sign-in is not configured." }, { status: 503 });
  }

  const handlers = toNextJsHandler(getAuth());
  return request.method === "GET" ? handlers.GET(request) : handlers.POST(request);
}

export const GET = handleAuthRequest;
export const POST = handleAuthRequest;
