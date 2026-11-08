"use client";

import { useEffect, useRef, useState } from "react";
import { playFestivalChime } from "@/components/festival/audio/festival-audio";
import {
  getWindForce,
  isInteractivePointerTarget,
  isLanternHit,
  recordLanternBurst,
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
  windX: number;
  windY: number;
  windVX: number;
  windVY: number;
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
    0.84 +
    0.16 * Math.sin(time * 0.006 + phase * 5) * Math.sin(time * 0.003 + phase);

  context.save();
  context.translate(x, y);
  context.globalAlpha = 0.58 + depth * 0.42;

  const halo = context.createRadialGradient(0, 0, 0, 0, 0, width * 1.7);
  halo.addColorStop(0, `rgba(255, 150, 60, ${0.16 * flicker})`);
  halo.addColorStop(1, "rgba(255, 100, 30, 0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(0, 0, width * 1.7, 0, Math.PI * 2);
  context.fill();

  const body = context.createLinearGradient(0, -height / 2, 0, height / 2);
  body.addColorStop(0, "#ffb347");
  body.addColorStop(0.45, "#ff7a2f");
  body.addColorStop(1, "#c92b1d");
  context.fillStyle = body;
  context.beginPath();
  context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.beginPath();
  context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
  context.clip();

  context.strokeStyle = "rgba(70, 15, 5, 0.25)";
  context.lineWidth = 1;

  for (let rib = -1; rib <= 1; rib += 1) {
    context.beginPath();
    context.moveTo(rib * width * 0.22, -height / 2);
    context.quadraticCurveTo(
      rib * width * 0.3,
      0,
      rib * width * 0.22,
      height / 2,
    );
    context.stroke();
  }

  context.restore();

  context.fillStyle = "#3a1408";
  context.fillRect(-width * 0.25, -height * 0.56, width * 0.5, height * 0.07);
  context.fillRect(-width * 0.25, height * 0.49, width * 0.5, height * 0.06);

  const glow = context.createRadialGradient(
    0,
    height * 0.46,
    0,
    0,
    height * 0.46,
    width * 0.54,
  );
  glow.addColorStop(0, `rgba(255, 230, 140, ${0.9 * flicker})`);
  glow.addColorStop(0.5, `rgba(255, 160, 60, ${0.5 * flicker})`);
  glow.addColorStop(1, "rgba(255, 130, 40, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.ellipse(
    0,
    height * 0.46,
    width * 0.48,
    height * 0.22,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();

  context.strokeStyle = "rgba(255, 210, 120, 0.75)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, height * 0.55);
  context.lineTo(0, height * 0.7);
  context.stroke();

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
        windX: 0,
        windY: 0,
        windVX: 0,
        windVY: 0,
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

      pointerActive = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerOverInteractive = isInteractivePointerTarget(event.target);
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

      for (const lantern of lanterns) {
        const sway =
          Math.sin(time * lantern.swaySpeed + lantern.phase) *
          lantern.swayAmplitude;
        const centerX = lantern.baseX + sway + lantern.windX;
        const centerY = lantern.y + lantern.windY;

        if (finePointer && pointerActive) {
          const force = getWindForce(
            { x: pointerX, y: pointerY },
            { x: centerX, y: centerY },
            WIND_RADIUS,
          );

          if (force.strength > 0) {
            lantern.windVX += force.x * force.strength * 320 * delta;
            lantern.windVY += force.y * force.strength * 160 * delta;
          }
        }

        lantern.windVX += (-lantern.windX * 2.6 - lantern.windVX * 3.4) * delta;
        lantern.windVY += (-lantern.windY * 2.6 - lantern.windVY * 3.4) * delta;
        lantern.windX += lantern.windVX * delta;
        lantern.windY += lantern.windVY * delta;
        lantern.y -= lantern.speed * delta;
        lantern.renderX =
          lantern.baseX +
          Math.sin(time * lantern.swaySpeed + lantern.phase) *
            lantern.swayAmplitude +
          lantern.windX;
        lantern.renderY = lantern.y + lantern.windY;

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

      const delta = Math.min(0.033, Math.max(0.001, (time - lastFrame) / 1000));
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
