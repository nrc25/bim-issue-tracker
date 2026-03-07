"use client";

import { useState, useEffect, useCallback } from "react";

interface IssueDto {
  id: string;
  title: string;
  description: string;
  status: string;
  pin?: { x: number; y: number; z: number; viewerState?: string };
  pinX?: number;
  pinY?: number;
  pinZ?: number;
  viewerState?: string;
  photos: { id: string; fileName: string; url?: string }[];
  createdAt: string;
  updatedAt: string;
}
interface IssuePanelProps {
  onNavigate?: (pin: { x: number; y: number; z: number; viewerState?: string }) => void;
  onIssueCreated?: () => void;
  pendingPin?: { x: number; y: number; z: number } | null;
  onClearPendingPin?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-500",
  InProgress: "bg-amber-500",
  Resolved: "bg-emerald-500",
  Closed: "bg-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  Open: "未着手",
  InProgress: "対応中",
  Resolved: "解決済",
  Closed: "完了",
};

export function IssuePanel({
  onNavigate,
  onIssueCreated,
  pendingPin,
  onClearPendingPin,
}: IssuePanelProps) {
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "create">("list");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch("/api/issues", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // 画像URLがAPIから返ってきていない場合のフォールバック処理を追加
        const formattedData = data.map((issue: any) => ({
          ...issue,
          photos: issue.photos?.map((photo: any) => ({
            ...photo,
            url: photo.url || `/api/photos/${photo.id}`
          })) || []
        }));
        setIssues(formattedData);
      }
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    if (pendingPin) setTab("create");
  }, [pendingPin]);

  useEffect(() => {
    if (!selectedIssueId && issues.length > 0) {
      setSelectedIssueId(issues[0].id);
    }
  }, [issues, selectedIssueId]);

  const handleCreate = async () => {
    if (!title.trim() || !pendingPin) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          pinX: pendingPin.x,
          pinY: pendingPin.y,
          pinZ: pendingPin.z,
        }),
      });

      if (res.ok) {
        const created = await res.json();

        if (selectedFile) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          await fetch(`/api/issues/${created.id}/photos`, {
            method: "POST",
            body: formData,
          });
        }

        setTitle("");
        setDescription("");
        setSelectedFile(null);
        onClearPendingPin?.();
        setTab("list");
        await fetchIssues();
        setSelectedIssueId(created.id);
        onIssueCreated?.();
      }
    } catch (err) {
      console.error("Failed to create issue:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (issueId: string, toStatus: string) => {
    try {
      await fetch(`/api/issues/${issueId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      await fetchIssues();
    } catch (err) {
      console.error("Failed to transition:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex border-b border-slate-200">
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === "list"
              ? "text-sky-600 border-b-2 border-sky-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setTab("list")}
        >
          指摘一覧 ({issues.length})
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === "create"
              ? "text-sky-600 border-b-2 border-sky-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setTab("create")}
        >
          新規登録
        </button>
      </div>

      {tab === "list" && (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-400 border-t-transparent" />
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm">
              <p>指摘はまだありません</p>
              <p className="mt-1 text-xs">Viewer上をクリックしてピンを配置</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {issues.map((issue) => {
                const isSelected = selectedIssueId === issue.id;

                return (
                  <li
                    key={issue.id}
                    className={`p-4 transition-colors ${
                      isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      className="w-full text-left cursor-pointer"
                      onClick={() =>
                        setSelectedIssueId(isSelected ? null : issue.id)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedIssueId(isSelected ? null : issue.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            STATUS_COLORS[issue.status] ?? "bg-slate-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-slate-900 truncate">
                              {issue.title}
                            </h3>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {STATUS_LABELS[issue.status] ?? issue.status}
                            </span>
                          </div>

                          {issue.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                              {issue.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <button
                              type="button"
                              className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate?.({
                                  x: issue.pin?.x ?? issue.pinX ?? 0,
                                  y: issue.pin?.y ?? issue.pinY ?? 0,
                                  z: issue.pin?.z ?? issue.pinZ ?? 0,
                                  viewerState:
                                    issue.pin?.viewerState ?? issue.viewerState,
                                });
                              }}
                            >
                              📍 位置へ移動
                            </button>

                            {issue.status === "Open" && (
                              <button
                                type="button"
                                className="text-xs text-amber-600 hover:text-amber-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTransition(issue.id, "InProgress");
                                }}
                              >
                                → 対応開始
                              </button>
                            )}

                            {issue.status === "InProgress" && (
                              <button
                                type="button"
                                className="text-xs text-emerald-600 hover:text-emerald-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTransition(issue.id, "Resolved");
                                }}
                              >
                                → 解決
                              </button>
                            )}

                            {issue.photos.length > 0 && (
                              <span className="text-xs text-slate-400">
                                📷 {issue.photos.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 ml-5 rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-xs text-slate-400">
                          ID: {issue.id}
                        </div>

                        <div className="mt-2">
                          <div className="text-xs font-semibold text-slate-700">
                            詳細
                          </div>
                          <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap break-words">
                            {issue.description || "詳細なし"}
                          </p>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs font-semibold text-slate-700">
                            位置情報
                          </div>
                          <p className="mt-1 text-xs text-slate-500 font-mono">
                            ({(issue.pin?.x ?? issue.pinX ?? 0).toFixed(1)}, {(issue.pin?.y ?? issue.pinY ?? 0).toFixed(1)},{" "}
                            {(issue.pin?.z ?? issue.pinZ ?? 0).toFixed(1)})
                          </p>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs font-semibold text-slate-700">
                            添付写真
                          </div>

                          {issue.photos.length === 0 ? (
                            <p className="mt-1 text-xs text-slate-400">
                              写真なし
                            </p>
                          ) : (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {issue.photos.map((photo) => (
                                <a
                                  key={photo.id}
                                  href={photo.url || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block"
                                >
                                  {photo.url ? (
                                    <img
                                      src={photo.url}
                                      alt={photo.fileName}
                                      className="h-24 w-full rounded border border-slate-200 object-cover bg-slate-100"
                                      onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="h-24 w-full rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                                      URL未設定
                                    </div>
                                  )}
                                  <div className="mt-1 truncate text-[11px] text-slate-500">
                                    {photo.fileName}
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "create" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!pendingPin ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              Viewer上をクリックして、ピンを配置してください。
            </div>
          ) : (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-700 font-mono">
              Pin: ({pendingPin.x.toFixed(1)}, {pendingPin.y.toFixed(1)},{" "}
              {pendingPin.z.toFixed(1)})
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              指摘タイトル *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              placeholder="例: 壁面クラック発見"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              詳細説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none resize-none"
              placeholder="指摘の詳細を入力..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              現場写真
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!title.trim() || !pendingPin || submitting}
            className="w-full py-2.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "登録中..." : "指摘を登録"}
          </button>
        </div>
      )}
    </div>
  );
}
