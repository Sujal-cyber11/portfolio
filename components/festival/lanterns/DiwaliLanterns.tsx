"use client";

import { useEffect, useRef } from "react";
import styles from "./FestivalLanterns.module.css";

interface Lantern {
  baseX: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  speed: number;
  renderX: number;
  renderY: number;
}

const MAX_DELTA_SECONDS = 1 / 30;

function drawLantern(
  context: CanvasRenderingContext2D,
  lantern: Lantern,
): void {
  const { width, height, depth } = lantern;
  const topY = -height * 0.48;
  const bottomY = height * 0.46;
  const topHalf = width * 0.25;
  const bottomHalf = width * 0.5;

  context.save();
  context.translate(lantern.renderX, lantern.renderY);
  context.globalAlpha = 0.5 + depth * 0.5;

  const halo = context.createRadialGradient(0, 0, 0, 0, 0, width * 1.6);
  halo.addColorStop(0, "rgba(255, 150, 60, 0.13)");
  halo.addColorStop(1, "rgba(255, 100, 30, 0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(0, 0, width * 1.6, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.moveTo(-topHalf, topY);
  context.bezierCurveTo(
    -width * 0.46,
    -height * 0.24,
    -bottomHalf,
    height * 0.12,
    -bottomHalf,
    bottomY,
  );
  context.quadraticCurveTo(0, bottomY + height * 0.07, bottomHalf, bottomY);
  context.bezierCurveTo(
    bottomHalf,
    height * 0.12,
    width * 0.46,
    -height * 0.24,
    topHalf,
    topY,
  );
  context.quadraticCurveTo(0, topY - height * 0.05, -topHalf, topY);
  context.closePath();

  const body = context.createLinearGradient(0, topY, 0, bottomY);
  body.addColorStop(0, "#ffb347");
  body.addColorStop(0.45, "#ff7a2f");
  body.addColorStop(1, "#b71f17");
  context.fillStyle = body;
  context.fill();

  context.save();
  context.clip();
  context.strokeStyle = "rgba(72, 16, 7, 0.25)";
  context.lineWidth = 1;

  for (const ratio of [-0.5, 0, 0.5]) {
    context.beginPath();
    context.moveTo(topHalf * ratio, topY + height * 0.04);
    context.quadraticCurveTo(
      bottomHalf * ratio * 0.55,
      0,
      bottomHalf * ratio,
      bottomY - height * 0.03,
    );
    context.stroke();
  }

  context.restore();

  context.fillStyle = "#3a1408";
  context.beginPath();
  context.ellipse(0, topY, topHalf * 0.85, height * 0.045, 0, 0, Math.PI * 2);
  context.fill();

  const glow = context.createRadialGradient(
    0,
    bottomY,
    0,
    0,
    bottomY,
    width * 0.6,
  );
  glow.addColorStop(0, "rgba(255, 236, 150, 0.9)");
  glow.addColorStop(0.5, "rgba(255, 165, 60, 0.45)");
  glow.addColorStop(1, "rgba(255, 120, 35, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.ellipse(
    0,
    bottomY,
    bottomHalf * 0.9,
    height * 0.16,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();

  context.restore();
}

export function DiwaliLanterns() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let lanterns: Lantern[] = [];
    let frame = 0;
    let running = false;
    let lastFrame = 0;

    function targetCount(): number {
      return width < 640 ? 5 : 9;
    }

    function resize(): void {
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasNode.width = Math.max(1, Math.round(width * devicePixelRatio));
      canvasNode.height = Math.max(1, Math.round(height * devicePixelRatio));
      context2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function createLantern(spawnBelow = false): Lantern {
      const depth = 0.35 + Math.random() * 0.65;
      const lanternWidth = 18 + depth * 30;
      const lanternHeight = lanternWidth * 1.45;
      const baseX = Math.random() * width;
      const y = spawnBelow
        ? height + lanternHeight + Math.random() * height * 0.35
        : Math.random() * height;

      return {
        baseX,
        y,
        width: lanternWidth,
        height: lanternHeight,
        depth,
        speed: 6 + depth * 13,
        renderX: baseX,
        renderY: y,
      };
    }

    function resetLantern(lantern: Lantern): void {
      Object.assign(lantern, createLantern(true));
    }

    function draw(): void {
      context2d.clearRect(0, 0, width, height);

      for (const lantern of lanterns) {
        drawLantern(context2d, lantern);
      }
    }

    function drawStatic(): void {
      const count = width < 640 ? 4 : 6;
      const specs = [
        [0.14, 0.26, 0.45],
        [0.3, 0.58, 0.7],
        [0.46, 0.34, 0.55],
        [0.62, 0.68, 0.8],
        [0.78, 0.38, 0.6],
        [0.9, 0.62, 0.5],
      ];

      context2d.clearRect(0, 0, width, height);

      for (let index = 0; index < count; index += 1) {
        const [xRatio, yRatio, depth] = specs[index] ?? specs[0];
        const lanternWidth = 18 + depth * 30;
        const lanternHeight = lanternWidth * 1.45;
        const lantern: Lantern = {
          baseX: width * xRatio,
          y: height * yRatio,
          width: lanternWidth,
          height: lanternHeight,
          depth,
          speed: 0,
          renderX: width * xRatio,
          renderY: height * yRatio,
        };

        drawLantern(context2d, lantern);
      }
    }

    function start(): void {
      if (running || document.hidden) {
        return;
      }

      running = true;
      lastFrame = performance.now();
      frame = window.requestAnimationFrame(loop);
    }

    function stop(): void {
      running = false;
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    function loop(time: number): void {
      if (!running) {
        return;
      }

      const delta = Math.min(
        MAX_DELTA_SECONDS,
        Math.max(0.001, (time - lastFrame) / 1000),
      );
      lastFrame = time;

      for (const lantern of lanterns) {
        lantern.y -= lantern.speed * delta;
        lantern.renderX = lantern.baseX;
        lantern.renderY = lantern.y;

        if (lantern.renderY < -lantern.height * 1.5) {
          resetLantern(lantern);
        }
      }

      draw();
      frame = window.requestAnimationFrame(loop);
    }

    function handleVisibility(): void {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    function handleResize(): void {
      resize();

      if (reducedMotion) {
        drawStatic();
        return;
      }

      lanterns = Array.from({ length: targetCount() }, () => createLantern());
    }

    resize();
    drawStatic();

    if (reducedMotion) {
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }

    lanterns = Array.from({ length: targetCount() }, () => createLantern());
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas aria-hidden="true" className={styles.canvas} ref={canvasRef} />
  );
}
