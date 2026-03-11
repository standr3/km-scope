import { Router } from "express";
import { verifyAccess } from "../middleware/verifyAccess.js";
import { requireMemberActive } from "../middleware/requireMemberActive.js";
import {
  getProject,
  // getProjectNodes,
  createProjectNode,
  deleteProjectNode,
  // setNodeReview,
  upsertNodeReview,

  // EDGES (NEW)
  getProjectEdges,
  createProjectEdge,
  deleteProjectEdge,
  setEdgeOwnerDecision,
  upsertEdgeReview,
  getProjectWithMembers,
  createNode,
  getNodes,
} from "../controllers/projects.controller.js";

const router = Router();
router.use(verifyAccess, requireMemberActive);

router.get("/:projectId", getProject);

router.get("/:projectId/members", getProjectWithMembers);
// --------------------
// NODES
// --------------------
// router.get('/:projectId/nodes', getProjectNodes);

// owner-only enforced in controller
// router.post('/:projectId/nodes', createProjectNode);

// owner-only enforced in controller (soft delete)
router.delete("/:projectId/nodes/:nodeId", deleteProjectNode);

// owner decision: ACCEPTED / REJECTED (only when PENDING, not deleted)
router.patch("/:projectId/nodes/:nodeId/review", upsertNodeReview);

// like / dislike (toggle off = DELETE)
// router.put("/:projectId/nodes/:nodeId/review", upsertNodeReview);

router.post("/:projectId/nodes", createNode);
router.get("/:projectId/nodes", getNodes);

// --------------------
// EDGES (NEW)
// --------------------
router.get("/:projectId/edges", getProjectEdges);

// create edge (drag-to-connect in ReactFlow)
router.post("/:projectId/edges", createProjectEdge);

// delete edge
router.delete("/:projectId/edges/:edgeId", deleteProjectEdge);

// owner decision: ACCEPTED / REJECTED (only when PENDING, not deleted)
router.patch("/:projectId/edges/:edgeId/owner-decision", setEdgeOwnerDecision);

// like / dislike (toggle off = DELETE)
router.patch("/:projectId/edges/:edgeId/review", upsertEdgeReview);

export default router;
