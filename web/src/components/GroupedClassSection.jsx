import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const getStableIndex = (value, max) => {
  const str = String(value || "");
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  return hash % max;
};

const classAccents = [
  {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
  },
];

export default function GroupedClassSection({ title, groupBy, classes = [] }) {
  const scrollerRef = useRef(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const [isOpen, setIsOpen] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollerRef.current;

    if (!el || !isOpen) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const maxScrollLeft = el.scrollWidth - el.clientWidth;

    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 1);
  }, [isOpen]);

  useEffect(() => {
    const el = scrollerRef.current;

    if (!el || !isOpen) {
      updateScrollButtons();
      return;
    }

    requestAnimationFrame(updateScrollButtons);

    el.addEventListener("scroll", updateScrollButtons, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [updateScrollButtons, classes.length, isOpen]);

  const scrollClasses = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === "left" ? -el.clientWidth : el.clientWidth,
      behavior: "smooth",
    });
  };

  const handlePointerDown = (event) => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    isDraggingRef.current = false;
  };

  const handlePointerMove = (event) => {
    const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);

    if (deltaX > 6 || deltaY > 6) {
      isDraggingRef.current = true;
    }
  };

  const handleCardClick = (event) => {
    if (isDraggingRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const groupLabel = groupBy === "subject" ? "Subject" : "Classroom";

  const totalProjects = classes.reduce(
    (sum, c) => sum + (c.projects?.length ?? 0),
    0
  );

  return (
    <section className="w-full min-w-0">
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
            <ChevronDown
              className={[
                "h-4 w-4 text-slate-500 transition-transform",
                isOpen ? "rotate-0" : "-rotate-90",
              ].join(" ")}
            />
          </span>

          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {groupLabel}
            </span>

            <span className="mt-0.5 block truncate text-sm font-semibold text-slate-950">
              {title}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full bg-white px-2 py-1 text-xs text-slate-600 shadow-sm sm:inline-flex">
            {classes.length} {classes.length === 1 ? "class" : "classes"}
          </span>

          <span className="hidden rounded-full bg-white px-2 py-1 text-xs text-slate-600 shadow-sm sm:inline-flex">
            {totalProjects} {totalProjects === 1 ? "project" : "projects"}
          </span>

          {isOpen && (
            <div className="hidden items-center gap-2 md:flex xl:hidden">
              <button
                type="button"
                disabled={!canScrollLeft}
                onClick={() => scrollClasses("left")}
                className="rounded bg-white px-2 py-1 text-xs text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
              >
                ◀
              </button>

              <button
                type="button"
                disabled={!canScrollRight}
                onClick={() => scrollClasses("right")}
                className="rounded bg-white px-2 py-1 text-xs text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="pt-3">
          {!classes.length ? (
            <div className="rounded-md bg-slate-50 px-3 py-5 text-center text-sm text-slate-400">
              No classes
            </div>
          ) : (
            <div
              ref={scrollerRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible scroll-smooth overscroll-y-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x_pan-y] [&::-webkit-scrollbar]:hidden xl:grid xl:grid-cols-3 xl:overflow-visible xl:pb-0"
            >
              {classes.map((c) => {
                const accent =
                  classAccents[
                    getStableIndex(c.id || c.name, classAccents.length)
                  ];

                const subtitleLabel =
                  groupBy === "classroom" ? "Subject" : "Classroom";

                const subtitle =
                  groupBy === "classroom"
                    ? c.subject_name || "-"
                    : c.classroom_name || "-";

                const projectCount = c.projects?.length ?? 0;

                return (
                  <Link
                    key={c.id}
                    to={`/dashboard/teacher/classes/${c.id}/projects`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onClick={handleCardClick}
                    draggable={false}
                    className={[
                      "min-w-0 select-none flex-none basis-[calc((100%-0.75rem)/2)] snap-start overflow-hidden rounded-md border bg-white transition hover:-translate-y-0.5 hover:shadow-sm md:basis-[calc((100%-1.5rem)/3)] xl:basis-auto",
                      accent.border,
                    ].join(" ")}
                  >
                    <div className={["h-1.5 w-full", accent.bg].join(" ")} />

                    <div className="min-w-0 p-3">
                      <h5 className="truncate text-sm font-semibold text-slate-950">
                        {c.name || "-"}
                      </h5>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {subtitleLabel}:{" "}
                        <span className="font-medium text-slate-700">
                          {subtitle}
                        </span>
                      </p>

                      <div className="mt-3">
                        <span
                          className={[
                            "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                            accent.bg,
                            accent.text,
                          ].join(" ")}
                        >
                          {projectCount}{" "}
                          {projectCount === 1 ? "project" : "projects"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}