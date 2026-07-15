import { NextResponse } from "next/server";
import { db, FieldValue } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const memberId = body.memberId;
    const memberName = body.memberName || "회원";

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: "memberId가 없습니다." },
        { status: 400 }
      );
    }

    const memberRef = db.collection("members").doc(memberId);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      await memberRef.set({
        memberId,
        memberName,
        remain: 5,
        total: 5,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        member: {
          memberId,
          memberName,
          remain: 5,
          total: 5,
          active: true,
        },
      });
    }

    const data = memberSnap.data();

    return NextResponse.json({
      success: true,
      member: {
        memberId,
        memberName: data?.memberName || memberName,
        remain: data?.remain ?? 5,
        total: data?.total ?? 5,
        active: data?.active ?? true,
      },
    });
  } catch (error: any) {
    console.error("MEMBER STATUS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "회원 정보 조회 오류",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}