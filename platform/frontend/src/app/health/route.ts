import { NextResponse } from "next/server";

// Container healthcheck target (infrastructure/Dockerfile.frontend). Cheap,
// no backend dependency -- proves the Next.js server itself is alive and
// serving, matching the backend's equivalent /health endpoint.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
