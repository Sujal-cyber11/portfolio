"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { SweetImageMap } from "@/lib/gift-images";
import type { FestivalGiftConfig } from "@/lib/schema";
import styles from "./FestivalGift.module.css";

interface FestivalGiftProps {
  gift: FestivalGiftConfig;
  festivalName: string;
  opened: boolean;
  images?: SweetImageMap;
  onOpen?: () => void;
  interactive?: boolean;
  className?: string;
}

interface SweetFrameProps {
  x: number;
  y: number;
  size?: number;
  image?: string;
  label: string;
  children: ReactNode;
}

function SweetFrame({
  x,
  y,
  size = 48,
  image,
  label,
  children,
}: SweetFrameProps): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={styles.sweet}>
        {image ? (
          <foreignObject height={size} width={size} x={-size / 2} y={-size / 2}>
            <Image
              alt={label}
              className={styles.sweetPhoto}
              height={size}
              src={image}
              width={size}
            />
          </foreignObject>
        ) : (
          children
        )}
      </g>
    </g>
  );
}

function LadduArt(): ReactNode {
  const boondi: Array<[number, number, number]> = [
    [-12, -8, 2.2],
    [-6, -14, 1.8],
    [2, -15, 2],
    [10, -10, 2.2],
    [14, -2, 1.8],
    [16, 7, 2.1],
    [9, 14, 2],
    [0, 17, 2.2],
    [-9, 13, 1.8],
    [-16, 6, 2.1],
    [-17, -3, 1.9],
    [-4, -4, 1.6],
    [6, -2, 1.9],
    [11, 8, 1.7],
    [-12, 7, 1.8],
    [2, 8, 1.6],
  ];

  return (
    <g className={styles.sweetArt}>
      <circle fill="url(#gift-laddu)" r="23" />
      {boondi.map(([x, y, radius]) => (
        <circle
          cx={x}
          cy={y}
          fill="rgba(120, 53, 15, 0.32)"
          key={`${x}-${y}`}
          r={radius}
        />
      ))}
      <ellipse
        cx="-8"
        cy="-9"
        fill="url(#gift-sweet-sheen)"
        opacity="0.6"
        rx="9"
        ry="6"
        transform="rotate(-20)"
      />
      <path d="M -10 -20 Q 0 -26 10 -20 Q 0 -16 -10 -20 Z" fill="#6b8f3c" />
    </g>
  );
}

function KajuKatliArt(): ReactNode {
  return (
    <g className={styles.sweetArt}>
      <polygon
        fill="url(#gift-kaju)"
        points="0,-26 32,0 0,26 -32,0"
        stroke="#d4c9a3"
        strokeWidth="1.5"
      />
      <polygon
        fill="none"
        opacity="0.85"
        points="0,-22 27,0 0,22 -27,0"
        stroke="#fffdf4"
        strokeWidth="1.2"
      />
      <path
        d="M -22 -4 Q -12 -13 0 -18 Q 12 -13 22 -4"
        fill="none"
        opacity="0.55"
        stroke="#ffffff"
        strokeWidth="1.2"
      />
      <path
        d="M -18 4 Q -8 -3 2 -8 Q 12 -3 20 4"
        fill="none"
        opacity="0.32"
        stroke="#ffffff"
        strokeWidth="1"
      />
      <polygon fill="#f8f4df" opacity="0.9" points="6,-10 12,-4 4,-2" />
    </g>
  );
}

function JalebiArt(): ReactNode {
  return (
    <g className={styles.sweetArt}>
      <path
        d="M4 2C22 4 24-18 4-20-18-22-26 2-10 16 8 32 34 16 28-8 24-28 0-32-18-18"
        fill="none"
        stroke="url(#gift-jalebi)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
      <path
        d="M2 0C18 2 20-16 3-18-16-20-23 2-9 14 7 29 31 14 25-7"
        fill="none"
        opacity="0.5"
        stroke="#ffd27a"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <circle cx="27" cy="18" fill="#e86a2d" r="2.4" />
      <circle cx="-24" cy="-9" fill="#e86a2d" r="1.8" />
      <circle cx="18" cy="-24" fill="#e86a2d" r="1.6" />
    </g>
  );
}

function BarfiArt(): ReactNode {
  return (
    <g className={styles.sweetArt}>
      <rect
        fill="url(#gift-barfi)"
        height="33"
        rx="4"
        stroke="#d48aa9"
        strokeWidth="1.2"
        width="52"
        x="-26"
        y="-17"
      />
      <rect
        fill="#fff3e6"
        height="9"
        opacity="0.85"
        rx="4"
        width="52"
        x="-26"
        y="-17"
      />
      <path
        d="M -18 -9 L 18 12 M -8 -14 L 23 5 M -24 -1 L 5 15 M 0 -13 L 26 -3"
        fill="none"
        opacity="0.3"
        stroke="#c76e9e"
        strokeWidth="1"
      />
      <path
        d="M -18 12 L 18 -9 M -8 14 L 23 -5 M -24 1 L 5 -15 M 0 13 L 26 3"
        fill="none"
        opacity="0.22"
        stroke="#c76e9e"
        strokeWidth="1"
      />
      <rect
        fill="#6b8f3c"
        height="5"
        rx="1.5"
        transform="rotate(-18 -9 -9)"
        width="9"
        x="-13"
        y="-11"
      />
      <rect
        fill="#7fa34c"
        height="4"
        rx="1.5"
        transform="rotate(24 11 -7)"
        width="8"
        x="7"
        y="-9"
      />
      <ellipse
        fill="#efd7b0"
        rx="5"
        ry="2.2"
        transform="rotate(-24 4 6)"
        cx="4"
        cy="6"
      />
      <ellipse
        fill="#e7c893"
        rx="4.5"
        ry="2"
        transform="rotate(28 -6 8)"
        cx="-6"
        cy="8"
      />
    </g>
  );
}

function Sweets({ images }: { images?: SweetImageMap }): ReactNode {
  return (
    <g className={styles.sweets}>
      <SweetFrame image={images?.laddu} label="Laddu" x={88} y={124}>
        <LadduArt />
      </SweetFrame>
      <SweetFrame
        image={images?.kajuKatli}
        label="Kaju katli"
        size={52}
        x={137}
        y={111}
      >
        <KajuKatliArt />
      </SweetFrame>
      <SweetFrame image={images?.jalebi} label="Jalebi" x={176} y={134}>
        <JalebiArt />
      </SweetFrame>
      <SweetFrame image={images?.barfi} label="Barfi" size={50} x={112} y={96}>
        <BarfiArt />
      </SweetFrame>
    </g>
  );
}

function Sparkles(): ReactNode {
  const sparkles = [
    [48, 84],
    [212, 104],
    [64, 172],
    [198, 176],
    [130, 58],
    [220, 142],
  ];

  return (
    <g className={styles.sparkles}>
      {sparkles.map(([x, y]) => (
        <path
          className={styles.sparkle}
          d={`M${x} ${y - 8} L${x + 2.3} ${y - 2.3} L${x + 8} ${y} L${x + 2.3} ${y + 2.3} L${x} ${y + 8} L${x - 2.3} ${y + 2.3} L${x - 8} ${y} L${x - 2.3} ${y - 2.3} Z`}
          key={`${x}-${y}`}
        />
      ))}
    </g>
  );
}

function GiftSvg({
  gift,
  opened,
  images,
}: {
  gift: FestivalGiftConfig;
  opened: boolean;
  images?: SweetImageMap;
}): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className={styles.svg}
      focusable="false"
      viewBox="0 0 260 260"
    >
      <defs>
        <radialGradient id="gift-laddu" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffe29a" />
          <stop offset="0.5" stopColor="#f2a93b" />
          <stop offset="1" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="gift-sweet-sheen" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fffdf0" />
          <stop offset="1" stopColor="#fffdf0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gift-kaju" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fffdf2" />
          <stop offset="0.55" stopColor="#f1ead3" />
          <stop offset="1" stopColor="#d9cfae" />
        </linearGradient>
        <linearGradient id="gift-jalebi" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="0.5" stopColor="#e86a2d" />
          <stop offset="1" stopColor="#b73a16" />
        </linearGradient>
        <linearGradient id="gift-barfi" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f6d4e5" />
          <stop offset="0.55" stopColor="#e7a6c8" />
          <stop offset="1" stopColor="#c76e9e" />
        </linearGradient>
      </defs>

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

      {opened && gift.type === "sweets" ? <Sweets images={images} /> : null}

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
  images,
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
        <GiftSvg gift={gift} images={images} opened={opened} />
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
        <GiftSvg gift={gift} images={images} opened={opened} />
      </button>
      <span className="visually-hidden" role="status">
        {opened ? "Your gift is open." : ""}
      </span>
    </div>
  );
}
