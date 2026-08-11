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
      .collection("aiRoomGenerations")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const generations = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        visitorId: data.visitorId || "",
        sofaId: data.sofaId || "",
        material: data.material || "",
        color: data.color || "",
        lighting: data.lighting || "",
        roomType: data.roomType || "",
        success: data.success !== false,

        createdAt: data.createdAt
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: generations.length,
      generations,
    });
  } catch (error) {
    console.error("ADMIN GENERATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "생성 이력을 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}