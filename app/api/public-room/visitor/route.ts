import { NextRequest, NextResponse } from "next/server";
import { db, FieldValue } from "@/lib/firebaseAdmin";

const DEFAULT_LIMIT = 10;

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
    const visitorDoc = await visitorRef.get();

    // 처음 방문한 사용자
    if (!visitorDoc.exists) {
      await visitorRef.set({
        visitorId,
        usageCount: 0,
        limit: DEFAULT_LIMIT,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
        lastVisitAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        visitorId,
        usageCount: 0,
        limit: DEFAULT_LIMIT,
        remain: DEFAULT_LIMIT,
        active: true,
        isNew: true,
      });
    }

    // 기존 사용자
    const data = visitorDoc.data() || {};

    const usageCount =
      typeof data.usageCount === "number" ? data.usageCount : 0;

    const limit =
      typeof data.limit === "number" ? data.limit : DEFAULT_LIMIT;

    const active = data.active !== false;

    await visitorRef.update({
      lastVisitAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      visitorId,
      usageCount,
      limit,
      remain: Math.max(limit - usageCount, 0),
      active,
      isNew: false,
    });
  } catch (error) {
    console.error("PUBLIC ROOM VISITOR ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "방문자 정보를 확인하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}