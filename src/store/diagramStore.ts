/**
 * Central Zustand store for System Design Visualizer
 * Manages: diagrams, history (undo/redo), UI state, persistence
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { nanoid } from 'nanoid';
import type {
  DiagramStore,
  Diagram,
  DiagramNode,
  DiagramEdge,
  LayoutDirection,
  DiagramSnapshot,
  UIState,
  PersistedState,
  CURRENT_SCHEMA_VERSION,
} from './types';

// ============================================================================
// Initial States
// ============================================================================

const createEmptyDiagram = (name: string = 'Untitled Diagram'): Diagram => ({
  id: nanoid(),
  name,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  version: 1,
  nodes: [],
  edges: [],
  layoutDirection: 'LR',
  connectionLineType: 'default',
  viewport: { x: 0, y: 0, zoom: 1 },
});

const initialUIState: UIState = {
  showSaveModal: false,
  showLoadPanel: false,
  isChatOpen: false,
  showComponentPanel: false,
  showCodePanel: false,
  isAnalyzing: false,
  isConverting: false,
  isGeneratingCode: false,
  selectedNode: null,
  selectedEdge: null,
  error: null,
  isGridVisible: true,
  isMinimapVisible: true,
  snapToGrid: false,
  gridSize: 20,
  isCommandPaletteOpen: false,
  searchQuery: '',
  filterByType: null,
};

// ============================================================================
// History Management (Undo/Redo)
// ============================================================================

const MAX_HISTORY_SIZE = 50;

const createSnapshot = (nodes: DiagramNode[], edges: DiagramEdge[]): DiagramSnapshot => ({
  nodes: structuredClone(nodes),
  edges: structuredClone(edges),
  timestamp: Date.now(),
});

// ============================================================================
// Store Creation
// ============================================================================

export const useDiagramStore = create<DiagramStore>()(
  persist(
    immer((set, get) => ({
      // ========================================================================
      // State
      // ========================================================================

      currentDiagram: createEmptyDiagram(),
      savedDiagrams: [],
      history: {
        past: [],
        future: [],
      },
      ui: initialUIState,
      version: 1,

      // ========================================================================
      // Node Management
      // ========================================================================

      addNode: (node) =>
        set((state) => {
          const newNode: DiagramNode = {
            ...node,
            id: nanoid(),
          } as DiagramNode;
          state.currentDiagram.nodes.push(newNode);
          state.currentDiagram.modifiedAt = Date.now();
          get().captureSnapshot();
        }),

      updateNode: (id, updates) =>
        set((state) => {
          const nodeIndex = state.currentDiagram.nodes.findIndex((n) => n.id === id);
          if (nodeIndex !== -1) {
            state.currentDiagram.nodes[nodeIndex] = {
              ...state.currentDiagram.nodes[nodeIndex],
              ...updates,
            };
            state.currentDiagram.modifiedAt = Date.now();
          }
        }),

      deleteNode: (id) =>
        set((state) => {
          state.currentDiagram.nodes = state.currentDiagram.nodes.filter((n) => n.id !== id);
          state.currentDiagram.edges = state.currentDiagram.edges.filter(
            (e) => e.source !== id && e.target !== id
          );
          state.currentDiagram.modifiedAt = Date.now();
          get().captureSnapshot();
        }),

      // ========================================================================
      // Edge Management
      // ========================================================================

      addEdge: (edge) =>
        set((state) => {
          const newEdge: DiagramEdge = {
            ...edge,
            id: nanoid(),
          } as DiagramEdge;
          state.currentDiagram.edges.push(newEdge);
          state.currentDiagram.modifiedAt = Date.now();
          get().captureSnapshot();
        }),

      updateEdge: (id, updates) =>
        set((state) => {
          const edgeIndex = state.currentDiagram.edges.findIndex((e) => e.id === id);
          if (edgeIndex !== -1) {
            state.currentDiagram.edges[edgeIndex] = {
              ...state.currentDiagram.edges[edgeIndex],
              ...updates,
            };
            state.currentDiagram.modifiedAt = Date.now();
          }
        }),

      deleteEdge: (id) =>
        set((state) => {
          state.currentDiagram.edges = state.currentDiagram.edges.filter((e) => e.id !== id);
          state.currentDiagram.modifiedAt = Date.now();
          get().captureSnapshot();
        }),

      // ========================================================================
      // Bulk Operations
      // ========================================================================

      setNodes: (nodes) =>
        set((state) => {
          state.currentDiagram.nodes = nodes;
          state.currentDiagram.modifiedAt = Date.now();
        }),

      setEdges: (edges) =>
        set((state) => {
          state.currentDiagram.edges = edges;
          state.currentDiagram.modifiedAt = Date.now();
        }),

      clearDiagram: () =>
        set((state) => {
          state.currentDiagram.nodes = [];
          state.currentDiagram.edges = [];
          state.currentDiagram.modifiedAt = Date.now();
          get().captureSnapshot();
        }),

      // ========================================================================
      // React Flow Change Handlers
      // ========================================================================

      onNodesChange: (changes) =>
        set((state) => {
          state.currentDiagram.nodes = applyNodeChanges(
            changes,
            state.currentDiagram.nodes
          ) as DiagramNode[];
          state.currentDiagram.modifiedAt = Date.now();

          // Capture snapshot for position changes and deletions
          const hasSignificantChange = changes.some(
            (change) => change.type === 'remove' || change.type === 'add'
          );
          if (hasSignificantChange) {
            get().captureSnapshot();
          }
        }),

      onEdgesChange: (changes) =>
        set((state) => {
          state.currentDiagram.edges = applyEdgeChanges(
            changes,
            state.currentDiagram.edges
          ) as DiagramEdge[];
          state.currentDiagram.modifiedAt = Date.now();

          const hasSignificantChange = changes.some(
            (change) => change.type === 'remove' || change.type === 'add'
          );
          if (hasSignificantChange) {
            get().captureSnapshot();
          }
        }),

      onConnect: (connection) =>
        set((state) => {
          const newEdge: DiagramEdge = {
            id: nanoid(),
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            type: state.currentDiagram.connectionLineType,
            animated: false,
            style: { stroke: '#64748b', strokeWidth: 2 },
            markerEnd: { type: 'arrowclosed', color: '#64748b' },
          };
          state.currentDiagram.edges.push(newEdge);
          state.currentDiagram.modifiedAt = Date.now();
          get().captureSnapshot();
        }),

      // ========================================================================
      // History (Undo/Redo)
      // ========================================================================

      captureSnapshot: () =>
        set((state) => {
          const snapshot = createSnapshot(
            state.currentDiagram.nodes,
            state.currentDiagram.edges
          );

          // Add to past, clear future
          state.history.past.push(snapshot);
          state.history.future = [];

          // Limit history size
          if (state.history.past.length > MAX_HISTORY_SIZE) {
            state.history.past.shift();
          }
        }),

      undo: () =>
        set((state) => {
          if (state.history.past.length === 0) return;

          const currentSnapshot = createSnapshot(
            state.currentDiagram.nodes,
            state.currentDiagram.edges
          );

          const previousSnapshot = state.history.past.pop()!;
          state.history.future.unshift(currentSnapshot);

          state.currentDiagram.nodes = previousSnapshot.nodes;
          state.currentDiagram.edges = previousSnapshot.edges;
          state.currentDiagram.modifiedAt = Date.now();

          // Limit future size
          if (state.history.future.length > MAX_HISTORY_SIZE) {
            state.history.future.pop();
          }
        }),

      redo: () =>
        set((state) => {
          if (state.history.future.length === 0) return;

          const currentSnapshot = createSnapshot(
            state.currentDiagram.nodes,
            state.currentDiagram.edges
          );

          const nextSnapshot = state.history.future.shift()!;
          state.history.past.push(currentSnapshot);

          state.currentDiagram.nodes = nextSnapshot.nodes;
          state.currentDiagram.edges = nextSnapshot.edges;
          state.currentDiagram.modifiedAt = Date.now();
        }),

      canUndo: () => get().history.past.length > 0,

      canRedo: () => get().history.future.length > 0,

      clearHistory: () =>
        set((state) => {
          state.history.past = [];
          state.history.future = [];
        }),

      // ========================================================================
      // Diagram Management
      // ========================================================================

      createDiagram: (name) =>
        set((state) => {
          const newDiagram = createEmptyDiagram(name);
          state.currentDiagram = newDiagram;
          state.savedDiagrams.push(newDiagram);
          get().clearHistory();
          get().captureSnapshot();
        }),

      loadDiagram: (id) =>
        set((state) => {
          const diagram = state.savedDiagrams.find((d) => d.id === id);
          if (diagram) {
            state.currentDiagram = structuredClone(diagram);
            get().clearHistory();
            get().captureSnapshot();
            state.ui.showLoadPanel = false;
          }
        }),

      saveDiagram: (name) =>
        set((state) => {
          if (name) {
            state.currentDiagram.name = name;
          }
          state.currentDiagram.modifiedAt = Date.now();

          const existingIndex = state.savedDiagrams.findIndex(
            (d) => d.id === state.currentDiagram.id
          );

          if (existingIndex !== -1) {
            state.savedDiagrams[existingIndex] = structuredClone(state.currentDiagram);
          } else {
            state.savedDiagrams.push(structuredClone(state.currentDiagram));
          }
        }),

      deleteDiagram: (id) =>
        set((state) => {
          state.savedDiagrams = state.savedDiagrams.filter((d) => d.id !== id);
        }),

      duplicateDiagram: (id) =>
        set((state) => {
          const diagram = state.savedDiagrams.find((d) => d.id === id);
          if (diagram) {
            const duplicate: Diagram = {
              ...structuredClone(diagram),
              id: nanoid(),
              name: `${diagram.name} (Copy)`,
              createdAt: Date.now(),
              modifiedAt: Date.now(),
            };
            state.savedDiagrams.push(duplicate);
          }
        }),

      renameDiagram: (id, newName) =>
        set((state) => {
          const diagram = state.savedDiagrams.find((d) => d.id === id);
          if (diagram) {
            diagram.name = newName;
            diagram.modifiedAt = Date.now();
          }
          if (state.currentDiagram.id === id) {
            state.currentDiagram.name = newName;
          }
        }),

      getCurrentDiagram: () => get().currentDiagram,

      getAllDiagrams: () => get().savedDiagrams,

      // ========================================================================
      // Export/Import (Stub implementations - will be enhanced with services)
      // ========================================================================

      exportDiagram: async (options) => {
        // Stub - will be implemented with export service
        console.log('Export diagram with options:', options);
      },

      importDiagram: async (data) => {
        // Stub - will be implemented with import service
        console.log('Import diagram:', data);
        return { success: false, error: 'Not implemented yet' };
      },

      exportToJSON: () => {
        const diagram = get().currentDiagram;
        return JSON.stringify(diagram, null, 2);
      },

      importFromJSON: (json) => {
        try {
          const diagram = JSON.parse(json) as Diagram;
          set((state) => {
            state.currentDiagram = diagram;
            get().clearHistory();
            get().captureSnapshot();
          });
          return { success: true, diagram };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Invalid JSON',
          };
        }
      },

      // ========================================================================
      // Layout Actions (Integrated with layout service)
      // ========================================================================

      applyAutoLayout: (direction) =>
        set((state) => {
          // Dynamic import to avoid circular dependencies
          import('../services/layoutService').then(({ applyDagreLayout }) => {
            const layoutDirection = direction || state.currentDiagram.layoutDirection;
            const { nodes, edges } = applyDagreLayout(
              state.currentDiagram.nodes,
              state.currentDiagram.edges,
              { direction: layoutDirection }
            );

            set((state) => {
              state.currentDiagram.nodes = nodes;
              state.currentDiagram.edges = edges;
              state.currentDiagram.layoutDirection = layoutDirection;
              state.currentDiagram.modifiedAt = Date.now();
            });

            get().captureSnapshot();
          });
        }),

      setLayoutDirection: (direction) =>
        set((state) => {
          state.currentDiagram.layoutDirection = direction;
          state.currentDiagram.modifiedAt = Date.now();
        }),

      setConnectionLineType: (type) =>
        set((state) => {
          state.currentDiagram.connectionLineType = type;
          state.currentDiagram.modifiedAt = Date.now();
        }),

      alignNodes: (alignment) =>
        set((state) => {
          // Get selected nodes (for now, just use all nodes - proper selection coming)
          const selectedIds = state.currentDiagram.nodes.map((n) => n.id);
          import('../services/layoutService').then(({ alignNodes }) => {
            const nodes = alignNodes(state.currentDiagram.nodes, selectedIds, alignment);
            set((state) => {
              state.currentDiagram.nodes = nodes;
              state.currentDiagram.modifiedAt = Date.now();
            });
            get().captureSnapshot();
          });
        }),

      distributeNodes: (distribution) =>
        set((state) => {
          const selectedIds = state.currentDiagram.nodes.map((n) => n.id);
          import('../services/layoutService').then(({ distributeNodes }) => {
            const nodes = distributeNodes(state.currentDiagram.nodes, selectedIds, distribution);
            set((state) => {
              state.currentDiagram.nodes = nodes;
              state.currentDiagram.modifiedAt = Date.now();
            });
            get().captureSnapshot();
          });
        }),

      fitView: () => {
        // This will be handled by React Flow's fitView function
        // Store doesn't need to do anything
      },

      // ========================================================================
      // UI Actions
      // ========================================================================

      toggleSaveModal: (show) =>
        set((state) => {
          state.ui.showSaveModal = show ?? !state.ui.showSaveModal;
        }),

      toggleLoadPanel: (show) =>
        set((state) => {
          state.ui.showLoadPanel = show ?? !state.ui.showLoadPanel;
        }),

      toggleChatPanel: (show) =>
        set((state) => {
          state.ui.isChatOpen = show ?? !state.ui.isChatOpen;
        }),

      toggleComponentPanel: (show) =>
        set((state) => {
          state.ui.showComponentPanel = show ?? !state.ui.showComponentPanel;
        }),

      toggleCodePanel: (show) =>
        set((state) => {
          state.ui.showCodePanel = show ?? !state.ui.showCodePanel;
        }),

      setSelectedNode: (node) =>
        set((state) => {
          state.ui.selectedNode = node;
          state.ui.selectedEdge = null;
        }),

      setSelectedEdge: (edge) =>
        set((state) => {
          state.ui.selectedEdge = edge;
          state.ui.selectedNode = null;
        }),

      clearSelection: () =>
        set((state) => {
          state.ui.selectedNode = null;
          state.ui.selectedEdge = null;
        }),

      setAnalyzing: (isAnalyzing) =>
        set((state) => {
          state.ui.isAnalyzing = isAnalyzing;
        }),

      setConverting: (isConverting) =>
        set((state) => {
          state.ui.isConverting = isConverting;
        }),

      setGeneratingCode: (isGenerating) =>
        set((state) => {
          state.ui.isGeneratingCode = isGenerating;
        }),

      setError: (error) =>
        set((state) => {
          state.ui.error = error;
        }),

      toggleGrid: () =>
        set((state) => {
          state.ui.isGridVisible = !state.ui.isGridVisible;
        }),

      toggleMinimap: () =>
        set((state) => {
          state.ui.isMinimapVisible = !state.ui.isMinimapVisible;
        }),

      toggleSnapToGrid: () =>
        set((state) => {
          state.ui.snapToGrid = !state.ui.snapToGrid;
        }),

      setGridSize: (size) =>
        set((state) => {
          state.ui.gridSize = size;
        }),

      toggleCommandPalette: (show) =>
        set((state) => {
          state.ui.isCommandPaletteOpen = show ?? !state.ui.isCommandPaletteOpen;
        }),

      setSearchQuery: (query) =>
        set((state) => {
          state.ui.searchQuery = query;
        }),

      setFilterByType: (type) =>
        set((state) => {
          state.ui.filterByType = type;
        }),
    })),
    {
      name: 'sdv-diagram-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentDiagram: state.currentDiagram,
        savedDiagrams: state.savedDiagrams,
        version: state.version,
      }),
    }
  )
);

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectNodes = (state: DiagramStore) => state.currentDiagram.nodes;
export const selectEdges = (state: DiagramStore) => state.currentDiagram.edges;
export const selectUI = (state: DiagramStore) => state.ui;
export const selectCanUndo = (state: DiagramStore) => state.history.past.length > 0;
export const selectCanRedo = (state: DiagramStore) => state.history.future.length > 0;
export const selectFilteredNodes = (state: DiagramStore) => {
  let nodes = state.currentDiagram.nodes;

  if (state.ui.searchQuery) {
    const query = state.ui.searchQuery.toLowerCase();
    nodes = nodes.filter(
      (node) =>
        node.data.label?.toLowerCase().includes(query) ||
        node.data.description?.toLowerCase().includes(query) ||
        node.data.tech?.toLowerCase().includes(query)
    );
  }

  if (state.ui.filterByType) {
    nodes = nodes.filter((node) => node.type === state.ui.filterByType);
  }

  return nodes;
};
