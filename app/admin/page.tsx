"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function AdminHomePage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
        });

        const json = await res.json();
        setAuthenticated(Boolean(json.authenticated));
      } catch (error) {
        console.error("관리자 세션 확인 오류:", error);
        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, []);

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
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-5 rounded-2xl bg-black p-7 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm tracking-[0.25em] text-gray-300">
              KHOUSEHOLD
            </p>

            <h1 className="mt-2 text-3xl font-bold">AI ROOM 관리자</h1>

            <p className="mt-2 text-sm text-gray-300">
              회원과 소파 정보를 관리합니다.
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

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/members"
            className="rounded-2xl bg-white p-7 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold text-gray-500">MEMBERS</p>
            <h2 className="mt-3 text-2xl font-bold">회원 관리</h2>
            <p className="mt-3 leading-7 text-gray-600">
              회원 검색, 남은 AI 생성 횟수 확인 및 수정
            </p>
          </Link>

          <Link
            href="/admin/sofas"
            className="rounded-2xl bg-white p-7 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold text-gray-500">SOFAS</p>
            <h2 className="mt-3 text-2xl font-bold">소파 관리</h2>
            <p className="mt-3 leading-7 text-gray-600">
              로컬 이미지 선택, 제품 정보 입력 및 소파 등록
            </p>
          </Link>

<Link
  href="/admin/materials"
  className="rounded-2xl bg-white p-7 shadow transition hover:-translate-y-1 hover:shadow-lg"
>
  <p className="text-sm font-semibold text-gray-500">MATERIALS</p>
  <h2 className="mt-3 text-2xl font-bold">원단 관리</h2>
  <p className="mt-3 leading-7 text-gray-600">
    원단 종류와 원단별 선택 가능한 컬러를 관리합니다.
  </p>
</Link>


          <div className="rounded-2xl bg-white p-7 opacity-60 shadow">
            <p className="text-sm font-semibold text-gray-500">HISTORY</p>
            <h2 className="mt-3 text-2xl font-bold">생성 이력</h2>
            <p className="mt-3 leading-7 text-gray-600">
              추후 회원별 AI 이미지 생성 이력을 확인합니다.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-bold text-amber-900">소파 관리 안내</h2>

          <p className="mt-2 text-sm leading-7 text-amber-800">
            소파 등록과 JSON 파일 수정은 로컬 관리자 화면에서만
            가능합니다. 로컬에서 등록한 뒤 GitHub에 업데이트하면
            온라인 서비스에 반영됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}