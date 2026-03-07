"use client";

import { useState, useCallback } from "react";

interface Pin {
  id: string;
  x: number;
  y: number;
  z: number;
  color?: string;
  label?: string;
}

interface MockViewerProps {
  pins?: Pin[];
  onViewerClick?: (point: { x: number; y: number; z: number }) => void;
  onPinClick?: (pinId: string) => void;
}

/**
 * APS Viewer のモック。SDKなしでUI開発・デモが可能。
 * 2D平面上でピン配置をシミュレートする。
 */
export function ({
  pins = [],
  onViewerClick,
  onPinClick,
}: MockViewerProps) {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onViewerClick?.({ x, y, z: 0 });
    },
    [onViewerClick]
  );

  return (
    <div
      className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 cursor-crosshair overflow-hidden select-none"
      onClick={handleClick}
    >
      {/* グリッド線 */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 建物モック */}
      <div className="absolute inset-8 border border-slate-600/30 rounded">
        <div className="absolute top-4 left-4 text-slate-500 text-xs font-mono">
          BIM Model — Mock View
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-3/4 border border-dashed border-slate-600/40 rounded flex items-center justify-center">
            <div className="text-slate-600 text-sm">
              Click anywhere to place a pin
            </div>
          </div>
        </div>
      </div>

      {/* ピン描画 */}
      {pins.map((pin) => (
        <button
          key={pin.id}
          className="absolute transform -translate-x-1/2 -translate-y-full z-10 group"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          onClick={(e) => {
            e.stopPropagation();
            onPinClick?.(pin.id);
          }}
          onMouseEnter={() => setHoveredPin(pin.id)}
          onMouseLeave={() => setHoveredPin(null)}
        >
          {/* ピンアイコン */}
          <svg width="24" height="36" viewBox="0 0 24 36" className="drop-shadow-lg">
            <path
              d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
              fill={pin.color ?? "#ef4444"}
            />
            <circle cx="12" cy="12" r="5" fill="white" opacity="0.9" />
          </svg>
          {/* ツールチップ */}
          {hoveredPin === pin.id && pin.label && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
              {pin.label}
            </div>
          )}
        </button>
      ))}

      {/* ステータスバー */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/40 flex items-center px-4 gap-4">
        <span className="text-slate-400 text-xs font-mono">
          Pins: {pins.length}
        </span>
        <span className="text-slate-500 text-xs">|</span>
        <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Mock Mode
        </span>
      </div>
    </div>
  );
}
