import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
} from "lucide-react";

const CLASS_ACCENTS = [
  {
    bar: "bg-emerald-500",
    background: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  {
    bar: "bg-sky-500",
    background: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  {
    bar: "bg-violet-500",
    background: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
  },
  {
    bar: "bg-amber-500",
    background: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  {
    bar: "bg-rose-500",
    background: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
  },
];

function getStableIndex(value, max) {
  const text = String(value || "");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash =
      (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash % max;
}

function getClassAccent(classItem) {
  const stableValue =
    classItem.id ??
    classItem.name ??
    "class";

  return CLASS_ACCENTS[
    getStableIndex(
      stableValue,
      CLASS_ACCENTS.length
    )
  ];
}

function getClassSubtitle(
  classItem,
  groupBy
) {
  if (groupBy === "classroom") {
    return {
      label: "Subject",
      value:
        classItem.subject_name ||
        "No subject",
    };
  }

  return {
    label: "Classroom",
    value:
      classItem.classroom_name ||
      "No classroom",
  };
}

function ScrollButton({
  direction,
  disabled,
  onClick,
}) {
  const isLeft = direction === "left";
  const Icon = isLeft
    ? ChevronLeft
    : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        isLeft
          ? "Scroll classes left"
          : "Scroll classes right"
      }
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon
        className="h-4 w-4"
        strokeWidth={1.8}
      />
    </button>
  );
}

function ClassCard({
  classItem,
  groupBy,
  onPointerDown,
  onPointerMove,
  onClick,
}) {
  const accent =
    getClassAccent(classItem);

  const subtitle =
    getClassSubtitle(
      classItem,
      groupBy
    );

  const projects =
    classItem.projects ?? [];

  const projectCount =
    projects.length;

  return (
    <Link
      to={`/dashboard/teacher/classes/${classItem.id}/projects`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onClick={onClick}
      draggable={false}
      className={[
        "group min-w-0 select-none flex-none basis-[calc((100%_-_0.75rem)/2)] snap-start overflow-hidden rounded-2xl border bg-white transition-colors",
        "hover:border-slate-300 hover:bg-slate-50/60",
        "md:basis-[calc((100%_-_1.5rem)/3)]",
        "xl:basis-auto",
        accent.border,
      ].join(" ")}
    >
      <div
        className={[
          "h-1.5 w-full",
          accent.bar,
        ].join(" ")}
      />

      <div className="min-w-0 px-4 py-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-950 transition-colors group-hover:text-slate-700">
              {classItem.name ||
                "Untitled class"}
            </h3>

            <p className="mt-1.5 truncate text-xs text-slate-500">
              {subtitle.label}:{" "}
              <span className="font-medium text-slate-700">
                {subtitle.value}
              </span>
            </p>
          </div>

          <div
            className={[
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              accent.background,
              accent.text,
            ].join(" ")}
          >
            <FolderKanban
              className="h-4 w-4"
              strokeWidth={1.8}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span
            className={[
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              accent.background,
              accent.text,
            ].join(" ")}
          >
            {projectCount}{" "}
            {projectCount === 1
              ? "project"
              : "projects"}
          </span>

          <span className="text-xs font-medium text-blue-500 transition-colors group-hover:text-blue-700">
            Open class
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function GroupedClassSection({
  title,
  groupBy,
  classes = [],
}) {
  const contentId = useId();
  const scrollerRef = useRef(null);

  const pointerStartRef = useRef({
    x: 0,
    y: 0,
  });

  const isDraggingRef =
    useRef(false);

  const [isOpen, setIsOpen] =
    useState(true);

  const [
    canScrollLeft,
    setCanScrollLeft,
  ] = useState(false);

  const [
    canScrollRight,
    setCanScrollRight,
  ] = useState(false);

  const updateScrollButtons =
    useCallback(() => {
      const scroller =
        scrollerRef.current;

      if (!scroller || !isOpen) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      const maximumScrollLeft =
        scroller.scrollWidth -
        scroller.clientWidth;

      setCanScrollLeft(
        scroller.scrollLeft > 1
      );

      setCanScrollRight(
        scroller.scrollLeft <
          maximumScrollLeft - 1
      );
    }, [isOpen]);

  useEffect(() => {
    const scroller =
      scrollerRef.current;

    if (!scroller || !isOpen) {
      updateScrollButtons();
      return undefined;
    }

    const frameId =
      window.requestAnimationFrame(
        updateScrollButtons
      );

    scroller.addEventListener(
      "scroll",
      updateScrollButtons,
      {
        passive: true,
      }
    );

    const resizeObserver =
      new ResizeObserver(
        updateScrollButtons
      );

    resizeObserver.observe(scroller);

    return () => {
      window.cancelAnimationFrame(
        frameId
      );

      scroller.removeEventListener(
        "scroll",
        updateScrollButtons
      );

      resizeObserver.disconnect();
    };
  }, [
    updateScrollButtons,
    classes.length,
    isOpen,
  ]);

  const scrollClasses = (
    direction
  ) => {
    const scroller =
      scrollerRef.current;

    if (!scroller) {
      return;
    }

    const distance =
      Math.max(
        scroller.clientWidth * 0.85,
        240
      );

    scroller.scrollBy({
      left:
        direction === "left"
          ? -distance
          : distance,
      behavior: "smooth",
    });
  };

  const handlePointerDown = (
    event
  ) => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    isDraggingRef.current =
      false;
  };

  const handlePointerMove = (
    event
  ) => {
    const horizontalDistance =
      Math.abs(
        event.clientX -
          pointerStartRef.current.x
      );

    const verticalDistance =
      Math.abs(
        event.clientY -
          pointerStartRef.current.y
      );

    if (
      horizontalDistance > 6 ||
      verticalDistance > 6
    ) {
      isDraggingRef.current =
        true;
    }
  };

  const handleCardClick = (
    event
  ) => {
    if (!isDraggingRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    isDraggingRef.current =
      false;
  };

  const groupLabel =
    groupBy === "subject"
      ? "Subject"
      : "Classroom";

  const totalProjects =
    classes.reduce(
      (total, classItem) =>
        total +
        (classItem.projects?.length ??
          0),
      0
    );

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex min-w-0 items-center justify-between gap-3 bg-slate-50/70 px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() =>
            setIsOpen(
              (currentValue) =>
                !currentValue
            )
          }
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950">
            <ChevronDown
              className={[
                "h-4 w-4 transition-transform duration-200",
                isOpen
                  ? "rotate-0"
                  : "-rotate-90",
              ].join(" ")}
              strokeWidth={1.8}
            />
          </span>

          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {groupLabel}
            </span>

            <span className="mt-1 block truncate text-sm font-semibold text-slate-950">
              {title}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-3 text-xs sm:flex">
            <span className="text-slate-500">
              Classes:
            </span>

            <span className="font-semibold text-slate-950">
              {classes.length}
            </span>

            <span
              aria-hidden="true"
              className="h-4 border-l border-slate-300"
            />

            <span className="text-slate-500">
              Projects:
            </span>

            <span className="font-semibold text-slate-950">
              {totalProjects}
            </span>
          </div>

          {isOpen && (
            <div className="hidden items-center gap-2 md:flex xl:hidden">
              <ScrollButton
                direction="left"
                disabled={!canScrollLeft}
                onClick={() =>
                  scrollClasses("left")
                }
              />

              <ScrollButton
                direction="right"
                disabled={!canScrollRight}
                onClick={() =>
                  scrollClasses("right")
                }
              />
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          id={contentId}
          className="border-t border-slate-100 p-3 sm:p-4"
        >
          {!classes.length ? (
            <div className="grid min-h-[150px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No classes
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  This section does not contain any classes.
                </p>
              </div>
            </div>
          ) : (
            <div
              ref={scrollerRef}
              className={[
                "flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden scroll-smooth pb-1",
                "overscroll-x-contain [scrollbar-gutter:stable]",
                "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                "[touch-action:pan-x_pan-y]",
                "xl:grid xl:grid-cols-3 xl:overflow-visible xl:pb-0",
              ].join(" ")}
            >
              {classes.map(
                (classItem) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    groupBy={groupBy}
                    onPointerDown={
                      handlePointerDown
                    }
                    onPointerMove={
                      handlePointerMove
                    }
                    onClick={
                      handleCardClick
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}