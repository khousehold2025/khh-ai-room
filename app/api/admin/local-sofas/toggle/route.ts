import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

    const body = await req.json();
    const id = String(body.id || "").trim();
    const active = Boolean(body.active);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "소파 ID가 없습니다.",
        },
        { status: 400 }
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
    const sofaIndex = sofas.findIndex((sofa: any) => sofa.id === id);

    if (sofaIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "해당 소파를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    sofas[sofaIndex] = {
      ...sofas[sofaIndex],
      active,
    };

    fs.writeFileSync(
      jsonPath,
      JSON.stringify(sofas, null, 2) + "\n",
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: active
        ? `${sofas[sofaIndex].name} 소파를 다시 표시합니다.`
        : `${sofas[sofaIndex].name} 소파를 화면에서 숨겼습니다.`,
      sofa: sofas[sofaIndex],
    });
  } catch (error: unknown) {
    console.error("LOCAL SOFA TOGGLE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "소파 표시 상태 변경 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}