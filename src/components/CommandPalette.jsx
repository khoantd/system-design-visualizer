/**
 * Command Palette (Cmd+K)
 * Quick access to all actions and navigation
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import {
  Search,
  FileJson,
  Image,
  FileCode,
  Download,
  Upload,
  Save,
  Folder,
  Plus,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Layout,
  Grid3x3,
  Maximize,
  MessageSquare,
  Code2,
  FileText,
  Server,
  Database,
  Smartphone,
  Globe,
  Layers,
  User,
  Box,
} from 'lucide-react';

const COMMANDS = [
  {
    category: 'File',
    items: [
      { id: 'save', label: 'Save Diagram', icon: Save, shortcut: 'Cmd+S', action: 'saveDiagram' },
      { id: 'load', label: 'Load Diagram', icon: Folder, action: 'toggleLoadPanel' },
      { id: 'new', label: 'New Diagram', icon: Plus, action: 'createDiagram' },
    ],
  },
  {
    category: 'Export',
    items: [
      { id: 'export-json', label: 'Export as JSON', icon: FileJson, shortcut: 'Cmd+E', action: 'exportJSON' },
      { id: 'export-png', label: 'Export as PNG', icon: Image, action: 'exportPNG' },
      { id: 'export-svg', label: 'Export as SVG', icon: FileCode, action: 'exportSVG' },
      { id: 'export-markdown', label: 'Export as Markdown', icon: FileText, action: 'exportMarkdown' },
      { id: 'export-mermaid', label: 'Export as Mermaid', icon: Download, action: 'exportMermaid' },
    ],
  },
  {
    category: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', icon: Undo2, shortcut: 'Cmd+Z', action: 'undo' },
      { id: 'redo', label: 'Redo', icon: Redo2, shortcut: 'Cmd+Shift+Z', action: 'redo' },
      { id: 'clear', label: 'Clear Diagram', icon: Trash2, action: 'clearDiagram' },
    ],
  },
  {
    category: 'Add Node',
    items: [
      { id: 'add-server', label: 'Add Server Node', icon: Server, action: 'addNode:serverNode' },
      { id: 'add-database', label: 'Add Database Node', icon: Database, action: 'addNode:databaseNode' },
      { id: 'add-client', label: 'Add Client Node', icon: Smartphone, action: 'addNode:clientNode' },
      { id: 'add-lb', label: 'Add Load Balancer', icon: Globe, action: 'addNode:loadBalancerNode' },
      { id: 'add-cache', label: 'Add Cache Node', icon: Layers, action: 'addNode:cacheNode' },
      { id: 'add-user', label: 'Add User Node', icon: User, action: 'addNode:userNode' },
      { id: 'add-subflow', label: 'Add Subflow Node', icon: Box, action: 'addNode:subflowNode' },
    ],
  },
  {
    category: 'Layout',
    items: [
      { id: 'layout-lr', label: 'Layout: Left to Right', icon: Layout, action: 'layout:LR' },
      { id: 'layout-tb', label: 'Layout: Top to Bottom', icon: Layout, action: 'layout:TB' },
      { id: 'layout-rl', label: 'Layout: Right to Left', icon: Layout, action: 'layout:RL' },
      { id: 'layout-bt', label: 'Layout: Bottom to Top', icon: Layout, action: 'layout:BT' },
      { id: 'auto-layout', label: 'Apply Auto Layout', icon: Layout, action: 'applyAutoLayout' },
    ],
  },
  {
    category: 'View',
    items: [
      { id: 'toggle-grid', label: 'Toggle Grid', icon: Grid3x3, action: 'toggleGrid' },
      { id: 'toggle-minimap', label: 'Toggle Minimap', icon: Maximize, action: 'toggleMinimap' },
      { id: 'fit-view', label: 'Fit View', icon: Maximize, action: 'fitView' },
    ],
  },
  {
    category: 'Panels',
    items: [
      { id: 'toggle-chat', label: 'Toggle AI Chat', icon: MessageSquare, action: 'toggleChatPanel' },
      { id: 'toggle-code', label: 'Toggle Code Panel', icon: Code2, action: 'toggleCodePanel' },
      { id: 'toggle-component', label: 'Toggle Component Panel', icon: FileText, action: 'toggleComponentPanel' },
    ],
  },
];

export const CommandPalette = () => {
  const isOpen = useDiagramStore((state) => state.ui.isCommandPaletteOpen);
  const toggleCommandPalette = useDiagramStore((state) => state.toggleCommandPalette);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Get store actions
  const store = useDiagramStore.getState();

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return COMMANDS;

    const query = searchQuery.toLowerCase();
    return COMMANDS.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.action.toLowerCase().includes(query) ||
          category.category.toLowerCase().includes(query)
      ),
    })).filter((category) => category.items.length > 0);
  }, [searchQuery]);

  // Flatten filtered commands for keyboard navigation
  const flatCommands = useMemo(() => {
    return filteredCommands.flatMap((category) => category.items);
  }, [filteredCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggleCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flatCommands]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const executeCommand = async (command) => {
    const action = command.action;

    // Parse action
    if (action.startsWith('addNode:')) {
      const nodeType = action.split(':')[1];
      const viewportCenter = { x: 400, y: 300 }; // Approximate center
      store.addNode({
        type: nodeType,
        position: viewportCenter,
        data: { label: `New ${command.label.replace('Add ', '')}` },
      });
    } else if (action.startsWith('layout:')) {
      const direction = action.split(':')[1];
      store.setLayoutDirection(direction);
      store.applyAutoLayout(direction);
    } else if (action === 'saveDiagram') {
      store.toggleSaveModal(true);
    } else if (action === 'createDiagram') {
      if (confirm('Create a new diagram? Unsaved changes will be lost.')) {
        store.createDiagram('New Diagram');
      }
    } else if (action === 'exportJSON') {
      const json = store.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (action === 'exportPNG' || action === 'exportSVG' || action === 'exportMarkdown' || action === 'exportMermaid') {
      // Import export service dynamically
      const format = action.replace('export', '').toLowerCase();
      alert(`Export as ${format.toUpperCase()} will be available soon. Use the export menu for now.`);
    } else if (typeof store[action] === 'function') {
      store[action]();
    }

    toggleCommandPalette(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={() => toggleCommandPalette(false)}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <Search className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
              No commands found
            </div>
          ) : (
            filteredCommands.map((category) => (
              <div key={category.category}>
                <div
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  {category.category}
                </div>
                {category.items.map((item, index) => {
                  const globalIndex = flatCommands.findIndex((cmd) => cmd.id === item.id);
                  const isSelected = globalIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      data-index={globalIndex}
                      onClick={() => executeCommand(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                      style={{
                        backgroundColor: isSelected ? 'var(--interactive-hover)' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <kbd
                          className="px-2 py-1 text-xs rounded"
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 text-xs border-t"
          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}
        >
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>⏎ Select</span>
            <span>ESC Close</span>
          </div>
          <span>{flatCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
};
