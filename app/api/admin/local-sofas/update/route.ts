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
          message: "소파 정보 수정 기능은 로컬에서만 사용할 수 있습니다.",
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
    const name = String(body.name || "").trim();
    const size = String(body.size || "").trim();
    const color = String(body.color || "").trim();
    const image = String(body.image || "").trim();

    const width = Number(body.width);
    const depth = Number(body.depth);
    const height = Number(body.height);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "소파 ID가 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!name || !size || !color || !image) {
      return NextResponse.json(
        {
          success: false,
          message: "품명, 사이즈, 컬러, 이미지를 모두 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(depth) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      depth <= 0 ||
      height <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "가로, 깊이, 높이는 0보다 큰 숫자로 입력해 주세요.",
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
          message: "수정할 소파를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    sofas[sofaIndex] = {
      ...sofas[sofaIndex],
      name,
      size,
      color,
      width,
      depth,
      height,
      image,
    };

    fs.writeFileSync(
      jsonPath,
      JSON.stringify(sofas, null, 2) + "\n",
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: `${name} 소파 정보를 수정했습니다.`,
      sofa: sofas[sofaIndex],
    });
  } catch (error: unknown) {
    console.error("LOCAL SOFA UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "소파 정보 수정 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}