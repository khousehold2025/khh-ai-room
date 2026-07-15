"use client";

import { FormEvent, useEffect, useState } from "react";

type MemberItem = {
  memberId: string;
  memberName: string;
  remain: number;
  total: number;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [remainInputs, setRemainInputs] = useState<Record<string, string>>({});
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
        });

        const json = await res.json();
        const isAuthenticated = Boolean(json.authenticated);

        setAuthenticated(isAuthenticated);

        if (isAuthenticated) {
          await loadMembers("");
        }
      } catch (error) {
        console.error("관리자 세션 확인 오류:", error);
        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, []);

  const loadMembers = async (searchQuery: string) => {
    try {
      setMembersLoading(true);

      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }

      const url = params.toString()
        ? `/api/admin/members?${params.toString()}`
        : "/api/admin/members";

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || "회원 목록을 불러오지 못했습니다.");
        return;
      }

      const loadedMembers: MemberItem[] = json.members || [];

      setMembers(loadedMembers);

      const nextInputs: Record<string, string> = {};

      loadedMembers.forEach((member) => {
        nextInputs[member.memberId] = String(member.remain);
      });

      setRemainInputs(nextInputs);

      if (
        selectedMemberId &&
        !loadedMembers.some((member) => member.memberId === selectedMemberId)
      ) {
        setSelectedMemberId(null);
      }
    } catch (error) {
      console.error("회원 목록 조회 오류:", error);
      alert("회원 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password.trim()) {
      alert("관리자 비밀번호를 입력하세요.");
      return;
    }

    try {
      setLoginLoading(true);

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || "관리자 로그인에 실패했습니다.");
        return;
      }

      setAuthenticated(true);
      setPassword("");
      await loadMembers("");
    } catch (error) {
      console.error("관리자 로그인 오류:", error);
      alert("관리자 로그인 중 오류가 발생했습니다.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      setAuthenticated(false);
      setMembers([]);
      setQuery("");
      setSelectedMemberId(null);
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadMembers(query);
  };

  const handleShowRecent = async () => {
    setQuery("");
    setSelectedMemberId(null);
    await loadMembers("");
  };

  const handleRemainInput = (memberId: string, value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setRemainInputs((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const handleUpdateRemain = async (member: MemberItem) => {
    const rawValue = remainInputs[member.memberId] ?? "";
    const remain = Number(rawValue);

    if (!Number.isInteger(remain) || remain < 0 || remain > 9999) {
      alert("남은 횟수는 0~9999 사이의 정수로 입력해 주세요.");
      return;
    }

    try {
      setSavingMemberId(member.memberId);

      const res = await fetch("/api/admin/member/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: member.memberId,
          remain,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || "남은 횟수 수정에 실패했습니다.");
        return;
      }

      setMembers((prev) =>
        prev.map((item) =>
          item.memberId === member.memberId
            ? {
                ...item,
                remain: json.member.remain,
                total: json.member.total,
                active: json.member.active,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      setRemainInputs((prev) => ({
        ...prev,
        [member.memberId]: String(json.member.remain),
      }));

      alert(json.message || "남은 횟수를 수정했습니다.");
    } catch (error) {
      console.error("회원 횟수 수정 오류:", error);
      alert("회원 횟수 수정 중 오류가 발생했습니다.");
    } finally {
      setSavingMemberId(null);
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
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow"
        >
          <p className="text-sm tracking-[0.25em] text-gray-500">
            KHOUSEHOLD
          </p>

          <h1 className="mt-3 text-3xl font-bold">AI ROOM 관리자</h1>

          <p className="mt-2 text-sm text-gray-500">
            관리자 비밀번호를 입력해 주세요.
          </p>

          <label className="mt-8 block">
            <span className="text-sm font-semibold">관리자 비밀번호</span>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>

          <button
            type="submit"
            disabled={loginLoading}
            className="mt-6 w-full rounded-xl bg-black py-4 font-bold text-white disabled:opacity-40"
          >
            {loginLoading ? "로그인 중..." : "관리자 로그인"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-5 rounded-2xl bg-black p-7 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm tracking-[0.25em] text-gray-300">
              KHOUSEHOLD
            </p>
            <h1 className="mt-2 text-3xl font-bold">AI ROOM 관리자</h1>
            <p className="mt-2 text-sm text-gray-300">
              회원별 AI 이미지 생성 가능 횟수를 관리합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/40 px-4 py-2 text-sm hover:bg-white hover:text-black"
          >
            로그아웃
          </button>
        </header>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">회원 검색</h2>

          <p className="mt-2 text-sm text-gray-500">
            회원번호 또는 회원 이름을 입력하세요. 이름 검색은 정확히 일치해야
            합니다.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-5 flex flex-col gap-3 md:flex-row"
          >
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="회원번호 또는 회원 이름"
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <button
              type="submit"
              disabled={membersLoading}
              className="rounded-xl bg-black px-7 py-3 font-semibold text-white disabled:opacity-40"
            >
              {membersLoading ? "조회 중..." : "검색"}
            </button>

            <button
              type="button"
              onClick={handleShowRecent}
              disabled={membersLoading}
              className="rounded-xl border border-gray-300 px-7 py-3 font-semibold hover:border-black disabled:opacity-40"
            >
              최근 회원
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                {query.trim() ? "검색 결과" : "최근 수정 회원"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                최대 20명의 회원을 표시합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadMembers(query)}
              disabled={membersLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-black disabled:opacity-40"
            >
              새로고침
            </button>
          </div>

          {membersLoading ? (
            <p className="py-12 text-center text-gray-500">
              회원 정보를 불러오는 중입니다.
            </p>
          ) : members.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              표시할 회원이 없습니다.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {members.map((member) => {
                const isSelected = selectedMemberId === member.memberId;
                const isSaving = savingMemberId === member.memberId;

                return (
                  <article
                    key={member.memberId}
                    className={`rounded-2xl border p-5 transition ${
                      isSelected
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMemberId(
                          isSelected ? null : member.memberId
                        )
                      }
                      className="flex w-full flex-col gap-4 text-left md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">
                            {member.memberName}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              member.active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {member.active ? "활성" : "비활성"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          회원번호: {member.memberId}
                        </p>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="text-left md:text-right">
                          <p className="text-sm text-gray-500">남은 횟수</p>
                          <p className="text-2xl font-bold">
                            {member.remain} / {member.total}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-gray-500">
                          {isSelected ? "닫기" : "관리"}
                        </span>
                      </div>
                    </button>

                    {isSelected && (
                      <div className="mt-5 border-t border-gray-200 pt-5">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl bg-white p-4">
                            <p className="text-sm text-gray-500">생성일</p>
                            <p className="mt-1 font-semibold">
                              {formatDate(member.createdAt)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white p-4">
                            <p className="text-sm text-gray-500">최근 수정일</p>
                            <p className="mt-1 font-semibold">
                              {formatDate(member.updatedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-white p-5">
                          <label className="block">
                            <span className="text-sm font-bold">
                              남은 AI 이미지 생성 횟수
                            </span>

                            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                              <input
                                type="number"
                                min="0"
                                max="9999"
                                step="1"
                                value={remainInputs[member.memberId] ?? ""}
                                onChange={(event) =>
                                  handleRemainInput(
                                    member.memberId,
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-bold outline-none focus:border-black sm:max-w-xs"
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdateRemain(member)}
                                disabled={isSaving}
                                className="rounded-xl bg-black px-7 py-3 font-bold text-white disabled:opacity-40"
                              >
                                {isSaving ? "저장 중..." : "횟수 저장"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setRemainInputs((prev) => ({
                                    ...prev,
                                    [member.memberId]: "5",
                                  }))
                                }
                                disabled={isSaving}
                                className="rounded-xl border border-gray-300 px-7 py-3 font-semibold hover:border-black disabled:opacity-40"
                              >
                                5회 입력
                              </button>
                            </div>
                          </label>

                          <p className="mt-3 text-sm leading-6 text-gray-500">
                            입력한 값으로 회원의 남은 횟수가 변경됩니다. 기존
                            총 횟수보다 큰 값을 입력하면 총 횟수도 함께
                            증가합니다.
                          </p>
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