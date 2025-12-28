import { FileUp, FolderOpen, Loader2, Layers } from "lucide-react";
import { useCallback, useState } from "react";
import LoadDiagramPanel from "./LoadDiagramPanel";
import SpecToComponentPanel from "./SpecToComponentPanel";

const MainOptions = ({ onUpload, isAnalyzing, savedDiagrams, onLoadDiagram, onDeleteDiagram, onGenerateFromSpec }) => {
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [showSpecPanel, setShowSpecPanel] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        console.log("MainOptions: File dropped", e.dataTransfer.files[0]);
        onUpload(e.dataTransfer.files[0]);
      }
    },
    [onUpload]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e) => {
    console.log("MainOptions: File input changed", e.target.files);
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
      e.target.value = null;
    }
  };

  const handleLoadDiagram = useCallback((diagram) => {
    onLoadDiagram(diagram);
    setShowLoadPanel(false);
  }, [onLoadDiagram]);

  const handleDeleteDiagram = useCallback((diagramId) => {
    onDeleteDiagram(diagramId);
  }, [onDeleteDiagram]);

  const handleGenerateFromSpec = useCallback((result) => {
    onGenerateFromSpec(result);
    setShowSpecPanel(false);
  }, [onGenerateFromSpec]);

  return (
    <>
      <div className="w-full max-w-4xl mx-auto mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Option */}
          <div
            className="p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group hover:border-[var(--accent-blue)]"
            style={{
              borderColor: "var(--border-primary)",
              backgroundColor: "var(--bg-secondary)",
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById("file-upload-main").click()}
          >
            <input
              type="file"
              id="file-upload-main"
              className="hidden"
              accept="image/*"
              onChange={handleChange}
              disabled={isAnalyzing}
            />

            {isAnalyzing ? (
              <>
                <Loader2
                  className="w-16 h-16 animate-spin"
                  style={{ color: "var(--accent-blue)" }}
                />
                <p
                  className="text-xl font-medium text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Analyzing System Architecture...
                </p>
                <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                  Identifying components and relationships
                </p>
              </>
            ) : (
              <>
                <div
                  className="p-4 rounded-full transition-colors group-hover:bg-[var(--accent-blue-glow)]"
                  style={{ backgroundColor: "var(--interactive-bg)" }}
                >
                  <FileUp
                    className="w-12 h-12 group-hover:text-[var(--accent-blue)]"
                    style={{ color: "var(--text-secondary)" }}
                  />
                </div>
                <div className="text-center">
                  <h3
                    className="text-xl font-medium mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Upload Image
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Drop your system design image here or click to browse (JPG, PNG)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Load Option */}
          <div
            className="p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group hover:border-[var(--accent-purple)]"
            style={{
              borderColor: "var(--border-primary)",
              backgroundColor: "var(--bg-secondary)",
            }}
            onClick={() => setShowLoadPanel(true)}
          >
            <div
              className="p-4 rounded-full transition-colors group-hover:bg-[var(--accent-purple-glow)]"
              style={{ backgroundColor: "var(--interactive-bg)" }}
            >
              <FolderOpen
                className="w-12 h-12 group-hover:text-[var(--accent-purple)]"
                style={{ color: "var(--text-secondary)" }}
              />
            </div>
            <div className="text-center">
              <h3
                className="text-xl font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Load Saved Diagram
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Continue working on a previously saved diagram ({savedDiagrams.length} saved)
              </p>
            </div>
          </div>

          {/* Spec to C4 Component Option */}
          <div
            className="p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group hover:border-[var(--accent-emerald)]"
            style={{
              borderColor: "var(--border-primary)",
              backgroundColor: "var(--bg-secondary)",
            }}
            onClick={() => setShowSpecPanel(true)}
          >
            <div
              className="p-4 rounded-full transition-colors group-hover:bg-[rgba(16,185,129,0.1)]"
              style={{ backgroundColor: "var(--interactive-bg)" }}
            >
              <Layers
                className="w-12 h-12 group-hover:text-[var(--accent-emerald)]"
                style={{ color: "var(--text-secondary)" }}
              />
            </div>
            <div className="text-center">
              <h3
                className="text-xl font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Spec to C4 Component
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Convert functional specification to C4 Component diagram
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Upload an image, load a saved diagram, or generate a C4 Component diagram from your specification
          </p>
        </div>
      </div>

      {/* Load Diagram Modal */}
      {showLoadPanel && (
        <LoadDiagramPanel
          savedDiagrams={savedDiagrams}
          onLoadDiagram={handleLoadDiagram}
          onDeleteDiagram={handleDeleteDiagram}
          onClose={() => setShowLoadPanel(false)}
        />
      )}

      {/* Spec to Component Modal */}
      {showSpecPanel && (
        <SpecToComponentPanel
          onGenerate={handleGenerateFromSpec}
          onClose={() => setShowSpecPanel(false)}
        />
      )}
    </>
  );
};

export default MainOptions;
