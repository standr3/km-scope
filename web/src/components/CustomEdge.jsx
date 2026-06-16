import React, { useMemo, useState } from "react";
import { EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";
import { Check, Ellipsis, Trash2, X } from "lucide-react";

const STATUS_STYLES = {
  Accepted: {
    stroke: "#059669",
    dash: undefined,
    panelRing: "ring-emerald-100",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    iconBg: "bg-emerald-600 text-white",
    icon: Check,
  },
  Pending: {
    stroke: "#d97706",
    dash: "6 4",
    panelRing: "ring-amber-100",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    iconBg: "bg-amber-500 text-white",
    icon: Ellipsis,
  },
  Rejected: {
    stroke: "#e11d48",
    dash: undefined,
    panelRing: "ring-rose-100",
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
    iconBg: "bg-rose-600 text-white",
    icon: X,
  },
  Owner: {
    stroke: "#0f172a",
    dash: undefined,
    panelRing: "ring-slate-100",
    pill: "bg-slate-100 text-slate-700 ring-slate-200",
    iconBg: "bg-slate-900 text-white",
    icon: Check,
  },
};

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isOwner = data.projectRole === "OWNER";
  const isCreator = data.createdBy === data.currentUserId;

  const rs = data.reviewState ?? {};

  const ownerCreated = rs.ownerCreated;
  const ownerUpped = rs.ownerUpped;
  const ownerDowned = rs.ownerDowned;

  const canDelete = rs.canDelete;
  const showButtons = rs.reviewable && !ownerCreated;
  const upActive = rs.currentUpped;
  const downActive = rs.currentDowned;
  const reviewDisabled = !isOwner && rs.ownerReviewed;

  const upCounter = rs.upCount || 0;
  const downCounter = rs.downCount || 0;

  const status = ownerCreated
    ? null
    : ownerUpped
      ? "Accepted"
      : ownerDowned
        ? "Rejected"
        : "Pending";

  const st = status ? STATUS_STYLES[status] : STATUS_STYLES.Owner;
  const StatusIcon = st.icon;

  const edgeLabel = useMemo(() => {
    if (data.label) return data.label;
    if (data.relationLabel) return data.relationLabel;
    return "";
  }, [data.label, data.relationLabel]);

  const isPending = status === "Pending";

  const pillElm = status && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(true);
      }}
      className={[
        "nodrag nopan inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2 text-xs font-semibold ring-1 transition hover:opacity-80",
        st.pill,
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-4 w-4 items-center justify-center rounded-full",
          st.iconBg,
        ].join(" ")}
      >
        <StatusIcon strokeWidth={3} size={10} />
      </span>

      {status}
    </button>
  );

  const creatorElm = (
    <span className="truncate text-xs font-medium text-slate-500">
      {isCreator ? (
        <em>by you</em>
      ) : (
        <em>by {ownerCreated ? "Teacher" : rs.creatorName ?? "unknown"}</em>
      )}
    </span>
  );

  const deleteBtnElm = canDelete && (
    <button
      type="button"
      className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
      onClick={(e) => {
        e.stopPropagation();
        data.onDelete?.(id);
      }}
      aria-label="Delete edge"
    >
      <Trash2 strokeWidth={2} size={13} />
    </button>
  );

  const reviewBtnsElm = showButtons && (
    <div className="ml-auto flex items-center gap-1.5">
      <button
        type="button"
        disabled={reviewDisabled}
        onClick={(e) => {
          e.stopPropagation();
          data.onVoteUp?.();
        }}
        className={[
          "nodrag nopan group inline-flex h-7 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition",
          reviewDisabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
            : upActive
              ? "cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-700"
              : [
                  "cursor-pointer border-slate-200 bg-white text-slate-500 shadow-sm",
                  "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
                ].join(" "),
        ].join(" ")}
      >
        <Check className="shrink-0" strokeWidth={2.5} size={13} />

        <span
          className={[
            "ml-1 leading-none transition",
            reviewDisabled
              ? "text-slate-300"
              : upActive
                ? "text-emerald-700"
                : "text-slate-500 group-hover:text-emerald-700",
          ].join(" ")}
        >
          {upCounter}
        </span>
      </button>

      <button
        type="button"
        disabled={reviewDisabled}
        onClick={(e) => {
          e.stopPropagation();
          data.onVoteDown?.();
        }}
        className={[
          "nodrag nopan group inline-flex h-7 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition",
          reviewDisabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
            : downActive
              ? "cursor-pointer border-rose-300 bg-rose-50 text-rose-700"
              : [
                  "cursor-pointer border-slate-200 bg-white text-slate-500 shadow-sm",
                  "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700",
                ].join(" "),
        ].join(" ")}
      >
        <X className="shrink-0" strokeWidth={2.5} size={13} />

        <span
          className={[
            "ml-1 leading-none transition",
            reviewDisabled
              ? "text-slate-300"
              : downActive
                ? "text-rose-700"
                : "text-slate-500 group-hover:text-rose-700",
          ].join(" ")}
        >
          {downCounter}
        </span>
      </button>
    </div>
  );

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke={st.stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={st.dash}
      >
        {isPending && (
          <animate
            attributeName="stroke-dashoffset"
            values="0;-10"
            dur="0.7s"
            repeatCount="indefinite"
          />
        )}
      </path>

      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
        className="cursor-pointer"
        onClick={() => setIsOpen((current) => !current)}
      />

      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {!isOpen ? (
            !ownerCreated && pillElm
          ) : (
            <div
              onClick={() => setIsOpen(false)}
              className={[
                "min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 transition",
                "cursor-pointer",
                st.panelRing,
              ].join(" ")}
            >
              {/* Top Row - Creator & Delete Btn */}
              <div className="flex h-8 w-full items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3">
                {creatorElm}
                {deleteBtnElm}
              </div>

              {/* Middle Row - Edge Label */}
              {edgeLabel && (
                <div className="bg-white px-4 py-3">
                  <span className="block max-w-[220px] break-words text-sm font-semibold leading-5 tracking-tight text-slate-950">
                    {edgeLabel}
                  </span>
                </div>
              )}

              {/* Bottom Row - Status & Review Actions */}
              {(pillElm || reviewBtnsElm) && (
                <div className="flex min-h-11 w-full items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2">
                  {pillElm}
                  {reviewBtnsElm}
                </div>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}