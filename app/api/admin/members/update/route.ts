import { NextResponse } from "next/server";
import { db, FieldValue } from "@/lib/firebaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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

    const memberId = String(body.memberId || "").trim();
    const remain = Number(body.remain);

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          message: "회원번호가 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(remain) || remain < 0 || remain > 9999) {
      return NextResponse.json(
        {
          success: false,
          message: "남은 횟수는 0~9999 사이의 정수로 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    const memberRef = db.collection("members").doc(memberId);
    const memberSnapshot = await memberRef.get();

    if (!memberSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          message: "해당 회원을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const currentData = memberSnapshot.data();
    const currentTotal = Number(currentData?.total ?? 5);

    // 관리자가 남은 횟수를 total보다 크게 지정하면 total도 함께 올림
    const nextTotal = Math.max(currentTotal, remain);

    await memberRef.update({
      remain,
      total: nextTotal,
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: `${memberId} 회원의 남은 횟수를 ${remain}회로 변경했습니다.`,
      member: {
        memberId,
        memberName: currentData?.memberName || "회원",
        remain,
        total: nextTotal,
        active: true,
      },
    });
  } catch (error: any) {
    console.error("ADMIN MEMBER UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "회원 횟수 수정 중 오류가 발생했습니다.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}