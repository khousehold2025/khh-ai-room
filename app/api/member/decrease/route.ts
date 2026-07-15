import { NextResponse } from "next/server";
import { db, FieldValue } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const memberId = body.memberId;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: "memberId가 없습니다." },
        { status: 400 }
      );
    }

    const memberRef = db.collection("members").doc(memberId);

    const result = await db.runTransaction(async (transaction) => {
      const memberSnap = await transaction.get(memberRef);

      if (!memberSnap.exists) {
        throw new Error("회원 정보를 찾을 수 없습니다.");
      }

      const data = memberSnap.data();
      const remain = data?.remain ?? 0;
      const total = data?.total ?? 5;
      const active = data?.active ?? true;

      if (!active) {
        throw new Error("비활성화된 회원입니다.");
      }

      if (remain <= 0) {
        throw new Error("AI 이미지 생성 가능 횟수를 모두 사용했습니다.");
      }

      const nextRemain = remain - 1;

      transaction.update(memberRef, {
        remain: nextRemain,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        remain: nextRemain,
        total,
      };
    });

    return NextResponse.json({
      success: true,
      remain: result.remain,
      total: result.total,
    });
  } catch (error: any) {
    console.error("MEMBER DECREASE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "회원 생성 횟수 차감 오류",
      },
      { status: 500 }
    );
  }
}