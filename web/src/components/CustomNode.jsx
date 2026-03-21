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
  return (
    <div className={`cn-card ${selected ? "cn-card--selected" : ""}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="cn-handle cn-handle--top"
      />

      {/* Header row */}
      <div className="cn-header">
        <div className="cn-label">
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