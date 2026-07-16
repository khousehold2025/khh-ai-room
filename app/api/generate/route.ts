import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import sofas from "@/data/sofas.json";
import materials from "@/data/materials.json";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 원단별 고정 프롬프트 삭제
 */

/**
 * 컬러별 고정 프롬프트 삭제
 */

function getLightingPrompt(lighting: string): string {
  if (lighting === "warm") {
    return `
Selected lighting mode: 2. 전구색 / Warm White.

Apply warm yellow-orange bulb lighting similar to candlelight or incandescent light.
The scene should feel cozy, soft, warm, and relaxing.

Lighting characteristics:
- 2700K to 3000K
- strong warm yellow-orange tone
- white walls may look slightly cream or beige
- floor reflections should feel warm and golden
- sofa highlights should feel warm
- shadows should be soft and warm brown
- reduce the feeling of cold daylight
`;
  }

  if (lighting === "neutral") {
    return `
Selected lighting mode: 3. 주백색 / Natural White / Soft ivory LED.

Apply balanced natural-white LED lighting.
It should feel like a mix of soft yellow warmth and clean white light.

Lighting characteristics:
- 4000K to 4500K
- soft ivory-white tone
- not too yellow and not too blue
- walls should look soft ivory white
- sofa should have a gentle and realistic warm-white cast
- shadows should be soft and balanced
`;
  }

  if (lighting === "daylight") {
    return `
Selected lighting mode: 4. 주광색 / Cool White / Bright crisp white LED.

Apply strong cool-white LED lighting.
The scene should feel crisp, bright, clear, and vivid.

Lighting characteristics:
- 6000K to 6500K
- cool-white tone with a subtle blue cast
- walls should look crisp bluish-white
- floor reflections should look bright and cool
- sofa should look sharper and cooler only because of the light
- shadows should be slightly more defined
- reduce warm yellow tones
`;
  }

  return `
Selected lighting mode: 1. 자연광 / Natural Light.

Apply natural sunlight lighting.
Show the sofa's selected color as accurately and naturally as possible.

Lighting characteristics:
- 5000K to 5500K
- main light should feel like sunlight from windows
- room should feel fresh, airy, and naturally bright
- white walls should look naturally white
- avoid excessive yellow or blue casts
- floor should have soft daylight highlights
- shadows should be natural and soft
`;
}

function getImageMimeType(imagePath: string): string {
  const extension = path.extname(imagePath).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/png";
}

function configureGoogleCredentials(projectId: string): void {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    const credentialsPath = path.join(
      "/tmp",
      "google-credentials.json"
    );

    fs.writeFileSync(
      credentialsPath,
      JSON.stringify({
        type: "service_account",
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey,
      }),
      "utf-8"
    );

    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    return;
  }

  const localCredentialsPath = path.join(
    process.cwd(),
    "vertex-key.json"
  );

  if (fs.existsSync(localCredentialsPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS =
      localCredentialsPath;
  }
}

export async function POST(req: Request) {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "global";

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "GOOGLE_CLOUD_PROJECT가 없습니다.",
        },
        { status: 500 }
      );
    }

    configureGoogleCredentials(projectId);

    const formData = await req.formData();

    const roomValue = formData.get("room");
    const sofaValue = formData.get("sofa");
    const materialValue = formData.get("material");
    const colorValue = formData.get("color");
    const lightingValue = formData.get("lighting");

    if (!(roomValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "방 사진이 없습니다.",
        },
        { status: 400 }
      );
    }

    if (typeof sofaValue !== "string" || !sofaValue.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "소파가 선택되지 않았습니다.",
        },
        { status: 400 }
      );
    }

    const material =
      typeof materialValue === "string"
        ? materialValue
        : "original";

    const color =
      typeof colorValue === "string"
        ? colorValue
        : "original";

    const lighting =
      typeof lightingValue === "string"
        ? lightingValue
        : "natural";

    const sofa = sofas.find(
      (item) => item.id === sofaValue
    );

    if (!sofa) {
      return NextResponse.json(
        {
          success: false,
          message: "소파 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    const selectedMaterial = materials.find(
      (item) =>
        item.id === material &&
        item.active !== false
    );

    if (!selectedMaterial) {
      return NextResponse.json(
        {
          success: false,
          message: "선택한 원단 정보를 찾을 수 없습니다.",
        },
        { status: 400 }
      );
    }

    const selectedColor = selectedMaterial.colors.find(
      (item) => item.id === color
    );

    if (!selectedColor) {
      return NextResponse.json(
        {
          success: false,
          message: `${selectedMaterial.name}에서 선택할 수 없는 컬러입니다.`,
        },
        { status: 400 }
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

    const roomBuffer = Buffer.from(
      await roomValue.arrayBuffer()
    );

    const sofaBuffer = fs.readFileSync(sofaPath);

    const roomBase64 = roomBuffer.toString("base64");
    const sofaBase64 = sofaBuffer.toString("base64");

   const geometryLockText = `
ABSOLUTE SOFA GEOMETRY LOCK:

Image 2 is the authoritative reference image of the exact sofa product.
Treat the sofa in Image 2 as a locked product photograph.

Do not redraw, regenerate, reconstruct, reinterpret, or redesign the sofa.

Preserve exactly:
- overall shape
- silhouette and outer contour
- width-to-height ratio
- depth proportions
- seat count
- module arrangement
- cushion position
- cushion size
- cushion thickness
- cushion volume
- cushion angle
- cushion shape
- backrest and headrest shape
- armrest shape, width, height, and angle
- chaise direction
- asymmetric left-right configuration
- seams
- stitching
- piping
- panel divisions
- quilting
- folds
- gaps
- base
- legs
- visible hardware
- floor clearance

Material and color changes are surface-only edits.

Material may change only:
- surface texture
- grain
- gloss
- reflectivity

Color may change only:
- upholstery color
- natural tonal variation

Never change:
- geometry
- construction
- padding volume
- cushion shape
- seam position
- panel division
- module arrangement
- product identity

If any instruction conflicts with preserving the exact sofa shape,
preserving the exact sofa shape has absolute priority.
`;

const materialText = `
${geometryLockText}

${selectedMaterial.prompt?.trim() || `
Apply the selected upholstery material named "${selectedMaterial.name}" realistically.

Change only:
- visible upholstery surface texture
- surface grain
- gloss level
- reflectivity

Do not change any physical sofa component.
`}
`;

const colorText = `
${geometryLockText}

${selectedColor.prompt?.trim() || `
Apply the selected color named "${selectedColor.name}" realistically.

Only recolor the visible upholstery surface.
Do not alter the sofa geometry, cushion volume, seams, or structure.
`}
`;

    const lightingText = getLightingPrompt(lighting);

    const ai = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location,
    });

    const imagePrompt = `
${geometryLockText}

Image 1 is the customer's real room photograph.
Image 2 is the authoritative product reference image of the exact sofa.

Use Image 2 as a locked visual reference.
Place that exact sofa into Image 1 without redesigning or reconstructing it.
Treat the entire sofa in Image 2 as one rigid product whose internal geometry must remain unchanged.
Only its overall position, uniform scale, viewing direction, rotation, perspective, upholstery surface material, upholstery color, lighting response, and contact shadow may change.

Selected sofa:
${sofa.name}

Selected material:
${selectedMaterial.name}

Material instructions:
${materialText}

Selected color:
${selectedColor.name}

Color instructions:
${colorText}

Selected lighting:
${lightingText}

Important upholstery editing rules — highest priority:
- Image 2 is the locked authoritative reference for the exact sofa product.
- Treat the sofa geometry from Image 2 as immutable and fully locked.
- Changing material or color is a surface-only edit, equivalent to recoloring and retexturing the existing upholstery pixels.
- Do not regenerate, redraw, reconstruct, reinterpret, or redesign the sofa.
- Apply the selected material and selected color only to the visible upholstery surface.
- Keep the exact original silhouette and outer contour.
- Keep the exact original width-to-height ratio and depth proportions.
- Keep every cushion in exactly the same position, size, thickness, volume, angle, and shape.
- Keep every seam, stitch line, piping line, panel boundary, crease, gap, tuft, quilting pattern, and edge in exactly the same position.
- Keep the exact armrest shape, armrest width, armrest height, and armrest angle.
- Keep the exact backrest, headrest, seat, base, module arrangement, legs, and visible hardware.
- Keep all asymmetric features and left-right configuration exactly as shown.
- Do not mirror or reverse the sofa.
- Do not inflate, deflate, soften, sharpen, round, flatten, widen, narrow, lengthen, shorten, simplify, or reshape any component.
- Material changes may alter only surface texture, grain, reflectivity, and gloss.
- Color changes may alter only upholstery color and natural tonal variation.
- Material and color changes must never alter geometry, padding volume, seam position, panel division, construction, or product identity.
- If accurate material or color conversion conflicts with preserving the sofa shape, preserve the exact sofa shape and structure first.

Sofa geometry lock rules — absolute priority:
- Preserve the exact sofa from Image 2 as if it were a cut-out product photograph being composited into the room.
- The sofa must remain visually identical to Image 2 except for overall placement, uniform scale, viewing orientation, perspective, upholstery surface material, upholstery color, lighting response, and contact shadow.
- Use the original product image as the direct source for the sofa's shape and internal details.
- Do not create a new sofa inspired by Image 2.
- Do not approximate the design.
- Do not reinterpret hidden or unclear portions by inventing new shapes.
- Preserve the exact number and arrangement of modules, seats, backs, cushions, armrests, headrests, ottomans, and chaise sections.
- Preserve the exact left-right direction of chaise sections, corners, arms, asymmetrical modules, and open ends.
- Preserve the exact cushion gaps, seam locations, stitching, piping, quilting, folds, and visible upholstery divisions.
- Preserve the exact leg count, leg position, leg design, base height, and floor clearance.
- Do not add or remove cushions, modules, arms, legs, headrests, or decorative elements.
- Do not turn the sofa into another seating type or configuration.
- Do not make the sofa look more modern, softer, fuller, slimmer, or more luxurious by altering its physical design.

Permitted transformations only:
- Move the complete sofa as one rigid object.
- Rotate the complete sofa as one rigid object.
- Apply uniform scaling to the complete sofa.
- Apply camera-perspective correction to the complete sofa.
- Adjust overall lighting, highlights, shadows, and contact shadow.
- Change only the upholstery surface material and upholstery color.

Forbidden geometric transformations:
- no non-uniform scaling
- no horizontal stretching
- no vertical stretching
- no widening or narrowing
- no independent resizing of sofa parts
- no independent movement or rotation of cushions or modules
- no structural reconstruction
- no shape generation
- no geometry hallucination

Room preservation and sofa replacement rules:
- Keep the room structure unchanged.
- Keep walls, floor, ceiling, windows, doors, and all unrelated room objects unchanged.
- First inspect Image 1 for an existing sofa, couch, sectional, loveseat, chaise, armchair, ottoman, or sofa-related seating in the intended placement area.
- If an existing sofa or sofa-related seating is present in the intended placement area, remove it completely before placing the selected sofa from Image 2.
- Remove the existing sofa body, cushions, legs, shadows, reflections, and visible fragments.
- Reconstruct the wall, floor, rug, and background naturally where the old sofa was removed.
- Do not leave duplicate sofas, ghost images, residual cushions, leftover shadows, or sofa fragments.
- Preserve all unrelated furniture and objects.
- Do not remove tables, rugs, lamps, curtains, cabinets, plants, decorations, windows, or doors.
- Do not add extra furniture.
- Do not add people.
- Do not add text, logos, labels, borders, or watermarks.
- Do not crop the room unnecessarily.

Product information:
Name: ${sofa.name}
Size: ${sofa.size || "정보 없음"}
Original product color: ${sofa.color || "정보 없음"}
Width: ${sofa.width || "정보 없음"}mm
Depth: ${sofa.depth || "정보 없음"}mm
Height: ${sofa.height || "정보 없음"}mm

Final priority order:
1. Preserve the exact sofa geometry, silhouette, construction, proportions, cushion arrangement, seams, and product identity from Image 2.
2. Remove an existing sofa from the room when replacement is required.
3. Composite the exact selected sofa naturally into the cleared room position.
4. Apply the selected material only as a surface texture and reflectivity change.
5. Apply the selected color only as a surface recoloring operation.
6. Match lighting and contact shadows to the room.

Never sacrifice sofa-shape fidelity for material realism, color accuracy, viewing angle, room integration, styling, or visual attractiveness.
When uncertain, preserve the original product image more literally rather than creatively regenerating the sofa.
`;

    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: imagePrompt,
            },
            {
              inlineData: {
                mimeType:
                  roomValue.type || "image/jpeg",
                data: roomBase64,
              },
            },
            {
              inlineData: {
                mimeType: getImageMimeType(sofa.image),
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

    const imageParts =
      imageResponse.candidates?.[0]?.content?.parts ?? [];

    const imagePart = imageParts.find(
      (part: any) => part.inlineData?.data
    );

    if (!imagePart?.inlineData?.data) {
      const responseText = imageParts
        .map((part: any) => part.text)
        .filter(Boolean)
        .join("\n");

      return NextResponse.json(
        {
          success: false,
          message: "Gemini 이미지 결과가 없습니다.",
          text: responseText,
        },
        { status: 500 }
      );
    }

    const resultImageBase64 =
      imagePart.inlineData.data;

    const resultMimeType =
      imagePart.inlineData.mimeType || "image/png";

    const advicePrompt = `
You are an interior styling expert for a Korean premium sofa brand called 케이하우스홀드.

Analyze the final room image and provide practical advice in Korean.

Selected sofa:
${sofa.name}

Selected material:
${selectedMaterial.name}

Selected color:
${selectedColor.name}

Selected lighting:
${lighting}

Focus on:
- whether the sofa size and design suit the room
- whether the selected material suits the space
- whether the selected color works with the floor, walls, and existing furniture
- whether the selected lighting supports the desired atmosphere
- one simple improvement suggestion involving a rug, table, curtain, or lighting

Writing rules:
- Write in friendly and natural Korean.
- Write approximately 5 to 7 sentences.
- Be practical and sales-helpful.
- Do not mention AI.
- Do not overpromise.
- Do not claim exact real-world dimensions unless clearly visible.
`;

    let advice = "";

    try {
      const adviceResponse =
        await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: advicePrompt,
                },
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
      console.error(
        "ADVICE GENERATION ERROR:",
        adviceError
      );

      advice = "";
    }

    return NextResponse.json({
      success: true,
      image: `data:${resultMimeType};base64,${resultImageBase64}`,
      advice,
    });
  } catch (error: unknown) {
    console.error("VERTEX GEMINI ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Vertex Gemini 이미지 생성 오류",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}