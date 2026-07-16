"use client";
import { useMember } from "@/hooks/useMember";
import { useEffect, useMemo, useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import SofaGrid from "@/components/SofaGrid";
import sofas from "@/data/sofas.json";
import materials from "@/data/materials.json";

type AIRoomProps = {
  mode?: "basic" | "member";
};

export default function AIRoom({ mode = "basic" }: AIRoomProps) {
  const isMemberMode = mode === "member";

const {
  memberId,
  memberName,
  remain,
  total,
  active,
  memberLoading,
  decreaseRemain,
} = useMember(isMemberMode);

  const [selectedSofa, setSelectedSofa] = useState("");
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [material, setMaterial] = useState("original");
  const [color, setColor] = useState("original");
  const [lighting, setLighting] = useState("natural");

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);

const [loadingDots, setLoadingDots] = useState(1);
const [generationComplete, setGenerationComplete] = useState(false);

  const [advice, setAdvice] = useState("");


const materialOptions = useMemo(() => {
  return materials.filter((item) => item.active !== false);
}, []);

const selectedMaterial = useMemo(() => {
  return (
    materialOptions.find((item) => item.id === material) ||
    materialOptions[0]
  );
}, [materialOptions, material]);

const colorOptions = useMemo(() => {
  return selectedMaterial?.colors || [];
}, [selectedMaterial]);
 

const handleMaterialChange = (materialId: string) => {
  setMaterial(materialId);
  setColor("original");
};


  const lightingOptions = [
    {
      id: "natural",
      title: "1. 자연광",
      subtitle: "Natural Light",
      description:
        "태양의 빛으로, 대상의 원래 색상을 가장 정확하고 자연스럽게 표현합니다.",
    },
    {
      id: "warm",
      title: "2. 전구색",
      subtitle: "Warm White",
      description:
        "노란빛 또는 주황빛으로 촛불이나 백열전구와 유사한 따뜻한 색감입니다.",
    },
    {
      id: "neutral",
      title: "3. 주백색",
      subtitle: "Natural White / 부드러운 아이보리색 LED",
      description:
        "노란빛과 하얀빛이 섞여 있는 부드럽고 자연스러운 조명입니다.",
    },
    {
      id: "daylight",
      title: "4. 주광색",
      subtitle: "Cool White / 쨍한 하얀색 LED",
      description:
        "푸른빛이 도는 하얀빛으로 명도가 높고 또렷한 조명입니다.",
    },
  ];

  useEffect(() => {

if (!loading) {
    setLoadingDots(1);
    return;
  }

  const timer = setInterval(() => {
    setLoadingDots((previous) =>
      previous >= 3 ? 1 : previous + 1
    );
  }, 500);

  return () => clearInterval(timer);
}, [loading]);


   useEffect(() => {
  if (cooldown <= 0) {
    if (!isMemberMode) {
      setGenerationComplete(false);
    }

    return;
  }

  const timer = setInterval(() => {
    setCooldown((previous) => Math.max(previous - 1, 0));
  }, 1000);

  return () => clearInterval(timer);
}, [cooldown, isMemberMode]);

  const handleImage = (file: File) => {
    setRoomImage(file);
    setPreview(URL.createObjectURL(file));
    setResultImage(null);
    setAdvice("");
  };

  const getOptionTitle = (
    options: { id: string; title: string }[],
    id: string
  ) => {
    return options.find((item) => item.id === id)?.title || id;
  };

  const sanitizeFileName = (value: string) => {
    return value
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "")
      .trim();
  };

  const getTodayCode = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yy}${mm}${dd}`;
  };

  const getNextDownloadNumber = (dateCode: string) => {
    const key = `khh-download-count-${dateCode}`;
    const current = Number(localStorage.getItem(key) || "0");
    const next = current + 1;
    localStorage.setItem(key, String(next));
    return String(next).padStart(2, "0");
  };

  const makeDownloadFileName = () => {
    const dateCode = getTodayCode();
    const count = getNextDownloadNumber(dateCode);

    const sofaName =
      sofas.find((item) => item.id === selectedSofa)?.name || "소파";

const materialName =
  materialOptions.find((item) => item.id === material)?.name || material;

const colorName =
  colorOptions.find((item) => item.id === color)?.name || color;

    const lightingName = getOptionTitle(lightingOptions, lighting).replace(
      /^[0-9]\.\s*/,
      ""
    );

    return `${dateCode}_${count}_${sanitizeFileName(
      sofaName
    )}_${sanitizeFileName(materialName)}_${sanitizeFileName(
      colorName
    )}_${sanitizeFileName(lightingName)}.png`;
  };

  const handleDownload = async () => {
    if (!resultImage) {
      alert("저장할 이미지가 없습니다.");
      return;
    }

    const fileName = makeDownloadFileName();
    const response = await fetch(resultImage);
    const blob = await response.blob();

    try {
      if ("showSaveFilePicker" in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "PNG Image",
              accept: {
                "image/png": [".png"],
              },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      alert("이미지 저장 중 오류가 발생했습니다.");
    }
  };

  const handleGenerate = async () => {
    if (isMemberMode && remain <= 0) {
      alert("AI 이미지 생성 가능 횟수를 모두 사용했습니다.");
      return;
    }

    if (!roomImage) {
      alert("방 사진을 선택하세요.");
      return;
    }

    if (!selectedSofa) {
      alert("소파를 선택하세요.");
      return;
    }

    try {
      setLoading(true);
setGenerationComplete(false);
      setResultImage(null);
      setAdvice("");

      const formData = new FormData();
      formData.append("room", roomImage);
      formData.append("sofa", selectedSofa);
      formData.append("material", material);
      formData.append("color", color);
      formData.append("lighting", lighting);

      if (isMemberMode) {
        formData.append("memberId", memberId);
        formData.append("memberName", memberName);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(`${json.message || "API 실패"}\n\n${json.error || ""}`);
        return;
      }

      setResultImage(json.image);
      setAdvice(json.advice || "");
setGenerationComplete(true);

      if (isMemberMode) {
        await decreaseRemain();

 setTimeout(() => {
    setGenerationComplete(false);
  }, 30000);
      } else {
        setCooldown(30);
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

 const isDisabled =
  loading ||
  !preview ||
  !selectedSofa ||
  (!isMemberMode && cooldown > 0) ||
  (isMemberMode && remain <= 0) ||
  (isMemberMode && !active);

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-black p-8 text-white shadow">
          <p className="text-sm tracking-[0.3em] text-gray-300">
            KHOUSEHOLD
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            {isMemberMode ? "AI ROOM 2.0" : "KHH AI ROOM"}
          </h1>
          <p className="mt-3 text-gray-300">
            {isMemberMode
              ? "회원 전용 AI 공간 시뮬레이션 서비스입니다."
              : "내 공간에 케이하우스홀드 소파를 배치해보세요."}
          </p>
        </div>

        {isMemberMode && (
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{memberName}님</h2>
                <p className="mt-1 text-sm text-gray-500">
                  회원번호: {memberId}
                </p>
              </div>

              <div className="rounded-xl bg-gray-100 px-6 py-4 text-center">
                <p className="text-sm text-gray-500">남은 AI 생성 횟수</p>
                <p className="mt-1 text-3xl font-bold">
                  {remain} / {total}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  AI 이미지 생성은 5번의 회수 제한이 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

    <div className="mt-10 space-y-8">
  <UploadPanel image={preview} onSelect={handleImage} />

  <div className="rounded-xl bg-white p-6 shadow">
    <h2 className="mb-5 text-xl font-bold">소파 선택</h2>
    <SofaGrid selected={selectedSofa} onSelect={setSelectedSofa} />
  </div>
</div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold">원단 선택</h2>


          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
    {materialOptions.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => handleMaterialChange(item.id)}
        className={`rounded-xl border p-4 text-left transition ${
          material === item.id
            ? "border-black bg-black text-white"
            : "border-gray-200 bg-white text-gray-700"
        }`}
      >
        <div className="font-bold">{item.name}</div>
      </button>
    ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold">색상 선택</h2>


         <p className="mb-4 text-sm text-gray-500">
    {selectedMaterial?.name}에서 선택 가능한 컬러입니다.
  </p>

  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
    {colorOptions.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => setColor(item.id)}
        className={`rounded-xl border px-4 py-4 font-semibold ${
          color === item.id
            ? "border-black bg-black text-white"
            : "border-gray-200 bg-white text-gray-700"
        }`}
      >
        {item.name}
      </button>
    ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold">조명 분위기</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {lightingOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLighting(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  lighting === item.id
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <div className="font-bold">{item.title}</div>
                <div className="mt-1 text-sm opacity-70">{item.subtitle}</div>
                <p className="mt-3 text-sm leading-6">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isDisabled}
          className="mt-10 w-full rounded-xl bg-black py-5 text-xl font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
         {loading
  ? `AI 생성중${".".repeat(loadingDots)}`
  : generationComplete && !isMemberMode && cooldown > 0
  ? `생성완료 (${cooldown}초)`
  : generationComplete && isMemberMode
  ? "생성완료"
  : "AI 배치하기"}
        </button>

        {resultImage && (
          <div className="mt-10 rounded-xl bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">결과</h2>

              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
              >
                이미지 저장하기
              </button>

<p className="mt-2 text-center text-sm text-gray-500">
  ※ 모바일에서는 생성된 이미지를 길게 눌러 '사진에 저장'을 선택하세요.
</p>

            </div>

            <img
              src={resultImage}
              alt="AI Result"
              className="w-full rounded-xl"
            />

            {advice && (
              <div className="mt-6 rounded-xl bg-gray-50 p-5">
                <h3 className="mb-3 text-xl font-bold">
                  AI 인테리어 전문가 조언
                </h3>
                <p className="whitespace-pre-line leading-7 text-gray-700">
                  {advice}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}