"use client";
import { useRef, useEffect } from "react";
import { useForgeViewer, type ViewerClickEvent } from "../hooks/use-forge-viewer";

interface ForgeViewerProps {
  urn?: string;
  pins?: Array<{
    id?: string;
    x: number;
    y: number;
    z: number;
    color?: string;
    label?: string;
  }>;
  onViewerClick?: (point: { x: number; y: number; z: number }) => void;
  onPinClick?: (id: string) => void;
  onNavigateReady?: (fn: (x: number, y: number, z: number, viewerState?: string) => void) => void;
  onReady?: () => void;
}

export function ForgeViewer({
  urn,
  pins = [],
  onViewerClick,
  onNavigateReady,
  onReady,
}: ForgeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isReady, loadModel, addPin, clearPins, setClickHandler, navigateTo } =
  useForgeViewer(containerRef); 

  useEffect(() => {
    if (isReady && urn) {
      loadModel(urn);
    }
  }, [isReady, urn, loadModel]);

useEffect(() => {
  if (!isReady) return;
  clearPins();
  pins.forEach((pin) => addPin(pin.x, pin.y, pin.z, pin.color));
}, [isReady, pins, addPin, clearPins]);

  useEffect(() => {
    if (onViewerClick) {
      setClickHandler(() => (e: ViewerClickEvent) => {
        onViewerClick({
          x: e.worldPoint?.x ?? 0,
          y: e.worldPoint?.y ?? 0,
          z: e.worldPoint?.z ?? 0,
        });
      });
    }
  }, [onViewerClick, setClickHandler]);

  useEffect(() => {
    if (isReady && onNavigateReady && navigateTo) {
      onNavigateReady(navigateTo);
    }
  }, [isReady, onNavigateReady, navigateTo]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full bg-slate-900" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-400 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading APS Viewer...</p>
          </div>
        </div>
      )}
    </div>
  );
}
