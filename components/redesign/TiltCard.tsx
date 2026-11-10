"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import styles from "./TiltCard.module.css";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;

    if (!card || event.pointerType !== "mouse") {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
  };

  const reset = () => {
    const card = cardRef.current;

    if (!card) {
      return;
    }

    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div
      className={className ? `${styles.tilt} ${className}` : styles.tilt}
      onPointerLeave={reset}
      onPointerMove={move}
      ref={cardRef}
    >
      {children}
    </div>
  );
}
