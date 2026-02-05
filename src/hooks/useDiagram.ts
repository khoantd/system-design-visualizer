/**
 * Custom hooks for accessing diagram store
 * Provides convenient selectors and actions
 */

import { useDiagramStore, selectNodes, selectEdges, selectUI, selectCanUndo, selectCanRedo, selectFilteredNodes } from '../store/diagramStore';
import { useCallback } from 'react';
import type { DiagramNode, DiagramEdge } from '../store/types';

// ============================================================================
// Core hooks for store access
// ============================================================================

export const useDiagram = () => {
  const currentDiagram = useDiagramStore((state) => state.currentDiagram);
  const savedDiagrams = useDiagramStore((state) => state.savedDiagrams);

  return {
    currentDiagram,
    savedDiagrams,
  };
};

export const useNodes = () => {
  return useDiagramStore(selectNodes);
};

export const useEdges = () => {
  return useDiagramStore(selectEdges);
};

export const useFilteredNodes = () => {
  return useDiagramStore(selectFilteredNodes);
};

export const useUI = () => {
  return useDiagramStore(selectUI);
};

// ============================================================================
// Action hooks
// ============================================================================

export const useNodeActions = () => {
  const addNode = useDiagramStore((state) => state.addNode);
  const updateNode = useDiagramStore((state) => state.updateNode);
  const deleteNode = useDiagramStore((state) => state.deleteNode);
  const setNodes = useDiagramStore((state) => state.setNodes);

  return {
    addNode,
    updateNode,
    deleteNode,
    setNodes,
  };
};

export const useEdgeActions = () => {
  const addEdge = useDiagramStore((state) => state.addEdge);
  const updateEdge = useDiagramStore((state) => state.updateEdge);
  const deleteEdge = useDiagramStore((state) => state.deleteEdge);
  const setEdges = useDiagramStore((state) => state.setEdges);

  return {
    addEdge,
    updateEdge,
    deleteEdge,
    setEdges,
  };
};

export const useHistory = () => {
  const undo = useDiagramStore((state) => state.undo);
  const redo = useDiagramStore((state) => state.redo);
  const canUndo = useDiagramStore(selectCanUndo);
  const canRedo = useDiagramStore(selectCanRedo);
  const clearHistory = useDiagramStore((state) => state.clearHistory);
  const captureSnapshot = useDiagramStore((state) => state.captureSnapshot);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    captureSnapshot,
  };
};

export const useDiagramManagement = () => {
  const createDiagram = useDiagramStore((state) => state.createDiagram);
  const loadDiagram = useDiagramStore((state) => state.loadDiagram);
  const saveDiagram = useDiagramStore((state) => state.saveDiagram);
  const deleteDiagram = useDiagramStore((state) => state.deleteDiagram);
  const duplicateDiagram = useDiagramStore((state) => state.duplicateDiagram);
  const renameDiagram = useDiagramStore((state) => state.renameDiagram);
  const getCurrentDiagram = useDiagramStore((state) => state.getCurrentDiagram);
  const getAllDiagrams = useDiagramStore((state) => state.getAllDiagrams);

  return {
    createDiagram,
    loadDiagram,
    saveDiagram,
    deleteDiagram,
    duplicateDiagram,
    renameDiagram,
    getCurrentDiagram,
    getAllDiagrams,
  };
};

export const useExportImport = () => {
  const exportDiagram = useDiagramStore((state) => state.exportDiagram);
  const importDiagram = useDiagramStore((state) => state.importDiagram);
  const exportToJSON = useDiagramStore((state) => state.exportToJSON);
  const importFromJSON = useDiagramStore((state) => state.importFromJSON);

  return {
    exportDiagram,
    importDiagram,
    exportToJSON,
    importFromJSON,
  };
};

export const useLayout = () => {
  const applyAutoLayout = useDiagramStore((state) => state.applyAutoLayout);
  const setLayoutDirection = useDiagramStore((state) => state.setLayoutDirection);
  const setConnectionLineType = useDiagramStore((state) => state.setConnectionLineType);
  const alignNodes = useDiagramStore((state) => state.alignNodes);
  const distributeNodes = useDiagramStore((state) => state.distributeNodes);
  const fitView = useDiagramStore((state) => state.fitView);
  const layoutDirection = useDiagramStore((state) => state.currentDiagram.layoutDirection);
  const connectionLineType = useDiagramStore((state) => state.currentDiagram.connectionLineType);

  return {
    applyAutoLayout,
    setLayoutDirection,
    setConnectionLineType,
    alignNodes,
    distributeNodes,
    fitView,
    layoutDirection,
    connectionLineType,
  };
};

export const useUIActions = () => {
  const toggleSaveModal = useDiagramStore((state) => state.toggleSaveModal);
  const toggleLoadPanel = useDiagramStore((state) => state.toggleLoadPanel);
  const toggleChatPanel = useDiagramStore((state) => state.toggleChatPanel);
  const toggleComponentPanel = useDiagramStore((state) => state.toggleComponentPanel);
  const toggleCodePanel = useDiagramStore((state) => state.toggleCodePanel);
  const setSelectedNode = useDiagramStore((state) => state.setSelectedNode);
  const setSelectedEdge = useDiagramStore((state) => state.setSelectedEdge);
  const clearSelection = useDiagramStore((state) => state.clearSelection);
  const setAnalyzing = useDiagramStore((state) => state.setAnalyzing);
  const setConverting = useDiagramStore((state) => state.setConverting);
  const setGeneratingCode = useDiagramStore((state) => state.setGeneratingCode);
  const setError = useDiagramStore((state) => state.setError);
  const toggleGrid = useDiagramStore((state) => state.toggleGrid);
  const toggleMinimap = useDiagramStore((state) => state.toggleMinimap);
  const toggleSnapToGrid = useDiagramStore((state) => state.toggleSnapToGrid);
  const setGridSize = useDiagramStore((state) => state.setGridSize);
  const toggleCommandPalette = useDiagramStore((state) => state.toggleCommandPalette);
  const setSearchQuery = useDiagramStore((state) => state.setSearchQuery);
  const setFilterByType = useDiagramStore((state) => state.setFilterByType);

  return {
    toggleSaveModal,
    toggleLoadPanel,
    toggleChatPanel,
    toggleComponentPanel,
    toggleCodePanel,
    setSelectedNode,
    setSelectedEdge,
    clearSelection,
    setAnalyzing,
    setConverting,
    setGeneratingCode,
    setError,
    toggleGrid,
    toggleMinimap,
    toggleSnapToGrid,
    setGridSize,
    toggleCommandPalette,
    setSearchQuery,
    setFilterByType,
  };
};

// ============================================================================
// React Flow integration hooks
// ============================================================================

export const useReactFlowHandlers = () => {
  const onNodesChange = useDiagramStore((state) => state.onNodesChange);
  const onEdgesChange = useDiagramStore((state) => state.onEdgesChange);
  const onConnect = useDiagramStore((state) => state.onConnect);

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
  };
};

// ============================================================================
// Selection hooks
// ============================================================================

export const useSelection = () => {
  const selectedNode = useDiagramStore((state) => state.ui.selectedNode);
  const selectedEdge = useDiagramStore((state) => state.ui.selectedEdge);
  const setSelectedNode = useDiagramStore((state) => state.setSelectedNode);
  const setSelectedEdge = useDiagramStore((state) => state.setSelectedEdge);
  const clearSelection = useDiagramStore((state) => state.clearSelection);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: DiagramNode) => {
      event.stopPropagation();
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: DiagramEdge) => {
      event.stopPropagation();
      setSelectedEdge(edge);
    },
    [setSelectedEdge]
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return {
    selectedNode,
    selectedEdge,
    setSelectedNode,
    setSelectedEdge,
    clearSelection,
    handleNodeClick,
    handleEdgeClick,
    handlePaneClick,
  };
};

// ============================================================================
// Search & Filter hooks
// ============================================================================

export const useSearch = () => {
  const searchQuery = useDiagramStore((state) => state.ui.searchQuery);
  const filterByType = useDiagramStore((state) => state.ui.filterByType);
  const setSearchQuery = useDiagramStore((state) => state.setSearchQuery);
  const setFilterByType = useDiagramStore((state) => state.setFilterByType);
  const filteredNodes = useFilteredNodes();

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterByType(null);
  }, [setSearchQuery, setFilterByType]);

  return {
    searchQuery,
    filterByType,
    setSearchQuery,
    setFilterByType,
    filteredNodes,
    clearFilters,
  };
};
