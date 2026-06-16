import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Check, Ellipsis, Trash2, X } from "lucide-react";

const STATUS_STYLES = {
  Accepted: {
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    iconBg: "bg-emerald-600 text-white",
    buttonActive: "border-emerald-300 bg-emerald-50 text-emerald-700",
    buttonHover:
      "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
    icon: Check,
  },
  Pending: {
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    iconBg: "bg-amber-500 text-white",
    buttonActive: "border-amber-300 bg-amber-50 text-amber-700",
    buttonHover:
      "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700",
    icon: Ellipsis,
  },
  Rejected: {
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
    iconBg: "bg-rose-600 text-white",
    buttonActive: "border-rose-300 bg-rose-50 text-rose-700",
    buttonHover: "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700",
    icon: X,
  },
};

export default function CustomNode({ id, data, selected }) {
  const isOwner = data.projectRole === "OWNER";
  const isCreator = data.createdBy === data.currentUserId;

  const rs = data.reviewState;

  const ownerCreated = rs.ownerCreated;
  const ownerUpped = rs.ownerUpped;
  const ownerDowned = rs.ownerDowned;
  const canDelete = rs.canDelete;
  const showButtons = rs.reviewable;
  const upActive = rs.currentUpped;
  const downActive = rs.currentDowned;
  const reviewDisabled = !isOwner && rs.ownerReviewed;

  const upCounter = rs.upCount || 0;
  const downCounter = rs.downCount || 0;

  const status = ownerUpped ? "Accepted" : ownerDowned ? "Rejected" : "Pending";
  const st = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  const StatusIcon = st.icon;

  const topHandleElm = (
    <Handle
      type="target"
      position={Position.Top}
      className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
    />
  );

  const bottomHandleElm = (
    <Handle
      type="source"
      position={Position.Bottom}
      className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
    />
  );

  const pillElm = !ownerCreated && (
    <span
      className={[
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2 text-xs font-semibold ring-1",
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
    </span>
  );

  const deleteBtnElm = canDelete && (
    <button
      type="button"
      className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
      onClick={() => data.onDelete?.(id)}
      aria-label="Delete node"
    >
      <Trash2 strokeWidth={2} size={13} />
    </button>
  );

  const labelElm = (
    <span className="block max-w-[220px] break-words text-base font-semibold leading-6 tracking-tight text-slate-950">
      {data.label}
    </span>
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

  const reviewBtnsElm = showButtons && (
    <div className="ml-auto flex items-center gap-1.5">
      <button
        type="button"
        disabled={reviewDisabled}
        onClick={data.onVoteUp}
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
        onClick={data.onVoteDown}
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
    <div
      className={[
        "min-w-[220px] overflow-hidden rounded-xl border bg-white shadow-sm transition",
        isCreator || ownerCreated || ownerUpped
          ? "border-slate-300 shadow-[0_0_0_1px_rgba(148,163,184,0.22),0_10px_28px_rgba(15,23,42,0.10)]"
          : "border-slate-200",
        selected && "ring-2 ring-slate-400 ring-offset-2",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {topHandleElm}

      {/* Top Row - Creator & Delete Btn */}
      <div className="flex h-8 w-full items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3">
        {creatorElm}
        {deleteBtnElm}
      </div>

      {/* Middle Row - Node Label */}
      <div className="bg-white px-4 py-3">{labelElm}</div>

      {/* Bottom Row - Node Acceptance Status & Review Actions */}
      {(pillElm || reviewBtnsElm) && (
        <div className="flex min-h-11 w-full items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2">
          {pillElm}
          {reviewBtnsElm}
        </div>
      )}

      {bottomHandleElm}
    </div>
  );
}