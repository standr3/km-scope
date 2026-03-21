import React, { memo, useCallback, useEffect, useState } from "react";
import { Handle, NodeToolbar, Position } from "@xyflow/react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarBadge, AvatarImage } from "@/components/ui/avatar";

import { ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";

const NODE_STATUS = {
  BASELINE: "Baseline",
  PENDING: "Pending",
  NEEDS_REVIEW: "Needs Review",
  REJECTED: "Rejected",
  APPROVED: "Approved",
};

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

function getSafeNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getSafePercent(value, fallback = 0) {
  const safeValue = getSafeNumber(value, fallback);
  return Math.max(0, Math.min(100, safeValue));
}

function getStatusBadge(status) {
  console.log(status)
  switch (status) {
    case NODE_STATUS.BASELINE:
      return (
        <Badge
          variant="outline"
          className="antialiased rounded-bl-none border border-primary px-2 pb-0.5 text-[12px] text-primary bg-light-green/50"
        >
          {status}
        </Badge>
      );

    case NODE_STATUS.PENDING:
      return (
        <Badge
          variant="outline"
          className="antialiased rounded-bl-none border border-[#fdc700] px-2 pb-0.5 text-[12px] text-[#fdc700] bg-[#fffcf2]/50"
        >
          {status}
        </Badge>
      );

    case NODE_STATUS.REJECTED:
      return (
        <Badge
          variant="outline"
          className="antialiased rounded-bl-none border border-[#e7000b] px-2 pb-0.5 text-[12px] text-[#e7000b] bg-[#f9f0e7]/50"
        >
          {status}
        </Badge>
      );

    case NODE_STATUS.NEEDS_REVIEW:
      return (
        <Badge
          variant="outline"
          className="antialiased rounded-bl-none border border-[#fdc700] px-2 pb-0.5 text-[12px] text-[#fdc700] bg-[#fffcf2]/50"
        >
          {status}
        </Badge>
      );

    case NODE_STATUS.APPROVED:
      return (
        <Badge
          variant="outline"
          className="antialiased rounded-bl-none border border-primary px-2 pb-0.5 text-[12px] text-primary bg-light-green/50"
        >
          {status}
        </Badge>
      );
    default:
      return null;
  }
}

function getAffinityBar(color) {
  const sharedStyle = {
    borderTopLeftRadius: "4px 6px",
    borderBottomLeftRadius: "4px 6px",
  };

  switch (color) {
    case "green":
      return (
        <span
          className="absolute left-0 top-[1px] h-[calc(100%-2px)] w-1 bg-primary"
          style={sharedStyle}
        />
      );

    case "red":
      return (
        <span
          className="absolute left-0 top-[1px] h-[calc(100%-2px)] w-1 bg-[#e7000b]"
          style={sharedStyle}
        />
      );

    case "orange":
      return (
        <span
          className="absolute left-0 top-[1px] h-[calc(100%-2px)] w-1 bg-[#fdc700]"
          style={sharedStyle}
        />
      );

    default:
      return (
        <span
          className="absolute left-0 top-[1px] h-[calc(100%-2px)] w-1 bg-foreground"
          style={sharedStyle}
        />
      );
  }
}

function getOwnershipText(status) {
  return status === NODE_STATUS.BASELINE ? "Teacher node" : "Student node";
}

function getActionNeededText(status) {
  switch (status) {
    case NODE_STATUS.BASELINE:
      return "This is a reference concept.";
    case NODE_STATUS.PENDING:
      return "Teacher review in progress.";
    case NODE_STATUS.NEEDS_REVIEW:
      return "Needs your review.";
    case NODE_STATUS.REJECTED:
      return "Should be ignored.";
    case NODE_STATUS.APPROVED:
      return "Use this as a reference concept.";
    default:
      return "-";
  }
}

function CustomNode({ id, data }) {
  const {
    label,
    creatorName,
    abandoned,
    likesCount,
    dislikesCount,
    approvalRate,
    affinityBarColor,
    pillText,
    lastReview,
    canDelete,
    canReview,
    onReview,
    onDelete,
  } = data;

  const safeLabel = label ?? "-";
  const safeCreatorName = creatorName ?? "Unknown";
  const safeLikesCount = getSafeNumber(likesCount);
  const safeDislikesCount = getSafeNumber(dislikesCount);
  const safeApprovalRate = getSafePercent(approvalRate);
  const totalReviews = safeLikesCount + safeDislikesCount;

  const [voteChoice, setVoteChoice] = useState(() => toVoteChoice(lastReview));
  const [voteBusy, setVoteBusy] = useState(false);

  useEffect(() => {
    setVoteChoice(toVoteChoice(lastReview));
  }, [id, lastReview]);

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

  const handleDelete = useCallback(() => {
    if (!onDelete) return;
    if (window.confirm("Delete this node?")) {
      onDelete(id);
    }
  }, [id, onDelete]);

  return (
    <div className="">
      <div className="relative border bg-background shadow-sm rounded-[7.5px]">
        <Handle
          type="source"
          position={Position.Top}
          style={{
            borderTopLeftRadius: "4px 6px",
            borderBottomLeftRadius: "4px 6px",
          }}
        />
        <Handle type="target" position={Position.Bottom} />

        {getAffinityBar(affinityBarColor)}

        <div className="flex flex-col justify-between pt-2 pr-6 pb-4 pl-4">
          {getStatusBadge(pillText)}

          <p className="px-1 mt-2 antialiased text-[26px] text-foreground font-semibold leading-tight min-w-16">
            {safeLabel}
          </p>
        </div>
      </div>

      <RightNodeToolbar
        onDelete={handleDelete}
        showDelete={canDelete}
        abandoned={abandoned}
        likesCount={safeLikesCount}
        dislikesCount={safeDislikesCount}
        approvalRate={safeApprovalRate}
        pillText={pillText}
        creatorName={safeCreatorName}
        canReview={canReview}
        voteChoice={voteChoice}
        voteBusy={voteBusy}
        handleVoteClick={handleVoteClick}
        totalReviews={totalReviews}
      />
    </div>
  );
}

function RightNodeToolbar({
  onDelete,
  showDelete = false,
  abandoned = false,
  likesCount = 0,
  dislikesCount = 0,
  approvalRate = 0,
  pillText,
  creatorName,
  canReview,
  voteChoice,
  voteBusy,
  handleVoteClick,
  totalReviews,
}) {
  const ownershipText = getOwnershipText(pillText);
  const actionNeededText = getActionNeededText(pillText);

  return (
    <NodeToolbar position="bottom">
      <Card className="rounded-none p-0 bg-background">
        <div className="flex">
          <div className="flex min-w-0 items-center gap-4 border-r border-neutral-300 px-4 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="relative w-min">
                  <Avatar size="lg" className={`${abandoned ? "grayscale" : ""} rounded-full`}>
                    <AvatarImage src="https://github.com/pranathip.png" alt={creatorName} />
                  </Avatar>

                  {abandoned ? (
                    <AvatarBadge className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-red-500">
                      <Trash2 className="h-3 w-3" />
                    </AvatarBadge>
                  ) : null}
                </button>
              </TooltipTrigger>

              <TooltipContent>
                <p>Created by {creatorName}</p>
              </TooltipContent>
            </Tooltip>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="border px-2 py-0.5 text-[10px] font-medium uppercase">
                  {ownershipText}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                <span className="inline-flex items-center gap-1 py-1 text-neutral-900">
                  {actionNeededText}
                </span>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex border-r border-neutral-300">
            <div className="flex flex-col justify-center border-r border-neutral-300 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Reviews</p>
              <p className="mt-1 text-xl font-semibold">{totalReviews}</p>
              <p className="mt-1 text-[11px] text-neutral-500">
                {likesCount} ↑ / {dislikesCount} ↓
              </p>
            </div>

            <div className="flex flex-col justify-center px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Approval</p>
              <p className="mt-1 text-xl font-semibold">{approvalRate}%</p>

              <div className="mt-2 h-2 w-full border border-neutral-300">
                <div
                  className="h-full bg-neutral-900"
                  style={{ width: `${approvalRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0">
            {canReview ? (
              <>
                <button
                  type="button"
                  className={
                    "group flex h-full min-w-16 flex-col items-center justify-center gap-1 border-r border-neutral-300 px-3 y-3 transition hover:bg-[#f7faf2] hover:text-[#5ea500] " +
                    (voteChoice === REVIEW_CHOICE.UP ? "bg-[#5ea500]" : "")
                  }
                  disabled={voteBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVoteClick(REVIEW_CHOICE.UP);
                  }}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em]">
                    Like
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    "group flex h-full min-w-16 flex-col items-center justify-center gap-1 border-r border-neutral-300 px-3 py-3 transition hover:bg-[#f9f0e7] hover:text-[#e7000b] " +
                    (voteChoice === REVIEW_CHOICE.DOWN ? "bg-[#e7000b]" : "")
                  }
                  disabled={voteBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVoteClick(REVIEW_CHOICE.DOWN);
                  }}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">
                    Dislike
                  </span>
                </button>
              </>
            ) : null}

            {showDelete ? (
              <button
                type="button"
                className="group flex h-full min-w-16 flex-col items-center justify-center gap-1 px-3 py-3 transition text-[#e7000b] hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">
                  Delete
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </Card>
    </NodeToolbar>
  );
}

export default memo(CustomNode);