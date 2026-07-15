import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  adminCookieOptions,
  createAdminSessionToken,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

function safePasswordCompare(input: string, correct: string) {
  const inputBuffer = Buffer.from(input, "utf8");
  const correctBuffer = Buffer.from(correct, "utf8");

  if (inputBuffer.length !== correctBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, correctBuffer);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "ADMIN_PASSWORD 환경변수가 없습니다.",
        },
        { status: 500 }
      );
    }

    if (!safePasswordCompare(password, adminPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: "관리자 비밀번호가 올바르지 않습니다.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "관리자 로그인이 완료되었습니다.",
    });

    response.cookies.set(
      adminCookieOptions.name,
      createAdminSessionToken(),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: adminCookieOptions.maxAge,
      }
    );

    return response;
  } catch (error: any) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "관리자 로그인 중 오류가 발생했습니다.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}