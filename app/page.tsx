"use client";

import { useEffect, useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import SofaGrid from "@/components/SofaGrid";
import sofas from "@/data/sofas.json";

export default function Home() {
  const [selectedSofa, setSelectedSofa] = useState("");
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [material, setMaterial] = useState("original");
  const [color, setColor] = useState("original");
  const [lighting, setLighting] = useState("natural");

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [advice, setAdvice] = useState("");

  const materialOptions = [
  {
      id: "original",
      title: "원본원단",
      description: "제품 이미지의 원래 원단과 질감을 최대한 유지합니다.",
    },

    {
      id: "fabric",
      title: "패브릭",
      description: "부드럽고 포근한 질감으로 따뜻한 공간 연출에 좋습니다.",
    },
    {
      id: "silicone",
      title: "실리콘가죽",
      description: "관리 편의성과 깔끔한 질감을 함께 표현합니다.",
    },
    {
      id: "natural_leather",
      title: "천연가죽",
      description: "고급스럽고 깊이 있는 가죽 질감을 표현합니다.",
    },
  ];

  const colorOptions = [
    { id: "original", title: "원본색상" },
    { id: "ivory", title: "아이보리" },
    { id: "camel", title: "카멜" },
    { id: "cognac", title: "코냑" },
    { id: "gray", title: "그레이" },
    { id: "black", title: "블랙" },
  ];

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
        "노란빛 또는 주황빛으로 촛불이나 백열전구와 유사한 따뜻한 색감으로, 눈부심이 적고 아늑합니다.",
    },
    {
      id: "neutral",
      title: "3. 주백색",
      subtitle: "Natural White / 부드러운 아이보리색 LED",
      description:
        "해 질 녘의 태양빛이나 맑은 날의 밝은 빛과 유사하며, 노란빛과 하얀빛이 섞여 있습니다.",
    },
    {
      id: "daylight",
      title: "4. 주광색",
      subtitle: "Cool White / 쨍한 하얀색 LED",
      description:
        "푸른빛이 도는 하얀빛으로 낮의 태양광 중에서도 아주 쨍하고 맑은 날의 빛처럼, 명도가 높고 또렷합니다.",
    },
  ];

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

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

    const materialName = getOptionTitle(materialOptions, material);
    const colorName = getOptionTitle(colorOptions, color);
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
    // Chrome / Edge 지원: 저장 위치와 파일명 직접 선택
    if ("showSaveFilePicker" in window) {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "PNG 이미지",
            accept: {
              "image/png": [".png"],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      return;
    }

    // 지원 안 되는 브라우저용 fallback
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error: any) {
    if (error?.name === "AbortError") return;
    console.error(error);
    alert("이미지 저장 중 오류가 발생했습니다.");
  }
};

  const handleGenerate = async () => {
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
      setResultImage(null);
      setAdvice("");

      const formData = new FormData();
      formData.append("room", roomImage);
      formData.append("sofa", selectedSofa);
      formData.append("material", material);
      formData.append("color", color);
      formData.append("lighting", lighting);

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
      setCooldown(30);
    } catch (err) {
      console.error(err);
      alert("프론트 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldown > 0 || !preview || !selectedSofa;

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-4xl font-bold">KHH AI ROOM</h1>

        <p className="mt-2 text-gray-500">
          내 공간에 케이하우스홀드 소파를 배치해보세요.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <UploadPanel image={preview} onSelect={handleImage} />

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-5 text-xl font-bold">소파 선택</h2>
            <SofaGrid selected={selectedSofa} onSelect={setSelectedSofa} />
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold">원단 선택</h2>
          <p className="mb-5 text-sm text-gray-500">
            원하는 소파 소재감을 선택해 주세요.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {materialOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMaterial(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  material === item.id
                    ? "border-black bg-black text-white shadow-lg"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                <div className="text-base font-bold">{item.title}</div>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    material === item.id ? "text-gray-100" : "text-gray-600"
                  }`}
                >
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold">색상 선택</h2>
          <p className="mb-5 text-sm text-gray-500">
            공간 분위기에 맞춰 소파 색상을 선택해 주세요.
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {colorOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setColor(item.id)}
                className={`rounded-xl border px-4 py-4 font-semibold transition ${
                  color === item.id
                    ? "border-black bg-black text-white shadow-lg"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold">조명 분위기</h2>
          <p className="mb-5 text-sm text-gray-500">
            고객님의 공간 조명과 가장 비슷한 분위기를 선택해 주세요.
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {lightingOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLighting(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  lighting === item.id
                    ? "border-black bg-black text-white shadow-lg"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                <div className="text-base font-bold">{item.title}</div>
                <div
                  className={`mt-1 text-sm ${
                    lighting === item.id ? "text-gray-200" : "text-gray-500"
                  }`}
                >
                  {item.subtitle}
                </div>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    lighting === item.id ? "text-gray-100" : "text-gray-600"
                  }`}
                >
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isDisabled}
          className="
            mt-10
            w-full
            rounded-xl
            bg-black
            py-5
            text-xl
            font-semibold
            text-white
            transition
            hover:bg-gray-800
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {loading
            ? "AI 생성중..."
            : cooldown > 0
            ? `AI 배치하기 (${cooldown}초)`
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