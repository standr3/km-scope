import "./App.css";
import "@xyflow/react/dist/style.css";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,

} from "@xyflow/react";
import { useCallback, useEffect, useState, useRef } from "react";
// import { getNewNodeData } from "./utils/get-new-node-data";
import { useHocuspocusProvider } from "../hooks/useHocuspocusProvider.js";
import { useAuth } from "../context/AuthContext";
import CustomNode from "./_CustomNode";


export const getNewNodeData = (userName = null) => {
  const id = crypto.randomUUID();

  let name = 'o';
  if (userName === "tests1") {
    name = '1';
  }
  else if (userName === "tests2") {
    name = '2';
  }
  return {
    id,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      label: `${id.slice(0, 4)} [${name} +() -()]`,
      onDelete: () => {
        console.log("delete", id);
      },
    },
  };
};

const nodeTypes = { custom: CustomNode };
// const edgeTypes = { custom: CustomEdge };


const Cursor = ({ cursorPosition, userName }) => {
  return (
    <div
      className="cursor"
      style={{ top: cursorPosition.y, left: cursorPosition.x }}
    >
      <div className="pointer"></div>
      <div className="name-badge">{userName}</div>
    </div>
  );
};

export default function OwnerProjectView(props) {


  const { user } = useAuth();


  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const { provider, nodesMap, edgesMap, userName } = useHocuspocusProvider({
    projectId: props.project.id,
    user,
  });
  const [awareness, setAwareness] = useState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();

  //observer maps for changes
  useEffect(() => {
    if (!nodesMap || !edgesMap) {
      return;
    }

    // define the callbacks that update the local state when shared state changes
    const nodesObserver = () => {
      setNodes(Array.from(nodesMap.values()));
    };
    const edgesObserver = () => {
      setEdges(Array.from(edgesMap.values()));
    };
    // call the observers once when the component mounts to sync initial state
    nodesObserver();
    edgesObserver();

    // observers are triggered on changes
    nodesMap.observe(nodesObserver);
    edgesMap.observe(edgesObserver);

    return () => {
      // unobserve when component unmounts to prevent memory leaks or duplicate event handling
      nodesMap.unobserve(nodesObserver);
      edgesMap.unobserve(edgesObserver);
    };
  }, [nodesMap, edgesMap]);

  const addNode = () => {
    if (!nodesMap) return;
    const nodeData = getNewNodeData(user.name);
    nodesMap.set(nodeData.id, nodeData);
  };

  //share outgoing changes
  const onNodesChange = useCallback(
    (changes) => {
      if (!nodesMap) return;

      // current shared state read
      const nodes = Array.from(nodesMap.values());
      // apply changes to get the next state
      const nextNodes = applyNodeChanges(changes, nodes);

      for (const change of changes) {
        if (change.type === "add" || change.type === "replace") {
          // add or replace items for new or updated nodes
          nodesMap.set(change.item.id, change.item);
        } else if (change.type === "remove" && nodesMap.has(change.id)) {
          // or remove them if a node was deleted
          nodesMap.delete(change.id);
        } else {
          const node = nextNodes.find((n) => n.id === change.id);

          if (node) {
            nodesMap.set(change.id, node);
          }
        }
      }
    },
    [nodesMap],
  );

  const onEdgesChange = useCallback(
    (changes) => {
      if (!edgesMap) return;
      const edges = Array.from(edgesMap.values());
      const nextEdges = applyEdgeChanges(changes, edges);

      for (const change of changes) {
        if (change.type === "add" || change.type === "replace") {
          edgesMap.set(change.item.id, change.item);
        } else if (change.type === "remove" && edgesMap.has(change.id)) {
          edgesMap.delete(change.id);
        } else {
          const edge = nextEdges.find((e) => e.id === change.id);

          if (edge) {
            edgesMap.set(change.id, edge);
          }
        }
      }
    },
    [edgesMap],
  );

  // trigger for reactflow whenever the user creates a new connection between nodes
  const onConnect = useCallback(
    (params) => {
      if (!edgesMap) return;

      const edges = Array.from(edgesMap.values());
      // generate a new edge and store it the shared state
      const nextEdges = addEdge(params, edges);

      //store it in the shared state if its not already there
      for (const edge of nextEdges) {
        if (edgesMap.has(edge.id)) {
          continue;
        }

        edgesMap.set(edge.id, edge);
      }
    },
    [edgesMap],
  );

  // Send awareness updates to other users
  // this function is attached to on mouse move and on mouse drag
  const updateAwareness = useCallback(
    //takes the mouse event and call provider.setAwarenessField
    (e) => {
      if (!provider) {
        return;
      }

      // Converting screen coordinates to flow position

      // THE COORD TRAP
      // because users can zoom and pan we cannot sed raw screen pixels;
      // if we did that my cursor would be in the wrong place for someone who panned their view
      // (1)therefore we need a helper to translate my screen pixels into the abosulte coord of the diagram
      const flowPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // pass users metadata
      provider.setAwarenessField("userMetadata", {
        userName,
        cursorPosition: flowPosition,
      });
    },
    [provider, screenToFlowPosition, userName],
  );

  // Receiving awareness updates
  // to see other users we use useeffect that subscribes  to the update event on the awareness object
  useEffect(() => {
    if (!provider?.awareness) return;

    const awarenessObserver = () => {
      //inside this listener we get a list of all states
      const states = provider.awareness?.getStates();

      if (!states) return;

      const updatedAwareness = [];

      //we iterate through them but we must filter out our own client ID otherwise we would see a ghost cursor following ours with network delay
      for (const [clientId, state] of states.entries()) {
        const userMetadata = state.userMetadata;

        // Do not track this client's cursor
        if (
          clientId === provider.awareness?.clientID ||
          !userMetadata ||
          !userMetadata.cursorPosition //  fixed
        ) {
          continue;
        }

        // the remaining states are mapped to our local React state...
        updatedAwareness.push({
          userName: userMetadata.userName,
          // Converting flow position to screen coordinates

          //(2) when recieving someone elses position ; this takes their absolute coords and projects them onto my current screen viewport
          cursorPosition: flowToScreenPosition(userMetadata.cursorPosition)

        });
      }
      //...which we the render as cursors components
      setAwareness(updatedAwareness);
    };

    provider.awareness.on("update", awarenessObserver);

    return () => {
      provider.awareness?.off("update", awarenessObserver);
    };
  }, [provider, flowToScreenPosition]);

  return (
    <>
      <div className="diagram-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          onNodesChange={onNodesChange}
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
      {awareness.map(({ cursorPosition, userName }, index) => (
        <Cursor
          key={index}
          cursorPosition={cursorPosition}
          userName={user.name}
        />
      ))}
    </>
  );
}
