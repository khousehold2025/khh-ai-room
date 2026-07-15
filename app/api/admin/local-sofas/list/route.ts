import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          message: "소파 관리 기능은 로컬에서만 사용할 수 있습니다.",
        },
        { status: 403 }
      );
    }

    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "관리자 로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const jsonPath = path.join(process.cwd(), "data", "sofas.json");

    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "data/sofas.json 파일을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const sofas = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    return NextResponse.json({
      success: true,
      sofas: sofas.map((sofa: any) => ({
        ...sofa,
        active: sofa.active !== false,
      })),
    });
  } catch (error: unknown) {
    console.error("LOCAL SOFA LIST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "등록된 소파 목록 조회 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}