import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

export type GoogleUserInfo = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
};

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error("Google OAuth environment variables are not configured");
  }

  return { clientId, clientSecret, callbackUrl };
}

export function generateOAuthState(): string {
  return crypto.randomUUID();
}

export function buildGoogleAuthorizationUrl(state: string): string {
  const { clientId, callbackUrl } = getGoogleConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, callbackUrl } = getGoogleConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google token exchange failed: ${errorBody}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google userinfo fetch failed: ${errorBody}`);
  }

  return response.json() as Promise<GoogleUserInfo>;
}

export async function resolveOrLinkGoogleUser(input: {
  googleId: string;
  name: string;
  email?: string | null;
  existingUserId?: string | null;
}) {
  const { googleId, name, email, existingUserId } = input;

  const googleLinkedUser = await prisma.user.findUnique({
    where: { googleId },
  });

  if (googleLinkedUser) {
    if (existingUserId && googleLinkedUser.id !== existingUserId) {
      throw new Error("Google account already linked to another user");
    }

    return prisma.user.update({
      where: { id: googleLinkedUser.id },
      data: {
        name,
        ...(email ? { email } : {}),
      },
    });
  }

  if (existingUserId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: existingUserId },
    });

    if (!currentUser) {
      throw new Error("User not found");
    }

    if (currentUser.googleId && currentUser.googleId !== googleId) {
      throw new Error("User already linked to a different Google account");
    }

    return prisma.user.update({
      where: { id: existingUserId },
      data: {
        googleId,
        name,
        ...(email && !currentUser.email ? { email } : {}),
      },
    });
  }

  if (email) {
    const emailUser = await prisma.user.findUnique({
      where: { email },
    });

    if (emailUser) {
      if (emailUser.googleId && emailUser.googleId !== googleId) {
        throw new Error("Email account already linked to another Google account");
      }

      return prisma.user.update({
        where: { id: emailUser.id },
        data: {
          googleId,
          name,
        },
      });
    }
  }

  return prisma.user.create({
    data: {
      googleId,
      name,
      email: email ?? null,
    },
  });
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildLoginErrorRedirect(errorCode: string): string {
  return `${getAppUrl()}/login?error=${encodeURIComponent(errorCode)}`;
}
