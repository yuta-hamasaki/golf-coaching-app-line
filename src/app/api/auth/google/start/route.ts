import { NextRequest, NextResponse } from "next/server";

import {
  buildGoogleAuthorizationUrl,
  generateOAuthState,
} from "@/lib/google-auth";
import {
  GOOGLE_OAUTH_MODE_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "link" ? "link" : "login";
    const state = generateOAuthState();
    const authUrl = buildGoogleAuthorizationUrl(state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set(GOOGLE_OAUTH_MODE_COOKIE_NAME, mode, {
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
