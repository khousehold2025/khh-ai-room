import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MemberItem = {
  memberId: string;
  memberName: string;
  remain: number;
  total: number;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

function timestampToString(value: any): string | null {
  if (!value) return null;

  try {
    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return null;
  } catch {
    return null;
  }
}

function convertMember(
  documentId: string,
  data: FirebaseFirestore.DocumentData
): MemberItem {
  return {
    memberId: data.memberId || documentId,
    memberName: data.memberName || "회원",
    remain: Number(data.remain ?? 0),
    total: Number(data.total ?? 5),
    active: data.active ?? true,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  };
}

export async function GET(req: Request) {
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

    const url = new URL(req.url);
    const query = String(url.searchParams.get("q") || "").trim();

    const members: MemberItem[] = [];

    if (query) {
      // 회원번호와 문서 ID가 동일한 경우 먼저 조회
      const memberDocument = await db.collection("members").doc(query).get();

      if (memberDocument.exists) {
        members.push(
          convertMember(memberDocument.id, memberDocument.data() || {})
        );
      }

      // 회원 이름 정확히 일치 검색
      const nameSnapshot = await db
        .collection("members")
        .where("memberName", "==", query)
        .limit(20)
        .get();

      nameSnapshot.forEach((document) => {
        if (!members.some((member) => member.memberId === document.id)) {
          members.push(
            convertMember(document.id, document.data())
          );
        }
      });
    } else {
      // 검색어가 없으면 최근 수정 회원 20명 표시
      const recentSnapshot = await db
        .collection("members")
        .orderBy("updatedAt", "desc")
        .limit(20)
        .get();

      recentSnapshot.forEach((document) => {
        members.push(convertMember(document.id, document.data()));
      });
    }

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error: any) {
    console.error("ADMIN MEMBERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "회원 목록을 불러오는 중 오류가 발생했습니다.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}