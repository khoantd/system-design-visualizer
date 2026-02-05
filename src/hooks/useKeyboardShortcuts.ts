/**
 * Global keyboard shortcuts for System Design Visualizer
 * Handles: Undo/Redo, Copy/Paste, Delete, Command Palette, etc.
 */

import { useEffect, useCallback } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { useHistory } from './useDiagram';

// ============================================================================
// Keyboard shortcut configuration
// ============================================================================

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean; // Cmd on Mac
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

// ============================================================================
// Main keyboard shortcuts hook
// ============================================================================

export const useKeyboardShortcuts = (enabled: boolean = true) => {
  const { undo, redo, canUndo, canRedo } = useHistory();
  const toggleCommandPalette = useDiagramStore((state) => state.toggleCommandPalette);
  const selectedNode = useDiagramStore((state) => state.ui.selectedNode);
  const selectedEdge = useDiagramStore((state) => state.ui.selectedEdge);
  const deleteNode = useDiagramStore((state) => state.deleteNode);
  const deleteEdge = useDiagramStore((state) => state.deleteEdge);
  const clearSelection = useDiagramStore((state) => state.clearSelection);
  const nodes = useDiagramStore((state) => state.currentDiagram.nodes);
  const addNode = useDiagramStore((state) => state.addNode);
  const exportToJSON = useDiagramStore((state) => state.exportToJSON);
  const toggleSaveModal = useDiagramStore((state) => state.toggleSaveModal);

  // Detect if we're on Mac
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Cmd/Ctrl+K in inputs to open command palette
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          toggleCommandPalette();
        }
        return;
      }

      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // ========================================================================
      // Command Palette: Cmd/Ctrl + K
      // ========================================================================
      if (modKey && event.key === 'k') {
        event.preventDefault();
        toggleCommandPalette();
        return;
      }

      // ========================================================================
      // Undo: Cmd/Ctrl + Z
      // ========================================================================
      if (modKey && event.key === 'z' && !event.shiftKey) {
        if (canUndo) {
          event.preventDefault();
          undo();
        }
        return;
      }

      // ========================================================================
      // Redo: Cmd/Ctrl + Shift + Z OR Cmd/Ctrl + Y
      // ========================================================================
      if ((modKey && event.shiftKey && event.key === 'z') || (modKey && event.key === 'y')) {
        if (canRedo) {
          event.preventDefault();
          redo();
        }
        return;
      }

      // ========================================================================
      // Delete: Delete or Backspace (when node/edge selected)
      // ========================================================================
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNode) {
          event.preventDefault();
          deleteNode(selectedNode.id);
          clearSelection();
        } else if (selectedEdge) {
          event.preventDefault();
          deleteEdge(selectedEdge.id);
          clearSelection();
        }
        return;
      }

      // ========================================================================
      // Escape: Clear selection / Close modals
      // ========================================================================
      if (event.key === 'Escape') {
        event.preventDefault();
        clearSelection();
        toggleCommandPalette(false);
        return;
      }

      // ========================================================================
      // Copy: Cmd/Ctrl + C (copy selected node)
      // ========================================================================
      if (modKey && event.key === 'c') {
        if (selectedNode || selectedEdge) {
          event.preventDefault();
          const data = selectedNode || selectedEdge;
          // Store in clipboard (navigator.clipboard API)
          navigator.clipboard.writeText(JSON.stringify(data, null, 2)).catch(console.error);
        }
        return;
      }

      // ========================================================================
      // Paste: Cmd/Ctrl + V (paste node)
      // ========================================================================
      if (modKey && event.key === 'v') {
        event.preventDefault();
        navigator.clipboard
          .readText()
          .then((text) => {
            try {
              const data = JSON.parse(text);
              if (data && data.data && data.data.label) {
                // It's a node
                addNode({
                  type: data.type || 'serverNode',
                  position: { x: (data.position?.x || 0) + 50, y: (data.position?.y || 0) + 50 },
                  data: data.data,
                });
              }
            } catch (err) {
              console.error('Failed to parse clipboard data:', err);
            }
          })
          .catch(console.error);
        return;
      }

      // ========================================================================
      // Duplicate: Cmd/Ctrl + D (duplicate selected node)
      // ========================================================================
      if (modKey && event.key === 'd') {
        if (selectedNode) {
          event.preventDefault();
          addNode({
            type: selectedNode.type || 'serverNode',
            position: {
              x: selectedNode.position.x + 50,
              y: selectedNode.position.y + 50,
            },
            data: { ...selectedNode.data },
          });
        }
        return;
      }

      // ========================================================================
      // Save: Cmd/Ctrl + S (save diagram)
      // ========================================================================
      if (modKey && event.key === 's') {
        event.preventDefault();
        toggleSaveModal(true);
        return;
      }

      // ========================================================================
      // Select All: Cmd/Ctrl + A
      // ========================================================================
      if (modKey && event.key === 'a') {
        event.preventDefault();
        // React Flow handles this internally
        return;
      }

      // ========================================================================
      // Export JSON: Cmd/Ctrl + E
      // ========================================================================
      if (modKey && event.key === 'e') {
        event.preventDefault();
        const json = exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // ========================================================================
      // Arrow Keys: Nudge selected node
      // ========================================================================
      if (selectedNode && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const nudgeAmount = event.shiftKey ? 10 : 1;
        const updateNode = useDiagramStore.getState().updateNode;

        switch (event.key) {
          case 'ArrowUp':
            updateNode(selectedNode.id, {
              position: { x: selectedNode.position.x, y: selectedNode.position.y - nudgeAmount },
            });
            break;
          case 'ArrowDown':
            updateNode(selectedNode.id, {
              position: { x: selectedNode.position.x, y: selectedNode.position.y + nudgeAmount },
            });
            break;
          case 'ArrowLeft':
            updateNode(selectedNode.id, {
              position: { x: selectedNode.position.x - nudgeAmount, y: selectedNode.position.y },
            });
            break;
          case 'ArrowRight':
            updateNode(selectedNode.id, {
              position: { x: selectedNode.position.x + nudgeAmount, y: selectedNode.position.y },
            });
            break;
        }
        return;
      }
    },
    [
      enabled,
      isMac,
      undo,
      redo,
      canUndo,
      canRedo,
      toggleCommandPalette,
      selectedNode,
      selectedEdge,
      deleteNode,
      deleteEdge,
      clearSelection,
      addNode,
      exportToJSON,
      toggleSaveModal,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Return shortcut documentation for help/onboarding
  return {
    shortcuts: [
      { keys: isMac ? 'Cmd+K' : 'Ctrl+K', description: 'Open command palette' },
      { keys: isMac ? 'Cmd+Z' : 'Ctrl+Z', description: 'Undo' },
      { keys: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Shift+Z', description: 'Redo' },
      { keys: isMac ? 'Cmd+C' : 'Ctrl+C', description: 'Copy selected node/edge' },
      { keys: isMac ? 'Cmd+V' : 'Ctrl+V', description: 'Paste node' },
      { keys: isMac ? 'Cmd+D' : 'Ctrl+D', description: 'Duplicate selected node' },
      { keys: isMac ? 'Cmd+S' : 'Ctrl+S', description: 'Save diagram' },
      { keys: isMac ? 'Cmd+E' : 'Ctrl+E', description: 'Export as JSON' },
      { keys: 'Delete/Backspace', description: 'Delete selected node/edge' },
      { keys: 'Escape', description: 'Clear selection' },
      { keys: 'Arrow Keys', description: 'Nudge selected node (Shift = 10px)' },
    ],
  };
};

// ============================================================================
// Hook to get shortcut help text
// ============================================================================

export const useShortcutHelp = () => {
  const { shortcuts } = useKeyboardShortcuts(false); // Don't enable, just get docs
  return shortcuts;
};
