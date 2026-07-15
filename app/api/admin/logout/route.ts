import { NextResponse } from "next/server";
import { adminCookieOptions } from "@/lib/adminAuth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(adminCookieOptions.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}