import React, { useMemo, useState } from "react";
import { EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";
import { ThumbsDown, ThumbsUp, Trash2, Check, Ellipsis, X } from "lucide-react";


const STATUS_STYLES = {
  Accepted: {
    // pill: "text-[#0D6633] border-[#2EAD5E] bg-[#E6F5EC]",
    line: "stroke-[#2EAD5E]",
    panelBorder: "border-[#2EAD5E]",

    pill: "bg-[#EAF7EF] text-[#065F2C] border-[#24994F]",
    iconBg: "bg-[#24994F] text-white",
    icon: Check,
    accent: "#24994F",
  },
  Pending: {
    // pill: "text-[#B87000] border-[#E8A800] bg-[#FFF4D6]",
    line: "stroke-[#E8A800]",
    panelBorder: "border-[#E8A800]",

    pill: "bg-[#FFF4D6] text-[#7A4B00] border-[#D99A00]",
    iconBg: "bg-[#D99A00] text-white",
    icon: Ellipsis,
    accent: "#D99A00",
  },
  Rejected: {
    // pill: "text-[#990000] border-[#CC2222] bg-[#FFEAEA]",
    line: "stroke-[#CC2222]",
    panelBorder: "border-[#CC2222]",

    pill: "bg-[#FFF1F1] text-[#7A0000] border-[#B91C1C]",
    iconBg: "bg-[#B91C1C] text-white",
    icon: X,
    accent: "#B91C1C",
  },
  Owner: {
    line: "stroke-[#0A0A0A]",
    panelBorder: "border-[#0A0A0A]",

    pill: "bg-[#EAF7EF] text-[#065F2C] border-[#24994F]",
    iconBg: "bg-[#24994F] text-white",
    icon: Check,
    accent: "#24994F",
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
  // console.log(upActive)
  const downActive = rs.currentDowned;
  // console.log(downActive)
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

  const createdBy = ownerCreated ? "Teacher" : rs.creatorName ?? "unknown";

  const edgeLabel = useMemo(() => {
    if (data.label) return data.label;
    if (data.relationLabel) return data.relationLabel;
    return "";
  }, [data.label, data.relationLabel]);

  const isPending = status === "Pending";

  const edgeStroke =
    status === "Accepted"
      ? "#2EAD5E"
      : status === "Rejected"
        ? "#CC2222"
        : status === "Pending"
          ? "#E8A800"
          : "#0A0A0A";

  const pillElm = (status && (
    <button
      onClick={() => setIsOpen(true)}
      className={[
        "rounded-full items-center align-baseline flex h-fit w-fit pl-[2px] pr-[5px] h-[23px] text-[8px]",
        "border cursor-pointer transition ",
        st.pill,
      ].join(" ")}
    >
      <StatusIcon
        className={[
          "my-[2px] p-[2px] mr-[4px] rounded-full",
          st.iconBg,
        ].join(" ")}
        strokeWidth={3}
        size={10}
      />

      {status}
    </button>

    // <button
    //   onClick={() => setIsOpen(true)}
    //   className={[
    //     " text-[9px] tracking-[0.08em] uppercase",
    //     "px-[7px] py-[2px] border transition-opacity cursor-pointer hover:opacity-70",
    //     st.pill,
    //   ].join(" ")}
    // >
    //   {status}
    // </button>
  )
  )

  const creatorElm = (
    <span className="text-[8px] text-[#FFF] truncate max-w-35">
      {
        isCreator
          ? <em>by you</em>
          : <em>by {ownerCreated ? "Teacher" : rs.creatorName ?? "unknown"}</em>
      }
    </span>
  )
  const deleteBtnElm = canDelete && (

    <button
      className=" p-[1px] m-0 leading-none inline-flex items-center justify-center  text-[#FFF]    cursor-pointer hover:text-[#CC2222] border-none rounded-full bg-transparent"
      onClick={(e) => {
        e.stopPropagation();
        data.onDelete?.(id);
      }}
    >
      <Trash2 strokeWidth={2} size={8} />
    </button>
  )

  // {
  //   canDelete && (
  //     <button
  //       onClick={(e) => {
  //         e.stopPropagation();
  //         data.onDelete?.(id);
  //       }}
  //       title="Delete edge"
  //       className="shrink-0 text-[#DDDDD8] hover:text-[#CC2222] transition-colors"
  //     >
  //       <Trash2 size={10} />
  //     </button>
  //   )
  // }

  const reviewBtnsElm = (showButtons && (
    <div className="flex gap-[2px] ml-auto">
      <button
        disabled={reviewDisabled}
        onClick={(e) => {
          e.stopPropagation();
          data.onVoteUp?.();
        }}
        className={[
          "nodrag nopan group",
          "inline-flex h-[14px] items-center",
          "rounded-[2px] border",
          "pl-1 pr-1.5",
          "transition",
          reviewDisabled
            ? "border-[#DDDDD8] text-[#DDDDD8] cursor-not-allowed"
            : upActive
              ? "border-[#2EAD5E] bg-[#E6F5EC] text-[#2EAD5E] cursor-pointer"
              : [
                "border-[#D9E0E3] bg-[#F5F7FA] text-[#829196] cursor-pointer",
                "hover:border-[#2EAD5E] hover:bg-[#E6F5EC] hover:text-[#2EAD5E]",
              ].join(" "),
        ].join(" ")}
      >
        <Check className="shrink-0" strokeWidth={2} size={12} />
        <span
          className={[
            "ml-[4px] translate-y-[-0.5px]",
            "text-[7px] leading-none transition",
            reviewDisabled
              ? "text-[#DDDDD8]"
              : upActive
                ? "text-[#2EAD5E]"
                : "text-[#5B696E] group-hover:text-[#2EAD5E]",
          ].join(" ")}
        >
          {upCounter}
        </span>
      </button>

      <button
        disabled={reviewDisabled}
        onClick={(e) => {
          e.stopPropagation();
          data.onVoteDown?.();
        }}
        className={[
          "nodrag nopan group",
          "inline-flex h-[14px] items-center",
          "rounded-[2px] border",
          "pl-1 pr-1.5",
          "transition",
          reviewDisabled
            ? "border-[#DDDDD8] text-[#DDDDD8] cursor-not-allowed"
            : downActive
              ? "border-[#CC2222] bg-[#FFEAEA] text-[#990000] cursor-pointer"
              : [
                "border-[#D9E0E3] bg-[#F5F7FA] text-[#829196] cursor-pointer",
                "hover:border-[#CC2222] hover:bg-[#FFEAEA] hover:text-[#CC2222]",
              ].join(" "),
        ].join(" ")}
      >
        <X className="shrink-0" strokeWidth={2} size={12} />

        <span
          className={[
            "ml-[4px] translate-y-[-0.5px]",
            "text-[7px] leading-none transition",
            reviewDisabled
              ? "text-[#DDDDD8]"
              : downActive
                ? "text-[#990000]"
                : "text-[#5B696E] group-hover:text-[#CC2222]",
          ].join(" ")}
        >
          {downCounter}
        </span>
      </button>
    </div>
  )
  )

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke={edgeStroke}
        strokeWidth={2}
        strokeDasharray={isPending ? "6 4" : undefined}
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
        onClick={() => setIsOpen((v) => !v)}
      />

      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto "
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {!isOpen
            ? (!ownerCreated && pillElm)
            : (
              <div
                onClick={() => setIsOpen(false)}
                className={[
                  " rounded-[3px] border border-[#D9E0E3]",
                  "shadow-[0_8px_22px_rgba(15,23,42,0.09)] cursor-pointer",
                  st.panelBorder,
                ].join(" ")}
              >
                {/* Top Row -   */}
                <div
                  className="
                    bg-[#7B8794]
                    rounded-t-[2px]
                    w-full pl-[10px] pr-[2px] 
                    flex items-center justify-between gap-2
                  "
                >
                  {creatorElm}
                  {deleteBtnElm}
                </div>




                {pillElm && reviewBtnsElm && <div
                  className=" 
                    rounded-b-[2px]
                    min-w-[180px] 
                    flex items-center w-full bg-[#F5F7FA] 
                    justify-between h-[20px] px-[6px]   
                  "
                >
                  {pillElm}
                  {reviewBtnsElm}
                </div>
                }
              </div>


            )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}