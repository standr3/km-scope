import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";

const REVIEW_CHOICE = {
  UP: "up",
  DOWN: "down",
};

function toVoteChoice(lastReview) {
  if (lastReview === REVIEW_CHOICE.UP) return REVIEW_CHOICE.UP;
  if (lastReview === REVIEW_CHOICE.DOWN) return REVIEW_CHOICE.DOWN;
  return null;
}

function toVerdict(choice) {
  if (choice === REVIEW_CHOICE.UP) return "ENDORSE";
  if (choice === REVIEW_CHOICE.DOWN) return "OPPOSE";
  return null;
}

function getPillToneClasses(pillColor) {
  switch (pillColor) {
    case "green":
      return {
        pill: "border border-primary text-primary bg-light-green/50",
        dot: "bg-primary",
      };
    case "orange":
      return {
        pill: "border border-[#fdc700] text-[#fdc700] bg-[#fffcf2]/50",
        dot: "bg-[#fdc700]",
      };
    case "red":
      return {
        pill: "border border-[#e7000b] text-[#e7000b] bg-[#f9f0e7]/50",
        dot: "bg-[#e7000b]",
      };
    default:
      return {
        pill: "border border-neutral-300 text-foreground bg-background",
        dot: "bg-foreground",
      };
  }
}

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}) {
  const {
    strokeColor,
    pillColor,
    pillText,
    lastReview,
    canDelete,
    canReview,
    onReview,
    onDelete,
  } = data ?? {};

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const rootRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [voteChoice, setVoteChoice] = useState(() => toVoteChoice(lastReview));
  const [voteBusy, setVoteBusy] = useState(false);

  useEffect(() => {
    setVoteChoice(toVoteChoice(lastReview));
  }, [id, lastReview]);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (evt) => {
      const el = rootRef.current;
      if (!el) return;
      if (el.contains(evt.target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown, true);
    return () => document.removeEventListener("mousedown", onDocMouseDown, true);
  }, [open]);

  const edgeLineStyle = useMemo(() => {
    const base = { ...(style || {}) };
    if (strokeColor) base.stroke = strokeColor;
    return base;
  }, [style, strokeColor]);

  const handleToggleOpen = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  }, []);

  const handleClose = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  }, []);

  const handleVoteClick = useCallback(
    async (kind) => {
      if (!canReview || !onReview || voteBusy) return;

      const previousChoice = voteChoice;
      const nextChoice = previousChoice === kind ? null : kind;

      setVoteChoice(nextChoice);
      setVoteBusy(true);

      try {
        await onReview(id, toVerdict(nextChoice));
      } catch {
        setVoteChoice(previousChoice);
      } finally {
        setVoteBusy(false);
      }
    },
    [canReview, id, onReview, voteBusy, voteChoice]
  );

  const handleDelete = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canDelete || !onDelete) return;
      onDelete(id);
      setOpen(false);
    },
    [canDelete, id, onDelete]
  );

  const tone = getPillToneClasses(pillColor);
  const safePillText = pillText ?? "-";

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={edgeLineStyle} />

      <EdgeLabelRenderer>
        <div
          ref={rootRef}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <button
            type="button"
            onClick={handleToggleOpen}
            title={safePillText}
            className={[
              "flex items-center gap-1.5 rounded-none rounded-bl-none px-2 pb-0.5 pt-0.5",
              "text-[12px] antialiased shadow-sm transition",
              tone.pill,
              open ? "ring-1 ring-neutral-300" : "",
            ].join(" ")}
          >
            <span className={["h-1.5 w-1.5 rounded-full", tone.dot].join(" ")} aria-hidden="true" />
            <span>{safePillText}</span>
          </button>

          {open ? (
            <div
              className="mt-2"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="rounded-none p-0 bg-background shadow-sm">
                <div className="flex items-stretch">
                  {canReview ? (
                    <>
                      <button
                        type="button"
                        className={[
                          "group flex min-h-16 min-w-16 flex-col items-center justify-center gap-1",
                          "border-r border-neutral-300 px-3 py-3 transition",
                          "hover:bg-[#f7faf2] hover:text-[#5ea500]",
                          voteChoice === REVIEW_CHOICE.UP ? "bg-[#f7faf2] text-[#5ea500]" : "",
                        ].join(" ")}
                        disabled={voteBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoteClick(REVIEW_CHOICE.UP);
                        }}
                        aria-pressed={voteChoice === REVIEW_CHOICE.UP}
                        title="Like"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.14em]">
                          Like
                        </span>
                      </button>

                      <button
                        type="button"
                        className={[
                          "group flex min-h-16 min-w-16 flex-col items-center justify-center gap-1",
                          "border-r border-neutral-300 px-3 py-3 transition",
                          "hover:bg-[#f9f0e7] hover:text-[#e7000b]",
                          voteChoice === REVIEW_CHOICE.DOWN ? "bg-[#f9f0e7] text-[#e7000b]" : "",
                        ].join(" ")}
                        disabled={voteBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoteClick(REVIEW_CHOICE.DOWN);
                        }}
                        aria-pressed={voteChoice === REVIEW_CHOICE.DOWN}
                        title="Dislike"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.14em]">
                          Dislike
                        </span>
                      </button>
                    </>
                  ) : null}

                  {canDelete ? (
                    <button
                      type="button"
                      className="group flex min-h-16 min-w-16 flex-col items-center justify-center gap-1 border-r border-neutral-300 px-3 py-3 text-[#e7000b] transition hover:bg-white"
                      onClick={handleDelete}
                      title="Delete edge"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">
                        Delete
                      </span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="group flex min-h-16 min-w-16 flex-col items-center justify-center gap-1 px-3 py-3 transition hover:bg-neutral-50"
                    onClick={handleClose}
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">
                      Close
                    </span>
                  </button>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(CustomEdge);