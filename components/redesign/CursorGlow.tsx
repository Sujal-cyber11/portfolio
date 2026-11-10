"use client";

import { useEffect, useRef } from "react";
import styles from "./CursorGlow.module.css";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;

    if (!glow) {
      return;
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      glow.style.setProperty("--glow-x", `${event.clientX}px`);
      glow.style.setProperty("--glow-y", `${event.clientY}px`);
      glow.dataset.visible = "true";
    };

    const leave = () => {
      glow.dataset.visible = "false";
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);

    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <div aria-hidden="true" className={styles.glow} ref={glowRef} />;
}
