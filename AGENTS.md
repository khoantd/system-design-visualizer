# AGENTS.md

Guidelines for AI agents (Claude Code, Copilot, etc.) working in this repository.

## Project Overview

A React + Vite web app that generates interactive system architecture diagrams from uploaded images or text specifications, using OpenAI GPT-4o as the AI backend.

## Architecture

```
src/
├── App.jsx                    # Root component; owns nodes/edges state
├── store/diagramStore.ts      # Zustand store (undo/redo, persistence, UI state)
├── services/
│   ├── analysisService.js     # All OpenAI API calls (image→Mermaid, Mermaid→Flow, spec→C4, code gen)
│   ├── chatService.js         # AI chat panel backend
│   ├── aiCopilotService.ts    # Copilot-style suggestions
│   ├── layoutService.ts       # Dagre auto-layout helpers
│   ├── exportService.ts       # PNG/SVG/JSON export
│   ├── importService.ts       # JSON import
│   ├── costEstimationService.ts
│   ├── iacGenerationService.ts
│   ├── observabilityService.ts
│   ├── repositoryScanner.ts
│   └── simulationEngine.ts
├── components/                # UI panels and ReactFlow canvas
├── hooks/
│   ├── useDiagram.ts          # Store-bound diagram helpers
│   └── useKeyboardShortcuts.ts
├── store/types.ts             # TypeScript type definitions
└── config/nodeTypes.js        # ReactFlow node type registry
```

## State Management

There are **two parallel state systems** — be aware of this when making changes:

1. **`App.jsx` local state** (`useState`) — `nodes`, `edges`, and most UI flags. This is what the ReactFlow canvas and InfoPanel consume.
2. **Zustand `diagramStore`** — owns undo/redo history, `savedDiagrams`, command palette state, and selection. Keyboard shortcuts (`useKeyboardShortcuts`) read from the store.

These are not fully unified. When modifying diagram state, check which system the target component reads from before deciding where to write.

## Node Types

Seven semantic types are registered in `src/config/nodeTypes.js` and rendered by `src/components/CustomNodes.jsx`:

| Type | Represents |
|---|---|
| `serverNode` | Application servers, APIs, workers |
| `databaseNode` | Databases, data stores |
| `cacheNode` | Redis, in-memory caches |
| `loadBalancerNode` | Load balancers, API gateways, reverse proxies |
| `clientNode` | Frontend apps, SPAs, mobile clients |
| `userNode` | Human actors |
| `subflowNode` | Grouping container (rendered behind other nodes, `zIndex: -1`) |

Always validate node types against this list. Invalid types fall back to `serverNode`.

## AI Service (`analysisService.js`)

All AI calls go through `src/services/analysisService.js` via the OpenAI Chat Completions API. When `VITE_OPENAI_API_KEY` is absent, every function returns hardcoded mock data — the app is fully functional without a key.

| Function | Input | Output |
|---|---|---|
| `generateMermaidFromImage` | Image `File` | Mermaid code string |
| `convertMermaidToFlow` | Mermaid string | `{ nodes, edges }` for ReactFlow |
| `generateC4ComponentFromSpec` | Spec text + tech choices | `{ nodes, edges }` |
| `generateCodeFromComponents` | Nodes + patterns + language | `{ code, description, patterns }` |

All functions validate and sanitize the AI response before returning it (missing IDs, invalid types, missing positions are all corrected).

## Environment Variables

```
VITE_OPENAI_API_KEY=   # Required for live AI features; mock data used when absent
```

See `.env.example` for the full list.

## Key Conventions

- **Edge types**: Always use one of `straight`, `smoothstep`, `step`, `default` (Bezier). The current default is `straight`.
- **Subflow nodes** must have `zIndex: -1` and an explicit `style: { width, height }` so child nodes can be selected through them.
- **Node positions**: Always validate `position.x` and `position.y` are numbers before passing to ReactFlow. Use a fallback grid position (`250 + (i % 3) * 200, 100 + floor(i/3) * 150`) when missing.
- **IDs**: Use `nanoid()` for new nodes/edges in the store; use `` `ai-node-${Date.now()}-${index}-${Math.random()...}` `` in `handleApplyAIActions` in App.jsx (legacy pattern).
- **Persistence**: `diagramStore` persists `currentDiagram` and `savedDiagrams` to localStorage under the key `sdv-diagram-storage`. App.jsx also persists `savedDiagrams` independently under `savedDiagrams` — these are separate stores.

## Keyboard Shortcuts (implemented)

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+K` | Command palette |
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Shift+Z` | Redo |
| `Cmd/Ctrl+S` | Save diagram |
| `Cmd/Ctrl+D` | Duplicate selected node |
| `Cmd/Ctrl+C/V` | Copy/paste node via clipboard |
| `Cmd/Ctrl+E` | Export JSON |
| `Delete/Backspace` | Delete selected node or edge |
| `Escape` | Clear selection, close palette |
| `Arrow keys` | Nudge node 1px (Shift = 10px) |

## What to Avoid

- Do not introduce a third state system. Either use App.jsx local state or the Zustand store.
- Do not call the OpenAI API directly from components — route through `src/services/`.
- Do not hard-code node type strings outside of `src/config/nodeTypes.js` and the `validNodeTypes` arrays in `analysisService.js` and `App.jsx`.
- Do not use `git add -A` or commit without explicit user instruction.
