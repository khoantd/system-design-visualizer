import React, { useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import { nanoid } from "nanoid";
import { nodeTypes } from "../config/nodeTypes";
import { useTheme } from "../hooks/useTheme";
import NodeToolbar from "./NodeToolbar";

// Utility function to map ConnectionLineType to edge type string
const getEdgeType = (connectionLineType) => {
  switch (connectionLineType) {
    case ConnectionLineType.Bezier:
      return 'default';
    case ConnectionLineType.Step:
      return 'step';
    case ConnectionLineType.SmoothStep:
      return 'smoothstep';
    case ConnectionLineType.Straight:
    default:
      return 'straight';
  }
};

const SystemDiagram = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onEdgeClick,
  selectedNode,
  selectedEdge,
  onConnectionLineTypeChange,
  connectionLineType = ConnectionLineType.Straight,
}) => {
  const { themeName } = useTheme();
  const reactFlowWrapper = useRef(null);
  const reactFlowInstanceRef = useRef(null);
  const isFirstRender = useRef(true);
  const nodesRef = useRef(nodes);

  // Keep nodesRef updated
  React.useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Update connection line type for existing edges when it changes (skip first render)
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Update all edges with the new connection line type
    if (edges.length > 0) {
      const edgeType = getEdgeType(connectionLineType);
      const updatedEdges = edges.map(edge => ({
        ...edge,
        type: edgeType
      }));
      onEdgesChange(updatedEdges.map(edge => ({ type: 'replace', item: edge })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionLineType]); // Only run when connectionLineType changes

  // Handle connection line type change and notify parent
  const handleConnectionLineTypeChange = useCallback((newType) => {
    if (onConnectionLineTypeChange) {
      onConnectionLineTypeChange(newType);
    }
  }, [onConnectionLineTypeChange]);

  const nodeTypesMemo = React.useMemo(() => nodeTypes, []);

  // Validate nodes to ensure all have position property
  const validatedNodes = React.useMemo(() => {
    return nodes.map((node, index) => {
      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        // Default position if missing or invalid
        return {
          ...node,
          position: { x: 250 + (index % 3) * 200, y: 100 + Math.floor(index / 3) * 150 }
        };
      }
      return node;
    });
  }, [nodes]);

  const onConnect = useCallback(
    (params) => {
      const edgeType = getEdgeType(connectionLineType);
      
      const newEdge = {
        ...params,
        id: nanoid(),
        label: "",
        data: { label: "", type: "request", color: "#64748b" },
        style: { stroke: "#64748b", strokeWidth: 2 },
        labelStyle: { fill: "var(--text-primary)", fontSize: 12 },
        type: edgeType,
      };
      onEdgesChange([{ type: "add", item: newEdge }]);
      // Auto-select the new edge
      if (onEdgeClick) {
        onEdgeClick(null, newEdge);
      }
    },
    [onEdgesChange, onEdgeClick, connectionLineType]
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
            label: nodeType === 'subflowNode' ? "Subflow" : "New Node",
            tech: "",
            description: "",
          },
          ...(nodeType === 'subflowNode' && {
            style: { width: 300, height: 200 },
          }),
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
          label: nodeType === 'subflowNode' ? "Subflow" : "New Node",
          tech: "",
          description: "",
        },
        ...(nodeType === 'subflowNode' && {
          style: { width: 300, height: 200 },
        }),
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

  // Handle node drag stop to detect if node was dropped inside a subflow
  const handleNodeDragStop = useCallback(
    (event, draggedNode) => {
      console.log('[handleNodeDragStop] Called', { 
        nodeId: draggedNode.id, 
        nodeType: draggedNode.type,
        position: draggedNode.position,
        parentNode: draggedNode.parentNode 
      });
      
      // Skip if the dragged node is a subflow itself
      if (draggedNode.type === 'subflowNode') {
        console.log('[handleNodeDragStop] Skipping - is subflow');
        return;
      }
      
      // Skip if node already has a parent (is already inside a subflow)
      if (draggedNode.parentNode) {
        console.log('[handleNodeDragStop] Skipping - already has parent');
        return;
      }

      // Use ref to get current nodes (avoid stale closure)
      const currentNodes = nodesRef.current;
      
      // Find all subflow nodes
      const subflowNodes = currentNodes.filter(n => n.type === 'subflowNode' && n.id !== draggedNode.id);
      console.log('[handleNodeDragStop] Found subflows:', subflowNodes.length);
      
      // Check if the dragged node is inside any subflow
      for (const subflow of subflowNodes) {
        const subflowWidth = subflow.style?.width || 300;
        const subflowHeight = subflow.style?.height || 200;
        
        console.log('[handleNodeDragStop] Checking subflow', {
          subflowId: subflow.id,
          subflowPos: subflow.position,
          subflowSize: { width: subflowWidth, height: subflowHeight },
          draggedPos: draggedNode.position
        });
        
        const isInsideSubflow = 
          draggedNode.position.x >= subflow.position.x &&
          draggedNode.position.x <= subflow.position.x + subflowWidth &&
          draggedNode.position.y >= subflow.position.y &&
          draggedNode.position.y <= subflow.position.y + subflowHeight;

        console.log('[handleNodeDragStop] isInsideSubflow:', isInsideSubflow);

        if (isInsideSubflow) {
          // Calculate relative position within the subflow
          const relativeX = draggedNode.position.x - subflow.position.x;
          const relativeY = draggedNode.position.y - subflow.position.y;

          // Update the node to be a child of the subflow
          const updatedNode = {
            ...draggedNode,
            position: { x: relativeX, y: relativeY },
            parentNode: subflow.id,
            extent: 'parent',
          };

          console.log('[handleNodeDragStop] Updating node to be child of subflow', updatedNode);
          onNodesChange([{ type: 'replace', item: updatedNode }]);
          break;
        }
      }
    },
    [onNodesChange]
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
        nodes={validatedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDragStop={handleNodeDragStop}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance;
        }}
        nodeTypes={nodeTypesMemo}
        fitView
        connectionLineType={connectionLineType}
        style={{ backgroundColor: "var(--bg-primary)" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={bgColor} gap={20} />
        <Controls />
        
        {/* Connection Line Type Selector */}
        <div
          className="absolute top-4 right-14 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg z-10"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <label
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Connection Type:
          </label>
          <select
            value={connectionLineType}
            onChange={(e) => handleConnectionLineTypeChange(e.target.value)}
            className="text-xs px-2 py-1 rounded border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          >
            <option value={ConnectionLineType.Straight}>Straight</option>
            <option value={ConnectionLineType.Bezier}>Bezier</option>
            <option value={ConnectionLineType.Step}>Step</option>
            <option value={ConnectionLineType.SmoothStep}>Smooth Step</option>
          </select>
        </div>
      </ReactFlow>
    </div>
  );
};

export default SystemDiagram;
