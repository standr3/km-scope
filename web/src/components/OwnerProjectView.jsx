
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAuth } from "../context/AuthContext";
import CustomNode from "../components/CustomNode.jsx";
import CustomEdge from "../components/CustomEdge.jsx";



import { useProjectFlow } from "../hooks/useProjectFlow";
import Button from './ui/Button/Button';


const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

function OwnerCanvas({ project }) {
  const { user } = useAuth();
  const wrapperRef = useRef(null);

  const {
    nodes,
    edges,
    onNodesChange: onNodesChangeBase,
    onEdgesChange,

    isLoading,
    isError,

    addNode,
    onConnect,

    rfInstanceRef,
    applyViewportOnce,
    onMoveEnd,
    persistNodePositions,

  } = useProjectFlow({
    project,
    user,
    viewRole: "owner",
    members: project?.members ?? [],
  });

  useEffect(() => {
    applyViewportOnce();
  }, [applyViewportOnce]);

  const onNodesChange = useCallback((changes) => {
    onNodesChangeBase(changes);
  }, [onNodesChangeBase]);


  return (
    <div className='relative h-full w-full ' ref={wrapperRef}>

      <div className='h-full w-full'  >
        {isLoading ? (
          <div style={{ padding: 12 }}>Loading…</div>
        ) : isError ? (
          <div style={{ padding: 12 }}>Error loading nodes/edges.</div>
        ) : (
          <div className='h-full w-full ' >

            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={(instance) => {
                rfInstanceRef.current = instance;
              }}
              onMoveEnd={onMoveEnd}
              onNodeDragStop={(_, node) => {
                const next = nodes.map((n) => (n.id === node.id ? { ...n, position: node.position } : n));
                persistNodePositions(next);
              }}
              panOnDrag
              selectionOnDrag={false}
            >
              <Background bgColor="#f4f4f0" lineWidth="0.2" variant={BackgroundVariant.Dots} color="rgba(52, 61, 63, 0.5)" />

            </ReactFlow>


          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 flex flex-col gap-1 p-2">

        <button className='text-sm text-primary-foreground bg-primary hover:bg-primary/90 w-fit px-2 py-1' onClick={addNode}>
          Add node
        </button>
        <span className='' >
          Owner view{"[" + user.name + "]"} — {project.name}
        </span>


      </div>
    </div>
  );
}

export default function OwnerProjectView(props) {
  return (
    <ReactFlowProvider>
      <OwnerCanvas {...props} />
    </ReactFlowProvider>
  );
}
