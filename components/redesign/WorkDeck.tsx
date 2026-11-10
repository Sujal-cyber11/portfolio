"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ProjectMockup } from "@/components/redesign/ProjectMockups";
import type { WorkProject } from "@/lib/landing-data";
import styles from "./Work.module.css";

const DESKTOP_QUERY = "(min-width: 64rem)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

interface DragState {
  startX: number;
  startScroll: number;
  dragging: boolean;
}

export function WorkDeck({ projects }: { projects: WorkProject[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const draggedRef = useRef(false);

  const [active, setActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reduced, setReduced] = useState(false);

  const total = projects.length;
  const lastIndex = total - 1;

  const setActiveIndex = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(lastIndex, index));

      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }
    },
    [lastIndex],
  );

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(lastIndex, index));
      setActiveIndex(next);

      if (isDesktop && !reduced) {
        const section = sectionRef.current;

        if (!section) {
          return;
        }

        const top = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: top + next * window.innerHeight,
          behavior: "smooth",
        });
        return;
      }

      const viewport = viewportRef.current;
      const track = trackRef.current;
      const slide = track?.children[next] as HTMLElement | undefined;

      if (viewport && slide) {
        viewport.scrollTo({
          left:
            slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2,
          behavior: "smooth",
        });
      }
    },
    [isDesktop, lastIndex, reduced, setActiveIndex],
  );

  useEffect(() => {
    const desktopMedia = window.matchMedia(DESKTOP_QUERY);
    const reducedMedia = window.matchMedia(REDUCED_QUERY);

    const update = () => {
      setIsDesktop(desktopMedia.matches);
      setReduced(reducedMedia.matches);
    };

    update();
    desktopMedia.addEventListener("change", update);
    reducedMedia.addEventListener("change", update);

    return () => {
      desktopMedia.removeEventListener("change", update);
      reducedMedia.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || reduced) {
      const track = trackRef.current;

      if (track) {
        track.style.transform = "";
      }

      return;
    }

    const section = sectionRef.current;
    const track = trackRef.current;

    if (!section || !track) {
      return;
    }

    let cancelled = false;
    let trigger: { kill: () => void } | undefined;
    let refresh = () => {};

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const slides = Array.from(track.children) as HTMLElement[];

      if (slides.length < 2) {
        return;
      }

      const setX = (progress: number) => {
        const step = slides[1].offsetLeft - slides[0].offsetLeft;
        track.style.transform = `translate3d(${-progress * (slides.length - 1) * step}px, 0, 0)`;
      };

      setX(0);

      trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${(slides.length - 1) * window.innerHeight}`,
        invalidateOnRefresh: true,
        snap: {
          snapTo: 1 / (slides.length - 1),
          duration: 0.45,
          delay: 0.04,
          ease: "power1.inOut",
        },
        onRefresh: (self) => setX(self.progress),
        onUpdate: (self) => {
          setX(self.progress);
          setActiveIndex(Math.round(self.progress * (slides.length - 1)));
        },
      });

      refresh = () => {
        ScrollTrigger.refresh();
      };

      ScrollTrigger.refresh();
      window.addEventListener("resize", refresh);
      void document.fonts?.ready.then(() => {
        if (!cancelled) {
          ScrollTrigger.refresh();
        }
      });
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", refresh);
      trigger?.kill();
      track.style.transform = "";
    };
  }, [isDesktop, reduced, setActiveIndex, total]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track || (isDesktop && !reduced)) {
      return;
    }

    const slides = Array.from(track.children) as HTMLElement[];
    let frame = 0;

    const update = () => {
      frame = 0;
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let nearest = 0;
      let distance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
        const nextDistance = Math.abs(center - slideCenter);

        if (nextDistance < distance) {
          distance = nextDistance;
          nearest = index;
        }
      });

      setActiveIndex(nearest);
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      viewport.removeEventListener("scroll", onScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [isDesktop, reduced, setActiveIndex, total]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !isDesktop ||
      reduced ||
      event.pointerType !== "mouse" ||
      (event.target as HTMLElement).closest("a,button")
    ) {
      return;
    }

    dragRef.current = {
      startX: event.clientX,
      startScroll: window.scrollY,
      dragging: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    const dx = event.clientX - drag.startX;

    if (!drag.dragging && Math.abs(dx) < 6) {
      return;
    }

    if (!drag.dragging) {
      drag.dragging = true;
      draggedRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const track = trackRef.current;
    const slides = track ? (Array.from(track.children) as HTMLElement[]) : [];

    if (slides.length < 2) {
      return;
    }

    const step = slides[1].offsetLeft - slides[0].offsetLeft;
    window.scrollTo({
      top: drag.startScroll - dx * (window.innerHeight / step),
      behavior: "auto",
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;

    if (!drag?.dragging) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const section = sectionRef.current;

    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY;
      const span = (projects.length - 1) * window.innerHeight;
      const progress = span > 0 ? (window.scrollY - top) / span : 0;
      goTo(Math.round(progress * (projects.length - 1)));
    }

    window.setTimeout(() => {
      draggedRef.current = false;
    }, 300);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeRef.current + 1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeRef.current - 1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      goTo(total - 1);
    }
  };

  return (
    <section
      aria-labelledby="work-title"
      className={styles.work}
      id="work"
      ref={sectionRef}
      style={{ "--slide-count": total } as CSSProperties}
    >
      <div className={styles.sticky}>
        <div className={styles.headerInner}>
          <div className={styles.headingRow}>
            <div className={styles.meta}>
              <p className={styles.eyebrow}>FEATURED WORK</p>
              <div className={styles.progressLabel}>
                <span aria-hidden="true">
                  {String(active + 1).padStart(2, "0")} /{" "}
                  {String(total).padStart(2, "0")}
                </span>
                <span aria-hidden="true" className={styles.progressTrack}>
                  <span
                    className={styles.progressFill}
                    style={{ transform: `scaleX(${(active + 1) / total})` }}
                  />
                </span>
              </div>
            </div>

            <div className={styles.headingWrap}>
              <h2 className={styles.heading} id="work-title">
                Work
              </h2>
              <span aria-hidden="true" className={styles.reflection}>
                Work
              </span>
            </div>
          </div>
        </div>

        <div
          aria-label="Featured work"
          aria-roledescription="carousel"
          className={styles.deckViewport}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          ref={viewportRef}
          role="region"
          tabIndex={0}
        >
          <div className={styles.deckTrack} ref={trackRef}>
            {projects.map((project, index) => {
              const isActive = index === active;

              return (
                <article
                  aria-label={`${index + 1} of ${total}`}
                  aria-roledescription="slide"
                  className={`${styles.slide} ${styles[project.tone]} ${
                    isActive ? styles.slideActive : ""
                  }`}
                  key={project.id}
                  onClick={(event) => {
                    if (isActive || draggedRef.current) {
                      return;
                    }

                    if ((event.target as HTMLElement).closest("a,button")) {
                      return;
                    }

                    goTo(index);
                  }}
                  role="group"
                >
                  <div
                    className={styles.slideTop}
                    inert={!isActive ? true : undefined}
                  >
                    <span className={styles.number}>{project.number}</span>
                    <span className={styles.topTag}>{project.topTag}</span>
                  </div>

                  <div className={styles.slideBody}>
                    <div
                      className={styles.slideCopy}
                      inert={!isActive ? true : undefined}
                    >
                      <h3 className={styles.title}>{project.title}</h3>
                      <p className={styles.description}>
                        {project.description}
                      </p>
                      <ul className={styles.tags}>
                        {project.tags.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className={styles.mockupArea}
                      inert={!isActive ? true : undefined}
                    >
                      <ProjectMockup id={project.id} />
                    </div>
                  </div>

                  <div
                    className={styles.slideBottom}
                    inert={!isActive ? true : undefined}
                  >
                    <a
                      aria-label={`Open ${project.title} repository`}
                      className={styles.projectLink}
                      href={project.repoUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>{project.title}</span>
                      <span aria-hidden="true" className={styles.circleArrow}>
                        ↗
                      </span>
                    </a>

                    {project.liveUrl ? (
                      <a
                        className={styles.liveLink}
                        href={project.liveUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Live site
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className={styles.controlsInner}>
          <div className={styles.controls}>
            <button
              aria-label="Previous project"
              className={styles.arrowButton}
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
              type="button"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              aria-label="Next project"
              className={styles.arrowButton}
              disabled={active === total - 1}
              onClick={() => goTo(active + 1)}
              type="button"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
