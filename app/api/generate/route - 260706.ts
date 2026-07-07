import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import sofas from "@/data/sofas.json";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(
      process.cwd(),
      "vertex-key.json"
    );

    const formData = await req.formData();

    const room = formData.get("room");
    const sofaId = formData.get("sofa");
    const lighting = formData.get("lighting");

    if (!(room instanceof File)) {
      return NextResponse.json(
        { success: false, message: "방 사진이 없습니다." },
        { status: 400 }
      );
    }

    if (typeof sofaId !== "string") {
      return NextResponse.json(
        { success: false, message: "소파가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    const sofa = sofas.find((item) => item.id === sofaId);

    if (!sofa) {
      return NextResponse.json(
        { success: false, message: "소파 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "global";

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "GOOGLE_CLOUD_PROJECT가 없습니다." },
        { status: 500 }
      );
    }

    const sofaPath = path.join(
      process.cwd(),
      "public",
      sofa.image.replace(/^\//, "")
    );

    if (!fs.existsSync(sofaPath)) {
      return NextResponse.json(
        {
          success: false,
          message: `소파 이미지 파일이 없습니다: ${sofa.image}`,
        },
        { status: 404 }
      );
    }

    const roomBuffer = Buffer.from(await room.arrayBuffer());
    const sofaBuffer = fs.readFileSync(sofaPath);

    const roomBase64 = roomBuffer.toString("base64");
    const sofaBase64 = sofaBuffer.toString("base64");

    const lightingText =
      lighting === "warm"
        ? `
SELECTED LIGHTING MODE: 2. 전구색 / Warm White

Apply a clearly warm yellow-orange lighting atmosphere.

This light should resemble candlelight or incandescent bulb lighting.
The final image must feel warm, cozy, soft, and comfortable.

Lighting characteristics:
- Color temperature: about 2700K to 3000K.
- Strong warm yellow-orange tone.
- The room should feel less dazzling and more relaxed.
- White walls should become slightly cream or beige.
- The floor should have warm golden reflections.
- The sofa should receive warm highlights.
- Shadows should be soft, cozy, and warm brown.
- The image should clearly look different from natural light, neutral white, and cool white.

Important:
The sofa color may appear warmer because of lighting, but do not intentionally recolor the sofa.
`
        : lighting === "neutral"
        ? `
SELECTED LIGHTING MODE: 3. 주백색 / Natural White / Soft ivory LED

Apply a balanced natural-white LED lighting atmosphere.

This light should feel similar to sunset sunlight or a bright clear daytime light,
with a mixture of slight yellow warmth and clean white light.

Lighting characteristics:
- Color temperature: about 4000K to 4500K.
- Soft ivory white tone.
- Not too yellow and not too blue.
- The room should look comfortable, clean, and natural.
- White walls should look like soft ivory white.
- The sofa color should look realistic with a gentle warm-white cast.
- Shadows should be soft, balanced, and natural.
- The final image should clearly look softer and warmer than cool white, but cleaner than warm bulb light.

Important:
Preserve the sofa identity and original color as much as possible.
`
        : lighting === "daylight"
        ? `
SELECTED LIGHTING MODE: 4. 주광색 / Cool White / Bright crisp white LED

Apply a strong cool white LED lighting atmosphere.

This light should resemble very clear, bright daylight with a bluish-white tone.
The final image must feel crisp, bright, clear, and high in brightness.

Lighting characteristics:
- Color temperature: about 6000K to 6500K.
- Strong cool white tone with a subtle blue cast.
- White walls should look crisp bluish-white.
- The floor should have clean, bright, cool reflections.
- The sofa should look sharper and cooler only because of the light.
- Shadows should be cleaner and slightly more defined.
- Reduce warm yellow tones strongly.
- The final image should clearly look brighter, cooler, and more vivid than the other lighting modes.

Important:
Do not intentionally recolor the sofa. Only apply the cool lighting effect.
`
        : `
SELECTED LIGHTING MODE: 1. 자연광 / Natural Light

Apply natural sunlight lighting.

This light should represent sunlight and show the object's original color
as accurately and naturally as possible.

Lighting characteristics:
- Color temperature: about 5000K to 5500K.
- Main light source: natural sunlight from windows.
- The room should feel fresh, realistic, airy, and naturally bright.
- Preserve accurate color rendering of the sofa.
- White walls should look naturally white, not yellow and not blue.
- The floor should have soft daylight highlights.
- Shadows should be natural, soft, and directional from the window.
- The final image should clearly look like a naturally sunlit room.

Important:
This mode should show the sofa's original color most accurately.
`;

    const ai = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location,
    });

    const prompt = `
Image 1 is the customer's room.
Image 2 is a real sofa product image with transparent background.

Create one final realistic interior image by placing the sofa from Image 2 inside Image 1.

VERY IMPORTANT LIGHTING INSTRUCTION:
The selected lighting mode is the main creative direction.
The lighting effect must be clearly visible.
Do not make the four lighting modes look similar.
Apply the selected lighting to the entire final image, including:
- wall tone
- floor tone
- sofa highlights
- sofa shadows
- room brightness
- color temperature
- reflections

Lighting condition:
${lightingText}

Sofa placement:
- Place the sofa naturally on the floor.
- Resize the sofa to realistic scale.
- Rotate the sofa only if needed to match the camera angle.
- Adjust perspective so it belongs naturally in the room.
- Add realistic contact shadows under the legs and base.
- Match the selected lighting on the sofa surface.

Room preservation:
- Keep the room structure unchanged.
- Keep walls, floor, windows, ceiling, and existing objects in the same positions.
- Do not add extra furniture.
- Do not remove existing objects.
- Do not add people.
- Do not add text.

Sofa preservation:
- Do not redesign the sofa.
- Do not change the sofa structure.
- Do not change the armrests.
- Do not change the legs.
- Do not change cushions.
- Do not change stitching, seams, fabric texture, or leather texture.
- Do not intentionally recolor the sofa.
- The sofa color may appear naturally different only because of the selected lighting.

Product information:
Name: ${sofa.name}
Size: ${sofa.size}
Color: ${sofa.color}
Width: ${sofa.width}mm
Depth: ${sofa.depth}mm
Height: ${sofa.height}mm

Final output:
Return only the final realistic interior placement image.
The selected lighting effect must be clearly noticeable.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: room.type || "image/jpeg",
                data: roomBase64,
              },
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: sofaBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part: any) => part.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini 이미지 결과가 없습니다.",
          text: parts.map((p: any) => p.text).filter(Boolean).join("\n"),
          raw: response,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: `data:${
        imagePart.inlineData.mimeType || "image/png"
      };base64,${imagePart.inlineData.data}`,
    });
  } catch (error: any) {
    console.error("VERTEX GEMINI ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Vertex Gemini 이미지 생성 오류",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}