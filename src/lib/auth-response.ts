import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/session";

type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

export function getSessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function createSessionResponse(
  userId: string,
  body?: Record<string, unknown>,
  status = 200,
) {
  const response = NextResponse.json(
    body ?? { success: true, userId },
    { status },
  );
  response.cookies.set(SESSION_COOKIE_NAME, userId, getSessionCookieOptions());
  return response;
}

export function createLogoutResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export function setSessionOnRedirectResponse(
  response: NextResponse,
  userId: string,
) {
  response.cookies.set(SESSION_COOKIE_NAME, userId, getSessionCookieOptions());
  return response;
}
