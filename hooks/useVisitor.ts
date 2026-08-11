"use client";

import { useCallback, useEffect, useState } from "react";

const VISITOR_ID_KEY = "khh-ai-room-visitor-id";

export function useVisitor(enabled = true) {
  const [visitorId, setVisitorId] = useState("");

  const [usageCount, setUsageCount] = useState(0);
  const [limit, setLimit] = useState(10);
  const [remain, setRemain] = useState(10);
  const [active, setActive] = useState(true);

  const [visitorLoading, setVisitorLoading] = useState(true);

  const loadVisitor = useCallback(
    async (id?: string) => {
      if (!enabled) {
        setVisitorLoading(false);
        return;
      }

      const targetId = id || visitorId;

      if (!targetId) {
        return;
      }

      try {
        setVisitorLoading(true);

        const response = await fetch("/api/public-room/visitor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId: targetId,
          }),
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          console.error("방문자 정보 조회 실패:", json);
          return;
        }

        setUsageCount(json.usageCount ?? 0);
        setLimit(json.limit ?? 10);
        setRemain(json.remain ?? 10);
        setActive(json.active !== false);
      } catch (error) {
        console.error("방문자 정보 조회 오류:", error);
      } finally {
        setVisitorLoading(false);
      }
    },
    [enabled, visitorId]
  );

  useEffect(() => {
    if (!enabled) {
      setVisitorLoading(false);
      return;
    }

    let id = localStorage.getItem(VISITOR_ID_KEY);

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    setVisitorId(id);

    loadVisitor(id);
  }, [enabled, loadVisitor]);

  return {
    visitorId,
    usageCount,
    limit,
    remain,
    active,
    visitorLoading,

    refreshVisitor: loadVisitor,
  };
}