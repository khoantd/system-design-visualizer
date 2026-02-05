# Integration Steps for Phases 0 & 2

## ✅ Backup Created

Your original `App.jsx` has been backed up to `App.jsx.backup`.

---

## 🚀 Quick Integration (Minimal Changes)

### Step 1: Add New Components to App.jsx

At the top of your `App.jsx`, add these imports:

```javascript
// Phase 0 Imports
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CommandPalette } from './components/CommandPalette';
import { SearchFilter } from './components/SearchFilter';

// Phase 2 Imports (optional)
import { IntegrationPanel } from './components/IntegrationPanel';
```

### Step 2: Enable Keyboard Shortcuts

Inside your `App()` function, add this line right after your state declarations:

```javascript
function App() {
  // ... your existing state ...

  // Enable keyboard shortcuts (Cmd+Z, Cmd+K, Delete, etc.)
  useKeyboardShortcuts(true);

  // ... rest of your code ...
}
```

### Step 3: Add Command Palette

In your return JSX, add the CommandPalette before the closing `</div>`:

```javascript
return (
  <div>
    {/* Your existing UI */}

    {/* Add Command Palette (Cmd+K) */}
    <CommandPalette />
  </div>
);
```

### Step 4: Add Search Bar (Optional)

Add SearchFilter to your toolbar where you have other controls:

```javascript
<div className="toolbar flex items-center gap-4">
  {/* Your existing toolbar buttons */}

  {/* Add Search & Filter */}
  <SearchFilter className="ml-auto" />
</div>
```

### Step 5: Add Integration Panel (Optional - Phase 2)

Add the Integration Panel as a toggle:

```javascript
function App() {
  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);

  // ... your code ...

  return (
    <div>
      {/* Your existing UI */}

      {/* Add toggle button in toolbar */}
      <button onClick={() => setShowIntegrationPanel(!showIntegrationPanel)}>
        Integrations
      </button>

      {/* Integration Panel */}
      {showIntegrationPanel && <IntegrationPanel />}

      <CommandPalette />
    </div>
  );
}
```

---

## 🎯 That's It!

With these minimal changes, you'll have:
- ✅ **Keyboard shortcuts** (Cmd+Z, Cmd+Shift+Z, Cmd+K, Delete, Arrow keys)
- ✅ **Command Palette** (press Cmd+K to access 30+ commands)
- ✅ **Search & Filter** (if you added it)
- ✅ **Integration Panel** (if you added it)

---

## 🔧 Full Zustand Migration (Optional - Advanced)

If you want to fully migrate to Zustand store (more work, but better architecture):

### 1. Replace useState with Zustand

```javascript
// Before
const [nodes, setNodes] = useState([]);
const [edges, setEdges] = useState([]);

// After
import { useNodes, useEdges, useReactFlowHandlers } from './hooks/useDiagram';

const nodes = useNodes();
const edges = useEdges();
const { onNodesChange, onEdgesChange, onConnect } = useReactFlowHandlers();
```

### 2. Update React Flow Handlers

```javascript
// Before
<SystemDiagram
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  // ...
/>

// After (same but using store handlers)
<SystemDiagram
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}  // Now from store
  onEdgesChange={onEdgesChange}  // Now from store
  // ...
/>
```

### 3. Use Store Actions

```javascript
import { useDiagramStore } from './store/diagramStore';

// Add a node
useDiagramStore.getState().addNode({
  type: 'serverNode',
  position: { x: 100, y: 100 },
  data: { label: 'New Server' }
});

// Delete a node
useDiagramStore.getState().deleteNode(nodeId);

// Undo/Redo
useDiagramStore.getState().undo();
useDiagramStore.getState().redo();
```

---

## 📖 Testing Your Integration

### Test Keyboard Shortcuts

1. **Cmd+K** (or Ctrl+K) - Should open Command Palette
2. **Cmd+Z** - Should undo last change
3. **Cmd+Shift+Z** - Should redo
4. **Delete** - Should delete selected node/edge
5. **Arrow Keys** - Should nudge selected node
6. **Escape** - Should clear selection

### Test Command Palette

1. Press **Cmd+K**
2. Type "save" - Should show "Save Diagram" command
3. Type "export" - Should show export options
4. Type "server" - Should show "Add Server Node"
5. Press **Escape** to close

### Test Search (if added)

1. Type in search box
2. Should filter nodes by name/description/tech
3. Click filter dropdown to filter by type

---

## ⚠️ Troubleshooting

### Command Palette Not Opening

- Check that `<CommandPalette />` is rendered in your JSX
- Check that `useKeyboardShortcuts(true)` is called
- Check browser console for errors

### Keyboard Shortcuts Not Working

- Make sure `useKeyboardShortcuts(true)` is called with `true`
- Check that you're not in an input field
- Check browser console for errors

### Store Not Persisting

- Zustand store auto-persists to localStorage (key: `sdv-diagram-storage`)
- Check browser developer tools → Application → Local Storage
- Clear localStorage if you need to reset

---

## 🎉 Next Steps

Once you've integrated and tested:

1. **Export Features** - Try exporting to JSON, PNG, SVG
2. **Repository Scanner** - Connect to a GitHub repo (Phase 2)
3. **Cost Analysis** - Map cloud resources and see cost estimates
4. **AI Copilot** - Ask questions about your architecture
5. **IaC Generation** - Generate Terraform or Kubernetes manifests

---

## 📚 Documentation

- **Phase 0 Guide**: [PHASE0_INTEGRATION_GUIDE.md](PHASE0_INTEGRATION_GUIDE.md)
- **Phase 0 Summary**: [PHASE0_IMPLEMENTATION_SUMMARY.md](PHASE0_IMPLEMENTATION_SUMMARY.md)
- **Phase 2 Summary**: [PHASE2_IMPLEMENTATION_SUMMARY.md](PHASE2_IMPLEMENTATION_SUMMARY.md)
- **Full Overview**: [IMPLEMENTATION_OVERVIEW.md](IMPLEMENTATION_OVERVIEW.md)

---

## 💡 Pro Tips

1. **Start Small** - Just add keyboard shortcuts and Command Palette first
2. **Test Each Feature** - Make sure each addition works before moving to the next
3. **Keep Backup** - Your original `App.jsx` is backed up as `App.jsx.backup`
4. **Gradual Migration** - You don't need to migrate everything to Zustand at once
5. **Check Console** - Watch for errors or warnings in browser console

---

**Ready to integrate?** Start with Step 1 above!
