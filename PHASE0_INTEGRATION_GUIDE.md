# Phase 0 Integration Guide

This guide explains how to integrate all Phase 0: Foundation & Core UX features into the existing System Design Visualizer application.

## Overview

Phase 0 implementation includes:
- ✅ Zustand store with TypeScript types
- ✅ localStorage persistence with versioning
- ✅ Undo/Redo system (50 state history)
- ✅ Multi-diagram management
- ✅ JSON/PNG/SVG/Markdown/Mermaid export
- ✅ Import with schema versioning
- ✅ Dagre auto-layout integration
- ✅ Alignment & distribution tools
- ✅ Command Palette (Cmd+K)
- ✅ Comprehensive keyboard shortcuts
- ✅ Search & filter functionality

## File Structure

```
src/
├── store/
│   ├── types.ts                      # TypeScript type definitions
│   └── diagramStore.ts               # Central Zustand store
├── hooks/
│   ├── useDiagram.ts                 # Custom hooks for store access
│   └── useKeyboardShortcuts.ts       # Global keyboard shortcut handler
├── services/
│   ├── exportService.ts              # Export to JSON/PNG/SVG/Mermaid/PlantUML
│   ├── importService.ts              # Import with versioning & validation
│   └── layoutService.ts              # Dagre layout & alignment tools
├── components/
│   ├── CommandPalette.jsx            # Cmd+K command palette
│   └── SearchFilter.jsx              # Search & filter UI
└── [existing components]
```

## Step-by-Step Integration

### Step 1: Update App.jsx to Use Zustand Store

**Before (React useState):**
```javascript
const [nodes, setNodes] = useState([]);
const [edges, setEdges] = useState([]);
const [selectedNode, setSelectedNode] = useState(null);
```

**After (Zustand store):**
```javascript
import { useNodes, useEdges, useSelection, useReactFlowHandlers } from './hooks/useDiagram';

function App() {
  const nodes = useNodes();
  const edges = useEdges();
  const { selectedNode, setSelectedNode } = useSelection();
  const { onNodesChange, onEdgesChange, onConnect } = useReactFlowHandlers();

  // ...rest of component
}
```

### Step 2: Replace Manual State Updates

**Find all instances of:**
- `setNodes(...)` → Use `useDiagramStore((state) => state.setNodes)`
- `setEdges(...)` → Use `useDiagramStore((state) => state.setEdges)`
- `onNodesChange` → Already provided by store
- `onEdgesChange` → Already provided by store

### Step 3: Add Command Palette

**In App.jsx:**
```javascript
import { CommandPalette } from './components/CommandPalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts(true);

  return (
    <div className="app">
      {/* Existing content */}

      {/* Add Command Palette */}
      <CommandPalette />
    </div>
  );
}
```

### Step 4: Add Search & Filter UI

**Add to your toolbar/header:**
```javascript
import { SearchFilter } from './components/SearchFilter';

// In your header/toolbar component
<SearchFilter className="flex-1" />
```

### Step 5: Replace Layout Functions

**Before:**
```javascript
const applyLayout = (direction) => {
  const graph = new dagre.graphlib.Graph();
  // ... manual Dagre setup
};
```

**After:**
```javascript
import { useLayout } from './hooks/useDiagram';

const { applyAutoLayout, setLayoutDirection } = useLayout();

// Usage
applyAutoLayout('LR'); // Automatically layouts nodes
```

### Step 6: Add Export Buttons

**Create export menu:**
```javascript
import { useExportImport } from './hooks/useDiagram';
import { exportToPNG, exportToSVG, downloadJSON, downloadMarkdown } from './services/exportService';

function ExportMenu() {
  const { exportToJSON } = useExportImport();
  const currentDiagram = useDiagramStore((state) => state.currentDiagram);

  return (
    <div className="export-menu">
      <button onClick={() => downloadJSON(currentDiagram)}>
        Export JSON
      </button>
      <button onClick={() => exportToPNG('react-flow-container')}>
        Export PNG
      </button>
      <button onClick={() => exportToSVG('react-flow-container')}>
        Export SVG
      </button>
      <button onClick={() => downloadMarkdown(currentDiagram)}>
        Export Markdown
      </button>
    </div>
  );
}
```

### Step 7: Add Import Functionality

**Add file input:**
```javascript
import { importFromFile } from './services/importService';
import { useDiagramStore } from './store/diagramStore';

function ImportButton() {
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const result = await importFromFile(file);
    if (result.success) {
      useDiagramStore.getState().currentDiagram = result.diagram;
      useDiagramStore.getState().captureSnapshot();
      alert('Diagram imported successfully!');
    } else {
      alert(`Import failed: ${result.error}`);
    }
  };

  return (
    <label className="import-button">
      <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      Import JSON
    </label>
  );
}
```

### Step 8: Add Undo/Redo Buttons

```javascript
import { useHistory } from './hooks/useDiagram';
import { Undo2, Redo2 } from 'lucide-react';

function UndoRedoButtons() {
  const { undo, redo, canUndo, canRedo } = useHistory();

  return (
    <div className="flex gap-2">
      <button onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)">
        <Undo2 className="w-5 h-5" />
      </button>
      <button onClick={redo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
        <Redo2 className="w-5 h-5" />
      </button>
    </div>
  );
}
```

### Step 9: Update SaveDiagram Flow

**Before (localStorage directly):**
```javascript
const savedDiagrams = JSON.parse(localStorage.getItem('savedDiagrams') || '[]');
savedDiagrams.push({ name, nodes, edges });
localStorage.setItem('savedDiagrams', JSON.stringify(savedDiagrams));
```

**After (Zustand store):**
```javascript
import { useDiagramManagement } from './hooks/useDiagram';

const { saveDiagram } = useDiagramManagement();

// Usage
saveDiagram('My Architecture Diagram'); // Automatically persists
```

### Step 10: Update React Flow Component

**Update SystemDiagram.jsx:**
```javascript
import { useReactFlowHandlers } from '../hooks/useDiagram';

function SystemDiagram({ nodes, edges }) {
  const { onNodesChange, onEdgesChange, onConnect } = useReactFlowHandlers();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      // ... other props
    />
  );
}
```

## Migration Checklist

### Core State Migration
- [ ] Replace `useState` for nodes with `useNodes()` hook
- [ ] Replace `useState` for edges with `useEdges()` hook
- [ ] Replace `useState` for selectedNode/Edge with `useSelection()` hook
- [ ] Replace manual localStorage calls with store's built-in persistence

### UI Components
- [ ] Add `<CommandPalette />` to App.jsx
- [ ] Add `<SearchFilter />` to toolbar
- [ ] Add Undo/Redo buttons
- [ ] Add export menu with all formats
- [ ] Add import button/dialog

### Event Handlers
- [ ] Update `onNodesChange` to use store handler
- [ ] Update `onEdgesChange` to use store handler
- [ ] Update `onConnect` to use store handler
- [ ] Enable keyboard shortcuts with `useKeyboardShortcuts(true)`

### Layout & Tools
- [ ] Replace manual Dagre calls with `applyAutoLayout()`
- [ ] Add alignment tools to toolbar
- [ ] Add distribution tools to toolbar
- [ ] Add snap-to-grid toggle

### Export/Import
- [ ] Replace old export logic with new export service
- [ ] Add JSON import functionality
- [ ] Test schema versioning with old diagram files
- [ ] Add PNG/SVG export buttons

## Testing Checklist

### Basic Functionality
- [ ] Create new diagram
- [ ] Add nodes and edges
- [ ] Move nodes around
- [ ] Delete nodes/edges
- [ ] Save diagram
- [ ] Load diagram

### Advanced Features
- [ ] Undo/Redo works correctly
- [ ] Command Palette opens with Cmd+K
- [ ] Search filters nodes correctly
- [ ] Export to JSON works
- [ ] Import from JSON works
- [ ] Auto-layout arranges nodes correctly
- [ ] PNG export captures canvas
- [ ] Keyboard shortcuts work (Cmd+Z, Delete, Arrow keys, etc.)

### Edge Cases
- [ ] Import old diagram format (v0) migrates successfully
- [ ] Import invalid JSON shows error
- [ ] Undo/Redo history doesn't exceed 50 items
- [ ] localStorage persists across page refreshes
- [ ] Command Palette closes on Escape
- [ ] Search works with special characters

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open Command Palette |
| `Cmd+Z` / `Ctrl+Z` | Undo |
| `Cmd+Shift+Z` / `Ctrl+Shift+Z` | Redo |
| `Cmd+S` / `Ctrl+S` | Save Diagram |
| `Cmd+E` / `Ctrl+E` | Export as JSON |
| `Cmd+C` / `Ctrl+C` | Copy selected node |
| `Cmd+V` / `Ctrl+V` | Paste node |
| `Cmd+D` / `Ctrl+D` | Duplicate selected node |
| `Delete` / `Backspace` | Delete selected node/edge |
| `Escape` | Clear selection |
| `Arrow Keys` | Nudge selected node (Shift = 10px) |

## API Reference

### Store Actions

```typescript
// Node Management
addNode(node: Omit<DiagramNode, 'id'>): void
updateNode(id: string, updates: Partial<DiagramNode>): void
deleteNode(id: string): void

// Edge Management
addEdge(edge: Omit<DiagramEdge, 'id'>): void
updateEdge(id: string, updates: Partial<DiagramEdge>): void
deleteEdge(id: string): void

// History
undo(): void
redo(): void
canUndo(): boolean
canRedo(): boolean
captureSnapshot(): void

// Diagram Management
createDiagram(name: string): void
loadDiagram(id: string): void
saveDiagram(name?: string): void
deleteDiagram(id: string): void
duplicateDiagram(id: string): void

// Layout
applyAutoLayout(direction?: LayoutDirection): void
setLayoutDirection(direction: LayoutDirection): void
alignNodes(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void
distributeNodes(distribution: 'horizontal' | 'vertical'): void

// Export/Import
exportToJSON(): string
importFromJSON(json: string): ImportResult
exportDiagram(options: ExportOptions): Promise<void>
```

## Common Issues & Solutions

### Issue: Store not persisting
**Solution:** Make sure the store is wrapped with `persist` middleware and the `partialize` function is correctly configured.

### Issue: Undo/Redo not capturing changes
**Solution:** Make sure to call `captureSnapshot()` after significant state changes (add/delete nodes).

### Issue: PNG export shows blank image
**Solution:** Ensure the React Flow container has a valid DOM element with the correct ID or data-id attribute.

### Issue: Keyboard shortcuts not working
**Solution:** Call `useKeyboardShortcuts(true)` at the top level of your App component.

### Issue: Command Palette not opening
**Solution:** Ensure `<CommandPalette />` is rendered in your App and the store's `isCommandPaletteOpen` state is working.

## Performance Optimization Tips

1. **Use Selectors:** Import specific selectors from the store to avoid unnecessary re-renders:
   ```javascript
   const nodes = useDiagramStore(selectNodes); // Good
   const store = useDiagramStore(); // Bad - subscribes to everything
   ```

2. **Memoize Filtered Nodes:** The `selectFilteredNodes` selector is already memoized in the store.

3. **Lazy Load Services:** Export/import services are dynamically imported to reduce bundle size.

4. **Debounce Search:** Consider debouncing the search query for large diagrams (100+ nodes).

## Next Steps

After completing Phase 0 integration, you'll have a solid foundation for:
- Phase 1: Real-time simulation & failure cascades
- Phase 2: Code discovery & observability integration
- Phase 3: Collaboration & 3D visualization
- Phase 4: Enterprise features

---

**Need Help?**
- Check the TypeScript types in `src/store/types.ts` for API definitions
- Review the hooks in `src/hooks/useDiagram.ts` for usage examples
- Look at `CommandPalette.jsx` for an example of store integration
