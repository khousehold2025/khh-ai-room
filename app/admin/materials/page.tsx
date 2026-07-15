"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type MaterialColor = {
  id: string;
  name: string;
  prompt: string;
  locked?: boolean;
};

type MaterialItem = {
  id: string;
  name: string;
  prompt: string;
  active: boolean;
  locked?: boolean;
  colors: MaterialColor[];
};

type EditColor = {
  id: string;
  name: string;
  prompt: string;
};

export default function AdminMaterialsPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);

const [newMaterialName, setNewMaterialName] = useState("");
const [newMaterialId, setNewMaterialId] = useState("");
const [newMaterialPrompt, setNewMaterialPrompt] = useState("");
const [creating, setCreating] = useState(false);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null
  );
const [editName, setEditName] = useState("");
const [editPrompt, setEditPrompt] = useState("");
const [editActive, setEditActive] = useState(true);
const [editColors, setEditColors] = useState<EditColor[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        const sessionResponse = await fetch("/api/admin/session", {
          cache: "no-store",
        });

        const sessionJson = await sessionResponse.json();
        const isAuthenticated = Boolean(sessionJson.authenticated);

        setAuthenticated(isAuthenticated);

        if (isAuthenticated) {
          await loadMaterials();
        }
      } catch (error) {
        console.error("관리자 인증 확인 오류:", error);
        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    initializePage();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/local-materials", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let json: any;

      try {
        json = JSON.parse(text);
      } catch {
        console.error("원단 목록 API 응답:", text);
        alert("원단 목록 API가 올바른 JSON을 반환하지 않았습니다.");
        return;
      }

      if (!response.ok || !json.success) {
        alert(json.message || "원단 목록을 불러오지 못했습니다.");
        return;
      }

      setMaterials(json.materials || []);
    } catch (error) {
      console.error("원단 목록 조회 오류:", error);
      alert("원단 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!newMaterialName.trim()) {
      alert("원단 이름을 입력해 주세요.");
      return;
    }

if (!newMaterialPrompt.trim()) {
  alert("AI 원단 프롬프트를 입력해 주세요.");
  return;
}

    if (!newMaterialId.trim()) {
      alert("원단 ID를 입력해 주세요.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/admin/local-materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newMaterialName.trim(),
  id: newMaterialId.trim(),
  prompt: newMaterialPrompt.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        alert(json.message || "원단 추가에 실패했습니다.");
        return;
      }

      setMaterials(json.materials || []);
      setNewMaterialName("");
      setNewMaterialId("");
setNewMaterialPrompt("");

      alert(json.message || "원단을 추가했습니다.");
    } catch (error) {
      console.error("원단 추가 오류:", error);
      alert("원단 추가 중 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const startEditMaterial = (material: MaterialItem) => {
    if (material.locked) {
      return;
    }

    setEditingMaterialId(material.id);
    setEditName(material.name);
setEditPrompt(material.prompt || "");
    setEditActive(material.active !== false);

    setEditColors(
      material.colors
        .filter((color) => color.id !== "original")
        .map((color) => ({
         id: color.id,
  name: color.name,
  prompt: color.prompt || "",
        }))
    );
  };

  const cancelEdit = () => {
    setEditingMaterialId(null);
  setEditName("");
  setEditPrompt("");
  setEditActive(true);
  setEditColors([]);
  };

  const addColorRow = () => {
    setEditColors((previous) => [
      ...previous,
      {
        id: "",
        name: "",
prompt: "",
      },
    ]);
  };

  const updateColor = (
    index: number,
    key: keyof EditColor,
    value: string
  ) => {
    setEditColors((previous) =>
      previous.map((color, colorIndex) =>
        colorIndex === index
          ? {
              ...color,
              [key]: value,
            }
          : color
      )
    );
  };

  const removeColor = (index: number) => {
    setEditColors((previous) =>
      previous.filter((_, colorIndex) => colorIndex !== index)
    );
  };

  const handleSaveMaterial = async () => {
    if (!editingMaterialId) {
      return;
    }

    if (!editName.trim()) {
      alert("원단 이름을 입력해 주세요.");
      return;
    }

if (!editPrompt.trim()) {
  alert("AI 원단 프롬프트를 입력해 주세요.");
  return;
}
   const cleanedColors = editColors
  .map((color) => ({
    id: color.id.trim(),
    name: color.name.trim(),
    prompt: color.prompt.trim(),
  }))
  .filter(
    (color) =>
      color.id &&
      color.name &&
      color.prompt
  );

 const hasIncompleteColor = editColors.some((color) => {
  const values = [
    color.id.trim(),
    color.name.trim(),
    color.prompt.trim(),
  ];

  const filledCount = values.filter(Boolean).length;

  return filledCount > 0 && filledCount < 3;
});

    if (hasIncompleteColor) {
      alert("컬러 ID, 컬러 이름, AI 컬러 프롬프트를 모두 입력해 주세요.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/local-materials", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          materialId: editingMaterialId,
          name: editName.trim(),
prompt: editPrompt.trim(),
          active: editActive,
          colors: cleanedColors,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        alert(json.message || "원단 정보 저장에 실패했습니다.");
        return;
      }

      setMaterials(json.materials || []);
      cancelEdit();

      alert(json.message || "원단 정보를 저장했습니다.");
    } catch (error) {
      console.error("원단 저장 오류:", error);
      alert("원단 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">관리자 인증 확인 중...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-bold">관리자 로그인이 필요합니다.</h1>

          <p className="mt-3 leading-7 text-gray-500">
            관리자 메인에서 로그인한 뒤 원단 관리 페이지를 이용해 주세요.
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
          >
            관리자 로그인
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="rounded-2xl bg-black p-7 text-white">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm tracking-[0.25em] text-gray-300">
                KHOUSEHOLD
              </p>

              <h1 className="mt-2 text-3xl font-bold">원단 관리</h1>

              <p className="mt-2 text-sm text-gray-300">
                원단 종류와 원단별 선택 가능한 컬러를 관리합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-lg border border-white/40 px-4 py-2 text-sm hover:bg-white hover:text-black"
              >
                관리자 메인
              </Link>

              <Link
                href="/admin/sofas"
                className="rounded-lg border border-white/40 px-4 py-2 text-sm hover:bg-white hover:text-black"
              >
                소파 관리
              </Link>

              <Link
                href="/admin/members"
                className="rounded-lg border border-white/40 px-4 py-2 text-sm hover:bg-white hover:text-black"
              >
                회원 관리
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-bold text-amber-900">로컬 전용 기능</h2>

          <p className="mt-2 text-sm leading-7 text-amber-800">
            원단과 컬러 정보는 data/materials.json 파일에 저장됩니다.
            이 관리 기능은 로컬에서만 사용할 수 있습니다.
          </p>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold">새 원단 추가</h2>

          <form
            onSubmit={handleCreateMaterial}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label className="block">
              <span className="text-sm font-bold">원단 이름</span>

              <input
                type="text"
                value={newMaterialName}
                onChange={(event) =>
                  setNewMaterialName(event.target.value)
                }
                placeholder="예: 샤무드"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">원단 ID</span>

              <input
                type="text"
                value={newMaterialId}
                onChange={(event) =>
                  setNewMaterialId(event.target.value)
                }
                placeholder="예: shamude"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <p className="mt-2 text-xs text-gray-500">
                영문 소문자, 숫자, 밑줄만 사용하세요.
              </p>
            </label>


<label className="block md:col-span-2">
  <span className="text-sm font-bold">AI 원단 프롬프트</span>

  <textarea
    value={newMaterialPrompt}
    onChange={(event) =>
      setNewMaterialPrompt(event.target.value)
    }
    placeholder="예: Apply a premium boucle upholstery with a soft looped texture..."
    rows={5}
    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
  />
</label>

            <button
              type="submit"
              disabled={creating}
              className="self-end rounded-xl bg-black px-7 py-3 font-bold text-white disabled:opacity-40"
            >
              {creating ? "추가 중..." : "원단 추가"}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">등록된 원단</h2>

              <p className="mt-1 text-sm text-gray-500">
                원본원단과 원본색상은 수정하거나 삭제할 수 없습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMaterials}
              disabled={loading}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold hover:border-black disabled:opacity-40  md:col-span-2"
            >
              {loading ? "조회 중..." : "목록 새로고침"}
            </button>
          </div>

          {loading ? (
            <p className="py-14 text-center text-gray-500">
              원단 목록을 불러오는 중입니다.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {materials.map((material) => {
                const isEditing = editingMaterialId === material.id;

                return (
                  <article
                    key={material.id}
                    className={`rounded-2xl border p-5 ${
                      material.active
                        ? "border-gray-200 bg-white"
                        : "border-gray-300 bg-gray-100 opacity-65"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold">
                            {material.name}
                          </h3>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {material.id}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              material.active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {material.active ? "표시 중" : "숨김"}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-gray-500">
                          선택 가능한 컬러 {material.colors.length}개
                        </p>
                      </div>

                      {!material.locked && (
                        <button
                          type="button"
                          onClick={() => startEditMaterial(material)}
                          className="rounded-xl border border-gray-300 px-5 py-3 font-bold hover:border-black"
                        >
                          원단·컬러 수정
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {material.colors.map((color) => (
                        <span
                          key={`${material.id}-${color.id}`}
                          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        >
                          {color.name}
                        </span>
                      ))}
                    </div>

                    {isEditing && (
                      <div className="mt-6 rounded-2xl border border-gray-300 bg-gray-50 p-5">
                        <h4 className="text-lg font-bold">
                          원단 정보 수정
                        </h4>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="text-sm font-bold">
                              원단 이름
                            </span>

                            <input
                              type="text"
                              value={editName}
                              onChange={(event) =>
                                setEditName(event.target.value)
                              }
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                            />
                          </label>

<label className="block md:col-span-2">
  <span className="text-sm font-bold">AI 원단 프롬프트</span>

  <textarea
    value={editPrompt}
    onChange={(event) =>
      setEditPrompt(event.target.value)
    }
    rows={6}
    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
  />
</label>

                          <label className="flex items-center gap-3 self-end rounded-xl border border-gray-300 bg-white px-4 py-3">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(event) =>
                                setEditActive(event.target.checked)
                              }
                              className="h-5 w-5"
                            />

                            <span className="font-semibold">
                              사용자 화면에 표시
                            </span>
                          </label>
                        </div>

                        <div className="mt-6">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h5 className="font-bold">컬러 목록</h5>

                              <p className="mt-1 text-sm text-gray-500">
                                원본색상은 자동으로 맨 앞에 유지됩니다.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={addColorRow}
                              className="rounded-xl bg-black px-5 py-3 font-bold text-white"
                            >
                              컬러 추가
                            </button>
                          </div>

                          <div className="mt-4 space-y-3">
                            

<div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[0.8fr_1fr_2fr]">
  <input
    type="text"
    value="original"
    disabled
    className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500"
  />

  <input
    type="text"
    value="원본색상"
    disabled
    className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500"
  />

  <textarea
    value={
      material.colors.find(
        (color) => color.id === "original"
      )?.prompt || ""
    }
    disabled
    rows={3}
    className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500"
  />
</div>

                            {editColors.map((color, index) => (
                              <div
                                key={`${editingMaterialId}-${index}`}
                                className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[0.8fr_1fr_2fr_auto]"
                              >
                                <input
                                  type="text"
                                  value={color.id}
                                  onChange={(event) =>
                                    updateColor(
                                      index,
                                      "id",
                                      event.target.value
                                    )
                                  }
                                  placeholder="컬러 ID 예: ivory"
                                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                                />

                                <input
                                  type="text"
                                  value={color.name}
                                  onChange={(event) =>
                                    updateColor(
                                      index,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                  placeholder="컬러 이름 예: 아이보리"
                                  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                                />

<textarea
  value={color.prompt}
  onChange={(event) =>
    updateColor(index, "prompt", event.target.value)
  }
  placeholder="AI 컬러 프롬프트"
  rows={3}
  className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
/>


                                <button
                                  type="button"
                                  onClick={() => removeColor(index)}
                                  className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white"
                                >
                                  삭제
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={handleSaveMaterial}
                            disabled={saving}
                            className="flex-1 rounded-xl bg-black py-4 font-bold text-white disabled:opacity-40"
                          >
                            {saving ? "저장 중..." : "원단 정보 저장"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving}
                            className="flex-1 rounded-xl border border-gray-300 py-4 font-bold"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}