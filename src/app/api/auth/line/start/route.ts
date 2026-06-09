import { NextRequest, NextResponse } from "next/server";

import {
  buildLineAuthorizationUrl,
  generateOAuthState,
} from "@/lib/line-auth";
import {
  OAUTH_MODE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "link" ? "link" : "login";
    const state = generateOAuthState();
    const authUrl = buildLineAuthorizationUrl(state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set(OAUTH_MODE_COOKIE_NAME, mode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    );
  }
}
