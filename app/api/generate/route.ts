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
    const material = formData.get("material");
    const color = formData.get("color");
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

    const materialText =
      material === "silicone"
        ? `
Selected sofa material: Silicone leather.

Apply a smooth, clean, slightly refined leather-like surface.
The sofa should look easy to clean, modern, and slightly sleek.
Keep the original sofa structure, cushion shape, armrests, legs, seams, and proportions.
Only change the material impression to silicone leather.
`
        : material === "natural_leather"
        ? `
Selected sofa material: Natural leather.

Apply a premium natural leather surface with subtle grain, depth, and soft highlights.
The sofa should look luxurious, durable, and high-end.
Keep the original sofa structure, cushion shape, armrests, legs, seams, and proportions.
Only change the material impression to natural leather.
`
        : `
Selected sofa material: Fabric.

Apply a soft woven fabric texture with a warm and cozy appearance.
The sofa should look comfortable, matte, and textile-based.
Keep the original sofa structure, cushion shape, armrests, legs, seams, and proportions.
Only change the material impression to fabric.
`;

    const colorText =
      color === "ivory"
        ? `
Selected sofa color: Ivory.

Make the sofa an elegant warm ivory color.
The color should feel soft, bright, clean, and suitable for modern interiors.
Do not make it pure white.
`
        : color === "camel"
        ? `
Selected sofa color: Camel.

Make the sofa a warm camel color.
The color should feel natural, cozy, and premium.
`
        : color === "cognac"
        ? `
Selected sofa color: Cognac.

Make the sofa a rich cognac brown color.
The color should feel deep, warm, classic, and luxurious.
`
        : color === "gray"
        ? `
Selected sofa color: Gray.

Make the sofa a modern neutral gray color.
The color should feel calm, balanced, and easy to match with interiors.
`
        : color === "black"
        ? `
Selected sofa color: Black.

Make the sofa a deep black color.
The color should feel modern, bold, and premium.
Preserve visible details, seams, and cushion shapes.
`
        : `
Selected sofa color: Original.

Preserve the original sofa color from the product image as much as possible.
Only allow natural changes caused by the selected room lighting.
`;

    const lightingText =
      lighting === "warm"
        ? `
Selected lighting mode: 2. 전구색 / Warm White.

Apply warm yellow-orange bulb lighting similar to candlelight or incandescent light.
The scene should feel cozy, soft, warm, and relaxing.

Lighting characteristics:
- 2700K to 3000K.
- Strong warm yellow-orange tone.
- White walls should look slightly cream or beige.
- Floor reflections should feel warm and golden.
- Sofa highlights should feel warm.
- Shadows should be soft and warm brown.
- Reduce cold daylight feeling.
`
        : lighting === "neutral"
        ? `
Selected lighting mode: 3. 주백색 / Natural White / Soft ivory LED.

Apply balanced natural-white LED lighting.
It should feel like a mix of soft yellow warmth and clean white light.

Lighting characteristics:
- 4000K to 4500K.
- Soft ivory white tone.
- Not too yellow and not too blue.
- Walls should look soft ivory white.
- Sofa should look realistic with a gentle warm-white cast.
- Shadows should be soft and balanced.
`
        : lighting === "daylight"
        ? `
Selected lighting mode: 4. 주광색 / Cool White / Bright crisp white LED.

Apply strong cool white LED lighting.
The scene should feel crisp, bright, clear, and vivid.

Lighting characteristics:
- 6000K to 6500K.
- Cool white tone with a subtle blue cast.
- Walls should look crisp bluish-white.
- Floor reflections should look bright and cool.
- Sofa should look sharper and cooler only because of the light.
- Shadows should be cleaner and slightly more defined.
- Reduce warm yellow tones.
`
        : `
Selected lighting mode: 1. 자연광 / Natural Light.

Apply natural sunlight lighting.
This should show the sofa's original color most accurately and naturally.

Lighting characteristics:
- 5000K to 5500K.
- Main light source should feel like sunlight from windows.
- Room should feel fresh, airy, and naturally bright.
- White walls should look naturally white, not yellow and not blue.
- Floor should have soft daylight highlights.
- Shadows should be natural and soft.
`;

    const ai = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location,
    });

    const imagePrompt = `
Image 1 is the customer's room.
Image 2 is a real sofa product image with transparent background.

Create one final realistic interior image by placing the sofa from Image 2 inside Image 1.

Sofa material instruction:
${materialText}

Sofa color instruction:
${colorText}

Lighting instruction:
${lightingText}

Important image generation rules:
- Place the sofa naturally on the floor.
- Resize the sofa to realistic scale.
- Rotate the sofa only if needed to match the camera angle.
- Adjust perspective so it belongs naturally in the room.
- Add realistic contact shadows under the legs and base.
- Apply the selected material, selected color, and selected lighting clearly.
- Keep the room structure unchanged.
- Keep walls, floor, windows, ceiling, and existing objects in the same positions.
- Do not add extra furniture.
- Do not remove existing objects.
- Do not add people.
- Do not add text.
- Do not redesign the sofa structure.
- Do not change armrests, legs, cushion count, seams, or overall silhouette.
- Preserve the sofa product identity as much as possible.

Product information:
Name: ${sofa.name}
Size: ${sofa.size}
Original color: ${sofa.color}
Width: ${sofa.width}mm
Depth: ${sofa.depth}mm
Height: ${sofa.height}mm

Return only the final realistic interior placement image.
`;

    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { text: imagePrompt },
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

    const imageParts = imageResponse.candidates?.[0]?.content?.parts ?? [];
    const imagePart = imageParts.find((part: any) => part.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini 이미지 결과가 없습니다.",
          text: imageParts.map((p: any) => p.text).filter(Boolean).join("\n"),
          raw: imageResponse,
        },
        { status: 500 }
      );
    }

    const resultImageBase64 = imagePart.inlineData.data;
    const resultMimeType = imagePart.inlineData.mimeType || "image/png";

    const advicePrompt = `
You are an interior styling expert for a Korean sofa brand called 케이하우스홀드.

Analyze the final room image and give practical advice in Korean.

Focus on:
- Whether the selected sofa fits the room atmosphere.
- Whether the selected color works well with the room.
- Whether the selected material feels appropriate.
- Whether the selected lighting makes the room look good.
- One simple improvement suggestion.

Keep it concise, friendly, and sales-helpful.
Do not mention AI.
Do not overpromise.
Write about 5 to 7 Korean sentences.

Selected sofa:
${sofa.name}

Selected material:
${String(material || "fabric")}

Selected color:
${String(color || "original")}

Selected lighting:
${String(lighting || "natural")}
`;

    let advice = "";

    try {
      const adviceResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: advicePrompt },
              {
                inlineData: {
                  mimeType: resultMimeType,
                  data: resultImageBase64,
                },
              },
            ],
          },
        ],
      });

      advice =
        adviceResponse.candidates?.[0]?.content?.parts
          ?.map((part: any) => part.text)
          .filter(Boolean)
          .join("\n") || "";
    } catch (adviceError) {
      console.error("ADVICE GENERATION ERROR:", adviceError);
      advice = "";
    }

    return NextResponse.json({
      success: true,
      image: `data:${resultMimeType};base64,${resultImageBase64}`,
      advice,
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