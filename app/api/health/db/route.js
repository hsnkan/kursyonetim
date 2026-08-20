import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz istek" },
      { status: 401 },
    );
  }

  const hasUri = Boolean(process.env.MONGODB_URI);
  const uriHost = process.env.MONGODB_URI
    ? process.env.MONGODB_URI.replace(
        /mongodb(\+srv)?:\/\/([^:@/]+)(:[^@]*)?@([^/?]+).*/,
        "$4",
      )
    : null;

  try {
    await dbConnect();
    // #region agent log
    fetch("http://127.0.0.1:7509/ingest/b658938a-a4df-4187-b293-73636f9d4d0a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b3fe49",
      },
      body: JSON.stringify({
        sessionId: "b3fe49",
        runId: "db-health",
        hypothesisId: "A",
        location: "app/api/health/db/route.js:ok",
        message: "MongoDB connection OK",
        data: { hasUri, uriHost },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json({
      success: true,
      db: "connected",
      host: uriHost,
    });
  } catch (error) {
    const payload = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    };
    console.error("DB health check failed:", payload);
    // #region agent log
    fetch("http://127.0.0.1:7509/ingest/b658938a-a4df-4187-b293-73636f9d4d0a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b3fe49",
      },
      body: JSON.stringify({
        sessionId: "b3fe49",
        runId: "db-health",
        hypothesisId: "A",
        location: "app/api/health/db/route.js:fail",
        message: "MongoDB connection failed",
        data: { hasUri, uriHost, ...payload },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(
      {
        success: false,
        db: "failed",
        host: uriHost,
        error: payload,
      },
      { status: 500 },
    );
  }
}
