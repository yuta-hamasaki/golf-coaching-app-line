import { NextRequest, NextResponse } from "next/server";

import { setSessionOnRedirectResponse } from "@/lib/auth-response";
import {
  buildLoginErrorRedirect,
  exchangeCodeForTokens,
  getAppUrl,
  resolveOrLinkLineUser,
  verifyIdToken,
} from "@/lib/line-auth";
import {
  OAUTH_MODE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const oauthMode = request.cookies.get(OAUTH_MODE_COOKIE_NAME)?.value ?? "login";
  const sessionUserId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!code || !state) {
    return NextResponse.redirect(buildLoginErrorRedirect("oauth_missing_params"));
  }

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(buildLoginErrorRedirect("oauth_state_mismatch"));
  }

  if (oauthMode === "link" && !sessionUserId) {
    return NextResponse.redirect(buildLoginErrorRedirect("oauth_link_requires_login"));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await verifyIdToken(tokens.id_token);

    const user = await resolveOrLinkLineUser({
      lineUserId: profile.sub,
      name: profile.name ?? "LINE User",
      email: profile.email ?? null,
      existingUserId: oauthMode === "link" ? sessionUserId : null,
    });

    const redirectPath = oauthMode === "link" ? "/booking?linked=line" : "/booking";
    const response = NextResponse.redirect(new URL(redirectPath, getAppUrl()));

    if (oauthMode === "login") {
      setSessionOnRedirectResponse(response, user.id);
    }

    response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set(OAUTH_MODE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("LINE OAuth callback error:", error);

    if (error instanceof Error && error.message.includes("already linked")) {
      return NextResponse.redirect(buildLoginErrorRedirect("line_already_linked"));
    }

    if (error instanceof Error && error.message.includes("token exchange")) {
      return NextResponse.redirect(buildLoginErrorRedirect("oauth_token_failed"));
    }

    if (error instanceof Error && error.message.includes("id_token verification")) {
      return NextResponse.redirect(buildLoginErrorRedirect("oauth_verify_failed"));
    }

    return NextResponse.redirect(buildLoginErrorRedirect("oauth_failed"));
  }
}
