import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { createApiResponse } from "@/backend/shared/api-types";

export async function POST() {
  const response = NextResponse.json(createApiResponse(true, { loggedOut: true }), {
    status: 200,
  });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
