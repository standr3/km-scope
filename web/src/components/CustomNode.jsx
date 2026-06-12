import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Ban, CircleCheckBig, Trash2, UserRoundPen, School, Ellipsis, Check, X } from "lucide-react";
const STATUS_STYLES = {
  Accepted: {
    pill: "bg-[#EAF7EF] text-[#065F2C]",
    iconBg: "bg-[#24994F] text-white",
    icon: Check,
    accent: "#24994F",
  },
  Pending: {
    pill: "bg-[#FFF4D6] text-[#7A4B00]",
    iconBg: "bg-[#D99A00] text-white",
    icon: Ellipsis,
    accent: "#D99A00",
  },
  Rejected: {
    pill: "bg-[#FFF1F1] text-[#7A0000]",
    iconBg: "bg-[#B91C1C] text-white",
    icon: X,
    accent: "#B91C1C",
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

  // const nodeId = id.slice(0, 4);
  const status = ownerUpped ? "Accepted" : ownerDowned ? "Rejected" : "Pending";
  const st = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  const StatusIcon = st.icon;

  const topHandleElm = (
    <Handle
      type="target"
      position={Position.Top}
    />
  )
  const bottomHandleElm = (
    <Handle
      type="source"
      position={Position.Bottom}
    />
  )
  const pillElm = !ownerCreated && (


    // <span className="my-[4px] rounded-full items-center align-baseline flex  h-fit w-fit pl-[2px] pr-[5px] h-[23px]  text-[8px] bg-[#52606D] text-[#fff]">
    //   <Ellipsis className=" my-[2px] p-[2px] mr-[4px]  bg-[#1F2933] rounded-full" strokeWidth={3} size={10} />
    //   {status}
    // </span>

    <span
      className={[
        "my-[4px] rounded-full items-center align-baseline flex h-fit w-fit pl-[2px] pr-[5px] h-[23px] text-[8px]",
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
    </span>
  )
  const deleteBtnElm = canDelete && (

    <button
      className=" p-[1px] m-0 leading-none inline-flex items-center justify-center  text-[#FFF]    cursor-pointer hover:text-[#CC2222] border-none rounded-full bg-transparent"
      onClick={() => data.onDelete?.(id)}
    >
      <Trash2 strokeWidth={2} size={8} />
    </button>
  )
  const labelElm = (
    <span className="antialiased md:subpixel-antialiased text-[24px] text-[#1F2933] wrap-break-word   ">
      {data.label}
    </span>
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
  const reviewBtnsElm = (showButtons && (
    <div className="flex gap-[2px] ml-auto">

      <button 
        disabled={reviewDisabled}
        onClick={data.onVoteUp}
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
        onClick={data.onVoteDown}
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
    <div
      className={[
        "rounded-[3px]",
        isCreator || ownerCreated || ownerUpped
          ? "border border-[#829196] shadow-[0_0_0_1px_rgba(130,145,150,0.35),0_0_18px_rgba(91,105,110,0.50)]"
          : "border border-[#D9E0E3] shadow-[0_8px_22px_rgba(15,23,42,0.09)]",
        selected && "outline-dashed outline-2 outline-offset-2 outline-[#5B696E]",
      ].filter(Boolean).join(" ")}
    >
      {topHandleElm}

      {/* Top Row - Creator & Delete Btn */}
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

      {/* Middle Row - Node Label */}
      <div className="bg-white px-[16px]">
        {labelElm}
      </div>

      {/* Bottom Row - Node Acceptance Status & Review Actions*/}
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
      </div>}

      {bottomHandleElm}
    </div >
  );
}