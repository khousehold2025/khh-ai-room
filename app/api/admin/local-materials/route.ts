import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MaterialColor = {
  id: string;
  name: string;
  prompt: string;
  locked?: boolean;
};

type MaterialItem = {
  id: string;
  name: string;
  prompt: string;
  active: boolean;
  locked?: boolean;
  colors: MaterialColor[];
};

const ORIGINAL_MATERIAL: MaterialItem = {
  id: "original",
  name: "원본원단",
  prompt:
    "Preserve the sofa's original upholstery material exactly as shown in the product reference image. Do not change the material type, texture, grain, gloss level, seams, stitching, panel divisions, or upholstery finish. Material changes must not alter the sofa structure or cushion shape.",
  active: true,
  locked: true,
  colors: [
    {
      id: "original",
      name: "원본색상",
      prompt:
        "Preserve the original sofa color exactly as shown in the product reference image. Do not intentionally recolor the sofa. Allow only slight and natural color variation caused by the selected lighting.",
      locked: true,
    },
  ],
};

function getMaterialsPath() {
  return path.join(process.cwd(), "data", "materials.json");
}

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function ensureOriginalColor(colors: MaterialColor[]) {
  const otherColors = colors.filter((color) => color.id !== "original");

  return [
    {
      id: "original",
      name: "원본색상",
      prompt:
        "Preserve the original sofa color exactly as shown in the product reference image. Do not intentionally recolor the sofa. Allow only slight and natural color variation caused by the selected lighting.",
      locked: true,
    },
    ...otherColors,
  ];
}

function normalizeMaterials(items: MaterialItem[]) {
  const otherMaterials = items
    .filter((item) => item.id !== "original")
    .map((item) => ({
      ...item,
      active: item.active !== false,
      colors: ensureOriginalColor(item.colors || []),
    }));

  return [ORIGINAL_MATERIAL, ...otherMaterials];
}

async function checkLocalAdmin() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "원단 관리 기능은 로컬에서만 사용할 수 있습니다.",
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

  return null;
}

/**
 * 원단 목록 조회
 */
export async function GET() {
  try {
    const accessError = await checkLocalAdmin();

    if (accessError) {
      return accessError;
    }

    const materialsPath = getMaterialsPath();

    if (!fs.existsSync(materialsPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "data/materials.json 파일을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(materialsPath, "utf-8");
    const materials: MaterialItem[] = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      materials: normalizeMaterials(materials),
    });
  } catch (error: unknown) {
    console.error("LOCAL MATERIAL LIST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "원단 목록 조회 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 원단 종류 추가
 */
export async function POST(req: Request) {
  try {
    const accessError = await checkLocalAdmin();


    if (accessError) {
      return accessError;
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const requestedId = String(body.id || "").trim();
    const id = normalizeId(requestedId);
const prompt = String(body.prompt || "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "원단 이름을 입력해 주세요.",
        },
        { status: 400 }
      );
    }

if (!prompt) {
    return NextResponse.json(
        {
            success: false,
            message: "AI 원단 프롬프트를 입력해 주세요.",
        },
        { status: 400 }
    );
}


    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "원단 ID는 영문 소문자, 숫자, 밑줄 형식으로 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (id === "original") {
      return NextResponse.json(
        {
          success: false,
          message: "original ID는 원본원단 전용이라 사용할 수 없습니다.",
        },
        { status: 400 }
      );
    }

    const materialsPath = getMaterialsPath();

    if (!fs.existsSync(materialsPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "data/materials.json 파일을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(materialsPath, "utf-8");
    const materials: MaterialItem[] = JSON.parse(raw);

    if (materials.some((item) => item.id === id)) {
      return NextResponse.json(
        {
          success: false,
          message: `이미 사용 중인 원단 ID입니다: ${id}`,
        },
        { status: 409 }
      );
    }

    if (materials.some((item) => item.name === name)) {
      return NextResponse.json(
        {
          success: false,
          message: `이미 등록된 원단 이름입니다: ${name}`,
        },
        { status: 409 }
      );
    }

const newMaterial: MaterialItem = {
  id,
  name,
  prompt,
  active: true,
  colors: [
    {
      id: "original",
      name: "원본색상",
      prompt:
        "Preserve the original sofa color exactly as shown in the product reference image. Do not intentionally recolor the sofa. Allow only slight and natural color variation caused by the selected lighting.",
      locked: true,
    },
  ],
};

    const normalized = normalizeMaterials([...materials, newMaterial]);

    fs.writeFileSync(
      materialsPath,
      JSON.stringify(normalized, null, 2) + "\n",
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: `${name} 원단을 추가했습니다.`,
      material: newMaterial,
      materials: normalized,
    });
  } catch (error: unknown) {
    console.error("LOCAL MATERIAL CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "원단 추가 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 원단 이름·활성 상태·컬러 목록 수정
 */
export async function PUT(req: Request) {
  try {
    const accessError = await checkLocalAdmin();

    if (accessError) {
      return accessError;
    }

    const body = await req.json();

    const materialId = String(body.materialId || "").trim();
    const name = String(body.name || "").trim();
const prompt = String(body.prompt || "").trim();
    const active = body.active !== false;
    const receivedColors = Array.isArray(body.colors) ? body.colors : [];

    if (!materialId) {
      return NextResponse.json(
        {
          success: false,
          message: "수정할 원단 ID가 없습니다.",
        },
        { status: 400 }
      );
    }

    if (materialId === "original") {
      return NextResponse.json(
        {
          success: false,
          message: "원본원단은 수정하거나 숨길 수 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "원단 이름을 입력해 주세요.",
        },
        { status: 400 }
      );
    }

if (!prompt) {
  return NextResponse.json(
    {
      success: false,
      message: "AI 원단 프롬프트를 입력해 주세요.",
    },
    { status: 400 }
  );
}

    const colors: MaterialColor[] = [];

    for (const receivedColor of receivedColors) {
      const colorName = String(receivedColor?.name || "").trim();
const colorPrompt = String(receivedColor?.prompt || "").trim();
      const requestedColorId = String(receivedColor?.id || "").trim();
      const colorId = normalizeId(requestedColorId);

      if (
  !colorName ||
  !colorPrompt ||
  !colorId ||
  colorId === "original"
) {
  continue;
}

      if (colors.some((color) => color.id === colorId)) {
        return NextResponse.json(
          {
            success: false,
            message: `중복된 컬러 ID가 있습니다: ${colorId}`,
          },
          { status: 400 }
        );
      }

    colors.push({
  id: colorId,
  name: colorName,
  prompt: colorPrompt,
});
    }

    const materialsPath = getMaterialsPath();

    if (!fs.existsSync(materialsPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "data/materials.json 파일을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(materialsPath, "utf-8");
    const materials: MaterialItem[] = JSON.parse(raw);

    const materialIndex = materials.findIndex(
      (item) => item.id === materialId
    );

    if (materialIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "수정할 원단을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const duplicateName = materials.some(
      (item, index) => index !== materialIndex && item.name === name
    );

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          message: `이미 사용 중인 원단 이름입니다: ${name}`,
        },
        { status: 409 }
      );
    }

    materials[materialIndex] = {
      ...materials[materialIndex],
      name,
prompt,
      active,
      colors: ensureOriginalColor(colors),
    };

    const normalized = normalizeMaterials(materials);

    fs.writeFileSync(
      materialsPath,
      JSON.stringify(normalized, null, 2) + "\n",
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: `${name} 원단 정보를 저장했습니다.`,
      material: materials[materialIndex],
      materials: normalized,
    });
  } catch (error: unknown) {
    console.error("LOCAL MATERIAL UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "원단 정보 저장 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}