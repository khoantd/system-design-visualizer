import { FolderOpen, Trash2, Calendar, Box, ArrowRight } from "lucide-react";
import { useCallback } from "react";

const LoadDiagramPanel = ({ savedDiagrams, onLoadDiagram, onDeleteDiagram, onClose }) => {
  const handleLoadDiagram = useCallback((diagram) => {
    onLoadDiagram(diagram);
    onClose();
  }, [onLoadDiagram, onClose]);

  const handleDeleteDiagram = useCallback((e, diagramId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this diagram?')) {
      onDeleteDiagram(diagramId);
    }
  }, [onDeleteDiagram]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-4xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)",
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            borderBottomColor: "var(--border-secondary)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: "var(--accent-blue-glow)",
                border: "1px solid var(--accent-blue)",
              }}
            >
              <FolderOpen
                className="w-5 h-5"
                style={{ color: "var(--accent-blue)" }}
              />
            </div>
            <div>
              <h2 
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Load Saved Diagram
              </h2>
              <p 
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Choose a diagram to continue working on
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {savedDiagrams.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <FolderOpen
                  className="w-10 h-10"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
              <h3 
                className="text-xl font-medium mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                No saved diagrams yet
              </h3>
              <p 
                className="text-sm mb-6 max-w-md mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Create and save diagrams from images to see them here. You can then load them anytime to continue working.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: "var(--accent-blue)",
                  color: "white",
                }}
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedDiagrams.map((diagram) => (
                <div
                  key={diagram.id}
                  className="group relative p-4 rounded-xl border transition-all hover:shadow-lg cursor-pointer"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-primary)",
                  }}
                  onClick={() => handleLoadDiagram(diagram)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 
                      className="font-medium text-sm truncate flex-1 pr-2"
                      style={{ color: "var(--text-primary)" }}
                      title={diagram.name}
                    >
                      {diagram.name}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteDiagram(e, diagram.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900"
                      style={{ color: "var(--text-muted)" }}
                      title="Delete diagram"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5" style={{ color: "var(--accent-blue)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {diagram.nodes.length} nodes
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--accent-purple)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {diagram.edges.length} edges
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(diagram.createdAt).toLocaleDateString()} at {new Date(diagram.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Load Button */}
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: "var(--accent-blue)",
                      color: "white",
                    }}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Load Diagram
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadDiagramPanel;
