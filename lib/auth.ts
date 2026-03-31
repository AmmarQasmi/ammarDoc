import { prisma } from "@/lib/prisma";
import { ApiErrorHandler, ERROR_CODES } from "@/backend/shared/api-types";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "aq_auth_token";

type AuthTokenPayload = {
  userId: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Add it to your environment variables.");
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUserId(request?: Request): Promise<string> {
  const cookieHeader = request?.headers.get("cookie") || "";
  const token = extractCookieValue(cookieHeader, AUTH_COOKIE_NAME);

  if (!token) {
    throw new ApiErrorHandler(ERROR_CODES.UNAUTHORIZED, "Authentication required", 401);
  }

  const payload = verifyAuthToken(token);
  if (!payload?.userId) {
    throw new ApiErrorHandler(ERROR_CODES.UNAUTHORIZED, "Invalid auth token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true },
  });

  if (!user) {
    throw new ApiErrorHandler(ERROR_CODES.UNAUTHORIZED, "User not found", 401);
  }

  return user.id;
}

function extractCookieValue(cookieHeader: string, key: string): string | null {
  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const cookie = cookies.find((entry) => entry.startsWith(`${key}=`));
  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(key.length + 1));
}
