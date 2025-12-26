---
name: Add Node/Edge Editing
overview: Add functionality to manually create nodes and connections in the interactive visualization, and enable editing of node and connection properties through an enhanced InfoPanel.
todos:
  - id: create-toolbar
    content: Create NodeToolbar component with buttons for each node type (Database, Server, Client, LoadBalancer, Cache)
    status: completed
  - id: update-system-diagram
    content: Update SystemDiagram to handle node/edge selection, add onEdgeClick handler, and integrate NodeToolbar
    status: completed
  - id: enhance-info-panel
    content: Convert InfoPanel to editable form supporting both nodes and edges with Save/Cancel/Delete actions
    status: completed
  - id: update-app-state
    content: Update App.jsx to manage nodes/edges state and pass handlers for add/edit/delete operations
    status: completed
    dependencies:
      - update-system-diagram
  - id: add-node-generation
    content: Implement node creation logic with unique IDs and default positions in SystemDiagram
    status: completed
    dependencies:
      - create-toolbar
  - id: edge-styling
    content: Implement edge styling system (color, line style) and apply styles to React Flow edges
    status: completed
    dependencies:
      - enhance-info-panel
---

# Add Node and Connection Editing to Interactive Visualization

## Overview

Enable users to manually add nodes and connections to the React Flow diagram, and edit properties of both nodes and connections through an enhanced InfoPanel.

## Architecture Changes

### Component Structure

```javascript
SystemDiagram.jsx
  ├── Toolbar (new) - Add node buttons
  ├── ReactFlow - Canvas with nodes/edges
  └── InfoPanel (enhanced) - Edit node/edge properties
```



### Data Flow

1. User clicks toolbar button → New node added to canvas at default position
2. User clicks node/edge → InfoPanel shows properties
3. User edits in InfoPanel → Updates reflected in diagram
4. User connects nodes → New edge created with default properties

## Implementation Details

### 1. Create Toolbar Component (`src/components/NodeToolbar.jsx`)

- Position: Top-left overlay on the React Flow canvas
- Buttons for each node type: Database, Server, Client, LoadBalancer, Cache
- Each button creates a new node with:
- Unique ID (using `uuid` or timestamp)
- Default position (center of viewport or last click position)
- Default data: `{ label: "New Node", tech: "", description: "" }`
- Appropriate node type

### 2. Enhance SystemDiagram Component

- Add state for node/edge selection
- Handle edge click events (`onEdgeClick`)
- Pass `onAddNode` callback to Toolbar
- Pass `selectedEdge` to InfoPanel
- Update `onNodesChange` and `onEdgesChange` to sync with parent state
- Generate unique IDs for new nodes (use `nanoid` or similar)

### 3. Enhance InfoPanel Component

- Support editing mode (not just viewing)
- Handle both nodes and edges:
- **Node properties**: label, tech (comma-separated), description, type
- **Edge properties**: label, type (dropdown: request, response, sync, async), style (color picker, line style)
- Add form inputs:
- Text inputs for labels/descriptions
- Textarea for tech (comma-separated)
- Select dropdown for node type and edge type
- Color picker for edge color
- Toggle/select for edge style (solid/dashed/dotted)
- Add Save/Cancel buttons
- Show delete button for selected node/edge

### 4. Update App.jsx

- Manage nodes and edges state at App level (not just initial)
- Pass `setNodes` and `setEdges` to SystemDiagram
- Handle node/edge deletion
- Persist changes when editing

### 5. Edge Styling

- Store edge style properties in `edge.data` or `edge.style`
- Properties: `color`, `strokeWidth`, `strokeDasharray` (for dashed/dotted)
- Apply styles via React Flow's edge styling props

## Files to Modify

1. **[src/components/SystemDiagram.jsx](src/components/SystemDiagram.jsx)**

- Add `selectedNode` and `selectedEdge` state
- Add `onEdgeClick` handler
- Add `onAddNode` prop and handler
- Pass selection state to InfoPanel
- Update to use controlled nodes/edges from parent

2. **[src/components/InfoPanel.jsx](src/components/InfoPanel.jsx)**

- Convert to editable form
- Add support for edge editing
- Add form validation
- Add Save/Cancel/Delete buttons
- Handle both node and edge data structures

3. **[src/components/NodeToolbar.jsx](src/components/NodeToolbar.jsx)** (NEW)

- Create toolbar with node type buttons
- Position as overlay on canvas
- Emit `onAddNode` events with node type

4. **[src/App.jsx](src/App.jsx)**

- Manage `nodes` and `edges` state (not just `graphData`)
- Pass state setters to SystemDiagram
- Handle node/edge updates and deletions

## Technical Considerations

- **Node ID Generation**: Use `nanoid` package for unique IDs (lightweight, URL-safe)
- **Default Positions**: Calculate center of viewport or use `fitView` coordinates
- **Edge Selection**: React Flow provides `onEdgeClick` event
- **Form State**: Use local state in InfoPanel for editing, sync on Save
- **Validation**: Ensure node labels are not empty, edge labels are optional
- **Theme Support**: All new UI elements must use CSS variables for theming

## Dependencies

- Add `nanoid` package for unique ID generation (if not already present)

## User Experience Flow

1. **Adding a Node**:

- User clicks node type button in toolbar
- New node appears at center of viewport
- Node is automatically selected
- InfoPanel opens for immediate editing

2. **Editing a Node**:

- User clicks existing node
- InfoPanel shows current properties
- User edits fields
- User clicks Save → Changes applied
- User clicks Cancel → Changes discarded

3. **Adding a Connection**:

- User drags from source node handle to target node handle
- New edge created with default properties
- Edge automatically selected
- InfoPanel opens for editing

4. **Editing a Connection**:

- User clicks edge
- InfoPanel shows edge properties
- User edits label, type, style
- User clicks Save → Changes applied

5. **Deleting**:

- User selects node/edge
- User clicks Delete button in InfoPanel
- Confirmation dialog (optional)