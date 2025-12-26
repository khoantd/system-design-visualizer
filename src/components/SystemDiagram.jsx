import React, { useCallback, useRef } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
} from "reactflow";
import "reactflow/dist/style.css";
import { nanoid } from "nanoid";
import { nodeTypes } from "../config/nodeTypes";
import { useTheme } from "../hooks/useTheme";
import NodeToolbar from "./NodeToolbar";

const SystemDiagram = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onEdgeClick,
  selectedNode,
  selectedEdge,
}) => {
  const { themeName } = useTheme();
  const reactFlowWrapper = useRef(null);
  const reactFlowInstanceRef = useRef(null);

  const nodeTypesMemo = React.useMemo(() => nodeTypes, []);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: nanoid(),
        label: "",
        data: { label: "", type: "request", color: "#64748b" },
        style: { stroke: "#64748b", strokeWidth: 2 },
        labelStyle: { fill: "var(--text-primary)", fontSize: 12 },
      };
      onEdgesChange([{ type: "add", item: newEdge }]);
      // Auto-select the new edge
      if (onEdgeClick) {
        onEdgeClick(null, newEdge);
      }
    },
    [onEdgesChange, onEdgeClick]
  );

  const handleAddNode = useCallback(
    (nodeType) => {
      if (!reactFlowInstanceRef.current) {
        // Fallback: place at a default position
        const newNode = {
          id: nanoid(),
          type: nodeType,
          position: { x: 250, y: 250 },
          data: {
            label: "New Node",
            tech: "",
            description: "",
          },
        };
        onNodesChange([{ type: "add", item: newNode }]);
        if (onNodeClick) {
          onNodeClick(newNode);
        }
        return;
      }

      // Get viewport to calculate center position
      const viewport = reactFlowInstanceRef.current.getViewport();
      
      // Calculate center of visible viewport in flow coordinates
      const centerX = -viewport.x / viewport.zoom;
      const centerY = -viewport.y / viewport.zoom;

      const newNode = {
        id: nanoid(),
        type: nodeType,
        position: { x: centerX, y: centerY },
        data: {
          label: "New Node",
          tech: "",
          description: "",
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
      // Auto-select the new node
      if (onNodeClick) {
        onNodeClick(newNode);
      }
    },
    [onNodesChange, onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (event, edge) => {
      if (onEdgeClick) {
        onEdgeClick(event, edge);
      }
    },
    [onEdgeClick]
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Dynamic colors based on theme
  const bgColor = themeName === "dark" ? "#333" : "#ccc";

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full min-h-[600px] rounded-xl overflow-hidden relative"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
      }}
    >
      <NodeToolbar onAddNode={handleAddNode} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance;
        }}
        nodeTypes={nodeTypesMemo}
        fitView
        style={{ backgroundColor: "var(--bg-primary)" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={bgColor} gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default SystemDiagram;
