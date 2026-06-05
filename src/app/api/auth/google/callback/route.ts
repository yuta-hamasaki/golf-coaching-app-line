import { NextRequest, NextResponse } from "next/server";

import { setSessionOnRedirectResponse } from "@/lib/auth-response";
import {
  buildLoginErrorRedirect,
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  getAppUrl,
  resolveOrLinkGoogleUser,
} from "@/lib/google-auth";
import {
  GOOGLE_OAUTH_MODE_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE_NAME)?.value;
  const oauthMode = request.cookies.get(GOOGLE_OAUTH_MODE_COOKIE_NAME)?.value ?? "login";
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
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    if (!profile.sub) {
      return NextResponse.redirect(buildLoginErrorRedirect("oauth_verify_failed"));
    }

    const user = await resolveOrLinkGoogleUser({
      googleId: profile.sub,
      name: profile.name ?? profile.email ?? "Google User",
      email: profile.email ?? null,
      existingUserId: oauthMode === "link" ? sessionUserId : null,
    });

    const redirectPath = oauthMode === "link" ? "/booking?linked=google" : "/booking";
    const response = NextResponse.redirect(new URL(redirectPath, getAppUrl()));

    if (oauthMode === "login") {
      setSessionOnRedirectResponse(response, user.id);
    }

    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set(GOOGLE_OAUTH_MODE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    if (error instanceof Error && error.message.includes("already linked")) {
      return NextResponse.redirect(buildLoginErrorRedirect("google_already_linked"));
    }

    if (error instanceof Error && error.message.includes("token exchange")) {
      return NextResponse.redirect(buildLoginErrorRedirect("oauth_token_failed"));
    }

    if (error instanceof Error && error.message.includes("userinfo")) {
      return NextResponse.redirect(buildLoginErrorRedirect("oauth_verify_failed"));
    }

    return NextResponse.redirect(buildLoginErrorRedirect("oauth_failed"));
  }
}
