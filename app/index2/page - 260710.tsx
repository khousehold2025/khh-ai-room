"use client";

import { useEffect, useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import SofaGrid from "@/components/SofaGrid";
import sofas from "@/data/sofas.json";

export default function Index2Page() {
  const [memberId, setMemberId] = useState("test-member-001");
  const [memberName, setMemberName] = useState("테스트회원");
  const [remain, setRemain] = useState(5);
  const [total, setTotal] = useState(5);

  const [selectedSofa, setSelectedSofa] = useState("");
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [material, setMaterial] = useState("original");
  const [color, setColor] = useState("original");
  const [lighting, setLighting] = useState("natural");

  const [loading, setLoading] = useState(false);
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

  const handleImage = (file: File) => {
    setRoomImage(file);
    setPreview(URL.createObjectURL(file));
    setResultImage(null);
    setAdvice("");
  };

  const handleGenerate = async () => {
    if (remain <= 0) {
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
      setResultImage(null);
      setAdvice("");

      const formData = new FormData();
      formData.append("memberId", memberId);
      formData.append("memberName", memberName);
      formData.append("room", roomImage);
      formData.append("sofa", selectedSofa);
      formData.append("material", material);
      formData.append("color", color);
      formData.append("lighting", lighting);

      const res = await fetch("/api/generate2", {
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
      setRemain(json.remain ?? remain - 1);
      setTotal(json.total ?? total);
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !preview || !selectedSofa || remain <= 0;

  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-black p-8 text-white shadow">
          <p className="text-sm tracking-[0.3em] text-gray-300">
            KHOUSEHOLD
          </p>
          <h1 className="mt-3 text-4xl font-bold">AI ROOM 2.0</h1>
          <p className="mt-3 text-gray-300">
            회원 전용 AI 공간 시뮬레이션 서비스입니다.
          </p>
        </div>

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

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <UploadPanel image={preview} onSelect={handleImage} />

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-5 text-xl font-bold">소파 선택</h2>
            <SofaGrid selected={selectedSofa} onSelect={setSelectedSofa} />
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold">원단 선택</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {materialOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMaterial(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  material === item.id
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <div className="font-bold">{item.title}</div>
                <p className="mt-2 text-sm leading-6">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold">색상 선택</h2>
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
                {item.title}
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
          {loading ? "AI 생성중..." : "AI 배치하기"}
        </button>

        {resultImage && (
          <div className="mt-10 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold">결과</h2>

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