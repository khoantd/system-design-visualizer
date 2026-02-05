#!/usr/bin/env node

/**
 * Automated Integration Script for Phases 0 & 2
 * Safely adds Phase 0 and Phase 2 features to App.jsx
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_PATH = path.join(__dirname, 'src', 'App.jsx');
const BACKUP_PATH = path.join(__dirname, 'src', 'App.jsx.pre-integration-backup');

console.log('🚀 System Design Visualizer - Integration Script\n');
console.log('This script will integrate Phase 0 & Phase 2 features into App.jsx\n');

// Check if App.jsx exists
if (!fs.existsSync(APP_PATH)) {
  console.error('❌ Error: src/App.jsx not found!');
  process.exit(1);
}

// Read current App.jsx
console.log('📖 Reading App.jsx...');
let appContent = fs.readFileSync(APP_PATH, 'utf8');

// Create backup
console.log('💾 Creating backup...');
fs.writeFileSync(BACKUP_PATH, appContent);
console.log(`✅ Backup created: ${BACKUP_PATH}\n`);

// Track changes
let changesApplied = [];

// 1. Add imports
console.log('📦 Adding imports...');
if (!appContent.includes('useKeyboardShortcuts')) {
  const importInsertPoint = appContent.indexOf('import dagre');
  if (importInsertPoint !== -1) {
    const insertAfterLine = appContent.indexOf('\n', importInsertPoint) + 1;
    const importsToAdd = `
// Phase 0: Foundation & Core UX
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CommandPalette } from './components/CommandPalette';
import { SearchFilter } from './components/SearchFilter';

// Phase 2: Intelligence & Integration
import { IntegrationPanel } from './components/IntegrationPanel';
`;
    appContent = appContent.slice(0, insertAfterLine) + importsToAdd + appContent.slice(insertAfterLine);
    changesApplied.push('✅ Added Phase 0 & 2 imports');
  }
} else {
  changesApplied.push('⏭️  Imports already present');
}

// 2. Add showIntegrationPanel state
console.log('📝 Adding state...');
if (!appContent.includes('showIntegrationPanel')) {
  const stateInsertPoint = appContent.indexOf('const [showComponentToCodePanel');
  if (stateInsertPoint !== -1) {
    const insertAfterLine = appContent.indexOf('\n', stateInsertPoint) + 1;
    const stateToAdd = `  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);\n`;
    appContent = appContent.slice(0, insertAfterLine) + stateToAdd + appContent.slice(insertAfterLine);
    changesApplied.push('✅ Added showIntegrationPanel state');
  }
} else {
  changesApplied.push('⏭️  Integration panel state already present');
}

// 3. Add keyboard shortcuts hook
console.log('⌨️  Adding keyboard shortcuts...');
if (!appContent.includes('useKeyboardShortcuts(true)')) {
  const hookInsertPoint = appContent.indexOf('const interactiveSectionRef');
  if (hookInsertPoint !== -1) {
    const insertBeforeLine = appContent.lastIndexOf('\n', hookInsertPoint);
    const hookToAdd = `
  // Enable Phase 0 keyboard shortcuts (Cmd+Z, Cmd+K, Delete, Arrow keys, etc.)
  useKeyboardShortcuts(true);
`;
    appContent = appContent.slice(0, insertBeforeLine) + hookToAdd + appContent.slice(insertBeforeLine);
    changesApplied.push('✅ Added keyboard shortcuts hook');
  }
} else {
  changesApplied.push('⏭️  Keyboard shortcuts already enabled');
}

// 4. Add CommandPalette to JSX
console.log('🎨 Adding CommandPalette...');
if (!appContent.includes('<CommandPalette')) {
  // Find the closing tag before export
  const exportIndex = appContent.lastIndexOf('export default App');
  const closingDivIndex = appContent.lastIndexOf('</div>', exportIndex);
  if (closingDivIndex !== -1) {
    const paletteToAdd = `
      {/* Phase 0: Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Phase 2: Integration Panel */}
      {showIntegrationPanel && <IntegrationPanel />}

`;
    appContent = appContent.slice(0, closingDivIndex) + paletteToAdd + appContent.slice(closingDivIndex);
    changesApplied.push('✅ Added CommandPalette and IntegrationPanel to JSX');
  }
} else {
  changesApplied.push('⏭️  CommandPalette already in JSX');
}

// 5. Add Integrations button to toolbar
console.log('🔘 Adding Integrations button...');
if (!appContent.includes('Integrations</button>')) {
  // Try to find a good place in the toolbar
  const saveButtonIndex = appContent.indexOf('<Save className="w-4 h-4" />');
  if (saveButtonIndex !== -1) {
    // Find the end of the save button
    const buttonEndIndex = appContent.indexOf('</button>', saveButtonIndex) + '</button>'.length;
    const buttonToAdd = `

              {/* Phase 2: Integration Panel Toggle */}
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
              </button>`;
    appContent = appContent.slice(0, buttonEndIndex) + buttonToAdd + appContent.slice(buttonEndIndex);
    changesApplied.push('✅ Added Integrations button to toolbar');
  } else {
    changesApplied.push('⚠️  Could not auto-add Integrations button (add manually)');
  }
} else {
  changesApplied.push('⏭️  Integrations button already present');
}

// Write updated App.jsx
console.log('\n💾 Writing updated App.jsx...');
fs.writeFileSync(APP_PATH, appContent);

// Summary
console.log('\n' + '='.repeat(60));
console.log('✨ Integration Complete!\n');
console.log('Changes applied:');
changesApplied.forEach(change => console.log(`  ${change}`));
console.log('\n' + '='.repeat(60));
console.log('\n📋 Next Steps:\n');
console.log('1. Start your dev server: npm run dev');
console.log('2. Test keyboard shortcuts: Cmd+K for command palette');
console.log('3. Click "Integrations" button in toolbar');
console.log('4. Check browser console for any errors\n');
console.log('📚 Documentation:');
console.log('  - INTEGRATION_STEPS.md');
console.log('  - APP_INTEGRATION_PATCH.md');
console.log('  - PHASE0_IMPLEMENTATION_SUMMARY.md');
console.log('  - PHASE2_IMPLEMENTATION_SUMMARY.md\n');
console.log('⚠️  If something breaks, restore backup:');
console.log(`  cp ${BACKUP_PATH} ${APP_PATH}\n`);
