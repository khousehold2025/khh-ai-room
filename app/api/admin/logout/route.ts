import { NextResponse } from "next/server";
import { adminCookieOptions } from "@/lib/adminAuth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "로그아웃되었습니다.",
  });

  response.cookies.set(adminCookieOptions.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}