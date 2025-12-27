import {
  Activity,
  ArrowDown,
  ArrowLeft,
  Code,
  Image as ImageIcon,
  Layout,
  RotateCw,
  AlignCenter,
  AlignLeft,
  Save,
  SaveAll,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlowProvider, applyNodeChanges, applyEdgeChanges } from "reactflow";
import InfoPanel from "./components/InfoPanel";
import MermaidDisplay from "./components/MermaidDisplay";
import SystemDiagram from "./components/SystemDiagram";
import ThemeToggle from "./components/ThemeToggle";
import MainOptions from "./components/MainOptions";
import {
  convertMermaidToFlow,
  generateMermaidFromImage,
} from "./services/analysisService";
import dagre from '@dagrejs/dagre';

function App() {
  const [graphData, setGraphData] = useState(null);
  const [mermaidCode, setMermaidCode] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [layoutDirection, setLayoutDirection] = useState('LR');
  const [connectionLineType, setConnectionLineType] = useState('straight');
  const [savedDiagrams, setSavedDiagrams] = useState([]);
  const [showSavedDiagrams, setShowSavedDiagrams] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');

  const interactiveSectionRef = useRef(null);

  // Load saved diagrams from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('savedDiagrams');
    if (stored) {
      try {
        setSavedDiagrams(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load saved diagrams:', error);
      }
    }
  }, []);

  // Save diagrams to localStorage whenever they change
  // Use a ref to track if initial load has completed to avoid overwriting on mount
  const hasLoadedRef = useRef(false);
  
  useEffect(() => {
    // Skip the first render to avoid overwriting localStorage before loading
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }
    localStorage.setItem('savedDiagrams', JSON.stringify(savedDiagrams));
  }, [savedDiagrams]);

  const handleUpload = async (file) => {
    console.log("App: handleUpload called with file:", file);

    // Create a local URL for the uploaded image to display it
    const objectUrl = URL.createObjectURL(file);
    setUploadedImageUrl(objectUrl);

    setIsAnalyzing(true);
    try {
      console.log("App: calling generateMermaidFromImage...");
      const code = await generateMermaidFromImage(file);
      console.log("App: generateMermaidFromImage returned:", code);
      setMermaidCode(code);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConvertToInteractive = async () => {
    if (!mermaidCode) return;
    setIsConverting(true);
    try {
      console.log("App: calling convertMermaidToFlow...");
      const data = await convertMermaidToFlow(mermaidCode);
      console.log("App: convertMermaidToFlow returned:", data);
      console.log("App: nodes count:", data?.nodes?.length || 0);
      console.log("App: edges count:", data?.edges?.length || 0);
      
      if (!data || (!data.nodes && !data.edges)) {
        console.error("App: Invalid data structure returned:", data);
        alert("Failed to generate interactive visualization. Invalid data structure.");
        return;
      }
      
      setGraphData(data);
      // Ensure all nodes have a position property and an ID
      const validatedNodes = (data.nodes || []).map((node, index) => {
        const validatedNode = { ...node };
        
        // Ensure node has an ID (required by React Flow)
        if (!validatedNode.id) {
          validatedNode.id = `node-${index}-${Date.now()}`;
        }
        
        // Ensure node has a valid position
        if (!validatedNode.position || typeof validatedNode.position.x !== 'number' || typeof validatedNode.position.y !== 'number') {
          validatedNode.position = { x: 250 + (index % 3) * 200, y: 100 + Math.floor(index / 3) * 150 };
        }
        
        // Ensure node has a type (default to serverNode if missing)
        if (!validatedNode.type) {
          validatedNode.type = 'serverNode';
        }
        
        // Ensure node has data object
        if (!validatedNode.data) {
          validatedNode.data = { label: `Node ${index + 1}`, description: '', tech: '' };
        }
        
        return validatedNode;
      });
      console.log("App: validatedNodes count:", validatedNodes.length);
      console.log("App: validatedNodes:", validatedNodes);
      setNodes(validatedNodes);
      setEdges((data.edges || []).map(edge => ({
        ...edge,
        type: "straight"
      })));

      // Apply default layout after a short delay to ensure nodes are rendered
      setTimeout(() => {
        applyLayout('LR');
      }, 100);

      // Scroll to interactive section after a short delay to allow render
      setTimeout(() => {
        interactiveSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Conversion failed:", error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setGraphData(null);
    setMermaidCode(null);
    setUploadedImageUrl(null);
    setSelectedNode(null);
    setSelectedEdge(null);
    setNodes([]);
    setEdges([]);
  };

  const handleSaveDiagram = () => {
    console.log('handleSaveDiagram called');
    console.log('nodes:', nodes);
    console.log('nodes.length:', nodes.length);
    
    if (nodes.length === 0) {
      alert('No diagram to save. Please create a diagram first.');
      return;
    }

    const diagramName = prompt('Enter a name for this diagram:', `Diagram ${new Date().toLocaleString()}`);
    console.log('diagramName from prompt:', diagramName);
    if (!diagramName) {
      console.log('No diagram name provided, returning');
      return;
    }

    const diagramData = {
      id: Date.now().toString(),
      name: diagramName,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      mermaidCode: mermaidCode,
      createdAt: new Date().toISOString(),
      layoutDirection: layoutDirection,
      connectionLineType: connectionLineType
    };
    console.log('diagramData to save:', diagramData);

    setSavedDiagrams(prev => {
      console.log('Previous savedDiagrams:', prev);
      const newDiagrams = [...prev, diagramData];
      console.log('New savedDiagrams:', newDiagrams);
      return newDiagrams;
    });
    alert('Diagram saved successfully!');
  };

  const handleSaveAsDiagram = () => {
    if (nodes.length === 0) {
      alert('No diagram to save. Please create a diagram first.');
      return;
    }
    setSaveAsName(`Diagram Copy ${new Date().toLocaleString()}`);
    setShowSaveAsModal(true);
  };

  const handleConfirmSaveAs = () => {
    if (!saveAsName.trim()) {
      alert('Please enter a name for the diagram.');
      return;
    }

    const diagramData = {
      id: Date.now().toString(),
      name: saveAsName.trim(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      mermaidCode: mermaidCode,
      createdAt: new Date().toISOString(),
      layoutDirection: layoutDirection,
      connectionLineType: connectionLineType
    };

    setSavedDiagrams(prev => [...prev, diagramData]);
    setShowSaveAsModal(false);
    setSaveAsName('');
    alert(`Diagram saved as "${saveAsName.trim()}"!`);
  };

  const handleLoadDiagram = (diagram) => {
    setNodes(diagram.nodes);
    setEdges(diagram.edges);
    setMermaidCode(diagram.mermaidCode || '');
    setLayoutDirection(diagram.layoutDirection || 'LR');
    setConnectionLineType(diagram.connectionLineType || 'straight');
    setGraphData({ nodes: diagram.nodes, edges: diagram.edges });
    setSelectedNode(null);
    setSelectedEdge(null);
    
    // Update edge types to match the loaded connection line type
    const loadedConnectionType = diagram.connectionLineType || 'straight';
    const updatedEdges = (diagram.edges || []).map(edge => ({
      ...edge,
      type: loadedConnectionType
    }));
    setEdges(updatedEdges);
    
    // Scroll to interactive section
    setTimeout(() => {
      interactiveSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDeleteDiagram = (diagramId) => {
    if (confirm('Are you sure you want to delete this diagram?')) {
      setSavedDiagrams(prev => prev.filter(d => d.id !== diagramId));
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleEdgeClick = (event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const handleSave = (item) => {
    if (item.id && nodes.find((n) => n.id === item.id)) {
      // It's a node - ensure position is preserved
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id === item.id) {
            // Preserve position from existing node if not in item
            const position = item.position || n.position || { x: 250, y: 250 };
            return {
              ...item,
              position: {
                x: typeof position.x === 'number' ? position.x : 250,
                y: typeof position.y === 'number' ? position.y : 250
              }
            };
          }
          return n;
        })
      );
      // Update selected node with position preserved
      const existingNode = nodes.find((n) => n.id === item.id);
      const position = item.position || existingNode?.position || { x: 250, y: 250 };
      setSelectedNode({
        ...item,
        position: {
          x: typeof position.x === 'number' ? position.x : 250,
          y: typeof position.y === 'number' ? position.y : 250
        }
      });
    } else if (item.id && edges.find((e) => e.id === item.id)) {
      // It's an edge
      setEdges((prevEdges) =>
        prevEdges.map((e) => (e.id === item.id ? item : e))
      );
      setSelectedEdge(item);
    }
  };

  const handleDelete = (item) => {
    if (item.id && nodes.find((n) => n.id === item.id)) {
      // It's a node - delete node and connected edges
      setNodes((prevNodes) => prevNodes.filter((n) => n.id !== item.id));
      setEdges((prevEdges) =>
        prevEdges.filter(
          (e) => e.source !== item.id && e.target !== item.id
        )
      );
      setSelectedNode(null);
    } else if (item.id && edges.find((e) => e.id === item.id)) {
      // It's an edge
      setEdges((prevEdges) => prevEdges.filter((e) => e.id !== item.id));
      setSelectedEdge(null);
    }
  };

  // React Flow change handlers - must use applyNodeChanges and applyEdgeChanges
  const onNodesChange = useCallback(
    (changes) => {
      // Handle custom 'replace' type for node updates (e.g., adding to subflow)
      const replaceChanges = changes.filter(c => c.type === 'replace');
      const standardChanges = changes.filter(c => c.type !== 'replace');
      
      setNodes((nds) => {
        let newNodes = nds;
        
        // Apply standard changes
        if (standardChanges.length > 0) {
          newNodes = applyNodeChanges(standardChanges, newNodes);
        }
        
        // Apply replace changes (update entire node)
        if (replaceChanges.length > 0) {
          newNodes = newNodes.map(node => {
            const replacement = replaceChanges.find(c => c.item?.id === node.id);
            return replacement ? replacement.item : node;
          });
        }
        
        return newNodes;
      });
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes) => {
      // Handle custom 'replace' type for edge updates
      const replaceChanges = changes.filter(c => c.type === 'replace');
      const standardChanges = changes.filter(c => c.type !== 'replace');
      
      setEdges((eds) => {
        let newEdges = eds;
        
        // Apply standard changes
        if (standardChanges.length > 0) {
          newEdges = applyEdgeChanges(standardChanges, newEdges);
        }
        
        // Apply replace changes (update entire edge)
        if (replaceChanges.length > 0) {
          newEdges = newEdges.map(edge => {
            const replacement = replaceChanges.find(c => c.item?.id === edge.id);
            return replacement ? replacement.item : edge;
          });
        }
        
        return newEdges;
      });
    },
    []
  );

  // Layout functions using Dagre
  const getLayoutedElements = useCallback((nodes, edges, direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    
    const nodeWidth = 200;
    const nodeHeight = 120;
    
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ 
      rankdir: direction,
      nodesep: 100,
      ranksep: 150,
      marginx: 50,
      marginy: 50
    });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const newNode = {
        ...node,
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };

      return newNode;
    });

    return { nodes: newNodes, edges };
  }, []);

  const applyLayout = useCallback((direction) => {
    if (nodes.length === 0) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction,
    );

    // Update edges to use straight line type
    const updatedEdges = layoutedEdges.map(edge => ({
      ...edge,
      type: "straight"
    }));

    setNodes([...layoutedNodes]);
    setEdges([...updatedEdges]);
    setLayoutDirection(direction);
  }, [nodes, edges, getLayoutedElements]);

  const handleLayoutHorizontal = () => applyLayout('LR');
  const handleLayoutVertical = () => applyLayout('TB');

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  const showDashboard = uploadedImageUrl || mermaidCode || graphData;

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-blue-500/30"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <header
        className="border-b backdrop-blur-md sticky top-0 z-50"
        style={{
          borderColor: "var(--border-primary)",
          backgroundColor: "var(--bg-elevated)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg"
              style={{ boxShadow: "var(--accent-blue-glow)" }}
            >
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              System Design Visualizer
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {showDashboard && (
              <>
                <button
                  onClick={handleSaveDiagram}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: "var(--interactive-bg)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-hover)";
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-bg)";
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                  }}
                  title="Save current diagram"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleSaveAsDiagram}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: "var(--interactive-bg)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-hover)";
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-bg)";
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                  }}
                  title="Save as new diagram"
                >
                  <SaveAll className="w-4 h-4" />
                  Save As
                </button>
                <button
                  onClick={() => setShowSavedDiagrams(!showSavedDiagrams)}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: "var(--interactive-bg)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-hover)";
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-bg)";
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                  }}
                  title="Load saved diagrams"
                >
                  <FolderOpen className="w-4 h-4" />
                  Load ({savedDiagrams.length})
                </button>
                <button
                  onClick={handleReset}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: "var(--interactive-bg)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-hover)";
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--interactive-bg)";
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                  }}
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  Upload New Design
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {!showDashboard ? (
          <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div
                className="inline-flex items-center justify-center p-4 mb-6 rounded-full"
                style={{
                  backgroundColor: "var(--accent-blue-glow)",
                  border: "1px solid var(--accent-blue)",
                }}
              >
                <Activity
                  className="w-8 h-8"
                  style={{ color: "var(--accent-blue)" }}
                />
              </div>
              <h2
                className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Bring your architecture to life
              </h2>
              <p
                className="text-lg leading-relaxed max-w-xl mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Upload a system design image or load a saved diagram to create an
                interactive, explorable visualization with detailed component
                information.
              </p>
            </div>
            <MainOptions
              onUpload={handleUpload}
              isAnalyzing={isAnalyzing}
              savedDiagrams={savedDiagrams}
              onLoadDiagram={handleLoadDiagram}
              onDeleteDiagram={handleDeleteDiagram}
            />
          </div>
        ) : (
          <div className="flex flex-col p-6 gap-6 max-w-[1920px] mx-auto">
            {/* Row 1: Source Materials */}
            <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
              {/* Top Left: Original Image (35%) */}
              <div
                className="lg:w-[35%] flex flex-col rounded-xl overflow-hidden"
                style={{
                  border: "1px solid var(--border-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <div
                  className="px-5 py-3 flex items-center gap-2.5"
                  style={{
                    borderBottom: "1px solid var(--border-secondary)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  <ImageIcon
                    className="w-4 h-4"
                    style={{ color: "var(--accent-blue)" }}
                  />
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Original Design
                  </h3>
                </div>
                <div
                  className="flex-1 p-6 overflow-auto flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-overlay)" }}
                >
                  {uploadedImageUrl ? (
                    <img
                      src={uploadedImageUrl}
                      alt="Original System Design"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      style={{
                        boxShadow: "var(--shadow-xl)",
                        border: "1px solid var(--border-primary)",
                      }}
                    />
                  ) : (
                    <div
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No image loaded
                    </div>
                  )}
                </div>
              </div>

              {/* Top Right: Mermaid Diagram (65%) */}
              <div
                className="lg:w-[65%] flex flex-col rounded-xl overflow-hidden"
                style={{
                  border: "1px solid var(--border-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{
                    borderBottom: "1px solid var(--border-secondary)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Code
                      className="w-4 h-4"
                      style={{ color: "var(--accent-purple)" }}
                    />
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Mermaid Definition
                    </h3>
                  </div>
                  {mermaidCode && !graphData && (
                    <button
                      onClick={handleConvertToInteractive}
                      disabled={isConverting}
                      className="group flex items-center gap-2 px-4 py-1.5 rounded-md text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "var(--accent-blue)",
                        boxShadow: "var(--accent-blue-glow)",
                      }}
                    >
                      {isConverting
                        ? "Converting..."
                        : "Convert to Interactive"}
                      <ArrowDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                    </button>
                  )}
                </div>
                <div
                  className="flex-1 p-4 overflow-hidden relative"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  {mermaidCode ? (
                    <MermaidDisplay chart={mermaidCode} />
                  ) : isAnalyzing ? (
                    <div
                      className="h-full flex flex-col items-center justify-center gap-3 animate-pulse"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <div
                        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                        style={{
                          borderColor: "var(--accent-blue)",
                          borderTopColor: "transparent",
                        }}
                      />
                      <span className="text-sm">
                        Generating Mermaid diagram...
                      </span>
                    </div>
                  ) : (
                    <div
                      className="h-full flex items-center justify-center text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Waiting for analysis...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Interactive Diagram (Full Width) */}
            <div
              ref={interactiveSectionRef}
              className="h-[800px] flex flex-col rounded-xl overflow-hidden"
              style={{
                border: "1px solid var(--border-secondary)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  borderBottom: "1px solid var(--border-secondary)",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Activity
                    className="w-4 h-4"
                    style={{ color: "var(--accent-emerald)" }}
                  />
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Interactive Visualization
                  </h3>
                </div>
                
                {/* Layout Controls */}
                {(graphData || nodes.length > 0) && (
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-md"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-primary)",
                      }}
                    >
                      <button
                        onClick={handleLayoutHorizontal}
                        className="p-1.5 rounded transition-all"
                        style={{
                          backgroundColor: layoutDirection === 'LR' ? "var(--accent-blue)" : "transparent",
                          color: layoutDirection === 'LR' ? "white" : "var(--text-secondary)",
                        }}
                        title="Horizontal Layout"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleLayoutVertical}
                        className="p-1.5 rounded transition-all"
                        style={{
                          backgroundColor: layoutDirection === 'TB' ? "var(--accent-blue)" : "transparent",
                          color: layoutDirection === 'TB' ? "white" : "var(--text-secondary)",
                        }}
                        title="Vertical Layout"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="flex-1 relative"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                {graphData || nodes.length > 0 ? (
                  <>
                    <ReactFlowProvider>
                      <SystemDiagram
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={handleNodeClick}
                        onEdgeClick={handleEdgeClick}
                        selectedNode={selectedNode}
                        selectedEdge={selectedEdge}
                        onConnectionLineTypeChange={setConnectionLineType}
                        connectionLineType={connectionLineType}
                      />
                    </ReactFlowProvider>
                    <InfoPanel
                      node={selectedNode}
                      edge={selectedEdge}
                      onClose={() => {
                        setSelectedNode(null);
                        setSelectedEdge(null);
                      }}
                      onSave={handleSave}
                      onDelete={handleDelete}
                    />
                  </>
                ) : (
                  <div
                    className="h-full flex flex-col items-center justify-center p-8 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {mermaidCode ? (
                      <div className="max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div
                          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            border: "1px solid var(--border-secondary)",
                            boxShadow: "var(--shadow-xl)",
                          }}
                        >
                          <Activity
                            className="w-8 h-8"
                            style={{ color: "var(--accent-blue)" }}
                          />
                        </div>
                        <h3
                          className="text-xl font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Ready to Visualize
                        </h3>
                        <p style={{ color: "var(--text-secondary)" }}>
                          Review the Mermaid diagram above. When you're ready,
                          click "Convert to Interactive" to generate the
                          explorable graph.
                        </p>
                        <button
                          onClick={handleConvertToInteractive}
                          disabled={isConverting}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                          style={{
                            backgroundColor: "var(--accent-blue)",
                            boxShadow: "var(--accent-blue-glow)",
                          }}
                        >
                          {isConverting
                            ? "Converting..."
                            : "Convert to Interactive"}
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            border: "1px solid var(--border-secondary)",
                          }}
                        >
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <p>Upload an image to start the analysis.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saved Diagrams Sidebar */}
        {showSavedDiagrams && (
          <div
            className="fixed right-0 top-16 h-[calc(100vh-64px)] w-80 shadow-2xl z-40 overflow-hidden"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)",
              borderRight: "none",
            }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                borderBottom: "1px solid var(--border-secondary)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <FolderOpen
                  className="w-4 h-4"
                  style={{ color: "var(--accent-blue)" }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Saved Diagrams
                </h3>
              </div>
              <button
                onClick={() => setShowSavedDiagrams(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                style={{ color: "var(--text-secondary)" }}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {savedDiagrams.length === 0 ? (
                <div
                  className="text-center py-8"
                  style={{ color: "var(--text-muted)" }}
                >
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No saved diagrams yet</p>
                  <p className="text-xs mt-2">Create and save a diagram to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedDiagrams.map((diagram) => (
                    <div
                      key={diagram.id}
                      className="p-3 rounded-lg border transition-all hover:shadow-md"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4
                          className="font-medium text-sm truncate flex-1"
                          style={{ color: "var(--text-primary)" }}
                          title={diagram.name}
                        >
                          {diagram.name}
                        </h4>
                        <button
                          onClick={() => handleDeleteDiagram(diagram.id)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 ml-2"
                          style={{ color: "var(--text-muted)" }}
                          title="Delete diagram"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-xs mb-3">
                        <span style={{ color: "var(--text-muted)" }}>
                          {diagram.nodes.length} nodes
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          {diagram.edges.length} edges
                        </span>
                      </div>
                      <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                        {new Date(diagram.createdAt).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleLoadDiagram(diagram)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all"
                        style={{
                          backgroundColor: "var(--accent-blue)",
                          color: "white",
                        }}
                      >
                        <FolderOpen className="w-3 h-3" />
                        Load Diagram
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save As Modal */}
        {showSaveAsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className="rounded-xl p-6 w-96 shadow-2xl"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Save As
              </h3>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Enter diagram name"
                className="w-full px-4 py-2 rounded-lg mb-4 outline-none"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmSaveAs();
                  if (e.key === 'Escape') setShowSaveAsModal(false);
                }}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveAsModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSaveAs}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "var(--accent-blue)",
                    color: "white",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
