import { NextResponse } from "next/server";
import { db, FieldValue } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const memberId = String(body.memberId || "").trim();

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          message: "초기화할 회원번호가 없습니다.",
        },
        { status: 400 }
      );
    }

    const memberRef = db.collection("members").doc(memberId);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "해당 회원을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    await memberRef.update({
      remain: 5,
      total: 5,
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updatedSnap = await memberRef.get();
    const updatedData = updatedSnap.data();

    return NextResponse.json({
      success: true,
      message: "회원의 AI 생성 횟수를 5회로 초기화했습니다.",
      member: {
        memberId,
        memberName: updatedData?.memberName || "회원",
        remain: updatedData?.remain ?? 5,
        total: updatedData?.total ?? 5,
        active: updatedData?.active ?? true,
      },
    });
  } catch (error: any) {
    console.error("MEMBER RESET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "회원 횟수 초기화 중 오류가 발생했습니다.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}