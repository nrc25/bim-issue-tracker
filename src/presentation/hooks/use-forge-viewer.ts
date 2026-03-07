"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Autodesk: any;
    THREE: any;
    __forgeViewerSdkPromise?: Promise<void>;
  }
}

export type ViewerClickEvent = {
  dbId: number | null;
  worldPoint: { x: number; y: number; z: number } | null;
  screenPoint: { x: number; y: number };
  viewerState: string;
};

type UseForgeViewerReturn = {
  viewer: any | null;
  isReady: boolean;
  loadModel: (urn: string) => Promise<void>;
  addPin: (x: number, y: number, z: number, color?: string) => void;
  clearPins: () => void;
  navigateTo: (x: number, y: number, z: number, viewerState?: string) => void;
  setClickHandler: React.Dispatch<
    React.SetStateAction<((e: ViewerClickEvent) => void) | null>
  >;
};

const VIEWER_CSS_URL =
  "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css";
const VIEWER_JS_URL =
  "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js";

const PIN_OVERLAY_NAME = "issue-pins-overlay";

function ensureViewerCss() {
  if (document.querySelector('link[data-forge-viewer-css="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = VIEWER_CSS_URL;
  link.setAttribute("data-forge-viewer-css", "true");
  document.head.appendChild(link);
}

function loadViewerSDK(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }
  if (window.Autodesk?.Viewing) return Promise.resolve();
  if (window.__forgeViewerSdkPromise) return window.__forgeViewerSdkPromise;

  window.__forgeViewerSdkPromise = new Promise<void>((resolve, reject) => {
    ensureViewerCss();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-forge-viewer-sdk="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Viewer SDK load failed")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = VIEWER_JS_URL;
    script.async = true;
    script.setAttribute("data-forge-viewer-sdk", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Viewer SDK load failed"));
    document.head.appendChild(script);
  });

  return window.__forgeViewerSdkPromise;
}

export function useForgeViewer(
  containerRef: React.RefObject<HTMLDivElement | null>
): UseForgeViewerReturn {
  const viewerRef = useRef<any | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const clickHandlerRef = useRef<((e: ViewerClickEvent) => void) | null>(null);
  const pinObjectsRef = useRef<any[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [clickHandler, setClickHandler] = useState<
    ((e: ViewerClickEvent) => void) | null
  >(null);

  useEffect(() => {
    clickHandlerRef.current = clickHandler;
  }, [clickHandler]);

  useEffect(() => {
    let disposed = false;
    let localViewer: any | null = null;

    const initialize = async () => {
      if (!containerRef.current) return;

      try {
        await loadViewerSDK();
        if (disposed || !containerRef.current) return;

        const AV = window.Autodesk?.Viewing;
        if (!AV) throw new Error("Autodesk.Viewing is not available");

        const options = {
          env: "AutodeskProduction2",
          api: "streamingV2",
          getAccessToken: async (
            onTokenReady: (token: string, expiresInSeconds: number) => void
          ) => {
            const res = await fetch("/api/aps/token", { cache: "no-store" });
            if (!res.ok) throw new Error("Token API failed: " + res.status);
            const data = await res.json();
            onTokenReady(data.access_token, data.expires_in);
          },
        };

        AV.Initializer(options, () => {
          if (disposed || !containerRef.current) return;

          const viewer = new AV.GuiViewer3D(containerRef.current, {
            extensions: [],
          });
          const startedCode = viewer.start();

          if (startedCode > 0) {
            console.error("Viewer start failed:", startedCode);
            return;
          }

          localViewer = viewer;
          viewerRef.current = viewer;

          const onSingleClick = (event: any) => {
            const handler = clickHandlerRef.current;
            if (!handler) return;

            const x = event?.canvasX ?? event?.offsetX ?? 0;
            const y = event?.canvasY ?? event?.offsetY ?? 0;

            const hit =
              viewer?.impl?.hitTest?.(x, y, true) ??
              viewer?.clientToWorld?.(x, y, true);

            const point =
              hit?.intersectPoint || hit?.point
                ? {
                    x: Number((hit.intersectPoint || hit.point).x),
                    y: Number((hit.intersectPoint || hit.point).y),
                    z: Number((hit.intersectPoint || hit.point).z),
                  }
                : null;

            const dbId =
              typeof hit?.dbId === "number"
                ? hit.dbId
                : Array.isArray(hit?.dbIdArray) && hit.dbIdArray.length > 0
                ? hit.dbIdArray[0]
                : null;

            handler({
              dbId,
              worldPoint: point,
              screenPoint: { x, y },
              viewerState: JSON.stringify(viewer.getState()),
            });
          };

          const canvas = viewer.canvas || containerRef.current?.querySelector("canvas");
          if (canvas) {
            canvas.addEventListener("click", (ev: any) => {
              onSingleClick({ canvasX: ev.offsetX, canvasY: ev.offsetY });
            });
          }

          resizeObserverRef.current = new ResizeObserver(() => {
            viewer.resize();
          });
          resizeObserverRef.current.observe(containerRef.current);

          setIsReady(true);
        });
      } catch (error) {
        console.error("Viewer initialization failed:", error);
      }
    };

    void initialize();

    return () => {
      disposed = true;
      setIsReady(false);

      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      if (localViewer) {
        try {
          pinObjectsRef.current.forEach((obj) => {
            try {
              localViewer.impl.removeOverlay(PIN_OVERLAY_NAME, obj);
            } catch {}
          });
          pinObjectsRef.current = [];
          localViewer.finish();
        } catch (e) {
          console.error("Viewer cleanup failed:", e);
        }
      }

      viewerRef.current = null;
    };
  }, [containerRef]);

  const loadModel = useCallback(async (urn: string) => {
    const viewer = viewerRef.current;
    if (!viewer) throw new Error("Viewer is not ready");

    const AV = window.Autodesk?.Viewing;
    if (!AV) throw new Error("Autodesk.Viewing is not available");

    const documentId = urn.startsWith("urn:") ? urn : "urn:" + urn;

    await new Promise<void>((resolve, reject) => {
      AV.Document.load(
        documentId,
        (doc: any) => {
          viewer
            .loadDocumentNode(doc, doc.getRoot().getDefaultGeometry())
            .then(() => resolve())
            .catch((e: unknown) => reject(e));
        },
        (errorCode: unknown) => {
          reject(new Error("Model load failed: " + String(errorCode)));
        }
      );
    });
  }, []);

  const clearPins = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer?.impl) return;

    try {
      pinObjectsRef.current.forEach((obj) => {
        viewer.impl.removeOverlay(PIN_OVERLAY_NAME, obj);
      });
      pinObjectsRef.current = [];
      viewer.impl.invalidate(true, true, true);
    } catch (error) {
      console.error("clearPins failed:", error);
    }
  }, []);

  const addPin = useCallback(
    (x: number, y: number, z: number, color = "#ef4444") => {
      const viewer = viewerRef.current;
      const THREE = window.THREE;

      if (!viewer?.impl || !THREE) return;

      try {
        if (!viewer.impl.overlayScenes[PIN_OVERLAY_NAME]) {
          viewer.impl.createOverlayScene(PIN_OVERLAY_NAME);
        }

        const group = new THREE.Group();

        const stemMaterial = new THREE.LineBasicMaterial({
          color,
          depthTest: false,
          depthWrite: false,
        });

        const stemGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 6),
        ]);

        const stem = new THREE.Line(stemGeometry, stemMaterial);

        const headMaterial = new THREE.MeshBasicMaterial({
          color,
          depthTest: false,
          depthWrite: false,
        });

        const head = new THREE.Mesh(
          new THREE.SphereGeometry(1.4, 16, 16),
          headMaterial
        );
        head.position.set(0, 0, 7.2);

        group.add(stem);
        group.add(head);
        group.position.set(x, y, z);

        viewer.impl.addOverlay(PIN_OVERLAY_NAME, group);
        pinObjectsRef.current.push(group);
        viewer.impl.invalidate(true, true, true);
      } catch (error) {
        console.error("addPin failed:", error);
      }
    },
    []
  );

  const navigateTo = useCallback(
    (x: number, y: number, z: number, viewerState?: string) => {
      const viewer = viewerRef.current;
      const THREE = window.THREE;
      if (!viewer || !THREE) return;

      if (viewerState) {
        try {
          viewer.restoreState(JSON.parse(viewerState));
          return;
        } catch (e) {
          console.error("restoreState failed:", e);
        }
      }

      const target = new THREE.Vector3(x, y, z);
      const currentTarget = viewer.navigation.getTarget();
      const currentPos = viewer.navigation.getPosition();
      const offset = currentPos.clone().sub(currentTarget);

      viewer.navigation.setTarget(target);
      viewer.navigation.setPosition(target.clone().add(offset));
      viewer.impl.invalidate(true, true, true);
    },
    []
  );

  return {
    viewer: viewerRef.current,
    isReady,
    loadModel,
    addPin,
    clearPins,
    navigateTo,
    setClickHandler,
  };
}