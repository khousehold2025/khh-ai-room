import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import sofas from "@/data/sofas.json";
import materials from "@/data/materials.json";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 원단별 고정 프롬프트
 */
const MATERIAL_PROMPTS: Record<string, string> = {
  original: `
Preserve the sofa's original upholstery material exactly as shown in the product image.

Do not change:
- the original material type
- fabric or leather texture
- surface grain
- gloss level
- stitching
- seams
- upholstery finish

The sofa must retain its original upholstery identity.
`,

  fabric: `
Change the sofa upholstery to premium woven fabric.

Material characteristics:
- soft woven textile texture
- refined and dense fabric weave
- matte surface with minimal reflections
- warm, comfortable, and cozy appearance
- realistic upholstery fabric suitable for a premium sofa

Preserve the original sofa structure, cushions, seams, stitching, armrests,
legs, proportions, and product design.
Only change the upholstery material impression.
`,

  silicone: `
Change the sofa upholstery to premium matte silicone leather.

Material characteristics:
- smooth and clean silicone leather surface
- mostly matte finish
- very subtle soft reflections
- refined, modern, and easy-to-clean appearance
- consistent leather-like texture
- no excessive gloss or plastic appearance

Preserve the original sofa structure, cushions, seams, stitching, armrests,
legs, proportions, and product design.
Only change the upholstery material impression.
`,

  silicone_gloss: `
Change the sofa upholstery to premium glossy silicone leather.

Material characteristics:
- smooth silicone leather surface
- clearly visible elegant gloss
- refined light reflections across the cushions
- polished and luxurious appearance
- glossy but still realistic
- not metallic and not plastic
- highlights should naturally follow the sofa's curves

Preserve the original sofa structure, cushions, seams, stitching, armrests,
legs, proportions, and product design.
Only change the upholstery material impression and gloss level.
`,

  natural_leather: `
Change the sofa upholstery to premium natural leather.

Material characteristics:
- subtle natural leather grain
- soft depth and realistic leather texture
- gentle highlights and natural tonal variation
- elegant, durable, and high-quality appearance
- not overly glossy
- avoid artificial plastic texture

Preserve the original sofa structure, cushions, seams, stitching, armrests,
legs, proportions, and product design.
Only change the upholstery material impression.
`,

  italian_leather: `
Change the sofa upholstery to premium Italian natural leather.

Material characteristics:
- fine and sophisticated natural leather grain
- rich depth and elegant tonal variation
- soft and refined highlights
- supple and luxurious appearance
- premium European leather finish
- high-end but realistic surface
- avoid artificial plastic texture
- avoid excessive gloss

Preserve the original sofa structure, cushions, seams, stitching, armrests,
legs, proportions, and product design.
Only change the upholstery material impression.
`,
};

/**
 * 컬러별 고정 프롬프트
 */
const COLOR_PROMPTS: Record<string, string> = {
  original: `
Preserve the original sofa color exactly as shown in the product image.

Do not intentionally recolor the sofa.
The color may change only slightly and naturally because of the selected lighting.
`,

  ivory: `
Apply a soft warm ivory color.
It should be brighter than beige but softer and warmer than pure white.
Avoid strong yellow tones.
`,

  deep_green: `
Apply a deep muted green color.
The tone should feel calm, sophisticated, natural, and premium.
Avoid bright emerald or fluorescent green.
`,

  charcoal: `
Apply a deep charcoal gray color.
It should be dark, neutral, refined, and softer than pure black.
`,

  indie_pink: `
Apply a muted dusty indie pink color.
The tone should feel soft, elegant, calm, and slightly desaturated.
Avoid vivid or fluorescent pink.
`,

  gray_blue: `
Apply a muted gray-blue color.
Balance soft blue and neutral gray with a calm, modern appearance.
Avoid vivid royal blue.
`,

  white: `
Apply a clean soft white color.
It should look natural under interior lighting.
Do not make it overexposed or unnaturally bluish.
`,

  beige: `
Apply a soft warm beige color.
The tone should be neutral, calm, and natural.
Avoid making it strongly yellow.
`,

  olive: `
Apply a muted olive green color.
The tone should feel natural, sophisticated, calm, and slightly warm.
Avoid bright green.
`,

  camel: `
Apply a warm camel brown color.
Balance tan and warm brown characteristics.
Avoid overly orange or yellow results.
`,

  smoky_gray: `
Apply a medium-dark smoky gray color.
The tone should feel soft, muted, modern, and slightly warm.
Avoid cold metallic gray.
`,

  black: `
Apply a deep premium black color.
Preserve visible material texture, seams, cushions, and natural highlights.
Do not crush all details into featureless pure black.
`,

  gray: `
Apply a balanced medium gray color.
The tone should be neutral, elegant, and realistic under the selected lighting.
`,

  light_gray: `
Apply a soft light gray color.
It should remain clearly gray while feeling bright, clean, and neutral.
`,

  sky_blue: `
Apply a soft muted sky blue color.
The tone should feel bright, calm, airy, and sophisticated.
Avoid vivid blue.
`,

  green: `
Apply a refined natural green color.
The tone should be balanced, slightly muted, and suitable for premium furniture.
`,

  euro_snow: `
Apply a refined Euro Snow color.
Use a very bright warm off-white tone with a subtle creamy undertone.
It must remain softer and warmer than pure white.
`,

  deep_cream: `
Apply a rich deep cream color.
Use a warm creamy tone with gentle beige undertones and a luxurious soft appearance.
`,

  lily_gray: `
Apply a soft Lily Gray color.
Use a pale elegant gray with a subtle warm undertone and a clean premium appearance.
`,

  earl_gray_orange: `
Apply an Earl Gray Orange color.
Use a sophisticated muted warm orange softened with gray undertones.
Avoid bright tangerine or vivid orange.
`,

  forest_green: `
Apply a deep Forest Green color.
Use a rich, muted dark green with natural depth and a luxurious appearance.
Avoid bright emerald green.
`,

  brusque_blue: `
Apply a refined deep muted blue color.
Use a sophisticated blue tone with subtle gray undertones.
Avoid vivid cobalt or royal blue.
`,

  cognac: `
Apply a rich cognac leather color.
Use a warm reddish-brown tone with natural depth, subtle amber undertones,
and realistic tonal variation.
`,

  elephant_charcoal: `
Apply an Elephant Charcoal color.
Use a deep warm charcoal gray with subtle brown undertones.
It should remain softer and more dimensional than pure black.
`,

  cloud_white: `
Apply a soft Cloud White color.
Use a clean warm white with gentle softness.
Avoid harsh blue or yellow casts.
`,

  plum_pink: `
Apply a sophisticated Plum Pink color.
Use a muted dusty pink with subtle plum undertones and a calm luxurious appearance.
Avoid vivid magenta.
`,

  hush_brown: `
Apply a rich Hush Brown color.
Use a deep, warm, muted brown with soft chocolate and earthy undertones.
`,

  dark_night_black: `
Apply a Dark Night Black color.
Use an extremely deep luxurious black with subtle cool depth.
Preserve visible leather grain, seams, highlights, and cushion details.
`,
};

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

    const materialText =
      MATERIAL_PROMPTS[material] ||
      `
Apply the selected upholstery material named "${selectedMaterial.name}" realistically.

Preserve:
- the original sofa structure
- proportions
- seams
- cushions
- armrests
- legs
- product identity

Only change the upholstery material impression.
`;

    const colorText =
      COLOR_PROMPTS[color] ||
      `
Apply the selected color named "${selectedColor.name}" realistically.

Preserve:
- visible upholstery texture
- seams
- highlights
- shadows
- natural tonal variation

The selected color should remain recognizable under the selected lighting.
`;

    const lightingText = getLightingPrompt(lighting);

    const ai = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location,
    });

    const imagePrompt = `
Image 1 is the customer's real room photograph.
Image 2 is the authoritative product reference image of the exact sofa.

First inspect Image 1 for any existing sofa or sofa-related seating.
If an existing sofa is present, remove and replace it with the exact selected sofa from Image 2.
There must be only one main sofa after editing.
Do not place the new sofa in front of, beside, or on top of the existing sofa.

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

Important upholstery instructions:
- Apply the selected material and selected color consistently to all upholstered parts.
- If original material is selected, preserve the original upholstery material.
- If original color is selected, preserve the original sofa color.
- Keep the selected material texture clearly visible.
- Keep the selected color realistic under the selected lighting.
- Do not let the lighting completely replace or distort the selected color.

Sofa preservation rules — highest priority:
- Image 2 is the exact sofa product reference and must remain the source of truth.
- Preserve the exact sofa composition, construction, silhouette, proportions, and module arrangement shown in Image 2.
- Preserve the exact number, size, shape, thickness, and placement of all seat cushions and back cushions.
- Preserve the exact armrest design, armrest width, armrest height, and armrest angle.
- Preserve the exact backrest design, headrest design, seat depth, base shape, legs, seams, stitching, piping, quilting, gaps, and visible product details.
- Preserve all asymmetrical features exactly as shown in Image 2.
- Do not invent, remove, merge, split, enlarge, shrink, soften, simplify, or redesign any sofa part.
- Do not change a straight sofa into a corner sofa, sectional sofa, chaise sofa, or another configuration.
- Do not change a chaise, corner, module, ottoman, or armrest from one side to the other.
- Do not mirror the sofa unless mirroring is absolutely required by the requested room orientation.
- When changing viewing direction, rotate the same physical sofa as a rigid product. Do not reconstruct or reinterpret its design.
- Material and color changes may affect only the upholstery surface appearance.
- Material and color changes must not alter cushion volume, edge shape, seam position, panel division, padding, or structure.
- If any conflict occurs, preserving the exact sofa product shape is more important than changing material, color, lighting, perspective, or placement.

Placement and transformation rules:
- The only permitted geometric changes are translation, uniform scaling, perspective correction, and rotation of the complete sofa as one rigid object.
- Keep the sofa's internal proportions locked during every transformation.
- Do not independently rotate, move, resize, or reshape individual cushions, modules, armrests, legs, or backrests.
- Place the sofa naturally on the floor.
- Resize the complete sofa uniformly to a realistic scale based on the room and the provided product dimensions.
- Rotate the complete sofa only when necessary to match the room camera angle and placement direction.
- Adjust perspective only to make the same sofa fit the room viewpoint.
- Do not stretch the sofa horizontally or vertically.
- Do not compress, widen, narrow, deepen, shorten, or distort the sofa.
- Keep the sofa level, stable, and physically plausible.
- Add realistic contact shadows under the legs and base.
- Match highlights and shadows to the selected lighting.
- Avoid floating above the floor.
- Avoid embedding the sofa into walls, floors, or other furniture.
- Use the approximate floor area and position occupied by the removed sofa as the preferred placement zone for the selected sofa.
- If the selected sofa has different dimensions, adjust only its overall scale and position naturally within the available room space.

Room preservation rules:
- Keep the room structure unchanged.
- Keep walls, floor, ceiling, windows, doors, and all non-sofa objects in place.
- If Image 1 already contains a sofa, couch, sectional, loveseat, armchair, ottoman, or sofa-related furniture in the intended placement area, remove it completely before placing the selected sofa from Image 2.
- Remove the existing sofa cleanly, including its visible body, cushions, legs, shadows, reflections, and occlusion.
- Reconstruct the wall, floor, rug, and background naturally where the original sofa was removed.
- Do not leave duplicate sofas, sofa fragments, ghosting, residual cushions, shadows, or visual traces.
- Keep all unrelated furniture and room objects unchanged.
- Do not remove tables, rugs, lamps, curtains, cabinets, plants, decorations, windows, or doors unless they physically block the exact sofa placement area.

Product information:
Name: ${sofa.name}
Size: ${sofa.size || "정보 없음"}
Original product color: ${sofa.color || "정보 없음"}
Width: ${sofa.width || "정보 없음"}mm
Depth: ${sofa.depth || "정보 없음"}mm
Height: ${sofa.height || "정보 없음"}mm

Final priority order:
1. Detect and completely remove any existing sofa in Image 1.
2. Preserve the exact shape, composition, and product identity of the selected sofa from Image 2.
3. Place that sofa naturally in the cleared location.
4. Apply the selected material, color, and lighting.
5. Preserve all unrelated room elements.

Never sacrifice sofa-shape fidelity to improve styling or room integration.

Return only one final photorealistic interior placement image.
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