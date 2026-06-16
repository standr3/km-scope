import { useEffect, useState } from "react";
import {
  ChartColumnStacked,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  PanelTopClose,
  PanelBottomOpen,
  Plus,
  RotateCcw,
  ChevronDown,
  BookOpenCheck,
} from "lucide-react";
import { useProjectShell } from "../context/ProjectShellContext";

export default function ProjectSidebar({ projectRole }) {
  const {
    expanded,
    setExpanded,
    setEventsRoot,
    setScoringRoot,
    actionsRef,
  } = useProjectShell();

  const canScore = projectRole === "OWNER";

  const [eventsOpen, setEventsOpen] = useState(true);
  const [scoringOpen, setScoringOpen] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setEventsRoot(null);
      setScoringRoot(null);
    }
  }, [expanded, setEventsRoot, setScoringRoot]);

  useEffect(() => {
    if (!canScore) {
      setScoringOpen(false);
      setScoringRoot(null);
    }
  }, [canScore, setScoringRoot]);

  const isMobile = () => {
    return window.matchMedia("(max-width: 767px)").matches;
  };

  const toggleSidebar = () => {
    setExpanded((current) => !current);
  };

  const openEventsFromCollapsed = () => {
    setExpanded(true);
    setEventsOpen(true);
    setScoringOpen(false);
  };

  const openScoringFromCollapsed = () => {
    if (!canScore) return;

    setExpanded(true);
    setScoringOpen(true);
    setEventsOpen(false);
  };

  const toggleEventsSection = () => {
    setEventsOpen((current) => {
      const next = !current;

      if (isMobile() && next) {
        setScoringOpen(false);
      }

      return next;
    });
  };

  const toggleScoringSection = () => {
    if (!canScore) return;

    setScoringOpen((current) => {
      const next = !current;

      if (isMobile() && next) {
        setEventsOpen(false);
      }

      return next;
    });
  };

  return (
    <aside
      className={[
        "z-30 overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-200",

        // Mobile: bottom bar / bottom sheet.
        "absolute inset-x-0 bottom-0 border-t",
        expanded ? "h-[70vh]" : "h-14",

        // Desktop: left sidebar. Width is controlled by ProjectShell.
        "md:relative md:inset-auto md:h-full md:w-full md:border-r md:border-t-0",
      ].join(" ")}
    >
      <div className="flex h-full flex-col">
        {!expanded && (
          <>
            <div
              className={[
                "grid h-14 shrink-0 items-center bg-white md:hidden",
                canScore ? "grid-cols-4" : "grid-cols-3",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                title="Expand"
              >
                <PanelBottomOpen size={18} />
              </button>

              <button
                type="button"
                onClick={() => actionsRef.current.addNode?.()}
                className="flex h-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                title="New concept"
              >
                <Plus size={18} />
              </button>

              {canScore && (
                <button
                  type="button"
                  onClick={openScoringFromCollapsed}
                  className="flex h-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                  title="Scoring"
                >
                  <ChartColumnStacked size={18} />
                </button>
              )}

              <button
                type="button"
                onClick={openEventsFromCollapsed}
                className="flex h-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                title="Event log"
              >
                <ScrollText size={18} />
              </button>
            </div>

            <div className="hidden h-full flex-col bg-white md:flex">
              <div className="flex h-14 shrink-0 items-center justify-center border-b border-slate-200">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                  title="Expand"
                >
                  <PanelLeftOpen size={18} />
                </button>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <button
                  type="button"
                  onClick={() => actionsRef.current.addNode?.()}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                  title="New concept"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-2 border-t border-slate-200 py-3">
                {canScore && (
                  <button
                    type="button"
                    onClick={openScoringFromCollapsed}
                    className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                    title="Scoring"
                  >
                    <ChartColumnStacked size={18} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={openEventsFromCollapsed}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                  title="Event log"
                >
                  <ScrollText size={18} />
                </button>
              </div>
            </div>
          </>
        )}

        {expanded && (
          <>
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white p-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                title="Collapse"
              >
                <span className="hidden md:inline-flex">
                  <PanelLeftClose size={18} />
                </span>

                <span className="inline-flex md:hidden">
                  <PanelTopClose size={18} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => actionsRef.current.addNode?.()}
                className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-slate-800 px-3 text-sm font-semibold text-white hover:bg-slate-700"
                title="New concept"
              >
                <Plus size={17} className="shrink-0" />
                <span className="truncate">New concept</span>
              </button>
            </div>

            <div className="min-h-0 flex flex-1 flex-col overflow-hidden bg-white">
              {canScore && (
                <section
                  className={[
                    "flex min-h-0 flex-col border-b border-slate-200 transition-all duration-200",
                    scoringOpen ? "flex-1" : "h-9 shrink-0",
                  ].join(" ")}
                >
                  <div className="flex h-9 shrink-0 items-center gap-2 border-b border-slate-200 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <button
                      type="button"
                      onClick={toggleScoringSection}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-slate-700"
                    >
                      <ChartColumnStacked size={15} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate">Scoring</span>
                      <ChevronDown
                        size={15}
                        className={[
                          "shrink-0 transition-transform duration-200",
                          scoringOpen ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => actionsRef.current.scoreSession?.()}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Score session"
                    >
                      <BookOpenCheck size={14} />
                    </button>
                  </div>

                  {scoringOpen && (
                    <div
                      ref={setScoringRoot}
                      className="min-h-0 flex-1 overflow-hidden bg-white"
                    />
                  )}
                </section>
              )}

              <section
                className={[
                  "flex min-h-0 flex-col transition-all duration-200",
                  eventsOpen ? "flex-1" : "h-9 shrink-0",
                ].join(" ")}
              >
                <div className="flex h-9 shrink-0 items-center gap-2 border-b border-slate-200 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={toggleEventsSection}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-slate-700"
                  >
                    <ScrollText size={15} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">Event log</span>
                    <ChevronDown
                      size={15}
                      className={[
                        "shrink-0 transition-transform duration-200",
                        eventsOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  {canScore && (
                    <button
                      type="button"
                      onClick={() => actionsRef.current.clearProjectState?.()}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Reset project state"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>

                {eventsOpen && (
                  <div
                    ref={setEventsRoot}
                    className="min-h-0 flex-1 overflow-hidden bg-white"
                  />
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}