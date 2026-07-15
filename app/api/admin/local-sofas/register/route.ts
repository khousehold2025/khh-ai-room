import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";


type SofaItem = {
  id: string;
  name: string;
  size: string;
  color: string;
  width: number;
  depth: number;
  height: number;
  image: string;
  active?: boolean;
};

function createIdFromFileName(fileName: string) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);

  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          message: "소파 등록 기능은 로컬에서만 사용할 수 있습니다.",
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

    const name = String(body.name || "").trim();
    const size = String(body.size || "").trim();
    const color = String(body.color || "").trim();
    const fileName = String(body.fileName || "").trim();

    const width = Number(body.width);
    const depth = Number(body.depth);
    const height = Number(body.height);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "품명을 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (!size) {
      return NextResponse.json(
        {
          success: false,
          message: "사이즈를 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json(
        {
          success: false,
          message: "컬러를 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          message: "소파 이미지를 선택해 주세요.",
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

    const sofaDirectory = path.join(
      process.cwd(),
      "public",
      "sofas"
    );

    const selectedImagePath = path.join(
      sofaDirectory,
      fileName
    );

    if (!fs.existsSync(selectedImagePath)) {
      return NextResponse.json(
        {
          success: false,
          message: `선택한 이미지 파일이 없습니다: ${fileName}`,
        },
        { status: 404 }
      );
    }

    const sofasJsonPath = path.join(
      process.cwd(),
      "data",
      "sofas.json"
    );

    if (!fs.existsSync(sofasJsonPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "data/sofas.json 파일을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(sofasJsonPath, "utf-8");
    const sofas: SofaItem[] = JSON.parse(raw);

    const id = createIdFromFileName(fileName);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "이미지 파일명으로 소파 ID를 만들 수 없습니다.",
        },
        { status: 400 }
      );
    }

    if (sofas.some((item) => item.id === id)) {
      return NextResponse.json(
        {
          success: false,
          message: `이미 등록된 소파 ID입니다: ${id}`,
        },
        { status: 409 }
      );
    }

    if (sofas.some((item) => item.image === `/sofas/${fileName}`)) {
      return NextResponse.json(
        {
          success: false,
          message: "이 이미지는 이미 다른 소파에 등록되어 있습니다.",
        },
        { status: 409 }
      );
    }

const newSofa: SofaItem = {
  id,
  name,
  size,
  color,
  width,
  depth,
  height,
  image: `/sofas/${fileName}`,
  active: true,
};

    sofas.push(newSofa);

    fs.writeFileSync(
      sofasJsonPath,
      JSON.stringify(sofas, null, 2) + "\n",
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: `${name} 소파를 등록했습니다.`,
      sofa: newSofa,
    });
  } catch (error: unknown) {
    console.error("LOCAL SOFA REGISTER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "소파 등록 중 오류가 발생했습니다.",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}