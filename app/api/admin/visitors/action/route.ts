import { NextRequest, NextResponse } from "next/server";
import { db, FieldValue } from "@/lib/firebaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "관리자 인증이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const visitorId = body.visitorId;
    const action = body.action;

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "visitorId가 없습니다.",
        },
        { status: 400 }
      );
    }

    const visitorRef = db
      .collection("aiRoomVisitors")
      .doc(visitorId);

    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "방문자를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    if (action === "reset") {
      await visitorRef.update({
        usageCount: 0,
        lastAdminActionAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "사용횟수를 초기화했습니다.",
      });
    }

    if (action === "block") {
      await visitorRef.update({
        active: false,
        lastAdminActionAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "방문자를 차단했습니다.",
      });
    }

    if (action === "unblock") {
      await visitorRef.update({
        active: true,
        lastAdminActionAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "방문자 차단을 해제했습니다.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "지원하지 않는 작업입니다.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("ADMIN VISITOR ACTION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "방문자 정보를 수정하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}