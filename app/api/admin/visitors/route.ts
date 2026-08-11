import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET() {
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

    const snapshot = await db
      .collection("aiRoomVisitors")
      .orderBy("lastVisitAt", "desc")
      .limit(200)
      .get();

    const visitors = snapshot.docs.map((doc) => {
      const data = doc.data();

      const usageCount =
        typeof data.usageCount === "number" ? data.usageCount : 0;

      const limit =
        typeof data.limit === "number" ? data.limit : 10;

      return {
        id: doc.id,
        visitorId: data.visitorId || doc.id,
        usageCount,
        limit,
        remain: Math.max(limit - usageCount, 0),
        active: data.active !== false,

        createdAt: data.createdAt
          ? data.createdAt.toDate().toISOString()
          : null,

        lastVisitAt: data.lastVisitAt
          ? data.lastVisitAt.toDate().toISOString()
          : null,

        lastUsedAt: data.lastUsedAt
          ? data.lastUsedAt.toDate().toISOString()
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error("ADMIN VISITORS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "방문자 정보를 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}