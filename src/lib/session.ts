import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "session_user_id";
export const OAUTH_STATE_COOKIE_NAME = "line_oauth_state";
export const OAUTH_MODE_COOKIE_NAME = "line_oauth_mode";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function getSessionUserId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function setSessionUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function setOAuthState(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    ...baseCookieOptions,
    maxAge: 60 * 10,
  });
}

export async function getOAuthState(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
}

export async function clearOAuthState(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
}
