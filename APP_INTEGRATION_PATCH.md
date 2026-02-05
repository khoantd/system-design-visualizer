# App.jsx Integration Patch

## Instructions

Apply these changes to your `src/App.jsx` file. Your original has been backed up to `src/App.jsx.backup`.

---

## 1. Add Imports (After line 29)

```javascript
import dagre from '@dagrejs/dagre';

// ===== ADD THESE LINES =====
// Phase 0: Foundation & Core UX
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CommandPalette } from './components/CommandPalette';
import { SearchFilter } from './components/SearchFilter';

// Phase 2: Intelligence & Integration (optional)
import { IntegrationPanel } from './components/IntegrationPanel';
// ===== END ADD =====
```

---

## 2. Add State for Integration Panel (After line 49)

```javascript
  const [showComponentToCodePanel, setShowComponentToCodePanel] = useState(false);

  // ===== ADD THIS LINE =====
  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);
  // ===== END ADD =====

  const interactiveSectionRef = useRef(null);
```

---

## 3. Enable Keyboard Shortcuts (After line 51)

```javascript
  const interactiveSectionRef = useRef(null);

  // ===== ADD THESE LINES =====
  // Enable Phase 0 keyboard shortcuts (Cmd+Z, Cmd+K, Delete, Arrow keys, etc.)
  useKeyboardShortcuts(true);
  // ===== END ADD =====

  // Load saved diagrams from localStorage on component mount
```

---

## 4. Add Integration Panel Button to Toolbar

Find the toolbar section in your JSX (around line 700-900) where you have buttons like Save, Load, etc.

Add this button:

```javascript
{/* Existing buttons */}
<button onClick={handleSaveDiagram}>
  <Save className="w-4 h-4" />
  Save
</button>

{/* ===== ADD THIS BUTTON ===== */}
<button
  onClick={() => setShowIntegrationPanel(!showIntegrationPanel)}
  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
  style={{
    backgroundColor: showIntegrationPanel ? 'var(--accent-blue)' : 'var(--interactive-bg)',
    color: showIntegrationPanel ? 'white' : 'var(--text-primary)',
  }}
  title="Open Integrations (Repository, Observability, Cost, AI, IaC)"
>
  <Code2 className="w-4 h-4" />
  Integrations
</button>
{/* ===== END ADD ===== */}
```

---

## 5. Add Command Palette (Before closing </div> of main container)

Find the end of your main JSX return, before the final `</div>`:

```javascript
      {/* Component to Code Panel */}
      {showComponentToCodePanel && (
        <ComponentToCodePanel
          nodes={nodes}
          edges={edges}
          onClose={() => setShowComponentToCodePanel(false)}
        />
      )}

      {/* ===== ADD THESE COMPONENTS ===== */}
      {/* Phase 0: Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Phase 2: Integration Panel */}
      {showIntegrationPanel && <IntegrationPanel />}
      {/* ===== END ADD ===== */}

    </div>
  );
}

export default App;
```

---

## Complete Integration Example

Here's what the final structure looks like:

```javascript
// Imports
import { /* existing imports */ } from "lucide-react";
import { /* existing imports */ } from "react";
// ... existing imports ...
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';  // NEW
import { CommandPalette } from './components/CommandPalette';  // NEW
import { SearchFilter } from './components/SearchFilter';  // NEW
import { IntegrationPanel } from './components/IntegrationPanel';  // NEW

function App() {
  // Existing state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  // ... other state ...

  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);  // NEW

  // Enable keyboard shortcuts
  useKeyboardShortcuts(true);  // NEW

  // ... all your existing handlers ...

  return (
    <div>
      {/* Your existing UI */}
      <header>
        {/* Toolbar with buttons */}
        <button onClick={() => setShowIntegrationPanel(!showIntegrationPanel)}>  {/* NEW */}
          Integrations
        </button>
      </header>

      {/* Your existing diagram */}
      <SystemDiagram ... />

      {/* Existing panels */}
      <AIChatPanel ... />
      <ComponentToCodePanel ... />

      {/* NEW: Command Palette */}
      <CommandPalette />

      {/* NEW: Integration Panel */}
      {showIntegrationPanel && <IntegrationPanel />}
    </div>
  );
}
```

---

## Quick Apply Script

Want to apply these changes automatically? Run:

```bash
# From project root
cat > apply-integration.sh << 'EOF'
#!/bin/bash

# Backup
cp src/App.jsx src/App.jsx.pre-integration-backup

# Add imports after dagre import
sed -i.bak "/import dagre/a\\
\\
// Phase 0: Foundation & Core UX\\
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';\\
import { CommandPalette } from './components/CommandPalette';\\
import { SearchFilter } from './components/SearchFilter';\\
\\
// Phase 2: Intelligence & Integration\\
import { IntegrationPanel } from './components/IntegrationPanel';\\
" src/App.jsx

echo "✅ Integration imports added!"
echo "⚠️  You still need to:"
echo "   1. Add useKeyboardShortcuts(true) call"
echo "   2. Add <CommandPalette /> to JSX"
echo "   3. Add <IntegrationPanel /> toggle to JSX"
echo ""
echo "See APP_INTEGRATION_PATCH.md for manual steps"
EOF

chmod +x apply-integration.sh
./apply-integration.sh
```

---

## Testing

After applying the changes:

1. **Start your dev server**: `npm run dev`
2. **Test keyboard shortcuts**:
   - Press `Cmd+K` (or `Ctrl+K`) - Command Palette should open
   - Create a node and press `Cmd+Z` - Should undo
   - Select a node and press `Delete` - Should delete
3. **Test Integration Panel**:
   - Click "Integrations" button in toolbar
   - Panel should slide in from right side
   - Try the different tabs
4. **Check browser console** for any errors

---

## Rollback

If something goes wrong:

```bash
# Restore original
cp src/App.jsx.backup src/App.jsx

# Or restore pre-integration backup
cp src/App.jsx.pre-integration-backup src/App.jsx
```

---

## Need Help?

- Check [INTEGRATION_STEPS.md](INTEGRATION_STEPS.md) for detailed guide
- Check [PHASE0_INTEGRATION_GUIDE.md](PHASE0_INTEGRATION_GUIDE.md) for Phase 0 details
- Check browser console for errors
- Check that all imports resolve correctly

---

**Ready?** Start with Section 1 (Add Imports) and work your way down!
