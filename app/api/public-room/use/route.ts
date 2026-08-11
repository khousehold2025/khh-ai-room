import { NextRequest, NextResponse } from "next/server";
import { db, FieldValue } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const visitorId = body.visitorId;

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "visitorId가 없습니다.",
        },
        { status: 400 }
      );
    }

    const visitorRef = db.collection("aiRoomVisitors").doc(visitorId);

    const result = await db.runTransaction(async (transaction) => {
      const visitorDoc = await transaction.get(visitorRef);

      if (!visitorDoc.exists) {
        throw new Error("VISITOR_NOT_FOUND");
      }

      const data = visitorDoc.data() || {};

      const usageCount =
        typeof data.usageCount === "number" ? data.usageCount : 0;

      const limit =
        typeof data.limit === "number" ? data.limit : 10;

      const active = data.active !== false;

      if (!active) {
        throw new Error("VISITOR_BLOCKED");
      }

      if (usageCount >= limit) {
        throw new Error("LIMIT_EXCEEDED");
      }

      const newUsageCount = usageCount + 1;
      const newRemain = Math.max(limit - newUsageCount, 0);

      transaction.update(visitorRef, {
        usageCount: newUsageCount,
        lastUsedAt: FieldValue.serverTimestamp(),
      });

      return {
        usageCount: newUsageCount,
        limit,
        remain: newRemain,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("PUBLIC ROOM USE ERROR:", error);

    const message =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "LIMIT_EXCEEDED") {
      return NextResponse.json(
        {
          success: false,
          code: "LIMIT_EXCEEDED",
          message: "무료 AI 생성 횟수를 모두 사용했습니다.",
        },
        { status: 403 }
      );
    }

    if (message === "VISITOR_BLOCKED") {
      return NextResponse.json(
        {
          success: false,
          code: "VISITOR_BLOCKED",
          message: "현재 AI Room을 이용할 수 없습니다.",
        },
        { status: 403 }
      );
    }

    if (message === "VISITOR_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          code: "VISITOR_NOT_FOUND",
          message: "방문자 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "사용 횟수를 처리하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}