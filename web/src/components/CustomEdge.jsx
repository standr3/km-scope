import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

import "./CustomNode.css";

export default function CustomEdge(
  {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    ...props
  }
) {



  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const isOwner = data.projectRole === "OWNER";
  const rs = data.reviewState;
  const canDelete = rs.canDelete;
  const showButtons = rs.reviewable;
  const upActive = rs.currentUpped;
  const downActive = rs.currentDowned;
  const reviewDisabled = !isOwner && rs.ownerReviewed;

  const upCounter = rs.upCount || 0;
  const downCounter = rs.downCount || 0;

  const edge_id = id.slice(0, 4);
  const label = `[ ${rs.creatorName} +(${rs.usersNameUppedArray.sort().join(",")}) -(${rs.usersNameDownedArray.sort().join(",")}) ] `;


  return (
    <>
      {/* linia edge-ului */}
      <BaseEdge path={edgePath} />

      {/* label + controls */}
      <EdgeLabelRenderer className="edge-label">
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            pointerEvents: "all",
          }}
        >
          {/* label */}
          <div className="cn-label">
            <span className="cn-label__prefix">{edge_id}</span>
            <span className="cn-label__main">{label}</span>
          </div>


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

          {/* delete */}
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
      </EdgeLabelRenderer>
    </>
  );
}