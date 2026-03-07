"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ForgeViewer } from "../presentation/components/ForgeViewer";
import { IssuePanel } from "../presentation/components/IssuePanel";

interface ApiIssue {
  id: string; title: string; status: string; viewerState?: string;
  pin?: { x: number; y: number; z: number; viewerState?: string };
  pinX?: number; pinY?: number; pinZ?: number;
}
interface PinData { id: string; x: number; y: number; z: number; color?: string; label?: string; }

export default function HomePage() {
  const navigateRef = useRef<((x: number, y: number, z: number, vs?: string) => void) | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number; z: number } | null>(null);
  const [issues, setIssues] = useState<ApiIssue[]>([]);

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch("/api/issues", { cache: "no-store" });
      if (res.ok) setIssues(await res.json());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchIssues();
    const timer = setInterval(fetchIssues, 5000);
    return () => clearInterval(timer);
  }, [fetchIssues]);

  const handleNavigate = useCallback(
    (pin: { x: number; y: number; z: number; viewerState?: string }) => {
      navigateRef.current?.(pin.x, pin.y, pin.z, pin.viewerState);
    }, []
  );

  const savedPins: PinData[] = issues.map((i) => {
    const x = i.pin?.x ?? i.pinX;
    const y = i.pin?.y ?? i.pinY;
    const z = i.pin?.z ?? i.pinZ;
    if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") return null;
    return {
      id: i.id, x, y, z,
      color: i.status === "Resolved" || i.status === "Closed" ? "#10b981"
           : i.status === "InProgress" ? "#f59e0b" : "#ef4444",
      label: i.title,
    };
  }).filter((v): v is PinData => v !== null);

  const allPins: PinData[] = [
    ...savedPins,
    ...(pendingPin ? [{ id: "__pending", x: pendingPin.x, y: pendingPin.y, z: pendingPin.z, color: "#f59e0b", label: "新規" }] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <aside className="w-96 flex-shrink-0 border-r border-slate-200 shadow-lg z-10 flex flex-col bg-white">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 flex-shrink-0">
          <h1 className="text-lg font-bold text-slate-800">施工指摘管理</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <IssuePanel
            onNavigate={handleNavigate}
            onIssueCreated={() => { setPendingPin(null); fetchIssues(); }}
            pendingPin={pendingPin}
            onClearPendingPin={() => setPendingPin(null)}
          />
        </div>
      </aside>
      <main className="flex-1 relative bg-slate-900">
        <ForgeViewer
          urn="dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6cHJvamVjdC1idWNrZXQvc2FtcGxlX21lcC5ydnQ"
          pins={allPins}
          onViewerClick={(p) => setPendingPin(p)}
          onNavigateReady={(fn) => { navigateRef.current = fn; }}
        />
      </main>
    </div>
  );
}
