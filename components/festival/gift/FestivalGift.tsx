"use client";

import type { CSSProperties, ReactNode } from "react";
import type { FestivalGiftConfig } from "@/lib/schema";
import styles from "./FestivalGift.module.css";

interface FestivalGiftProps {
  gift: FestivalGiftConfig;
  festivalName: string;
  opened: boolean;
  onOpen?: () => void;
  interactive?: boolean;
  className?: string;
}

function Sweets(): ReactNode {
  return (
    <g className={styles.sweets}>
      <g className={styles.sweet}>
        <circle cx="96" cy="130" fill="#f2a93b" r="15" />
        <circle cx="91" cy="125" fill="#ffd27a" r="2" />
        <circle cx="101" cy="127" fill="#ffd27a" r="2" />
        <circle cx="96" cy="136" fill="#ffd27a" r="2" />
      </g>

      <g className={styles.sweet}>
        <polygon
          fill="#f4e6c8"
          points="132,111 148,128 132,145 116,128"
          stroke="#c9a24b"
          strokeWidth="2"
        />
        <polygon
          fill="none"
          points="132,118 141,128 132,138 123,128"
          stroke="#d9b96a"
          strokeWidth="1"
        />
      </g>

      <g className={styles.sweet}>
        <path
          d="M166 132c-13-14 13-24 11-5-2 11-17 10-14-1 2-8 13-6 10 1"
          fill="none"
          stroke="#e86a2d"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </g>

      <g className={styles.sweet}>
        <rect
          fill="#e7a6c8"
          height="20"
          rx="4"
          stroke="#c76e9e"
          width="24"
          x="76"
          y="100"
        />
        <path
          d="M81 106h14M81 112h14"
          stroke="#f6d4e5"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </g>
    </g>
  );
}

function Sparkles(): ReactNode {
  const sparkles = [
    [58, 94],
    [202, 104],
    [74, 172],
    [190, 176],
    [130, 66],
    [214, 142],
  ];

  return (
    <g className={styles.sparkles}>
      {sparkles.map(([x, y]) => (
        <path
          className={styles.sparkle}
          d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`}
          key={`${x}-${y}`}
        />
      ))}
    </g>
  );
}

function GiftSvg({
  gift,
  opened,
}: {
  gift: FestivalGiftConfig;
  opened: boolean;
}): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className={styles.svg}
      focusable="false"
      viewBox="0 0 260 260"
    >
      <ellipse className={styles.shadow} cx="130" cy="232" rx="78" ry="11" />

      <g className={styles.box}>
        <rect
          className={styles.body}
          height="82"
          rx="10"
          width="120"
          x="70"
          y="142"
        />
        <rect
          className={styles.bodyHighlight}
          height="8"
          rx="4"
          width="94"
          x="83"
          y="152"
        />
        <rect
          className={styles.ribbon}
          height="82"
          width="18"
          x="121"
          y="142"
        />
        <rect
          className={styles.ribbon}
          height="10"
          width="120"
          x="70"
          y="177"
        />
      </g>

      {opened && gift.type === "sweets" ? <Sweets /> : null}

      <g className={styles.lid}>
        <rect
          className={styles.lidPanel}
          height="34"
          rx="9"
          width="144"
          x="58"
          y="112"
        />
        <rect
          className={styles.ribbon}
          height="34"
          width="18"
          x="121"
          y="112"
        />
        <path
          className={styles.bow}
          d="M130 112c-4-15-24-18-28-5-3 10 13 13 28 5Zm0 0c4-15 24-18 28-5 3 10-13 13-28 5Z"
        />
        <circle className={styles.bowKnot} cx="130" cy="111" r="4" />
      </g>

      {opened ? <Sparkles /> : null}
    </svg>
  );
}

export function FestivalGift({
  gift,
  festivalName,
  opened,
  onOpen,
  interactive = true,
  className,
}: FestivalGiftProps) {
  const classes = [styles.wrap, opened ? styles.open : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  const style = {
    "--gift-body": gift.palette.body,
    "--gift-lid": gift.palette.lid,
    "--gift-ribbon": gift.palette.ribbon,
    "--gift-glow": gift.palette.glow,
  } as CSSProperties;

  if (!interactive) {
    return (
      <div
        aria-label={`${festivalName} gift`}
        className={classes}
        role="img"
        style={style}
      >
        <GiftSvg gift={gift} opened={opened} />
      </div>
    );
  }

  return (
    <div className={classes} style={style}>
      <button
        aria-expanded={opened}
        aria-label="Open your gift"
        className={styles.button}
        onClick={() => {
          if (!opened) {
            onOpen?.();
          }
        }}
        type="button"
      >
        <GiftSvg gift={gift} opened={opened} />
      </button>
      <span className="visually-hidden" role="status">
        {opened ? "Your gift is open." : ""}
      </span>
    </div>
  );
}
