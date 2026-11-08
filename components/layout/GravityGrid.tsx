"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import styles from "./GravityGrid.module.css";

const MAX_DELTA_SECONDS = 1 / 30;
const PULL_RADIUS = 280;
const MAX_PULL = 36;

function subscribeTheme(callback: () => void): () => void {
  if (typeof MutationObserver === "undefined") {
    return () => undefined;
  }

  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}

function getThemeSnapshot(): boolean {
  return !Array.from(document.documentElement.classList).some((name) =>
    name.startsWith("theme-"),
  );
}

function getServerThemeSnapshot(): boolean {
  return true;
}

function withAlpha(color: string, alpha: number): string {
  const value = color.trim();
  const shortHex = /^#([0-9a-f]{3})$/i.exec(value);
  const longHex = /^#([0-9a-f]{6})$/i.exec(value);

  if (shortHex?.[1]) {
    const [r, g, b] = shortHex[1].split("");
    return `rgba(${Number.parseInt(`${r}${r}`, 16)}, ${Number.parseInt(`${g}${g}`, 16)}, ${Number.parseInt(`${b}${b}`, 16)}, ${alpha})`;
  }

  if (longHex?.[1]) {
    const hex = longHex[1];
    return `rgba(${Number.parseInt(hex.slice(0, 2), 16)}, ${Number.parseInt(hex.slice(2, 4), 16)}, ${Number.parseInt(hex.slice(4, 6), 16)}, ${alpha})`;
  }

  return value;
}

export function GravityGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const defaultTheme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    if (!defaultTheme) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const canvasNode: HTMLCanvasElement = canvas;
    const context2d: CanvasRenderingContext2D = context;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let accent = "#3dffa0";
    let frame = 0;
    let running = false;
    let lastFrame = 0;
    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: false,
      influence: 0,
    };

    function resize(): void {
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasNode.width = Math.max(1, Math.round(width * devicePixelRatio));
      canvasNode.height = Math.max(1, Math.round(height * devicePixelRatio));
      context2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      accent =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim() || "#3dffa0";
      pointer.x = width / 2;
      pointer.y = height / 2;
      pointer.targetX = width / 2;
      pointer.targetY = height / 2;
    }

    function warpedPoint(x: number, y: number): [number, number] {
      if (pointer.influence <= 0.001) {
        return [x, y];
      }

      const dx = pointer.x - x;
      const dy = pointer.y - y;
      const distance = Math.hypot(dx, dy);

      if (distance >= PULL_RADIUS || distance < 1) {
        return [x, y];
      }

      const falloff = 1 - distance / PULL_RADIUS;
      const pull = falloff * falloff * MAX_PULL * pointer.influence;

      return [x + (dx / distance) * pull, y + (dy / distance) * pull];
    }

    function draw(): void {
      context2d.clearRect(0, 0, width, height);
      const spacing = width < 640 ? 32 : 42;

      if (pointer.influence > 0.001) {
        const glow = context2d.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          PULL_RADIUS * 0.75,
        );
        glow.addColorStop(0, withAlpha(accent, 0.08 * pointer.influence));
        glow.addColorStop(1, withAlpha(accent, 0));
        context2d.fillStyle = glow;
        context2d.beginPath();
        context2d.arc(pointer.x, pointer.y, PULL_RADIUS * 0.75, 0, Math.PI * 2);
        context2d.fill();
      }

      context2d.lineWidth = 1;
      context2d.strokeStyle = accent;
      context2d.globalAlpha = 0.13;

      for (let y = 0; y <= height + spacing; y += spacing) {
        context2d.beginPath();

        for (let x = -spacing; x <= width + spacing; x += spacing) {
          const [wx, wy] = warpedPoint(x, y);

          if (x === -spacing) {
            context2d.moveTo(wx, wy);
          } else {
            context2d.lineTo(wx, wy);
          }
        }

        context2d.stroke();
      }

      for (let x = 0; x <= width + spacing; x += spacing) {
        context2d.beginPath();

        for (let y = -spacing; y <= height + spacing; y += spacing) {
          const [wx, wy] = warpedPoint(x, y);

          if (y === -spacing) {
            context2d.moveTo(wx, wy);
          } else {
            context2d.lineTo(wx, wy);
          }
        }

        context2d.stroke();
      }

      if (pointer.influence > 0.001) {
        context2d.fillStyle = accent;
        context2d.globalAlpha = 0.38 * pointer.influence;

        for (let y = 0; y <= height + spacing; y += spacing) {
          for (let x = 0; x <= width + spacing; x += spacing) {
            const distance = Math.hypot(pointer.x - x, pointer.y - y);

            if (distance < PULL_RADIUS * 0.7) {
              const [wx, wy] = warpedPoint(x, y);
              context2d.beginPath();
              context2d.arc(wx, wy, 1.2, 0, Math.PI * 2);
              context2d.fill();
            }
          }
        }
      }

      context2d.globalAlpha = 1;
    }

    function tick(time: number): void {
      if (!running) {
        return;
      }

      const delta = Math.min(
        MAX_DELTA_SECONDS,
        Math.max(0.001, (time - lastFrame) / 1000),
      );
      lastFrame = time;
      const ease = 1 - Math.pow(0.82, delta * 60);

      pointer.x += (pointer.targetX - pointer.x) * ease;
      pointer.y += (pointer.targetY - pointer.y) * ease;
      pointer.influence +=
        ((pointer.active ? 1 : 0) - pointer.influence) * ease;
      draw();
      frame = window.requestAnimationFrame(tick);
    }

    function start(): void {
      if (running || document.hidden) {
        return;
      }

      running = true;
      lastFrame = performance.now();
      frame = window.requestAnimationFrame(tick);
    }

    function stop(): void {
      running = false;
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    function handlePointerMove(event: PointerEvent): void {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointer.active = true;
    }

    function handlePointerLeave(): void {
      pointer.active = false;
    }

    function handleMouseOut(event: MouseEvent): void {
      if (!event.relatedTarget) {
        handlePointerLeave();
      }
    }

    function handleStaticResize(): void {
      resize();
      draw();
    }

    function handleVisibility(): void {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    resize();
    draw();

    if (reducedMotion || !finePointer) {
      window.addEventListener("resize", handleStaticResize);

      return () => window.removeEventListener("resize", handleStaticResize);
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("blur", handlePointerLeave);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("blur", handlePointerLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [defaultTheme]);

  return (
    <canvas aria-hidden="true" className={styles.canvas} ref={canvasRef} />
  );
}
