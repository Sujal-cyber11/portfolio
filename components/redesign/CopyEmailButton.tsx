"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./Contact.module.css";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      aria-label={copied ? "Email address copied" : "Copy email address"}
      className={styles.copyButton}
      onClick={copy}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" size={15} strokeWidth={1.8} />
      ) : (
        <Copy aria-hidden="true" size={15} strokeWidth={1.8} />
      )}
      <span aria-live="polite" className="visually-hidden">
        {copied ? "Email address copied" : ""}
      </span>
    </button>
  );
}
