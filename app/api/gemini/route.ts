import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function GET() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "안녕하세요. 'KHH AI ROOM 연결 성공'이라고만 답해주세요.",
    });

    return NextResponse.json({
      success: true,
      text: response.text,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json({
      success: false,
      error: String(error),
    });

  }
}