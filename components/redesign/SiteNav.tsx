"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./SiteNav.module.css";

const sectionLinks = [
  { id: "work", label: "WORK", href: "/#work" },
  { id: "achievements", label: "ACHIEVEMENTS", href: "/#achievements" },
  { id: "toolkit", label: "TOOLKIT", href: "/#toolkit" },
  { id: "contact", label: "CONTACT", href: "/#contact" },
];

const sectionIds = ["top", ...sectionLinks.map((link) => link.id)];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) {
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const marker = window.scrollY + window.innerHeight * 0.35;
      let current = sections[0].id;

      for (const section of sections) {
        if (section.offsetTop <= marker) {
          current = section.id;
        }
      }

      setActiveSection(current);
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  const isActive = (id: string) => activeSection === id;

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Primary">
        <Link
          aria-current={isActive("top") ? "page" : undefined}
          className={styles.brand}
          href="/#top"
        >
          ABOUT ME
        </Link>

        <div className={styles.links}>
          {sectionLinks.map((link) => (
            <Link
              aria-current={isActive(link.id) ? "page" : undefined}
              href={link.href}
              key={link.id}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={open}
          className={styles.menuButton}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? "CLOSE" : "MENU"}
        </button>
      </nav>

      {open ? (
        <div className={styles.mobilePanel} id="mobile-navigation">
          <Link
            aria-current={isActive("top") ? "page" : undefined}
            href="/#top"
            onClick={() => setOpen(false)}
          >
            ABOUT ME
          </Link>
          {sectionLinks.map((link) => (
            <Link
              aria-current={isActive(link.id) ? "page" : undefined}
              href={link.href}
              key={link.id}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
