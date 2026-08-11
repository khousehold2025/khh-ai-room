"use client";

import { useEffect, useState } from "react";

type Generation = {
  id: string;
  visitorId: string;
  sofaId: string;
  material: string;
  color: string;
  lighting: string;
  roomType: string;
  success: boolean;
  createdAt: string | null;
};

type Visitor = {
  id: string;
  visitorId: string;
  usageCount: number;
  limit: number;
  remain: number;
  active: boolean;
  createdAt: string | null;
  lastVisitAt: string | null;
  lastUsedAt: string | null;
};

export default function AdminHistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
const [checking, setChecking] = useState(true);
const [authenticated, setAuthenticated] = useState(false);

const [visitors, setVisitors] = useState<Visitor[]>([]);

useEffect(() => {
  const load = async () => {
    try {
      // 1. 관리자 로그인 상태 확인
      const sessionResponse = await fetch("/api/admin/session", {
        cache: "no-store",
      });

      const sessionJson = await sessionResponse.json();

      if (!sessionJson.authenticated) {
        setAuthenticated(false);
        setChecking(false);
        return;
      }

      setAuthenticated(true);

      // 2. 생성 이력 조회
      const response = await fetch("/api/admin/generations", {
        cache: "no-store",
      });

      const json = await response.json();

      if (json.success) {
        setGenerations(json.generations || []);
      }

      // 3. 공개 방문자 정보 조회
      const visitorResponse = await fetch("/api/admin/visitors", {
        cache: "no-store",
      });

      const visitorJson = await visitorResponse.json();

      if (visitorJson.success) {
        setVisitors(visitorJson.visitors || []);
      }
    } catch (error) {
      console.error("관리자 데이터 조회 오류:", error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  load();
}, []);

  const uniqueVisitors = new Set(
    generations.map((item) => item.visitorId)
  ).size;

// ★ 여기에 추가
const handleVisitorAction = async (
  visitorId: string,
  action: "reset" | "block" | "unblock"
) => {
  try {
    const response = await fetch("/api/admin/visitors/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId,
        action,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      alert(json.message || "처리하지 못했습니다.");
      return;
    }

    alert(json.message);

    // 처리 후 방문자 목록 다시 불러오기
    const visitorResponse = await fetch("/api/admin/visitors", {
      cache: "no-store",
    });

    const visitorJson = await visitorResponse.json();

    if (visitorJson.success) {
      setVisitors(visitorJson.visitors || []);
    }
  } catch (error) {
    console.error("방문자 관리 오류:", error);
    alert("방문자 관리 중 오류가 발생했습니다.");
  }
};

if (checking) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <p className="text-gray-500">
        관리자 인증 확인 중...
      </p>
    </main>
  );
}

if (!authenticated) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold">
          관리자 인증이 필요합니다.
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          생성 이력은 관리자만 확인할 수 있습니다.
        </p>

        <a
          href="/admin"
          className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-semibold text-white"
        >
          관리자 로그인
        </a>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-black p-8 text-white shadow">
          <p className="text-sm tracking-[0.3em] text-gray-300">
            KHOUSEHOLD
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            AI 생성 이력
          </h1>

          <p className="mt-3 text-gray-300">
            공개 AI Room의 이용 현황을 확인합니다.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              전체 AI 생성
            </p>

            <p className="mt-2 text-3xl font-bold">
              {generations.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              방문자 수
            </p>

            <p className="mt-2 text-3xl font-bold">
              {uniqueVisitors}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">
              생성 성공
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                generations.filter(
                  (item) => item.success
                ).length
              }
            </p>
          </div>
        </div>


<div className="mt-8 rounded-xl bg-white p-6 shadow">
  <h2 className="mb-5 text-xl font-bold">
    방문자 관리
  </h2>

  {visitors.length === 0 ? (
    <p className="text-gray-500">
      방문자 정보가 없습니다.
    </p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-3 py-3">방문자</th>
            <th className="px-3 py-3">사용</th>
            <th className="px-3 py-3">남음</th>
            <th className="px-3 py-3">상태</th>
            <th className="px-3 py-3">관리</th>
          </tr>
        </thead>

        <tbody>
          {visitors.map((visitor) => (
            <tr
              key={visitor.id}
              className="border-b"
            >
              <td className="px-3 py-3">
                {visitor.visitorId.slice(0, 8)}...
              </td>

              <td className="px-3 py-3">
                {visitor.usageCount} / {visitor.limit}
              </td>

              <td className="px-3 py-3">
                {visitor.remain}
              </td>

              <td className="px-3 py-3">
                {visitor.active ? "정상" : "차단"}
              </td>

              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleVisitorAction(
                        visitor.visitorId,
                        "reset"
                      )
                    }
                    className="rounded-lg border px-3 py-2 hover:bg-gray-100"
                  >
                    초기화
                  </button>

                  {visitor.active ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleVisitorAction(
                          visitor.visitorId,
                          "block"
                        )
                      }
                      className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    >
                      차단
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleVisitorAction(
                          visitor.visitorId,
                          "unblock"
                        )
                      }
                      className="rounded-lg bg-black px-3 py-2 text-white hover:bg-gray-800"
                    >
                      차단 해제
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-bold">
            최근 생성 내역
          </h2>

          {loading ? (
            <p className="text-gray-500">
              불러오는 중...
            </p>
          ) : generations.length === 0 ? (
            <p className="text-gray-500">
              생성 이력이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-3">생성일시</th>
                    <th className="px-3 py-3">방문자</th>
                    <th className="px-3 py-3">소파</th>
                    <th className="px-3 py-3">원단</th>
                    <th className="px-3 py-3">컬러</th>
                    <th className="px-3 py-3">조명</th>
                    <th className="px-3 py-3">공간</th>
                  </tr>
                </thead>

                <tbody>
                  {generations.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b"
                    >
                      <td className="px-3 py-3">
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleString("ko-KR")
                          : "-"}
                      </td>

                      <td className="px-3 py-3">
                        {item.visitorId.slice(0, 8)}...
                      </td>

                      <td className="px-3 py-3">
                        {item.sofaId}
                      </td>

                      <td className="px-3 py-3">
                        {item.material}
                      </td>

                      <td className="px-3 py-3">
                        {item.color}
                      </td>

                      <td className="px-3 py-3">
                        {item.lighting}
                      </td>

                      <td className="px-3 py-3">
                        {item.roomType === "with-sofa"
                          ? "기존 소파 있음"
                          : "소파 없음"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}