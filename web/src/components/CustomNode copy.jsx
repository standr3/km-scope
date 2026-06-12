import React from "react";
import { Handle, Position } from "@xyflow/react";
import "./CustomNode.css";

export default function CustomNode({ id, data, selected }) {
  const isOwner = data.projectRole === "OWNER";
  const isCreator = data.createdBy === data.currentUserId;

  const rs = data.reviewState;

  const canDelete = rs.canDelete;
  const showButtons = rs.reviewable;
  const upActive = rs.currentUpped;
  const downActive = rs.currentDowned;
  const reviewDisabled = !isOwner && rs.ownerReviewed;

  const upCounter = rs.upCount || 0;
  const downCounter = rs.downCount || 0;

  // console.log({rs})
  const node_id = id.slice(0, 4);
  const label = `[ ${rs.creatorName} +(${rs.usersNameUppedArray.sort().join(",")}) -(${rs.usersNameDownedArray.sort().join(",")}) ] `;
  // const label = `[${data.creatorName}] `;


  const handleStyle =
    "w-2 h-2 rounded-full bg-navy border-2 border-white shadow-[0_0_0_1px_#0D0D66] -mt-.5";
  const outerNodeStyle = (isCreator ?
    "relative mt-3 flex-1 min-w-[260px] max-w-xs bg-white border border-[#1A1AFF] shadow-[0_2px_12px_rgba(26,26,255,0.10)]" :
    "relative mt-3 flex-1 min-w-[260px] max-w-xs bg-white border border-border shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
  );

  return (
    <div className={outerNodeStyle}>
      <Handle
        type="target"
        position={Position.Top}
        className={handleStyle}
      />

      <div className="absolute left-3 flex items-center gap-1.5 px-1.5 bg-canvas font-mono top-[-1px] -translate-y-1/2">
        <div className="w-[7px] h-[7px] rounded-full flex-shrink-0 bg-[#6EE5FF] border-[1.5px] border-[#1A1AFF]" />
        <span className="text-[9px] tracking-[0.1em] uppercase text-navy">
          NODE_001
        </span>
      </div>




      {/* Header row */}
      <div className="cn-header">
        <div className="cn-label">
          {isCreator && <span className="cn-label__creator">You</span>}
          <span className="cn-label__prefix">{node_id}</span>
          <span className="cn-label__main">{label}</span>
        </div>

        {canDelete && (
          <button
            onClick={() => data.onDelete?.(id)}
            title="Delete node"
            className="cn-delete-btn"
          >
            ×
          </button>
        )}
      </div>

      {/* Meta row */}
      {/* <div className="cn-meta">
        <span className="cn-author">
          {data.creatorName || "Unknown"}
        </span>
        {data.projectRole && (
          <span className={`cn-role cn-role--${data.projectRole.toLowerCase()}`}>
            {data.projectRole}
          </span>
        )}
      </div> */}

      {/* Divider */}
      {/* <div className="cn-divider" /> */}

      {/* Subtitle */}
      {/* <div className="cn-subtitle">
        {data.subtitle || "Click and drag to move"}
      </div> */}

      {/* Vote row */}
      {showButtons && (
        <div className="cn-vote-row">
          <div className="cn-vote-group">
            <button
              disabled={reviewDisabled}
              onClick={data.onVoteUp}
              className={`vote-btn up ${upActive ? "active" : ""} ${reviewDisabled ? "locked blocked" : ""}`}
            >
              ▲
            </button>
            <span className="cn-vote-count cn-vote-count--up">{upCounter}</span>
          </div>

          <div className="cn-vote-group">
            <button
              disabled={reviewDisabled}
              onClick={data.onVoteDown}
              className={`vote-btn down ${downActive ? "active" : ""} ${reviewDisabled ? "locked blocked" : ""}`}
            >
              ▼
            </button>
            <span className="cn-vote-count cn-vote-count--down">{downCounter}</span>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="cn-handle cn-handle--bottom"
      />
    </div>
  );
}