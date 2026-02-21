/**
 * Import service for diagrams
 * Supports: JSON imports with schema versioning and migrations
 */

import type { Diagram, ImportResult, LayoutDirection } from '../store/types';
import type { ConnectionLineType } from 'reactflow';
import { nanoid } from 'nanoid';

// ============================================================================
// Schema Versions & Migrations
// ============================================================================

const CURRENT_SCHEMA_VERSION = 1;

// Loose types for parsing untrusted legacy data
type RawNode = Record<string, unknown> & {
  id?: string;
  type?: string;
  position?: { x?: number; y?: number };
  data?: Record<string, unknown>;
  label?: string;
  description?: string;
  tech?: string;
};

type RawEdge = Record<string, unknown> & {
  id?: string;
  source?: string;
  target?: string;
  data?: Record<string, unknown>;
};

interface LegacyDiagramV0 {
  id?: string;
  name: string;
  nodes: RawNode[];
  edges: RawEdge[];
  mermaidCode?: string;
  layoutDirection?: string;
  connectionLineType?: string;
  createdAt?: number;
}

/**
 * Migrate a diagram from any version to the current version
 */
const migrateDiagram = (data: unknown): { diagram: Diagram; migrations: string[] } => {
  const migrations: string[] = [];
  let diagram = data as Record<string, unknown>;

  // Detect version
  const version = diagram.version || 0;

  // Migration: v0 → v1
  if (version === 0 || !diagram.version) {
    migrations.push('Migrated from v0 to v1');
    diagram = migrateV0ToV1(diagram);
  }

  return { diagram, migrations };
};

/**
 * Migration: v0 (legacy format) → v1 (current format)
 */
const migrateV0ToV1 = (legacyData: LegacyDiagramV0): Diagram => {
  const now = Date.now();

  return {
    // Metadata
    id: legacyData.id || nanoid(),
    name: legacyData.name || 'Imported Diagram',
    createdAt: legacyData.createdAt || now,
    modifiedAt: now,
    version: 1,
    tags: [],

    // Diagram data
    nodes: legacyData.nodes.map((node) => ({
      ...node,
      data: {
        label: node.data?.label || node.label || 'Untitled',
        description: node.data?.description || node.description || '',
        tech: node.data?.tech || node.tech || '',
      },
    })),
    edges: legacyData.edges.map((edge) => ({
      ...edge,
      data: edge.data || {},
    })),
    layoutDirection: (legacyData.layoutDirection as LayoutDirection) || 'LR',
    connectionLineType: (legacyData.connectionLineType as ConnectionLineType) || 'default',
    mermaidCode: legacyData.mermaidCode,
    viewport: { x: 0, y: 0, zoom: 1 },
  };
};

// ============================================================================
// JSON Import
// ============================================================================

export const importFromJSON = (json: string): ImportResult => {
  try {
    const data = JSON.parse(json);

    // Validate basic structure
    if (!data.nodes || !Array.isArray(data.nodes)) {
      return {
        success: false,
        error: 'Invalid diagram format: missing or invalid nodes array',
      };
    }

    if (!data.edges || !Array.isArray(data.edges)) {
      return {
        success: false,
        error: 'Invalid diagram format: missing or invalid edges array',
      };
    }

    // Handle both wrapped and unwrapped formats
    let diagramData = data;
    if (data.diagram) {
      // Wrapped format (exported with metadata)
      diagramData = {
        ...data.metadata,
        ...data.diagram,
        mermaidCode: data.mermaidCode,
      };
    }

    // Migrate to current version
    const { diagram, migrations } = migrateDiagram(diagramData);

    // Validate migrated diagram
    const validation = validateDiagram(diagram);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    return {
      success: true,
      diagram,
      migrationsApplied: migrations.length > 0 ? migrations : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse JSON',
    };
  }
};

// ============================================================================
// File Import (handles File object)
// ============================================================================

export const importFromFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    if (!file.name.endsWith('.json')) {
      resolve({
        success: false,
        error: 'Invalid file type. Only .json files are supported.',
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importFromJSON(content);
      resolve(result);
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file',
      });
    };

    reader.readAsText(file);
  });
};

// ============================================================================
// Validation
// ============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const validateDiagram = (diagram: Diagram): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!diagram.id) errors.push('Missing diagram ID');
  if (!diagram.name) errors.push('Missing diagram name');
  if (!diagram.version) errors.push('Missing schema version');
  if (!diagram.createdAt) errors.push('Missing creation date');
  if (!diagram.modifiedAt) errors.push('Missing modification date');

  // Validate nodes
  if (!Array.isArray(diagram.nodes)) {
    errors.push('Nodes must be an array');
  } else {
    diagram.nodes.forEach((node, index) => {
      if (!node.id) errors.push(`Node at index ${index} missing ID`);
      if (!node.type) warnings.push(`Node ${node.id} missing type`);
      if (!node.position) errors.push(`Node ${node.id} missing position`);
      if (!node.data) errors.push(`Node ${node.id} missing data`);
      if (node.data && !node.data.label) {
        warnings.push(`Node ${node.id} missing label`);
      }
    });
  }

  // Validate edges
  if (!Array.isArray(diagram.edges)) {
    errors.push('Edges must be an array');
  } else {
    diagram.edges.forEach((edge, index) => {
      if (!edge.id) errors.push(`Edge at index ${index} missing ID`);
      if (!edge.source) errors.push(`Edge ${edge.id} missing source`);
      if (!edge.target) errors.push(`Edge ${edge.id} missing target`);

      // Check if source/target nodes exist
      const sourceExists = diagram.nodes.some((n) => n.id === edge.source);
      const targetExists = diagram.nodes.some((n) => n.id === edge.target);

      if (!sourceExists) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!targetExists) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    });
  }

  // Validate layout direction
  const validDirections = ['LR', 'TB', 'RL', 'BT'];
  if (diagram.layoutDirection && !validDirections.includes(diagram.layoutDirection)) {
    warnings.push(`Invalid layout direction: ${diagram.layoutDirection}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

// ============================================================================
// Import from Legacy Formats (Mermaid, PlantUML)
// ============================================================================

export const importFromMermaid = (mermaidCode: string): ImportResult => {
  try {
    // Parse Mermaid syntax (basic implementation)
    const lines = mermaidCode.split('\n').filter((line) => line.trim());
    const nodes: RawNode[] = [];
    const edges: RawEdge[] = [];
    const nodeMap = new Map<string, RawNode>();

    let graphDirection = 'LR';

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse graph direction
      if (trimmed.startsWith('graph ')) {
        const match = trimmed.match(/graph\s+(LR|TB|RL|BT)/);
        if (match) graphDirection = match[1];
        continue;
      }

      // Parse node definitions
      const nodeMatch = trimmed.match(/^(\w+)\[(.*?)\]$/);
      if (nodeMatch) {
        const [, id, label] = nodeMatch;
        const node = {
          id,
          type: 'serverNode',
          position: { x: nodes.length * 200, y: 100 },
          data: { label },
        };
        nodes.push(node);
        nodeMap.set(id, node);
        continue;
      }

      // Parse edges
      const edgeMatch = trimmed.match(/(\w+)\s*(-->|==>)\s*(\w+)/);
      if (edgeMatch) {
        const [, source, arrow, target] = edgeMatch;
        edges.push({
          id: nanoid(),
          source,
          target,
          animated: arrow === '==>',
          type: 'default',
        });
        continue;
      }
    }

    if (nodes.length === 0) {
      return {
        success: false,
        error: 'No nodes found in Mermaid diagram',
      };
    }

    const diagram: Diagram = {
      id: nanoid(),
      name: 'Imported from Mermaid',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      version: CURRENT_SCHEMA_VERSION,
      nodes,
      edges,
      layoutDirection: graphDirection as LayoutDirection,
      connectionLineType: 'default',
      mermaidCode,
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    return {
      success: true,
      diagram,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse Mermaid code',
    };
  }
};

// ============================================================================
// Bulk Import (multiple diagrams)
// ============================================================================

export const importMultipleDiagrams = async (files: FileList): Promise<ImportResult[]> => {
  const results: ImportResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await importFromFile(file);
    results.push(result);
  }

  return results;
};

// ============================================================================
// Export all functions
// ============================================================================

export {
  CURRENT_SCHEMA_VERSION,
  validateDiagram,
  migrateDiagram,
};
