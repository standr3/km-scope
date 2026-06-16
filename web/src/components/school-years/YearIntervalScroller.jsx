import React, { useEffect, useMemo, useRef, useState } from "react";
import SchoolYearRecordModal from "./SchoolYearRecordModal";

const ITEM_HEIGHT = 64;
const ITEM_GAP = 12;
const ITEM_SIZE = ITEM_HEIGHT + ITEM_GAP;
const EDGE_PEEK = 24;
const OVERSCAN = 4;

const TOTAL_INTERVALS = 10001;

const WHEEL_FORCE = 0.1;
const FRICTION = 0.91;
const MIN_VELOCITY = 0.35;
const SNAP_DELAY = 120;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function normalizeWheelDelta(event, viewportHeight) {
  if (event.deltaMode === 1) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === 2) {
    return event.deltaY * viewportHeight;
  }

  return event.deltaY;
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function YearIntervalScroller({
  value,
  onChange,
  currentStartYear = new Date().getFullYear(),
  records = {},
  canCreate = true,
  onSaveRecord,
  onDeleteRecord,
  isSaving = false,
  isDeleting = false,
  showDebug = false,
  className = "",
}) {
  const scrollContainerRef = useRef(null);
  const snapTimeoutRef = useRef(null);
  const scrollStateFrameRef = useRef(null);
  const inertiaFrameRef = useRef(null);
  const velocityRef = useRef(0);
  const isSnappingRef = useRef(false);

  const baseYear = currentStartYear - Math.floor(TOTAL_INTERVALS / 2);
  const totalHeight = TOTAL_INTERVALS * ITEM_SIZE;

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedStartYear = value ?? currentStartYear;
  const selectedRecord = records[selectedStartYear];
  const hasSelectedRecord = Boolean(selectedRecord);

  const registeredYears = useMemo(() => {
    return Object.keys(records)
      .map(Number)
      .filter((year) => Number.isFinite(year))
      .sort((firstYear, secondYear) => firstYear - secondYear);
  }, [records]);

  const registeredCount = registeredYears.length;
  const firstRegisteredYear = registeredYears[0] ?? null;
  const lastRegisteredYear = registeredYears[registeredYears.length - 1] ?? null;
  const hasRegisteredIntervals = registeredCount > 0;

  const currentIndex = clamp(
    currentStartYear - baseYear,
    0,
    TOTAL_INTERVALS - 1
  );

  const maxScrollTop = Math.max(0, totalHeight - viewportHeight);

  const getYearByIndex = (index) => {
    return baseYear + index;
  };

  const getIndexByYear = (year) => {
    return clamp(year - baseYear, 0, TOTAL_INTERVALS - 1);
  };

  const getSnappedScrollTop = (index) => {
    return clamp(index * ITEM_SIZE - EDGE_PEEK, 0, maxScrollTop);
  };

  const getNearestIndex = (rawScrollTop) => {
    return clamp(
      Math.round((rawScrollTop + EDGE_PEEK) / ITEM_SIZE),
      0,
      TOTAL_INTERVALS - 1
    );
  };

  const stopInertia = () => {
    window.cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
    velocityRef.current = 0;
  };

  const snapToNearestInterval = () => {
    const element = scrollContainerRef.current;

    if (!element) return;

    const nearestIndex = getNearestIndex(element.scrollTop);
    const snappedTop = getSnappedScrollTop(nearestIndex);
    const distance = Math.abs(element.scrollTop - snappedTop);

    if (distance < 1) {
      return;
    }

    isSnappingRef.current = true;

    element.scrollTo({
      top: snappedTop,
      behavior: "smooth",
    });

    window.setTimeout(() => {
      isSnappingRef.current = false;
    }, 260);
  };

  const scheduleSnap = () => {
    window.clearTimeout(snapTimeoutRef.current);

    snapTimeoutRef.current = window.setTimeout(() => {
      if (!isSnappingRef.current) {
        snapToNearestInterval();
      }
    }, SNAP_DELAY);
  };

  const runInertia = () => {
    const element = scrollContainerRef.current;

    if (!element) return;

    const nextScrollTop = clamp(
      element.scrollTop + velocityRef.current,
      0,
      maxScrollTop
    );

    element.scrollTop = nextScrollTop;
    velocityRef.current *= FRICTION;

    const reachedTop = nextScrollTop <= 0 && velocityRef.current < 0;
    const reachedBottom =
      nextScrollTop >= maxScrollTop && velocityRef.current > 0;

    if (
      Math.abs(velocityRef.current) < MIN_VELOCITY ||
      reachedTop ||
      reachedBottom
    ) {
      stopInertia();
      scheduleSnap();
      return;
    }

    inertiaFrameRef.current = window.requestAnimationFrame(runInertia);
  };

  const startInertia = () => {
    if (inertiaFrameRef.current) {
      return;
    }

    inertiaFrameRef.current = window.requestAnimationFrame(runInertia);
  };

  const scrollToIndex = (index, behavior = "smooth") => {
    const element = scrollContainerRef.current;

    if (!element) return;

    stopInertia();

    isSnappingRef.current = true;

    element.scrollTo({
      top: getSnappedScrollTop(index),
      behavior,
    });

    window.setTimeout(() => {
      isSnappingRef.current = false;
    }, behavior === "auto" ? 0 : 260);
  };

  const goToYear = (startYear) => {
    if (startYear == null) return;

    onChange?.(startYear);
    scrollToIndex(getIndexByYear(startYear), "smooth");
  };

  const goToCurrentInterval = () => {
    goToYear(currentStartYear);
  };

  const goToFirstRegisteredInterval = () => {
    goToYear(firstRegisteredYear);
  };

  const goToLastRegisteredInterval = () => {
    goToYear(lastRegisteredYear);
  };

  useEffect(() => {
    const element = scrollContainerRef.current;

    if (!element) return;

    const updateViewportHeight = () => {
      setViewportHeight(element.clientHeight);
    };

    updateViewportHeight();

    const resizeObserver = new ResizeObserver(updateViewportHeight);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!viewportHeight) return;

    scrollToIndex(currentIndex, "auto");
  }, [viewportHeight, currentIndex]);

  useEffect(() => {
    const element = scrollContainerRef.current;

    if (!element) return;

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      window.clearTimeout(snapTimeoutRef.current);

      const normalizedDelta = normalizeWheelDelta(event, viewportHeight);

      velocityRef.current = clamp(
        velocityRef.current + normalizedDelta * WHEEL_FORCE,
        -ITEM_SIZE * 2.5,
        ITEM_SIZE * 2.5
      );

      startInertia();
    };

    element.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [viewportHeight, maxScrollTop]);

  useEffect(() => {
    return () => {
      window.clearTimeout(snapTimeoutRef.current);
      window.cancelAnimationFrame(scrollStateFrameRef.current);
      window.cancelAnimationFrame(inertiaFrameRef.current);
    };
  }, []);

  const handleScroll = () => {
    const element = scrollContainerRef.current;

    if (!element) return;

    window.cancelAnimationFrame(scrollStateFrameRef.current);

    scrollStateFrameRef.current = window.requestAnimationFrame(() => {
      setScrollTop(element.scrollTop);
    });
  };

  const visibleStartIndex = clamp(
    Math.floor(scrollTop / ITEM_SIZE),
    0,
    TOTAL_INTERVALS - 1
  );

  const visibleEndIndex = clamp(
    Math.ceil((scrollTop + viewportHeight) / ITEM_SIZE),
    0,
    TOTAL_INTERVALS - 1
  );

  const renderStartIndex = clamp(
    visibleStartIndex - OVERSCAN,
    0,
    TOTAL_INTERVALS - 1
  );

  const renderEndIndex = clamp(
    visibleEndIndex + OVERSCAN,
    0,
    TOTAL_INTERVALS - 1
  );

  const visibleCount = visibleEndIndex - visibleStartIndex + 1;
  const renderedCount = renderEndIndex - renderStartIndex + 1;
  const selectedIndex = getIndexByYear(selectedStartYear);

  const renderedItems = useMemo(() => {
    return Array.from({ length: renderedCount }, (_, localIndex) => {
      const index = renderStartIndex + localIndex;
      const startYear = getYearByIndex(index);

      return {
        index,
        startYear,
        endYear: startYear + 1,
      };
    });
  }, [renderStartIndex, renderedCount, baseYear]);

  const selectedLabel = `${selectedStartYear} - ${selectedStartYear + 1}`;
  const currentLabel = `${currentStartYear} - ${currentStartYear + 1}`;

  return (
    <section
      className={`grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden ${className}`}
    >
      <header className="min-h-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <h2 className="truncate text-base font-semibold text-slate-900">
                School year intervals
              </h2>

              <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                {registeredCount} registered
              </span>
            </div>

            <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">
              Manage activity date ranges by academic year.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={goToCurrentInterval}
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 sm:text-sm"
            >
              Current
            </button>

            <button
              type="button"
              onClick={goToFirstRegisteredInterval}
              disabled={!hasRegisteredIntervals}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm"
            >
              First
            </button>

            <button
              type="button"
              onClick={goToLastRegisteredInterval}
              disabled={!hasRegisteredIntervals}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm"
            >
              Last
            </button>
          </div>
        </div>
      </header>

      {showDebug && (
        <div className="mb-4 grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-5">
          <Metric label="Visible" value={visibleCount} />
          <Metric label="Rendered" value={renderedCount} />
          <Metric label="Virtual total" value={TOTAL_INTERVALS} />
          <Metric label="Registered" value={registeredCount} />
          <Metric label="Current" value={currentLabel} />
        </div>
      )}

      <div
        className={[
          "min-h-0 rounded-2xl border p-3",
          hasSelectedRecord
            ? "border-emerald-200 bg-emerald-50"
            : "border-dashed border-slate-300 bg-slate-50",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {hasSelectedRecord ? "Configured interval" : "Available interval"}
            </div>

            <div className="mt-1 truncate text-base font-semibold text-slate-900">
              {selectedLabel}
            </div>

            <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">
              {hasSelectedRecord
                ? "Activity dates are already set."
                : "No activity dates configured yet."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={[
              "w-full rounded-xl px-4 py-2 text-sm font-medium sm:w-auto",
              hasSelectedRecord
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-900 text-white hover:bg-slate-800",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {hasSelectedRecord ? "Edit" : "Create"}
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-3 shadow-sm [scrollbar-gutter:stable] sm:p-4"
      >
        <div className="relative" style={{ height: totalHeight }}>
          {renderedItems.map(({ index, startYear, endYear }) => {
            const record = records[startYear];

            const isCurrent = startYear === currentStartYear;
            const isSelected = startYear === selectedStartYear;
            const hasRecord = Boolean(record);

            return (
              <button
                key={startYear}
                type="button"
                onClick={() => onChange?.(startYear)}
                className={[
                  "absolute flex items-center justify-between rounded-2xl border px-3 text-left transition sm:px-4",
                  hasRecord
                    ? "left-0 right-1 z-10 -translate-y-0.5 border-emerald-200 bg-emerald-50 text-emerald-950 shadow-lg ring-1 ring-emerald-100"
                    : "left-4 right-6 border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                  isCurrent && !hasRecord
                    ? "border-sky-200 bg-sky-50 text-sky-900"
                    : "",
                  isSelected && !hasRecord
                    ? "border-slate-900 ring-2 ring-slate-100"
                    : "",
                  isSelected && hasRecord ? "ring-2 ring-emerald-300" : "",
                  isSelected && isCurrent && !hasRecord
                    ? "ring-2 ring-sky-200"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  top: index * ITEM_SIZE,
                  height: ITEM_HEIGHT,
                }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {hasRecord ? record.name : `${startYear} - ${endYear}`}
                  </div>

                  <div className="mt-1 truncate text-xs text-slate-500">
                    {hasRecord
                      ? `${record.startDate} → ${record.endDate}`
                      : "Click to configure activity dates"}
                  </div>
                </div>

                <div className="ml-2 flex shrink-0 items-center gap-1 sm:ml-3 sm:gap-2">
                  {hasRecord && (
                    <span className="rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">
                      Set
                    </span>
                  )}

                  {isSelected && (
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                      Selected
                    </span>
                  )}

                  {isCurrent && (
                    <span className="rounded-full bg-sky-500 px-2 py-1 text-xs font-semibold text-white">
                      Current
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showDebug && (
        <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
          <div>
            Visible index: {visibleStartIndex} - {visibleEndIndex}
          </div>

          <div>
            Render index: {renderStartIndex} - {renderEndIndex}
          </div>

          <div>Selected index: {selectedIndex}</div>

          <div>Current index: {currentIndex}</div>
        </div>
      )}

      <SchoolYearRecordModal
        isOpen={isModalOpen}
        startYear={selectedStartYear}
        record={selectedRecord}
        canCreate={canCreate}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveRecord}
        onDelete={onDeleteRecord}
      />
    </section>
  );
}