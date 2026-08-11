import { NextRequest, NextResponse } from "next/server";
import { db, FieldValue } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      visitorId,
      sofaId,
      material,
      color,
      lighting,
      roomType,
      success,
    } = body;

    if (!visitorId) {
      return NextResponse.json(
        {
          success: false,
          message: "visitorId가 없습니다.",
        },
        { status: 400 }
      );
    }

    const generationRef = db.collection("aiRoomGenerations").doc();

    await generationRef.set({
      generationId: generationRef.id,

      visitorId,

      sofaId: sofaId || "",
      material: material || "",
      color: color || "",
      lighting: lighting || "",
      roomType: roomType || "",

      success: success !== false,

      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      generationId: generationRef.id,
    });
  } catch (error) {
    console.error("GENERATION LOG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "생성 이력을 저장하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}