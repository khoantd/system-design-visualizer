/**
 * Layout service for automatic graph layouting
 * Uses Dagre for hierarchical layouts and provides alignment/distribution utilities
 */

import dagre from '@dagrejs/dagre';
import type { DiagramNode, DiagramEdge, LayoutDirection } from '../store/types';

// ============================================================================
// Dagre Auto-Layout
// ============================================================================

interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number; // Vertical spacing between ranks
  nodeSep?: number; // Horizontal spacing between nodes
  edgeSep?: number; // Spacing between edges
}

export const applyDagreLayout = (
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  options: LayoutOptions = {}
): { nodes: DiagramNode[]; edges: DiagramEdge[] } => {
  const {
    direction = 'LR',
    nodeWidth = 150,
    nodeHeight = 80,
    rankSep = 100,
    nodeSep = 80,
    edgeSep = 10,
  } = options;

  // Create a new directed graph
  const graph = new dagre.graphlib.Graph();

  // Set graph options
  graph.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    edgesep: edgeSep,
    marginx: 50,
    marginy: 50,
  });

  // Default edge configuration
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph
  nodes.forEach((node) => {
    // Use actual node dimensions if available
    const width = node.width || node.style?.width || nodeWidth;
    const height = node.height || node.style?.height || nodeHeight;

    graph.setNode(node.id, { width, height });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(graph);

  // Apply new positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);
    if (!nodeWithPosition) return node;

    // Dagre centers the node at x,y, React Flow uses top-left
    const width = node.width || node.style?.width || nodeWidth;
    const height = node.height || node.style?.height || nodeHeight;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
};

// ============================================================================
// Force-Directed Layout (Experimental)
// ============================================================================

export const applyForceLayout = (
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  iterations: number = 50
): { nodes: DiagramNode[]; edges: DiagramEdge[] } => {
  // Simple force-directed layout using repulsion and attraction
  const layoutedNodes = [...nodes];
  const k = 200; // Optimal distance between nodes
  const c = 0.1; // Repulsion constant
  const attractionStrength = 0.05;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { x: number; y: number }>();

    // Initialize forces
    layoutedNodes.forEach((node) => {
      forces.set(node.id, { x: 0, y: 0 });
    });

    // Calculate repulsive forces (all nodes repel each other)
    for (let i = 0; i < layoutedNodes.length; i++) {
      for (let j = i + 1; j < layoutedNodes.length; j++) {
        const node1 = layoutedNodes[i];
        const node2 = layoutedNodes[j];

        const dx = node2.position.x - node1.position.x;
        const dy = node2.position.y - node1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = (c * k * k) / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        const f1 = forces.get(node1.id)!;
        const f2 = forces.get(node2.id)!;

        f1.x -= fx;
        f1.y -= fy;
        f2.x += fx;
        f2.y += fy;
      }
    }

    // Calculate attractive forces (connected nodes attract)
    edges.forEach((edge) => {
      const sourceNode = layoutedNodes.find((n) => n.id === edge.source);
      const targetNode = layoutedNodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return;

      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      const force = attractionStrength * distance;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      const f1 = forces.get(sourceNode.id)!;
      const f2 = forces.get(targetNode.id)!;

      f1.x += fx;
      f1.y += fy;
      f2.x -= fx;
      f2.y -= fy;
    });

    // Apply forces
    layoutedNodes.forEach((node) => {
      const force = forces.get(node.id)!;
      node.position.x += force.x;
      node.position.y += force.y;
    });
  }

  return { nodes: layoutedNodes, edges };
};

// ============================================================================
// Alignment Tools
// ============================================================================

export const alignNodes = (
  nodes: DiagramNode[],
  selectedNodeIds: string[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): DiagramNode[] => {
  if (selectedNodeIds.length < 2) return nodes;

  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  const otherNodes = nodes.filter((n) => !selectedNodeIds.includes(n.id));

  let referenceValue: number;

  switch (alignment) {
    case 'left':
      referenceValue = Math.min(...selectedNodes.map((n) => n.position.x));
      selectedNodes.forEach((node) => {
        node.position.x = referenceValue;
      });
      break;

    case 'center': {
      const minX = Math.min(...selectedNodes.map((n) => n.position.x));
      const maxX = Math.max(...selectedNodes.map((n) => n.position.x + (n.width || 150)));
      referenceValue = (minX + maxX) / 2;
      selectedNodes.forEach((node) => {
        node.position.x = referenceValue - (node.width || 150) / 2;
      });
      break;
    }

    case 'right': {
      const maxX = Math.max(...selectedNodes.map((n) => n.position.x + (n.width || 150)));
      selectedNodes.forEach((node) => {
        node.position.x = maxX - (node.width || 150);
      });
      break;
    }

    case 'top':
      referenceValue = Math.min(...selectedNodes.map((n) => n.position.y));
      selectedNodes.forEach((node) => {
        node.position.y = referenceValue;
      });
      break;

    case 'middle': {
      const minY = Math.min(...selectedNodes.map((n) => n.position.y));
      const maxY = Math.max(...selectedNodes.map((n) => n.position.y + (n.height || 80)));
      referenceValue = (minY + maxY) / 2;
      selectedNodes.forEach((node) => {
        node.position.y = referenceValue - (node.height || 80) / 2;
      });
      break;
    }

    case 'bottom': {
      const maxY = Math.max(...selectedNodes.map((n) => n.position.y + (n.height || 80)));
      selectedNodes.forEach((node) => {
        node.position.y = maxY - (node.height || 80);
      });
      break;
    }
  }

  return [...otherNodes, ...selectedNodes];
};

// ============================================================================
// Distribution Tools
// ============================================================================

export const distributeNodes = (
  nodes: DiagramNode[],
  selectedNodeIds: string[],
  distribution: 'horizontal' | 'vertical'
): DiagramNode[] => {
  if (selectedNodeIds.length < 3) return nodes;

  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  const otherNodes = nodes.filter((n) => !selectedNodeIds.includes(n.id));

  if (distribution === 'horizontal') {
    // Sort by x position
    selectedNodes.sort((a, b) => a.position.x - b.position.x);

    const minX = selectedNodes[0].position.x;
    const maxX = selectedNodes[selectedNodes.length - 1].position.x;
    const totalWidth = maxX - minX;
    const spacing = totalWidth / (selectedNodes.length - 1);

    selectedNodes.forEach((node, index) => {
      node.position.x = minX + index * spacing;
    });
  } else {
    // Sort by y position
    selectedNodes.sort((a, b) => a.position.y - b.position.y);

    const minY = selectedNodes[0].position.y;
    const maxY = selectedNodes[selectedNodes.length - 1].position.y;
    const totalHeight = maxY - minY;
    const spacing = totalHeight / (selectedNodes.length - 1);

    selectedNodes.forEach((node, index) => {
      node.position.y = minY + index * spacing;
    });
  }

  return [...otherNodes, ...selectedNodes];
};

// ============================================================================
// Snap to Grid
// ============================================================================

export const snapNodesToGrid = (
  nodes: DiagramNode[],
  gridSize: number = 20
): DiagramNode[] => {
  return nodes.map((node) => ({
    ...node,
    position: {
      x: Math.round(node.position.x / gridSize) * gridSize,
      y: Math.round(node.position.y / gridSize) * gridSize,
    },
  }));
};

// ============================================================================
// Calculate Bounds
// ============================================================================

export const calculateBounds = (nodes: DiagramNode[]) => {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxX = Math.max(...nodes.map((n) => n.position.x + (n.width || 150)));
  const maxY = Math.max(...nodes.map((n) => n.position.y + (n.height || 80)));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// ============================================================================
// Center Diagram
// ============================================================================

export const centerDiagram = (
  nodes: DiagramNode[],
  viewportWidth: number,
  viewportHeight: number
): DiagramNode[] => {
  const bounds = calculateBounds(nodes);
  const offsetX = (viewportWidth - bounds.width) / 2 - bounds.minX;
  const offsetY = (viewportHeight - bounds.height) / 2 - bounds.minY;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }));
};
