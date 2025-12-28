import React, { useState, useMemo } from 'react';
import {
  Code2,
  Sparkles,
  Loader2,
  X,
  ChevronDown,
  CheckSquare,
  Square,
  FileCode,
  Layers,
  GitBranch,
  Copy,
  Check,
  FolderTree,
} from 'lucide-react';
import { generateCodeFromComponents } from '../services/analysisService';

const DESIGN_PATTERNS = [
  {
    id: 'repository',
    label: 'Repository Pattern',
    description: 'Data access abstraction layer',
    category: 'structural',
    applicableTo: ['databaseNode', 'serverNode'],
    // Strongly recommended when database + server are both selected
    strongMatch: { requires: ['databaseNode', 'serverNode'], minCount: 2 },
  },
  {
    id: 'factory',
    label: 'Factory Pattern',
    description: 'Object creation abstraction',
    category: 'creational',
    applicableTo: ['serverNode', 'clientNode'],
    // Recommended when multiple servers exist
    strongMatch: { requires: ['serverNode'], minCount: 2 },
  },
  {
    id: 'singleton',
    label: 'Singleton Pattern',
    description: 'Single instance guarantee',
    category: 'creational',
    applicableTo: ['cacheNode', 'databaseNode', 'serverNode'],
    // Strongly recommended for cache or database connections
    strongMatch: { requires: ['cacheNode'], minCount: 1 },
  },
  {
    id: 'observer',
    label: 'Observer/Pub-Sub',
    description: 'Event-driven communication',
    category: 'behavioral',
    applicableTo: ['serverNode', 'clientNode'],
    // Recommended when client + server need real-time updates
    strongMatch: { requires: ['clientNode', 'serverNode'], minCount: 2 },
  },
  {
    id: 'strategy',
    label: 'Strategy Pattern',
    description: 'Interchangeable algorithms',
    category: 'behavioral',
    applicableTo: ['serverNode', 'cacheNode'],
    // Recommended when cache strategies might vary
    strongMatch: { requires: ['cacheNode', 'serverNode'], minCount: 2 },
  },
  {
    id: 'facade',
    label: 'Facade Pattern',
    description: 'Simplified interface to complex subsystem',
    category: 'structural',
    applicableTo: ['loadBalancerNode', 'serverNode'],
    // Strongly recommended when load balancer is present
    strongMatch: { requires: ['loadBalancerNode'], minCount: 1 },
  },
  {
    id: 'adapter',
    label: 'Adapter Pattern',
    description: 'Interface compatibility layer',
    category: 'structural',
    applicableTo: ['serverNode', 'clientNode', 'databaseNode'],
    // Recommended for integrating different data sources
    strongMatch: { requires: ['databaseNode', 'serverNode'], minCount: 2 },
  },
  {
    id: 'decorator',
    label: 'Decorator Pattern',
    description: 'Dynamic behavior extension',
    category: 'structural',
    applicableTo: ['serverNode', 'clientNode'],
    strongMatch: null, // Optional pattern, no strong match
  },
  {
    id: 'command',
    label: 'Command Pattern',
    description: 'Request encapsulation',
    category: 'behavioral',
    applicableTo: ['serverNode', 'clientNode'],
    strongMatch: null, // Optional pattern
  },
  {
    id: 'mvc',
    label: 'MVC/MVVM Pattern',
    description: 'Model-View-Controller separation',
    category: 'architectural',
    applicableTo: ['clientNode', 'serverNode'],
    // Strongly recommended for client applications
    strongMatch: { requires: ['clientNode'], minCount: 1 },
  },
  {
    id: 'circuit-breaker',
    label: 'Circuit Breaker',
    description: 'Fault tolerance for distributed systems',
    category: 'behavioral',
    applicableTo: ['serverNode', 'loadBalancerNode'],
    // Recommended for distributed systems with multiple servers
    strongMatch: { requires: ['serverNode', 'loadBalancerNode'], minCount: 2 },
  },
  {
    id: 'cqrs',
    label: 'CQRS Pattern',
    description: 'Command Query Responsibility Segregation',
    category: 'architectural',
    applicableTo: ['serverNode', 'databaseNode'],
    // Recommended when multiple databases or read/write separation needed
    strongMatch: { requires: ['databaseNode'], minCount: 2 },
  },
];

// Component combination insights - when NO patterns are recommended
const SIMPLE_ARCHITECTURE_HINTS = {
  singleClient: {
    condition: (types) => types.length === 1 && types.includes('clientNode'),
    message: 'Simple client-only architecture. Consider adding a server for data persistence.',
    suggestPatterns: false,
  },
  simpleClientServer: {
    condition: (types) => types.length === 2 && types.includes('clientNode') && types.includes('serverNode') && !types.includes('databaseNode'),
    message: 'Basic client-server setup. Design patterns are optional for simple architectures.',
    suggestPatterns: true,
  },
  cacheOnly: {
    condition: (types) => types.length === 1 && types.includes('cacheNode'),
    message: 'Standalone cache component. Connect to a server for meaningful patterns.',
    suggestPatterns: false,
  },
  databaseOnly: {
    condition: (types) => types.length === 1 && types.includes('databaseNode'),
    message: 'Standalone database. Add a server layer for data access patterns.',
    suggestPatterns: false,
  },
};

const LANGUAGE_OPTIONS = [
  { id: 'typescript', label: 'TypeScript', description: 'Type-safe JavaScript' },
  { id: 'javascript', label: 'JavaScript', description: 'ES6+ JavaScript' },
  { id: 'python', label: 'Python', description: 'Python 3.x' },
  { id: 'java', label: 'Java', description: 'Java 17+' },
];

const OUTPUT_FORMATS = [
  { id: 'scaffolding', label: 'Code Scaffolding', description: 'Folder structure with boilerplate code', icon: FolderTree },
  { id: 'interfaces', label: 'Interface Definitions', description: 'Types, interfaces, and contracts', icon: FileCode },
  { id: 'class-diagram', label: 'Class Diagram', description: 'UML-style class relationships', icon: GitBranch },
];

const ComponentToCodePanel = ({ nodes, edges, onClose }) => {
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [language, setLanguage] = useState('typescript');
  const [outputFormat, setOutputFormat] = useState('scaffolding');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectableNodes = useMemo(() => {
    return (nodes || []).filter(node => node.type !== 'userNode' && node.type !== 'subflowNode');
  }, [nodes]);

  // Get unique node types from selected nodes
  const selectedNodeTypes = useMemo(() => {
    return selectedNodes.map(nodeId => {
      const node = selectableNodes.find(n => n.id === nodeId);
      return node?.type;
    }).filter(Boolean);
  }, [selectedNodes, selectableNodes]);

  // Get unique types for pattern matching
  const uniqueSelectedTypes = useMemo(() => {
    return [...new Set(selectedNodeTypes)];
  }, [selectedNodeTypes]);

  // Count occurrences of each node type
  const nodeTypeCounts = useMemo(() => {
    return selectedNodeTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }, [selectedNodeTypes]);

  // Check if architecture is too simple for patterns
  const architectureHint = useMemo(() => {
    if (selectedNodes.length === 0) return null;
    
    for (const hint of Object.values(SIMPLE_ARCHITECTURE_HINTS)) {
      if (hint.condition(uniqueSelectedTypes)) {
        return hint;
      }
    }
    return null;
  }, [uniqueSelectedTypes, selectedNodes.length]);

  // Calculate pattern recommendations with scores
  const suggestedPatterns = useMemo(() => {
    if (selectedNodes.length === 0) return [];
    
    // Filter applicable patterns
    const applicable = DESIGN_PATTERNS.filter(pattern => 
      pattern.applicableTo.some(type => uniqueSelectedTypes.includes(type))
    );

    // Calculate recommendation score for each pattern
    return applicable.map(pattern => {
      let isRecommended = false;
      let recommendationReason = '';

      if (pattern.strongMatch) {
        const { requires, minCount } = pattern.strongMatch;
        const matchingTypes = requires.filter(type => uniqueSelectedTypes.includes(type));
        const totalMatchingNodes = requires.reduce((sum, type) => sum + (nodeTypeCounts[type] || 0), 0);
        
        // Check if we have enough matching types and nodes
        if (matchingTypes.length >= Math.min(requires.length, uniqueSelectedTypes.length) && 
            totalMatchingNodes >= minCount) {
          isRecommended = true;
          recommendationReason = `Recommended for ${matchingTypes.map(t => t.replace('Node', '')).join(' + ')} architecture`;
        }
      }

      return {
        ...pattern,
        isRecommended,
        recommendationReason,
      };
    }).sort((a, b) => {
      // Sort recommended patterns first
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return 0;
    });
  }, [selectedNodes.length, uniqueSelectedTypes, nodeTypeCounts]);

  const toggleNodeSelection = (nodeId) => {
    setSelectedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const togglePatternSelection = (patternId) => {
    setSelectedPatterns(prev => 
      prev.includes(patternId) 
        ? prev.filter(id => id !== patternId)
        : [...prev, patternId]
    );
  };

  const selectAllNodes = () => {
    setSelectedNodes(selectableNodes.map(n => n.id));
  };

  const clearNodeSelection = () => {
    setSelectedNodes([]);
  };

  const handleGenerate = async () => {
    if (selectedNodes.length === 0) {
      setError('Please select at least one component');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedCode(null);

    try {
      const selectedNodeData = selectableNodes.filter(n => selectedNodes.includes(n.id));
      const relevantEdges = (edges || []).filter(e => 
        selectedNodes.includes(e.source) || selectedNodes.includes(e.target)
      );
      const selectedPatternData = DESIGN_PATTERNS.filter(p => selectedPatterns.includes(p.id));

      const result = await generateCodeFromComponents({
        nodes: selectedNodeData,
        edges: relevantEdges,
        patterns: selectedPatternData,
        language,
        outputFormat,
      });

      if (result && result.code) {
        setGeneratedCode(result);
      } else {
        setError('Failed to generate code. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedCode?.code) {
      await navigator.clipboard.writeText(generatedCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedLanguage = LANGUAGE_OPTIONS.find(opt => opt.id === language);

  const getNodeTypeColor = (type) => {
    const colors = {
      clientNode: 'var(--accent-blue)',
      serverNode: 'var(--accent-emerald)',
      databaseNode: 'var(--accent-amber)',
      loadBalancerNode: 'var(--accent-purple)',
      cacheNode: 'var(--accent-rose)',
    };
    return colors[type] || 'var(--text-secondary)';
  };

  const getCategoryColor = (category) => {
    const colors = {
      creational: 'var(--accent-emerald)',
      structural: 'var(--accent-blue)',
      behavioral: 'var(--accent-purple)',
      architectural: 'var(--accent-amber)',
    };
    return colors[category] || 'var(--text-secondary)';
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-secondary)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-secondary)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: 'var(--accent-emerald)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Component to Code
              </h2>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Generate code design with design patterns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-black/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!generatedCode ? (
            <>
              {/* Component Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Layers className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                    Select Components ({selectedNodes.length}/{selectableNodes.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllNodes}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearNodeSelection}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                {selectableNodes.length === 0 ? (
                  <div
                    className="px-4 py-8 rounded-xl text-center"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    <p style={{ color: 'var(--text-muted)' }}>
                      No components available. Please create a diagram first.
                    </p>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 rounded-xl"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    {selectableNodes.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => toggleNodeSelection(node.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                        style={{
                          backgroundColor: selectedNodes.includes(node.id) 
                            ? 'var(--bg-tertiary)' 
                            : 'transparent',
                          border: selectedNodes.includes(node.id)
                            ? `1px solid ${getNodeTypeColor(node.type)}`
                            : '1px solid transparent',
                        }}
                      >
                        {selectedNodes.includes(node.id) ? (
                          <CheckSquare 
                            className="w-4 h-4 flex-shrink-0" 
                            style={{ color: getNodeTypeColor(node.type) }} 
                          />
                        ) : (
                          <Square 
                            className="w-4 h-4 flex-shrink-0" 
                            style={{ color: 'var(--text-muted)' }} 
                          />
                        )}
                        <div className="min-w-0">
                          <div
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {node.data?.label || node.id}
                          </div>
                          <div
                            className="text-xs truncate"
                            style={{ color: getNodeTypeColor(node.type) }}
                          >
                            {node.type?.replace('Node', '')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Design Patterns Selection */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <GitBranch className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                  Design Patterns {suggestedPatterns.length > 0 && `(${selectedPatterns.length} selected)`}
                </label>
                
                {selectedNodes.length === 0 ? (
                  <div
                    className="px-4 py-4 rounded-xl text-center text-sm"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Select components to see suggested patterns
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Architecture Hint */}
                    {architectureHint && (
                      <div
                        className="px-4 py-3 rounded-xl text-sm flex items-start gap-2"
                        style={{
                          backgroundColor: architectureHint.suggestPatterns 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'rgba(251, 191, 36, 0.1)',
                          border: architectureHint.suggestPatterns 
                            ? '1px solid rgba(16, 185, 129, 0.3)' 
                            : '1px solid rgba(251, 191, 36, 0.3)',
                          color: architectureHint.suggestPatterns 
                            ? 'var(--accent-emerald)' 
                            : 'var(--accent-amber)',
                        }}
                      >
                        <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{architectureHint.message}</span>
                      </div>
                    )}

                    {/* Recommended Patterns Section */}
                    {suggestedPatterns.some(p => p.isRecommended) && (
                      <div>
                        <div 
                          className="text-xs font-medium mb-2 flex items-center gap-1"
                          style={{ color: 'var(--accent-emerald)' }}
                        >
                          <Sparkles className="w-3 h-3" />
                          Recommended for your architecture
                        </div>
                        <div
                          className="grid grid-cols-2 gap-2 p-3 rounded-xl"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          }}
                        >
                          {suggestedPatterns.filter(p => p.isRecommended).map((pattern) => (
                            <button
                              key={pattern.id}
                              onClick={() => togglePatternSelection(pattern.id)}
                              className="flex items-start gap-2 px-3 py-2 rounded-lg text-left transition-all"
                              style={{
                                backgroundColor: selectedPatterns.includes(pattern.id) 
                                  ? 'var(--bg-tertiary)' 
                                  : 'transparent',
                                border: selectedPatterns.includes(pattern.id)
                                  ? '1px solid var(--accent-emerald)'
                                  : '1px solid transparent',
                              }}
                            >
                              {selectedPatterns.includes(pattern.id) ? (
                                <CheckSquare 
                                  className="w-4 h-4 flex-shrink-0 mt-0.5" 
                                  style={{ color: 'var(--accent-emerald)' }} 
                                />
                              ) : (
                                <Square 
                                  className="w-4 h-4 flex-shrink-0 mt-0.5" 
                                  style={{ color: 'var(--text-muted)' }} 
                                />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span
                                    className="text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {pattern.label}
                                  </span>
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: 'var(--accent-emerald)',
                                      color: 'white',
                                    }}
                                  >
                                    ★
                                  </span>
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {pattern.description}
                                </div>
                                {pattern.recommendationReason && (
                                  <div
                                    className="text-xs mt-1"
                                    style={{ color: 'var(--accent-emerald)' }}
                                  >
                                    {pattern.recommendationReason}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optional Patterns Section */}
                    {suggestedPatterns.some(p => !p.isRecommended) && (
                      <div>
                        <div 
                          className="text-xs font-medium mb-2"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Other applicable patterns (optional)
                        </div>
                        <div
                          className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 rounded-xl"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                          }}
                        >
                          {suggestedPatterns.filter(p => !p.isRecommended).map((pattern) => (
                            <button
                              key={pattern.id}
                              onClick={() => togglePatternSelection(pattern.id)}
                              className="flex items-start gap-2 px-3 py-2 rounded-lg text-left transition-all"
                              style={{
                                backgroundColor: selectedPatterns.includes(pattern.id) 
                                  ? 'var(--bg-tertiary)' 
                                  : 'transparent',
                                border: selectedPatterns.includes(pattern.id)
                                  ? `1px solid ${getCategoryColor(pattern.category)}`
                                  : '1px solid transparent',
                              }}
                            >
                              {selectedPatterns.includes(pattern.id) ? (
                                <CheckSquare 
                                  className="w-4 h-4 flex-shrink-0 mt-0.5" 
                                  style={{ color: getCategoryColor(pattern.category) }} 
                                />
                              ) : (
                                <Square 
                                  className="w-4 h-4 flex-shrink-0 mt-0.5" 
                                  style={{ color: 'var(--text-muted)' }} 
                                />
                              )}
                              <div className="min-w-0">
                                <div
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {pattern.label}
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {pattern.description}
                                </div>
                                <div
                                  className="text-xs mt-1 capitalize"
                                  style={{ color: getCategoryColor(pattern.category) }}
                                >
                                  {pattern.category}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No patterns message */}
                    {suggestedPatterns.length === 0 && (
                      <div
                        className="px-4 py-4 rounded-xl text-center text-sm"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        No design patterns applicable for the selected components.
                        You can still generate code without patterns.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Language and Output Format */}
              <div className="grid grid-cols-2 gap-4">
                {/* Language Selection */}
                <div>
                  <label
                    className="flex items-center gap-2 text-sm font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Code2 className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />
                    Language
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span>{selectedLanguage?.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </button>
                    {showLanguageDropdown && (
                      <div
                        className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 shadow-xl"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-secondary)',
                        }}
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setLanguage(option.id);
                              setShowLanguageDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-black/5 transition-colors"
                            style={{
                              backgroundColor: language === option.id ? 'var(--bg-tertiary)' : 'transparent',
                            }}
                          >
                            <div
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {option.label}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {option.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Output Format Selection */}
                <div>
                  <label
                    className="flex items-center gap-2 text-sm font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <FileCode className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
                    Output Format
                  </label>
                  <div className="space-y-2">
                    {OUTPUT_FORMATS.map((format) => {
                      const Icon = format.icon;
                      return (
                        <button
                          key={format.id}
                          onClick={() => setOutputFormat(format.id)}
                          className="w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all"
                          style={{
                            backgroundColor: outputFormat === format.id 
                              ? 'var(--bg-tertiary)' 
                              : 'var(--bg-secondary)',
                            border: outputFormat === format.id
                              ? '1px solid var(--accent-amber)'
                              : '1px solid var(--border-primary)',
                          }}
                        >
                          <Icon 
                            className="w-4 h-4 flex-shrink-0" 
                            style={{ 
                              color: outputFormat === format.id 
                                ? 'var(--accent-amber)' 
                                : 'var(--text-muted)' 
                            }} 
                          />
                          <div className="min-w-0">
                            <div
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {format.label}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                  }}
                >
                  {error}
                </div>
              )}
            </>
          ) : (
            /* Generated Code View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Generated {selectedLanguage?.label} Code
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setGeneratedCode(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>

              {generatedCode.description && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {generatedCode.description}
                </div>
              )}

              <pre
                className="p-4 rounded-xl text-sm overflow-x-auto"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'ui-monospace, monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {generatedCode.code}
              </pre>

              {generatedCode.patterns && generatedCode.patterns.length > 0 && (
                <div>
                  <h4
                    className="text-sm font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Applied Patterns
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedCode.patterns.map((pattern, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--accent-purple)',
                          border: '1px solid var(--accent-purple)',
                        }}
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!generatedCode && (
          <div
            className="px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderTop: '1px solid var(--border-secondary)',
            }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedNodes.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--accent-emerald)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Code
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentToCodePanel;
