import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

function createImageUrl(fileName: string) {
  return `/sofas/${encodeURIComponent(fileName)}`;
}

export async function GET() {
  try {
    // 이 기능은 로컬 개발 환경에서만 사용합니다.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          message: "소파 이미지 등록 기능은 로컬에서만 사용할 수 있습니다.",
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

    const sofaDirectory = path.join(
      process.cwd(),
      "public",
      "sofas"
    );

    if (!fs.existsSync(sofaDirectory)) {
      return NextResponse.json(
        {
          success: false,
          message: "public/sofas 폴더를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const files = fs
      .readdirSync(sofaDirectory, {
        withFileTypes: true,
      })
      .filter((entry) => {
        if (!entry.isFile()) {
          return false;
        }

        const extension = path
          .extname(entry.name)
          .toLowerCase();

        return ALLOWED_EXTENSIONS.has(extension);
      })
      .map((entry) => {
        const absolutePath = path.join(
          sofaDirectory,
          entry.name
        );

        const stats = fs.statSync(absolutePath);

        return {
          fileName: entry.name,
          imageUrl: createImageUrl(entry.name),
          sizeBytes: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) =>
        a.fileName.localeCompare(b.fileName, "ko")
      );

    return NextResponse.json({
      success: true,
      images: files,
    });
  } catch (error: unknown) {
    console.error("LOCAL SOFA IMAGE LIST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "소파 이미지 목록을 불러오는 중 오류가 발생했습니다.",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}