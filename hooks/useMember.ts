"use client";

import { useEffect, useState } from "react";

type MemberInfo = {
  memberId: string;
  memberName: string;
  remain: number;
  total: number;
  active: boolean;
};

export function useMember(isMemberMode: boolean) {
  const [memberId] = useState("test-member-001");
  const [memberName, setMemberName] = useState("테스트회원");
  const [remain, setRemain] = useState(5);
  const [total, setTotal] = useState(5);
  const [active, setActive] = useState(true);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    if (!isMemberMode) return;

    const loadMemberStatus = async () => {
      try {
        setMemberLoading(true);

        const res = await fetch("/api/member/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId,
            memberName,
          }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          alert(json.message || "회원 정보를 불러오지 못했습니다.");
          return;
        }

        const member: MemberInfo = json.member;

        setMemberName(member.memberName || "회원");
        setRemain(member.remain ?? 5);
        setTotal(member.total ?? 5);
        setActive(member.active ?? true);
      } catch (error) {
        console.error(error);
        alert("회원 정보 조회 중 오류가 발생했습니다.");
      } finally {
        setMemberLoading(false);
      }
    };

    loadMemberStatus();
  }, [isMemberMode, memberId]);

 const decreaseRemain = async () => {
  const res = await fetch("/api/member/decrease", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memberId,
    }),
  });

  const text = await res.text();

let json;
try {
  json = JSON.parse(text);
} catch {
  console.error("API가 JSON이 아닌 응답을 반환했습니다:", text);
  alert("회원 정보 API 오류가 발생했습니다. CMD 서버 로그를 확인하세요.");
  return;
}

  if (!res.ok || !json.success) {
    throw new Error(json.message || "생성 횟수 차감에 실패했습니다.");
  }

  setRemain(json.remain ?? 0);
  setTotal(json.total ?? 5);

  return {
    remain: json.remain,
    total: json.total,
  };
};

  return {
    memberId,
    memberName,
    remain,
    total,
    active,
    memberLoading,
    setRemain,
    setTotal,
   decreaseRemain,
  };
}