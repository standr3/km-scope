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
import PerformancePanel from "./PerformancePanel";


import {
  createEvent,
  resolveAction,
  getNodeReviewState,
  getEdgeReviewState,
} from "./resolvers.js";

import {
  removeEventById,
} from "./yjsUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTE — referințe stabile
// ─────────────────────────────────────────────────────────────────────────────

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

// ─────────────────────────────────────────────────────────────────────────────
// CURSOR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

// TODO: înlocuiește cu getMemberById din context când cursorul va afișa date reale
const DBG_NAME_MAP = {
  tests1: "Student 1",
  tests2: "Student 2",
  testt1: "Teacher",
};

const Cursor = ({ cursorPosition, userName, role }) => {
  const displayedName = DBG_NAME_MAP[userName] ?? userName;
  return (
    <div
      className="cursor"
      style={{ top: cursorPosition.y - 60, left: cursorPosition.x - 260 }}
    >
      <div className={`pointer ${role === "OWNER" ? "pointer-owner" : ""}`} />
      <div className="name-badge">{displayedName}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectView({ projectRole, project }) {

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

  // citești flag-ul de lock din Yjs
  const yMeta = provider ? provider.document.getMap("meta") : null;
  const [isLocked, setIsLocked] = useState(false);

  // ─── UI state ────────────────────────────────────────────────────────────
  const [awareness, setAwareness] = useState([]);
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  // ─── Yjs observers → React state ────────────────────────────────────────


  useEffect(() => {
    if (!yMeta || !provider) return;
    // resetează lock la mount — în caz că a rămas blocat dintr-o sesiune anterioară
    yMeta.set("isLocked", false);
  }, [yMeta]);

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
  const lockProject = useCallback((locked) => {
    if (!yMeta) return;
    yMeta.set("isLocked", locked);
  }, [yMeta]);

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

      // guests nu pot acționa când proiectul e blocat
      if (isLocked && currentMemberRole !== "OWNER") {
        alert("Proiectul este blocat. Așteptați finalizarea evaluării.");
        return;
      }

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
    [isLocked, yEvents, yNodes, yEdges, provider, user, executeResolution, currentMemberId, currentMemberRole, projectOwnerId, getMemberById]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────

  const addNode = () => dispatch({ type: "NODE_ADD", position: { x: 0, y: 0 } });

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
          reviewState, projectRole,
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

  return (
    <>
      <div className="diagram-container">
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
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        <button className="add-node-btn" onClick={addNode}>
          Add node
        </button>
      </div>

      {isEventsOpen ? (
        <EventsPanel events={renderedEvents} onClose={() => setIsEventsOpen(false)} />
      ) : (
        <button
          onClick={() => setIsEventsOpen(true)}
          style={{
            position: "fixed", top: 88, right: 16, zIndex: 1000,
            border: "1px solid #e5e7eb", background: "#fff", borderRadius: 999,
            padding: "10px 14px", boxShadow: "0 8px 24px rgba(17, 24, 39, 0.12)",
            cursor: "pointer", fontWeight: 600,
          }}
        >
          Open events
        </button>
      )}

      {awareness.map(({ cursorPosition, userName, role }, index) => (
        <Cursor key={index} cursorPosition={cursorPosition} userName={userName} role={role} />
      ))}

      {projectRole === "OWNER" && (
        <button style={{ position: "absolute", bottom: 20, left: 60, zIndex: 10 }} onClick={clearProjectState}>
          Reset all Yjs state
        </button>
      )}
      <PerformancePanel
        projectId={project.id}
        projectRole={projectRole}
        onLockProject={lockProject}
        isLocked={isLocked}
      />
    </>
  );
}