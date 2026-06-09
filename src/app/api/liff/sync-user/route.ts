import { NextRequest, NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth-response";
import {
  getAppUrl,
  resolveOrLinkLineUser,
  verifyLineAccessToken,
} from "@/lib/line-auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";

type SyncUserBody = {
  accessToken?: string;
  displayName?: string;
  pictureUrl?: string;
  mode?: "login" | "link";
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SyncUserBody;
    const sessionUserId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const mode = body.mode ?? "login";

    if (!body.accessToken) {
      return NextResponse.json(
        { error: "accessToken is required" },
        { status: 400 },
      );
    }

    if (mode === "link" && !sessionUserId) {
      return NextResponse.json(
        { error: "Login required to link LINE account" },
        { status: 401 },
      );
    }

    const profile = await verifyLineAccessToken(body.accessToken);

    const user = await resolveOrLinkLineUser({
      lineUserId: profile.userId,
      name: profile.displayName ?? body.displayName ?? "LINE User",
      existingUserId: mode === "link" ? sessionUserId : null,
    });

    if (mode === "link") {
      return NextResponse.json({ success: true, userId: user.id, linked: true });
    }

    return createSessionResponse(user.id, { userId: user.id });
  } catch (error) {
    console.error("LIFF sync-user error:", error);

    if (error instanceof Error && error.message.includes("already linked")) {
      return NextResponse.json(
        { error: "LINE account already linked" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Failed to sync user" }, { status: 401 });
  }
}

export async function GET() {
  return NextResponse.redirect(new URL("/login", getAppUrl()));
}
