"use client";

import { useEffect, useRef, useState } from "react";
import { playFestivalChime } from "@/components/festival/audio/festival-audio";
import {
  getWindForce,
  isInteractivePointerTarget,
  isLanternHit,
  isWindWindowActive,
  MAX_DELTA_SECONDS,
  pointerMovementExceedsThreshold,
  recordLanternBurst,
  stepLanternWind,
  type LanternWindState,
} from "@/lib/lanterns";
import styles from "./DiwaliAmbient.module.css";

interface LanternShape {
  width: number;
  height: number;
  depth: number;
  phase: number;
}

interface Lantern extends LanternShape {
  baseX: number;
  y: number;
  speed: number;
  swayAmplitude: number;
  swaySpeed: number;
  wind: LanternWindState;
  renderX: number;
  renderY: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

interface Firework {
  delay: number;
  x: number;
  y: number;
}

const MAX_SPARKS = 320;
const WIND_RADIUS = 120;
const LANTERN_TOLERANCE = 10;
const STILL_POINTER_FORCE = { x: 0, y: 0, strength: 0 };
const BURST_COLORS = ["#ffd166", "#ffb347", "#ff7a2f", "#ff4d2e"];
const FIREWORK_COLORS = ["#ffd166", "#ffb347", "#ff7a2f", "#ff4d2e"];

function drawLantern(
  context: CanvasRenderingContext2D,
  lantern: LanternShape,
  x: number,
  y: number,
  time: number,
): void {
  const { width, height, depth, phase } = lantern;
  const flicker =
    0.86 +
    0.14 *
      Math.sin(time * 0.005 + phase * 4) *
      Math.sin(time * 0.0023 + phase * 1.7);
  const topY = -height * 0.48;
  const bottomY = height * 0.46;
  const topHalf = width * 0.25;
  const bottomHalf = width * 0.5;

  context.save();
  context.translate(x, y);
  context.globalAlpha = 0.55 + depth * 0.45;

  const halo = context.createRadialGradient(0, 0, 0, 0, 0, width * 1.75);
  halo.addColorStop(0, `rgba(255, 150, 60, ${0.18 * flicker})`);
  halo.addColorStop(0.55, `rgba(255, 100, 30, ${0.08 * flicker})`);
  halo.addColorStop(1, "rgba(255, 100, 30, 0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(0, 0, width * 1.75, 0, Math.PI * 2);
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
  body.addColorStop(0.42, "#ff7a2f");
  body.addColorStop(1, "#b71f17");
  context.fillStyle = body;
  context.fill();

  context.save();
  context.clip();
  context.strokeStyle = "rgba(72, 16, 7, 0.28)";
  context.lineWidth = 1;

  for (const ratio of [-0.55, -0.18, 0.18, 0.55]) {
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

  const sheen = context.createLinearGradient(-width * 0.4, 0, width * 0.4, 0);
  sheen.addColorStop(0, "rgba(255, 220, 160, 0)");
  sheen.addColorStop(0.45, `rgba(255, 230, 180, ${0.1 * flicker})`);
  sheen.addColorStop(1, "rgba(255, 220, 160, 0)");
  context.fillStyle = sheen;
  context.fillRect(-width, topY, width * 2, height);
  context.restore();

  context.fillStyle = "#3a1408";
  context.beginPath();
  context.ellipse(0, topY, topHalf * 0.85, height * 0.045, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#471408";
  context.beginPath();
  context.ellipse(0, bottomY, bottomHalf, height * 0.09, 0, 0, Math.PI * 2);
  context.fill();

  const glow = context.createRadialGradient(
    0,
    bottomY,
    0,
    0,
    bottomY,
    width * 0.62,
  );
  glow.addColorStop(0, `rgba(255, 238, 160, ${0.95 * flicker})`);
  glow.addColorStop(0.45, `rgba(255, 170, 65, ${0.58 * flicker})`);
  glow.addColorStop(1, "rgba(255, 120, 35, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.ellipse(
    0,
    bottomY,
    bottomHalf * 0.92,
    height * 0.17,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();

  const flameHeight = height * (0.12 + 0.03 * flicker);
  const flameWidth = width * (0.07 + 0.012 * flicker);
  const flame = context.createRadialGradient(
    0,
    bottomY,
    0,
    0,
    bottomY,
    flameHeight,
  );
  flame.addColorStop(0, "#fff6c7");
  flame.addColorStop(0.45, "#ffcc55");
  flame.addColorStop(1, "rgba(255, 120, 30, 0)");
  context.fillStyle = flame;
  context.beginPath();
  context.moveTo(0, bottomY + height * 0.02);
  context.bezierCurveTo(
    -flameWidth,
    bottomY - flameHeight * 0.3,
    -flameWidth * 0.55,
    bottomY - flameHeight * 0.95,
    0,
    bottomY - flameHeight,
  );
  context.bezierCurveTo(
    flameWidth * 0.55,
    bottomY - flameHeight * 0.95,
    flameWidth,
    bottomY - flameHeight * 0.3,
    0,
    bottomY + height * 0.02,
  );
  context.fill();

  context.restore();
}

export function DiwaliAmbient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const canvasElement = canvasRef.current;

    if (!canvasElement) {
      return;
    }

    const drawingContext = canvasElement.getContext("2d");

    if (!drawingContext) {
      return;
    }

    const canvasNode: HTMLCanvasElement = canvasElement;
    const context2d: CanvasRenderingContext2D = drawingContext;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let lanterns: Lantern[] = [];
    const sparks: Spark[] = [];
    const fireworks: Firework[] = [];
    const replacementTimers = new Set<number>();
    let burstCount = 0;
    let toastTimer = 0;
    let rafId = 0;
    let running = false;
    let lastFrame = 0;
    let pointerActive = false;
    let pointerX = 0;
    let pointerY = 0;
    let lastPointerMovementAt = Number.NEGATIVE_INFINITY;
    let pointerOverInteractive = false;
    let cursorOverridden = false;
    let previousCursor = "";

    function resizeCanvas(): void {
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasNode.width = Math.max(1, Math.round(width * devicePixelRatio));
      canvasNode.height = Math.max(1, Math.round(height * devicePixelRatio));
      context2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function targetLanternCount(): number {
      return width < 640 ? 5 : 10;
    }

    function createLantern(spawnBelow = false): Lantern {
      const depth = 0.3 + Math.random() * 0.7;
      const lanternWidth = 18 + depth * 32;
      const lanternHeight = lanternWidth * 1.45;
      const baseX = Math.random() * width;
      const y = spawnBelow
        ? height + lanternHeight + Math.random() * height * 0.5
        : Math.random() * height;

      return {
        baseX,
        y,
        width: lanternWidth,
        height: lanternHeight,
        depth,
        speed: 7 + depth * 20,
        swayAmplitude: 5 + depth * 15,
        swaySpeed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        wind: { x: 0, y: 0, vx: 0, vy: 0 },
        renderX: baseX,
        renderY: y,
      };
    }

    function resetLantern(lantern: Lantern): void {
      const fresh = createLantern(true);
      Object.assign(lantern, fresh);
    }

    function ensureLanterns(): void {
      const target = targetLanternCount();

      while (lanterns.length < target) {
        lanterns.push(createLantern());
      }

      if (lanterns.length > target) {
        lanterns.length = target;
      }

      for (const lantern of lanterns) {
        lantern.renderY = lantern.y;
      }
    }

    function setPointerCursor(enabled: boolean): void {
      if (!finePointer) {
        return;
      }

      if (enabled && !cursorOverridden) {
        previousCursor = document.body.style.cursor;
        document.body.style.cursor = "pointer";
        cursorOverridden = true;
        return;
      }

      if (!enabled && cursorOverridden) {
        document.body.style.cursor = previousCursor;
        cursorOverridden = false;
      }
    }

    function updateCursorFromHit(): void {
      if (!finePointer) {
        return;
      }

      if (!pointerActive || pointerOverInteractive) {
        setPointerCursor(false);
        return;
      }

      const hovering = lanterns.some((lantern) =>
        isLanternHit(
          { x: pointerX, y: pointerY },
          {
            x: lantern.renderX,
            y: lantern.renderY,
            width: lantern.width,
            height: lantern.height,
          },
          LANTERN_TOLERANCE,
        ),
      );

      setPointerCursor(hovering);
    }

    function spawnSparks(
      x: number,
      y: number,
      count: number,
      colors: string[],
      speed: number,
      life: number,
      gravity: number,
    ): void {
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = speed * (0.35 + Math.random() * 0.65);
        const maxLife = life * (0.65 + Math.random() * 0.35);

        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: maxLife,
          maxLife,
          size: 1 + Math.random() * 2.2,
          color:
            colors[Math.floor(Math.random() * colors.length)] ??
            colors[0] ??
            "#ffb347",
          gravity,
        });
      }

      if (sparks.length > MAX_SPARKS) {
        sparks.splice(0, sparks.length - MAX_SPARKS);
      }
    }

    function queueEasterEgg(): void {
      for (let index = 0; index < 6; index += 1) {
        fireworks.push({
          delay: index * 170 + Math.random() * 100,
          x: width * (0.15 + Math.random() * 0.7),
          y: height * (0.12 + Math.random() * 0.5),
        });
      }

      setToastVisible(true);

      if (toastTimer) {
        window.clearTimeout(toastTimer);
      }

      toastTimer = window.setTimeout(() => {
        setToastVisible(false);
        toastTimer = 0;
      }, 3000);
    }

    function burstLantern(lantern: Lantern): void {
      spawnSparks(
        lantern.renderX,
        lantern.renderY,
        26,
        BURST_COLORS,
        230,
        0.95,
        380,
      );
      playFestivalChime();

      const result = recordLanternBurst(burstCount);
      burstCount = result.count;

      if (result.triggered) {
        queueEasterEgg();
      }

      const timer = window.setTimeout(
        () => {
          replacementTimers.delete(timer);

          if (lanterns.length < targetLanternCount()) {
            lanterns.push(createLantern(true));
          }
        },
        1000 + Math.random() * 2000,
      );

      replacementTimers.add(timer);
      updateCursorFromHit();
    }

    function handleClick(event: MouseEvent): void {
      if (isInteractivePointerTarget(event.target)) {
        return;
      }

      const hitIndex = lanterns.findIndex((lantern) =>
        isLanternHit(
          { x: event.clientX, y: event.clientY },
          {
            x: lantern.renderX,
            y: lantern.renderY,
            width: lantern.width,
            height: lantern.height,
          },
          LANTERN_TOLERANCE,
        ),
      );

      if (hitIndex === -1) {
        return;
      }

      const [lantern] = lanterns.splice(hitIndex, 1);

      if (lantern) {
        burstLantern(lantern);
      }
    }

    function handlePointerMove(event: PointerEvent): void {
      if (!finePointer) {
        return;
      }

      const nextX = event.clientX;
      const nextY = event.clientY;
      const significant =
        !pointerActive ||
        pointerMovementExceedsThreshold(
          { x: pointerX, y: pointerY },
          { x: nextX, y: nextY },
        );

      pointerOverInteractive = isInteractivePointerTarget(event.target);

      if (significant) {
        pointerActive = true;
        pointerX = nextX;
        pointerY = nextY;
        lastPointerMovementAt = performance.now();
      }

      updateCursorFromHit();
    }

    function handlePointerLeave(): void {
      pointerActive = false;
      pointerOverInteractive = false;
      setPointerCursor(false);
    }

    function handleMouseOut(event: MouseEvent): void {
      if (!event.relatedTarget) {
        handlePointerLeave();
      }
    }

    function update(delta: number, time: number): void {
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];

        if (!spark) {
          continue;
        }

        spark.life -= delta;

        if (spark.life <= 0) {
          sparks.splice(index, 1);
          continue;
        }

        spark.vy += spark.gravity * delta;
        spark.x += spark.vx * delta;
        spark.y += spark.vy * delta;
        spark.vx *= 0.995;
      }

      for (let index = fireworks.length - 1; index >= 0; index -= 1) {
        const firework = fireworks[index];

        if (!firework) {
          continue;
        }

        firework.delay -= delta * 1000;

        if (firework.delay <= 0) {
          spawnSparks(
            firework.x,
            firework.y,
            30,
            FIREWORK_COLORS,
            190,
            1.5,
            120,
          );
          fireworks.splice(index, 1);
        }
      }

      const windActive =
        finePointer &&
        isWindWindowActive(time, lastPointerMovementAt, pointerActive);

      for (const lantern of lanterns) {
        const sway =
          Math.sin(time * lantern.swaySpeed + lantern.phase) *
          lantern.swayAmplitude;
        const centerX = lantern.baseX + sway + lantern.wind.x;
        const centerY = lantern.y + lantern.wind.y;
        const force = windActive
          ? getWindForce(
              { x: pointerX, y: pointerY },
              { x: centerX, y: centerY },
              WIND_RADIUS,
            )
          : STILL_POINTER_FORCE;

        stepLanternWind(lantern.wind, force, delta);
        lantern.y -= lantern.speed * delta;
        lantern.renderX =
          lantern.baseX +
          Math.sin(time * lantern.swaySpeed + lantern.phase) *
            lantern.swayAmplitude +
          lantern.wind.x;
        lantern.renderY = lantern.y + lantern.wind.y;

        if (lantern.renderY < -lantern.height * 1.5) {
          resetLantern(lantern);
        }
      }
    }

    function draw(time: number): void {
      context2d.clearRect(0, 0, width, height);

      for (const lantern of lanterns) {
        drawLantern(context2d, lantern, lantern.renderX, lantern.renderY, time);
      }

      context2d.save();
      context2d.globalCompositeOperation = "lighter";

      for (const spark of sparks) {
        context2d.globalAlpha = Math.max(0, spark.life / spark.maxLife);
        context2d.fillStyle = spark.color;
        context2d.beginPath();
        context2d.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        context2d.fill();
      }

      context2d.restore();
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
      update(delta, time);
      draw(time);
      rafId = window.requestAnimationFrame(loop);
    }

    function startLoop(): void {
      if (running || document.hidden) {
        return;
      }

      running = true;
      lastFrame = performance.now();
      rafId = window.requestAnimationFrame(loop);
    }

    function stopLoop(): void {
      running = false;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function handleVisibilityChange(): void {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    }

    function handleResize(): void {
      resizeCanvas();
      lanterns = Array.from({ length: targetLanternCount() }, () =>
        createLantern(),
      );
      draw(performance.now());
    }

    function drawStaticLanterns(): void {
      resizeCanvas();
      context2d.clearRect(0, 0, width, height);
      const count = width < 640 ? 4 : 6;

      for (let index = 0; index < count; index += 1) {
        const depth = 0.35 + ((index * 0.11) % 0.6);
        const lanternWidth = 20 + depth * 32;
        const lanternHeight = lanternWidth * 1.45;
        const x =
          width * (0.12 + (index % 3) * 0.32 + Math.floor(index / 3) * 0.1);
        const y = height * (0.24 + ((index * 0.17) % 0.55));

        drawLantern(
          context2d,
          {
            width: lanternWidth,
            height: lanternHeight,
            depth,
            phase: index * 1.7,
          },
          x,
          y,
          1000 + index * 300,
        );
      }
    }

    if (motionQuery.matches) {
      drawStaticLanterns();
      window.addEventListener("resize", drawStaticLanterns);

      return () => {
        window.removeEventListener("resize", drawStaticLanterns);
      };
    }

    resizeCanvas();
    ensureLanterns();
    draw(performance.now());
    startLoop();

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("resize", handleResize);
    window.addEventListener("blur", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopLoop();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("blur", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      for (const timer of replacementTimers) {
        window.clearTimeout(timer);
      }

      if (toastTimer) {
        window.clearTimeout(toastTimer);
      }

      setPointerCursor(false);
    };
  }, []);

  return (
    <>
      <canvas aria-hidden="true" className={styles.canvas} ref={canvasRef} />
      {toastVisible ? (
        <div aria-live="polite" className={styles.toast} role="status">
          You found it
        </div>
      ) : null}
    </>
  );
}
