import "./App.css";
import "@xyflow/react/dist/style.css";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useHocuspocusProvider } from "../hooks/useHocuspocusProvider.js";
import { useAuth } from "../context/AuthContext";
import { useProjectUsers } from "../context/ProjectUsersContext";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import EventsPanel from "./EventsPanel";
import { createPortal } from "react-dom";

import {
  createEvent,
  resolveAction,
  getNodeReviewState,
  getEdgeReviewState,
} from "./resolvers.js";

import {
  removeEventById,
} from "./yjsUtils.js";

// import { calculateSessionScores, createSession, saveSession, loadSessions, DEFAULT_WEIGHTS } from '../utils/scoring';
import { createPerformanceSessionApi } from '../api/project';
import { calculateSessionScores, DEFAULT_WEIGHTS } from '../utils/scoring';

import QuickScorePanel from './QuickScorePanel';
import { MousePointer2 } from "lucide-react";
import { useProjectShell } from "@/context/ProjectShellContext";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTE — referințe stabile
// ─────────────────────────────────────────────────────────────────────────────

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

// ─────────────────────────────────────────────────────────────────────────────
// CURSOR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const DBG_NAME_MAP = {
  tests1: "Student 1",
  tests2: "Student 2",
  testt1: "Teacher",
};

const Cursor = ({ cursorPosition, userName, role }) => {
  const displayedName = DBG_NAME_MAP[userName] ?? userName;
  const isOwner = role === "OWNER";

  return (
    <div
      className="cursor fixed   pointer-events-none"
      style={{
        left: `${cursorPosition.x}px`,
        top: `${cursorPosition.y}px`,
        transform: "translate(0, 0)",
      }}
    >
      <MousePointer2
        className="block"
        size={18}
        fill={isOwner ? "#1F2933" : "#7b8794"}
        stroke={isOwner ? "#1F2933" : "#7b8794"}
      />

      <div
        className={[
          "name-badge absolute left-4 top-4 rounded-3xl font-semibold",
          isOwner ? "text-[#1F2933]" : "text-[#7b8794]",
        ].join(" ")}
      >
        {displayedName}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectView({ projectRole, project }) {

  const {
    eventsRoot,
    scoringRoot,
    registerActions,
  } = useProjectShell();


  const [headerRoot, setHeaderRoot] = useState(null);

  useEffect(() => {
    setHeaderRoot(document.getElementById("dashboard-project-title"));
  }, []);


  // ─── Auth & project context ─────────────────────────────────────────────
  const { user } = useAuth();
  const { getMemberById, projectOwnerId } = useProjectUsers();

  const currentMemberId = user?.id;
  const currentMemberRole = getMemberById(user?.id)?.role;

  const resolverContext = { currentMemberId, currentMemberRole, projectOwnerId, getMemberById };

  // ─── Yjs / realtime ─────────────────────────────────────────────────────
  const {
    provider,
    nodesMap: yNodes,
    edgesMap: yEdges,
    eventsArray: yEvents,
  } = useHocuspocusProvider({ projectId: project.id });

  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();

  // ─── Yjs → React state ──────────────────────────────────────────────────
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [events, setEvents] = useState([]);

  // ─── UI state ────────────────────────────────────────────────────────────
  const [awareness, setAwareness] = useState([]);
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  // ─── Yjs observers → React state ────────────────────────────────────────

  useEffect(() => {
    if (!yEvents) return;
    const sync = () => setEvents(yEvents.toArray());
    sync();
    yEvents.observe(sync);
    return () => yEvents.unobserve(sync);
  }, [yEvents]);

  useEffect(() => {
    if (!yNodes || !yEdges) return;
    const syncNodes = () => setNodes(Array.from(yNodes.values()));
    const syncEdges = () => setEdges(Array.from(yEdges.values()));
    syncNodes();
    syncEdges();
    yNodes.observe(syncNodes);
    yEdges.observe(syncEdges);
    return () => {
      yNodes.unobserve(syncNodes);
      yEdges.unobserve(syncEdges);
    };
  }, [yNodes, yEdges]);

  useEffect(() => {
    if (!provider?.awareness) return;
    const onUpdate = () => {
      const states = provider.awareness?.getStates();
      if (!states) return;
      const updated = [];
      for (const [clientId, state] of states.entries()) {
        const meta = state.userMetadata;
        if (clientId === provider.awareness?.clientID || !meta?.cursorPosition) continue;
        updated.push({ userName: meta.userName, role: meta.role, cursorPosition: flowToScreenPosition(meta.cursorPosition) });
      }
      setAwareness(updated);
    };
    provider.awareness.on("update", onUpdate);
    return () => provider.awareness?.off("update", onUpdate);
  }, [provider, flowToScreenPosition]);

  // ─── Yjs helpers ────────────────────────────────────────────────────────

  const appendEvent = useCallback(
    (eventData) => {
      if (!yEvents) return;
      yEvents.push([createEvent(eventData)]);
    },
    [yEvents]
  );

  // ─── executeResolution ──────────────────────────────────────────────────
  const executeResolution = useCallback(
    (resolution) => {
      if (!provider?.document || !yNodes || !yEdges || !yEvents) return;

      provider.document.transact(() => {
        // ENTITIES — nodes
        for (const nodeObj of resolution.entities.nodes.add) yNodes.set(nodeObj.id, nodeObj);
        for (const nodeId of resolution.entities.nodes.remove) yNodes.delete(nodeId);

        // ENTITIES — edges
        for (const edgeObj of resolution.entities.edges.add) yEdges.set(edgeObj.id, edgeObj);
        for (const edgeId of resolution.entities.edges.remove) yEdges.delete(edgeId);

        // EVENTS — remove prima, apoi add
        for (const eventId of resolution.events.nodes.remove) removeEventById(yEvents, eventId);
        for (const eventData of resolution.events.nodes.add) appendEvent(eventData);
        for (const eventId of resolution.events.edges.remove) removeEventById(yEvents, eventId);
        for (const eventData of resolution.events.edges.add) appendEvent(eventData);
      });
    },
    [provider, yNodes, yEdges, yEvents, appendEvent]
  );

  // ─── dispatch ───────────────────────────────────────────────────────────
  const dispatch = useCallback(
    (action) => {
      if (!yEvents || !yNodes || !yEdges || !provider || !user) return;

      const resolution = resolveAction(action, {
        ...resolverContext,
        events: yEvents.toArray(),
        nodes: Array.from(yNodes.values()),
      });

      if (resolution.error) { alert(resolution.error); return; }

      if (resolution.requiresConfirm) {
        const ok = window.confirm(resolution.requiresConfirm.message);
        if (!ok) return;
      }

      executeResolution(resolution);
    },
    [yEvents, yNodes, yEdges, provider, user, executeResolution, currentMemberId, currentMemberRole, projectOwnerId, getMemberById]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────

  const addNode = () => {
    const label = prompt("Node label:");
    if (!label) return;
    dispatch({ type: "NODE_ADD", position: { x: 0, y: 0 }, label });
  }

  const onNodesChange = useCallback(
    (changes) => {
      if (!yNodes) return;
      const currentNodes = Array.from(yNodes.values());
      const nextNodes = applyNodeChanges(changes, currentNodes);
      for (const change of changes) {
        if (change.type === "add" || change.type === "replace") {
          yNodes.set(change.item.id, change.item);
        } else if (change.type === "remove" && yNodes.has(change.id)) {
          yNodes.delete(change.id);
        } else {
          const node = nextNodes.find((n) => n.id === change.id);
          if (node) yNodes.set(change.id, node);
        }
      }
    },
    [yNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      if (!yEdges) return;
      const currentEdges = Array.from(yEdges.values());
      const nextEdges = applyEdgeChanges(changes, currentEdges);
      for (const change of changes) {
        if (change.type === "add" || change.type === "replace") {
          yEdges.set(change.item.id, change.item);
        } else if (change.type === "remove" && yEdges.has(change.id)) {
          yEdges.delete(change.id);
        } else {
          const edge = nextEdges.find((e) => e.id === change.id);
          if (edge) yEdges.set(change.id, edge);
        }
      }
    },
    [yEdges]
  );

  const onConnect = useCallback(
    (params) => dispatch({ type: "EDGE_CREATE", params }),
    [dispatch]
  );

  const updateAwareness = useCallback(
    (e) => {
      if (!provider || !user) return;
      const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      provider.setAwarenessField("userMetadata", {
        userId: user.id, userName: user.name, role: projectRole, cursorPosition: flowPosition,
      });
    },
    [provider, user, projectRole, screenToFlowPosition]
  );

  const clearProjectState = useCallback(() => {
    if (projectRole !== "OWNER") return;
    if (!provider?.document || !yNodes || !yEdges || !yEvents) return;
    const ok = window.confirm("Delete all project nodes, edges, and events?");
    if (!ok) return;
    provider.document.transact(() => {
      for (const key of Array.from(yNodes.keys())) yNodes.delete(key);
      for (const key of Array.from(yEdges.keys())) yEdges.delete(key);
      if (yEvents.length > 0) yEvents.delete(0, yEvents.length);
    });
  }, [projectRole, provider, yNodes, yEdges, yEvents]);


  // handler pentru scoring
  const handleScoreSession = async () => {
    const label = prompt('Label sesiune (opțional):') ?? undefined;

    const scores = calculateSessionScores(
      yEvents.toArray(),
      project.members,
      projectOwnerId,
      DEFAULT_WEIGHTS,
    );

    if (!scores.length) {
      alert('Nu există studenți de evaluat.');
      return;
    }

    try {
      await createPerformanceSessionApi(project.id, {
        label: label || undefined,
        scores,
      });
      alert('Sesiunea a fost salvată.');
    } catch (e) {
      console.error(e);
      alert('Eroare la salvarea sesiunii.');
    }
  };
  // ─── Memos pentru render ─────────────────────────────────────────────────

  const renderedNodes = useMemo(() => {
    if (!nodes || !events) return [];
    return nodes.map((node) => {
      const reviewState = getNodeReviewState(node.id, events, resolverContext);
      return {
        ...node,
        data: {
          ...node.data,
          reviewState, projectRole, currentUserId: currentMemberId,
          onVoteUp: () => dispatch({ type: "NODE_VOTE", nodeId: node.id, voteType: "up" }),
          onVoteDown: () => dispatch({ type: "NODE_VOTE", nodeId: node.id, voteType: "down" }),
          onDelete: () => dispatch({ type: "NODE_DELETE", nodeId: node.id }),
        },
      };
    });
  }, [nodes, events, currentMemberId, projectRole, dispatch]);

  const renderedEdges = useMemo(() => {
    if (!edges || !events) return [];
    return edges.map((edge) => {
      const reviewState = getEdgeReviewState(edge.id, events, resolverContext);
      return {
        ...edge,
        data: {
          ...edge.data,
          reviewState, projectRole, currentUserId: currentMemberId,
          onVoteUp: () => dispatch({ type: "EDGE_VOTE", edgeId: edge.id, voteType: "up" }),
          onVoteDown: () => dispatch({ type: "EDGE_VOTE", edgeId: edge.id, voteType: "down" }),
          onDelete: () => dispatch({ type: "EDGE_DELETE", edgeId: edge.id }),
        },
      };
    });
  }, [edges, events, projectRole, dispatch]);

  const renderedEvents = useMemo(
    () => events.map((event, index) => ({ ...event, index: index + 1 })),
    [events]
  );

  // ─── JSX ────────────────────────────────────────────────────────────────


  useEffect(() => {
    registerActions({
      addNode,
      clearProjectState: projectRole === "OWNER" ? clearProjectState : null,
      scoreSession: projectRole === "OWNER" ? handleScoreSession : null,
    });

    return () => {
      registerActions({
        addNode: null,
        clearProjectState: null,
        scoreSession: null,
      });
    };
  }, [
    registerActions,
    addNode,
    clearProjectState,
    handleScoreSession,
    projectRole,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden  ">

      {headerRoot &&
        createPortal(
          <span className="block truncate font-semibold">
            {project.name}
          </span>,
          headerRoot
        )}

      <div className="h-full w-full  ">
        <ReactFlow
          nodes={renderedNodes}
          edges={renderedEdges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onMouseMove={updateAwareness}
          onNodeDrag={updateAwareness}
          className=" "
        >
          <Background bgColor="#fff" />
          <Controls />
          <MiniMap />
        </ReactFlow>

       
      </div>

       

      {awareness.map(({ cursorPosition, userName, role }, index) => (
        <Cursor key={index} cursorPosition={cursorPosition} userName={userName} role={role} />
      ))}

      

      {eventsRoot && createPortal(
        <EventsPanel events={renderedEvents} />,
        eventsRoot
      )}

      {scoringRoot && projectRole === "OWNER" && createPortal(
        <QuickScorePanel
          events={events}
          members={project.members}
          projectOwnerId={projectOwnerId}
        />,
        scoringRoot
      )}
    </div>
  );
}