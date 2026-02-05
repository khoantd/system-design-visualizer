/**
 * Type definitions for the System Design Visualizer store
 * Covers all state shapes, actions, and configuration
 */

import type { Node, Edge, ConnectionLineType } from 'reactflow';

// ============================================================================
// Core Diagram Types
// ============================================================================

export interface DiagramNode extends Node {
  data: {
    label: string;
    description?: string;
    tech?: string;
    // Future: health, status for simulation
    health?: number; // 0-100
    status?: 'healthy' | 'degraded' | 'down';
    lastChecked?: number; // timestamp
  };
}

export interface DiagramEdge extends Edge {
  data?: {
    label?: string;
    type?: 'request' | 'response' | 'sync' | 'async';
    color?: string;
    // Future: traffic metrics for visualization
    criticality?: 'low' | 'medium' | 'high';
    timeout?: number; // ms
  };
}

export type LayoutDirection = 'LR' | 'TB' | 'RL' | 'BT';

// ============================================================================
// Diagram Management
// ============================================================================

export interface DiagramMetadata {
  id: string;
  name: string;
  createdAt: number; // timestamp
  modifiedAt: number; // timestamp
  author?: string;
  version: number; // schema version for migrations
  tags?: string[];
  description?: string;
}

export interface Diagram extends DiagramMetadata {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  mermaidCode?: string;
  layoutDirection: LayoutDirection;
  connectionLineType: ConnectionLineType;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

// ============================================================================
// UI State
// ============================================================================

export interface UIState {
  // Panels & Modals
  showSaveModal: boolean;
  showLoadPanel: boolean;
  isChatOpen: boolean;
  showComponentPanel: boolean;
  showCodePanel: boolean;

  // Processing States
  isAnalyzing: boolean;
  isConverting: boolean;
  isGeneratingCode: boolean;

  // Selection
  selectedNode: DiagramNode | null;
  selectedEdge: DiagramEdge | null;

  // Error Handling
  error: string | null;

  // Canvas State
  isGridVisible: boolean;
  isMinimapVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // Command Palette
  isCommandPaletteOpen: boolean;

  // Search & Filter
  searchQuery: string;
  filterByType: string | null;
}

// ============================================================================
// History for Undo/Redo
// ============================================================================

export interface HistoryState {
  past: DiagramSnapshot[];
  future: DiagramSnapshot[];
}

export interface DiagramSnapshot {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  timestamp: number;
}

// ============================================================================
// Export/Import
// ============================================================================

export type ExportFormat = 'json' | 'png' | 'svg' | 'mermaid' | 'plantuml';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  imageResolution?: number; // for PNG export (DPI multiplier)
  watermark?: boolean;
}

export interface ImportResult {
  success: boolean;
  diagram?: Diagram;
  error?: string;
  migrationsApplied?: string[];
}

// ============================================================================
// Store Schema Versioning
// ============================================================================

export const CURRENT_SCHEMA_VERSION = 1;

export interface PersistedState {
  version: number;
  currentDiagram: Diagram;
  savedDiagrams: Diagram[];
  uiState: Partial<UIState>;
  timestamp: number;
}

// ============================================================================
// Store Actions
// ============================================================================

export interface DiagramActions {
  // Node Management
  addNode: (node: Omit<DiagramNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<DiagramNode>) => void;
  deleteNode: (id: string) => void;

  // Edge Management
  addEdge: (edge: Omit<DiagramEdge, 'id'>) => void;
  updateEdge: (id: string, updates: Partial<DiagramEdge>) => void;
  deleteEdge: (id: string) => void;

  // Bulk Operations
  setNodes: (nodes: DiagramNode[]) => void;
  setEdges: (edges: DiagramEdge[]) => void;
  clearDiagram: () => void;

  // React Flow Change Handlers
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: any) => void;
}

export interface HistoryActions {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  captureSnapshot: () => void;
}

export interface DiagramManagementActions {
  createDiagram: (name: string) => void;
  loadDiagram: (id: string) => void;
  saveDiagram: (name?: string) => void;
  deleteDiagram: (id: string) => void;
  duplicateDiagram: (id: string) => void;
  renameDiagram: (id: string, newName: string) => void;
  getCurrentDiagram: () => Diagram;
  getAllDiagrams: () => Diagram[];
}

export interface ExportImportActions {
  exportDiagram: (options: ExportOptions) => Promise<void>;
  importDiagram: (data: string | File) => Promise<ImportResult>;
  exportToJSON: () => string;
  importFromJSON: (json: string) => ImportResult;
}

export interface LayoutActions {
  applyAutoLayout: (direction?: LayoutDirection) => void;
  setLayoutDirection: (direction: LayoutDirection) => void;
  setConnectionLineType: (type: ConnectionLineType) => void;
  alignNodes: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeNodes: (distribution: 'horizontal' | 'vertical') => void;
  fitView: () => void;
}

export interface UIActions {
  // Modal/Panel Control
  toggleSaveModal: (show?: boolean) => void;
  toggleLoadPanel: (show?: boolean) => void;
  toggleChatPanel: (show?: boolean) => void;
  toggleComponentPanel: (show?: boolean) => void;
  toggleCodePanel: (show?: boolean) => void;

  // Selection
  setSelectedNode: (node: DiagramNode | null) => void;
  setSelectedEdge: (edge: DiagramEdge | null) => void;
  clearSelection: () => void;

  // Processing States
  setAnalyzing: (isAnalyzing: boolean) => void;
  setConverting: (isConverting: boolean) => void;
  setGeneratingCode: (isGenerating: boolean) => void;

  // Error Handling
  setError: (error: string | null) => void;

  // Canvas Controls
  toggleGrid: () => void;
  toggleMinimap: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;

  // Command Palette
  toggleCommandPalette: (show?: boolean) => void;

  // Search & Filter
  setSearchQuery: (query: string) => void;
  setFilterByType: (type: string | null) => void;
}

// ============================================================================
// Combined Store State
// ============================================================================

export interface DiagramStore extends
  DiagramActions,
  HistoryActions,
  DiagramManagementActions,
  ExportImportActions,
  LayoutActions,
  UIActions {

  // State
  currentDiagram: Diagram;
  savedDiagrams: Diagram[];
  history: HistoryState;
  ui: UIState;

  // Metadata
  version: number;
}
