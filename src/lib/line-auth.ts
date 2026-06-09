import { prisma } from "@/lib/prisma";

const LINE_AUTH_BASE = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

export type LineIdTokenPayload = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export type LineTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token: string;
};

function getLineConfig() {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL;

  if (!channelId || !channelSecret || !callbackUrl) {
    throw new Error("LINE login environment variables are not configured");
  }

  return { channelId, channelSecret, callbackUrl };
}

export function generateOAuthState(): string {
  return crypto.randomUUID();
}

export function buildLineAuthorizationUrl(state: string): string {
  const { channelId, callbackUrl } = getLineConfig();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: callbackUrl,
    state,
    scope: "profile openid email",
    bot_prompt: "normal",
  });

  return `${LINE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<LineTokenResponse> {
  const { channelId, channelSecret, callbackUrl } = getLineConfig();

  const response = await fetch(LINE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE token exchange failed: ${errorBody}`);
  }

  return response.json() as Promise<LineTokenResponse>;
}

export async function verifyIdToken(idToken: string): Promise<LineIdTokenPayload> {
  const { channelId } = getLineConfig();

  const response = await fetch(LINE_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE id_token verification failed: ${errorBody}`);
  }

  return response.json() as Promise<LineIdTokenPayload>;
}

export async function resolveOrLinkLineUser(input: {
  lineUserId: string;
  name: string;
  email?: string | null;
  existingUserId?: string | null;
}) {
  const { lineUserId, name, email, existingUserId } = input;

  const lineLinkedUser = await prisma.user.findUnique({
    where: { lineUserId },
  });

  if (lineLinkedUser) {
    if (existingUserId && lineLinkedUser.id !== existingUserId) {
      throw new Error("LINE account already linked to another user");
    }

    return prisma.user.update({
      where: { id: lineLinkedUser.id },
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

    if (currentUser.lineUserId && currentUser.lineUserId !== lineUserId) {
      throw new Error("User already linked to a different LINE account");
    }

    return prisma.user.update({
      where: { id: existingUserId },
      data: {
        lineUserId,
        ...(email && !currentUser.email ? { email } : {}),
      },
    });
  }

  if (email) {
    const emailUser = await prisma.user.findUnique({
      where: { email },
    });

    if (emailUser) {
      if (emailUser.lineUserId && emailUser.lineUserId !== lineUserId) {
        throw new Error("Email account already linked to another LINE account");
      }

      return prisma.user.update({
        where: { id: emailUser.id },
        data: {
          lineUserId,
          name,
        },
      });
    }
  }

  return prisma.user.create({
    data: {
      lineUserId,
      name,
      email: email ?? null,
    },
  });
}

/** @deprecated Use resolveOrLinkLineUser instead */
export async function upsertUserFromLineProfile(input: {
  lineUserId: string;
  name: string;
  email?: string | null;
}) {
  return resolveOrLinkLineUser(input);
}

export async function verifyLineAccessToken(accessToken: string) {
  const response = await fetch("https://api.line.me/v2/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Invalid LINE access token");
  }

  return response.json() as Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
  }>;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildLoginErrorRedirect(errorCode: string): string {
  return `${getAppUrl()}/login?error=${encodeURIComponent(errorCode)}`;
}
