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
          message: "소파 순서 변경 기능은 로컬에서만 사용할 수 있습니다.",
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
    const orderedIds = body.orderedIds;

    if (
      !Array.isArray(orderedIds) ||
      orderedIds.some((id) => typeof id !== "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "소파 순서 정보가 올바르지 않습니다.",
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

    const sofaMap = new Map(
      sofas.map((sofa: any) => [sofa.id, sofa])
    );

    const reordered = orderedIds
      .map((id: string) => sofaMap.get(id))
      .filter(Boolean);

    const missingSofas = sofas.filter(
      (sofa: any) => !orderedIds.includes(sofa.id)
    );

    const finalSofas = [...reordered, ...missingSofas];

    fs.writeFileSync(
      jsonPath,
      JSON.stringify(finalSofas, null, 2) + "\n",
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: "소파 표시 순서를 저장했습니다.",
      sofas: finalSofas,
    });
  } catch (error: unknown) {
    console.error("LOCAL SOFA REORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "소파 순서 저장 중 오류가 발생했습니다.",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}