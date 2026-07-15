"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SofaImage = {
  fileName: string;
  imageUrl: string;
  sizeBytes: number;
  modifiedAt: string;
};

type SofaForm = {
  name: string;
  size: string;
  color: string;
  width: string;
  depth: string;
  height: string;
  fileName: string;
};

type RegisteredSofa = {
  id: string;
  name: string;
  size: string;
  color: string;
  width: number;
  depth: number;
  height: number;
  image: string;
  active: boolean;
};

const initialForm: SofaForm = {
  name: "",
  size: "",
  color: "",
  width: "",
  depth: "",
  height: "",
  fileName: "",
};

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "-";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminSofasPage() {

const [editingSofaId, setEditingSofaId] = useState<string | null>(null);

const [editForm, setEditForm] = useState({
  name: "",
  size: "",
  color: "",
  width: "",
  depth: "",
  height: "",
  image: "",
});


const handleStartEdit = (sofa: RegisteredSofa) => {
  setEditingSofaId(sofa.id);

  setEditForm({
    name: sofa.name,
    size: sofa.size,
    color: sofa.color,
    width: String(sofa.width),
    depth: String(sofa.depth),
    height: String(sofa.height),
    image: sofa.image,
  });
};



const handleCancelEdit = () => {
  setEditingSofaId(null);

  setEditForm({
    name: "",
    size: "",
    color: "",
    width: "",
    depth: "",
    height: "",
    image: "",
  });
};


const handleSaveEdit = async (sofa: RegisteredSofa) => {
  const width = Number(editForm.width);
  const depth = Number(editForm.depth);
  const height = Number(editForm.height);

  if (
    !editForm.name.trim() ||
    !editForm.size.trim() ||
    !editForm.color.trim() ||
    !editForm.image.trim()
  ) {
    alert("품명, 사이즈, 컬러, 이미지를 모두 입력해 주세요.");
    return;
  }

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(depth) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    depth <= 0 ||
    height <= 0
  ) {
    alert("가로, 깊이, 높이는 0보다 큰 숫자로 입력해 주세요.");
    return;
  }

  try {
    setSavingEdit(true);

    const response = await fetch("/api/admin/local-sofas/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: sofa.id,
        name: editForm.name.trim(),
        size: editForm.size.trim(),
        color: editForm.color.trim(),
        width,
        depth,
        height,
        image: editForm.image.trim(),
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      alert(json.message || "소파 정보 수정에 실패했습니다.");
      return;
    }

    setRegisteredSofas((previous) =>
      previous.map((item) =>
        item.id === sofa.id
          ? {
              ...item,
              ...json.sofa,
            }
          : item
      )
    );

    handleCancelEdit();
    alert(json.message || "소파 정보를 수정했습니다.");
  } catch (error) {
    console.error(error);
    alert("소파 정보 수정 중 오류가 발생했습니다.");
  } finally {
    setSavingEdit(false);
  }
};


const [savingEdit, setSavingEdit] = useState(false);

const [draggedSofaId, setDraggedSofaId] = useState<string | null>(null);
const [savingOrder, setSavingOrder] = useState(false);

const [registeredSofas, setRegisteredSofas] = useState<RegisteredSofa[]>([]);
const [sofasLoading, setSofasLoading] = useState(false);
const [changingSofaId, setChangingSofaId] = useState<string | null>(null);

  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const [images, setImages] = useState<SofaImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const [form, setForm] = useState<SofaForm>(initialForm);
  const [registering, setRegistering] = useState(false);
  const [searchText, setSearchText] = useState("");


const handleDragStart = (sofaId: string) => {
  setDraggedSofaId(sofaId);
};


const handleDrop = (targetSofaId: string) => {
  if (!draggedSofaId || draggedSofaId === targetSofaId) {
    setDraggedSofaId(null);
    return;
  }

  setRegisteredSofas((previous) => {
    const next = [...previous];

    const draggedIndex = next.findIndex(
      (sofa) => sofa.id === draggedSofaId
    );

    const targetIndex = next.findIndex(
      (sofa) => sofa.id === targetSofaId
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      return previous;
    }

    const [draggedItem] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, draggedItem);

    return next;
  });

  setDraggedSofaId(null);
};

const handleSaveOrder = async () => {
  try {
    setSavingOrder(true);

    const response = await fetch("/api/admin/local-sofas/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderedIds: registeredSofas.map((sofa) => sofa.id),
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      alert(json.message || "소파 순서 저장에 실패했습니다.");
      return;
    }

    alert("소파 표시 순서를 저장했습니다.");
  } catch (error) {
    console.error(error);
    alert("소파 순서 저장 중 오류가 발생했습니다.");
  } finally {
    setSavingOrder(false);
  }
};


const handleToggleSofa = async (sofa: RegisteredSofa) => {
  try {
    setChangingSofaId(sofa.id);

    const response = await fetch("/api/admin/local-sofas/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: sofa.id,
        active: !sofa.active,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      alert(json.message || "소파 상태 변경에 실패했습니다.");
      return;
    }

    setRegisteredSofas((previous) =>
      previous.map((item) =>
        item.id === sofa.id
          ? {
              ...item,
              active: !item.active,
            }
          : item
      )
    );

    alert(json.message);
  } catch (error) {
    console.error(error);
    alert("소파 표시 상태 변경 중 오류가 발생했습니다.");
  } finally {
    setChangingSofaId(null);
  }
};

const loadRegisteredSofas = async () => {
  try {
    setSofasLoading(true);

    const response = await fetch("/api/admin/local-sofas/list", {
      cache: "no-store",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      alert(json.message || "등록된 소파 목록을 불러오지 못했습니다.");
      return;
    }

    setRegisteredSofas(json.sofas || []);
  } catch (error) {
    console.error(error);
    alert("등록된 소파 목록 조회 중 오류가 발생했습니다.");
  } finally {
    setSofasLoading(false);
  }
};


  const selectedImage = useMemo(
    () => images.find((image) => image.fileName === form.fileName) || null,
    [images, form.fileName]
  );

  const filteredImages = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return images;
    }

    return images.filter((image) =>
      image.fileName.toLowerCase().includes(keyword)
    );
  }, [images, searchText]);

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
          await loadImages();
await loadRegisteredSofas();
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

  const loadImages = async () => {
    try {
      setImagesLoading(true);

      const response = await fetch("/api/admin/local-sofas/images", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let json: any;

      try {
        json = JSON.parse(text);
      } catch {
        console.error("이미지 목록 API 응답:", text);
        alert("소파 이미지 목록 API가 올바른 JSON을 반환하지 않았습니다.");
        return;
      }

      if (!response.ok || !json.success) {
        alert(json.message || "소파 이미지 목록을 불러오지 못했습니다.");
        return;
      }

      setImages(json.images || []);
    } catch (error) {
      console.error("소파 이미지 목록 조회 오류:", error);
      alert("소파 이미지 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setImagesLoading(false);
    }
  };

  const updateForm = (key: keyof SofaForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const selectImage = (image: SofaImage) => {
    setForm((previous) => ({
      ...previous,
      fileName: image.fileName,
    }));
  };

  const validateForm = () => {
    if (!form.fileName) {
      alert("소파 이미지를 선택해 주세요.");
      return false;
    }

    if (!form.name.trim()) {
      alert("품명을 입력해 주세요.");
      return false;
    }

    if (!form.size.trim()) {
      alert("사이즈를 입력해 주세요.");
      return false;
    }

    if (!form.color.trim()) {
      alert("컬러를 입력해 주세요.");
      return false;
    }

    const width = Number(form.width);
    const depth = Number(form.depth);
    const height = Number(form.height);

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(depth) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      depth <= 0 ||
      height <= 0
    ) {
      alert("가로, 깊이, 높이는 0보다 큰 숫자로 입력해 주세요.");
      return false;
    }

    return true;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setRegistering(true);

      const response = await fetch("/api/admin/local-sofas/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          size: form.size.trim(),
          color: form.color.trim(),
          width: Number(form.width),
          depth: Number(form.depth),
          height: Number(form.height),
          fileName: form.fileName,
        }),
      });

      const text = await response.text();

      let json: any;

      try {
        json = JSON.parse(text);
      } catch {
        console.error("소파 등록 API 응답:", text);
        alert("소파 등록 API가 올바른 JSON을 반환하지 않았습니다.");
        return;
      }

      if (!response.ok || !json.success) {
        alert(json.message || "소파 등록에 실패했습니다.");
        return;
      }

      alert(json.message || "소파를 등록했습니다.");

      setForm(initialForm);
      setSearchText("");
    } catch (error) {
      console.error("소파 등록 오류:", error);
      alert("소파 등록 중 오류가 발생했습니다.");
    } finally {
      setRegistering(false);
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
            관리자 메인에서 로그인한 뒤 소파 관리 페이지를 이용해 주세요.
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

              <h1 className="mt-2 text-3xl font-bold">소파 관리</h1>

              <p className="mt-2 text-sm text-gray-300">
                로컬 이미지 폴더에서 파일을 선택하고 소파 정보를 등록합니다.
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
            이 페이지의 소파 등록 기능은
            {" "}
            <strong>http://localhost:3000/admin/sofas</strong>
            {" "}
            에서만 사용할 수 있습니다. 등록 후 GitHub에 업데이트하면
            온라인 서비스에 반영됩니다.
          </p>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl bg-white p-6 shadow">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">이미지 선택</h2>

                <p className="mt-1 text-sm text-gray-500">
                  public/sofas 폴더 안의 이미지가 표시됩니다.
                </p>
              </div>

              <button
                type="button"
                onClick={loadImages}
                disabled={imagesLoading}
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold hover:border-black disabled:opacity-40"
              >
                {imagesLoading ? "불러오는 중..." : "이미지 새로고침"}
              </button>
            </div>

            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="파일명 검색"
              className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            {imagesLoading ? (
              <p className="py-16 text-center text-gray-500">
                이미지 목록을 불러오는 중입니다.
              </p>
            ) : filteredImages.length === 0 ? (
              <p className="py-16 text-center text-gray-500">
                표시할 이미지가 없습니다.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredImages.map((image) => {
                  const isSelected = form.fileName === image.fileName;

                  return (
                    <button
                      key={image.fileName}
                      type="button"
                      onClick={() => selectImage(image)}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        isSelected
                          ? "border-black ring-2 ring-black"
                          : "border-gray-200 hover:border-gray-500"
                      }`}
                    >
                      <div className="flex h-44 items-center justify-center bg-gray-50 p-3">
                        <img
                          src={image.imageUrl}
                          alt={image.fileName}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="border-t border-gray-200 p-4">
                        <p className="break-all text-sm font-bold">
                          {image.fileName}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          {formatFileSize(image.sizeBytes)}
                        </p>

                        {isSelected && (
                          <p className="mt-2 text-sm font-bold text-black">
                            선택됨
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-2xl font-bold">소파 정보 입력</h2>

            <p className="mt-2 text-sm leading-7 text-gray-500">
              모든 치수는 밀리미터(mm) 단위로 입력합니다.
            </p>

            {selectedImage ? (
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex h-48 items-center justify-center">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.fileName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <p className="mt-3 break-all text-center text-sm font-bold">
                  {selectedImage.fileName}
                </p>
              </div>
            ) : (
              <div className="mt-5 flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                이미지를 먼저 선택하세요.
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-bold">품명</span>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="예: 멕소"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold">사이즈</span>

                <input
                  type="text"
                  value={form.size}
                  onChange={(event) => updateForm("size", event.target.value)}
                  placeholder="예: 4인용"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold">컬러</span>

                <input
                  type="text"
                  value={form.color}
                  onChange={(event) => updateForm("color", event.target.value)}
                  placeholder="예: 코냑"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-bold">가로</span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.width}
                    onChange={(event) =>
                      updateForm("width", event.target.value)
                    }
                    placeholder="2850"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">깊이</span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.depth}
                    onChange={(event) =>
                      updateForm("depth", event.target.value)
                    }
                    placeholder="950"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">높이</span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.height}
                    onChange={(event) =>
                      updateForm("height", event.target.value)
                    }
                    placeholder="920"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={registering || !selectedImage}
                className="w-full rounded-xl bg-black py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {registering ? "소파 등록 중..." : "소파 등록"}
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">등록 후 온라인 업데이트</h2>

          <p className="mt-2 text-sm leading-7 text-gray-500">
            등록이 완료되면 data/sofas.json이 자동으로 수정됩니다.
            새 이미지와 JSON 파일을 GitHub에 올리면 Vercel이 자동 배포합니다.
          </p>

          <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-950 p-5 text-sm leading-7 text-gray-100">
{`git add data/sofas.json public/sofas/
git commit -m "Add new sofa models"
git push`}
          </pre>
        </section>


<section className="mt-8 rounded-2xl bg-white p-6 shadow">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-bold">등록된 소파</h2>




<button
  type="button"
  onClick={handleSaveOrder}
  disabled={savingOrder}
  className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-40"
>
  {savingOrder ? "순서 저장 중..." : "변경된 순서 저장"}
</button>

      <p className="mt-1 text-sm text-gray-500">
        파일과 JSON 항목은 삭제하지 않고 화면 표시 여부만 변경합니다.
      </p>
    </div>

    <button
      type="button"
      onClick={loadRegisteredSofas}
      disabled={sofasLoading}
      className="rounded-xl border border-gray-300 px-5 py-3 font-semibold"
    >
      {sofasLoading ? "조회 중..." : "목록 새로고침"}
    </button>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {registeredSofas.map((sofa) => (
      <article
        key={sofa.id}
  draggable
  onDragStart={() => handleDragStart(sofa.id)}
  onDragOver={(event) => event.preventDefault()}
  onDrop={() => handleDrop(sofa.id)}

        className={`rounded-2xl border p-4 ${
          sofa.active
            ? "border-gray-200 bg-white"
            : "border-gray-300 bg-gray-100 opacity-60"
        }`}
      >
        <div className="flex h-44 items-center justify-center rounded-xl bg-gray-50">
          <img
            src={sofa.image}
            alt={sofa.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <h3 className="mt-4 text-lg font-bold">
          {sofa.name} {sofa.size}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {sofa.color} · {sofa.width} × {sofa.depth} × {sofa.height}mm
        </p>

        <p className="mt-2 text-sm font-semibold">
          현재 상태: {sofa.active ? "화면에 표시 중" : "숨김"}
        </p>

        <button
          type="button"
          onClick={() => handleToggleSofa(sofa)}
          disabled={changingSofaId === sofa.id}
          className={`mt-4 w-full rounded-xl py-3 font-bold text-white ${
            sofa.active ? "bg-red-600" : "bg-black"
          } disabled:opacity-40`}
        >
          {changingSofaId === sofa.id
            ? "처리 중..."
            : sofa.active
            ? "화면에서 숨기기"
            : "다시 표시하기"}
        </button>



{editingSofaId === sofa.id && (
  <div className="mt-4 rounded-xl border border-gray-300 bg-white p-4">
    <h4 className="font-bold">소파 정보 수정</h4>

    <div className="mt-4 space-y-3">
      <input
        type="text"
        value={editForm.name}
        onChange={(event) =>
          setEditForm((previous) => ({
            ...previous,
            name: event.target.value,
          }))
        }
        placeholder="품명"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        type="text"
        value={editForm.size}
        onChange={(event) =>
          setEditForm((previous) => ({
            ...previous,
            size: event.target.value,
          }))
        }
        placeholder="사이즈"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        type="text"
        value={editForm.color}
        onChange={(event) =>
          setEditForm((previous) => ({
            ...previous,
            color: event.target.value,
          }))
        }
        placeholder="컬러"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          min="1"
          value={editForm.width}
          onChange={(event) =>
            setEditForm((previous) => ({
              ...previous,
              width: event.target.value,
            }))
          }
          placeholder="가로"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />

        <input
          type="number"
          min="1"
          value={editForm.depth}
          onChange={(event) =>
            setEditForm((previous) => ({
              ...previous,
              depth: event.target.value,
            }))
          }
          placeholder="깊이"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />

        <input
          type="number"
          min="1"
          value={editForm.height}
          onChange={(event) =>
            setEditForm((previous) => ({
              ...previous,
              height: event.target.value,
            }))
          }
          placeholder="높이"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <input
        type="text"
        value={editForm.image}
        onChange={(event) =>
          setEditForm((previous) => ({
            ...previous,
            image: event.target.value,
          }))
        }
        placeholder="/sofas/파일명.png"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
    </div>

    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => handleSaveEdit(sofa)}
        disabled={savingEdit}
        className="flex-1 rounded-lg bg-black py-3 font-bold text-white disabled:opacity-40"
      >
        {savingEdit ? "저장 중..." : "수정 저장"}
      </button>

      <button
        type="button"
        onClick={handleCancelEdit}
        disabled={savingEdit}
        className="flex-1 rounded-lg border border-gray-300 py-3 font-bold"
      >
        취소
      </button>
    </div>
  </div>
)}




<button
  type="button"
  onClick={() => handleStartEdit(sofa)}
  className="mt-3 w-full rounded-xl border border-gray-300 py-3 font-bold hover:border-black"
>
  정보 수정
</button>


      </article>
    ))}
  </div>
</section>


      </div>
    </main>
  );
}