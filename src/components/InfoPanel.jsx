import { Activity, Code2, Info, X, Save, XCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

const InfoPanel = ({
  node,
  edge,
  onClose,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (node) {
      setFormData({
        label: node.data?.label || "",
        tech: node.data?.tech || "",
        description: node.data?.description || "",
        type: node.type || "serverNode",
      });
      setIsEditing(true);
    } else if (edge) {
      const strokeDasharray = edge.style?.strokeDasharray || "0";
      const dashStyle =
        strokeDasharray === "5,5"
          ? "dashed"
          : strokeDasharray === "2,2"
          ? "dotted"
          : "solid";
      // Determine arrow style from markerEnd/markerStart
      let arrowStyle = "end"; // default
      if (edge.markerEnd && edge.markerStart) {
        arrowStyle = "both";
      } else if (edge.markerStart && !edge.markerEnd) {
        arrowStyle = "start";
      } else if (!edge.markerEnd && !edge.markerStart) {
        arrowStyle = "none";
      }
      setFormData({
        label: edge.label || edge.data?.label || "",
        type: edge.data?.type || "request",
        color: edge.style?.stroke || edge.data?.color || "#64748b",
        labelColor: edge.labelStyle?.fill || edge.data?.labelColor || "#374151",
        strokeWidth: edge.style?.strokeWidth || 2,
        strokeDasharray: dashStyle,
        arrowStyle: arrowStyle,
      });
      setIsEditing(true);
    }
  }, [node, edge]);

  if (!node && !edge) return null;

  const isNode = !!node;
  const displayType = isNode
    ? node.type?.replace("Node", "") || "Node"
    : "Connection";

  const handleSave = () => {
    if (onSave) {
      if (isNode) {
        onSave({
          ...node,
          position: node.position || { x: 250, y: 250 }, // Ensure position is preserved
          data: {
            ...node.data,
            label: formData.label,
            tech: formData.tech,
            description: formData.description,
          },
          type: formData.type,
        });
      } else {
        const strokeDasharray =
          formData.strokeDasharray === "dashed"
            ? "5,5"
            : formData.strokeDasharray === "dotted"
            ? "2,2"
            : "0";
        // Build marker configuration based on arrow style
        const markerConfig = {};
        const arrowMarker = { type: 'arrowclosed', color: formData.color };
        
        if (formData.arrowStyle === "end" || formData.arrowStyle === "both") {
          markerConfig.markerEnd = arrowMarker;
        }
        if (formData.arrowStyle === "start" || formData.arrowStyle === "both") {
          markerConfig.markerStart = arrowMarker;
        }
        
        onSave({
          ...edge,
          label: formData.label,
          data: {
            ...edge.data,
            label: formData.label,
            type: formData.type,
            color: formData.color,
          },
          style: {
            ...edge.style,
            stroke: formData.color,
            strokeWidth: formData.strokeWidth,
            strokeDasharray: strokeDasharray,
          },
          labelStyle: {
            fill: formData.labelColor,
            fontSize: 12,
          },
          ...markerConfig,
          // Clear markers if not set
          ...(formData.arrowStyle === "none" && { markerEnd: undefined, markerStart: undefined }),
          ...(formData.arrowStyle === "end" && { markerStart: undefined }),
          ...(formData.arrowStyle === "start" && { markerEnd: undefined }),
        });
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    if (node) {
      setFormData({
        label: node.data?.label || "",
        tech: node.data?.tech || "",
        description: node.data?.description || "",
        type: node.type || "serverNode",
      });
    } else if (edge) {
      const strokeDasharray = edge.style?.strokeDasharray || "0";
      const dashStyle =
        strokeDasharray === "5,5"
          ? "dashed"
          : strokeDasharray === "2,2"
          ? "dotted"
          : "solid";
      // Determine arrow style from markerEnd/markerStart
      let arrowStyle = "end";
      if (edge.markerEnd && edge.markerStart) {
        arrowStyle = "both";
      } else if (edge.markerStart && !edge.markerEnd) {
        arrowStyle = "start";
      } else if (!edge.markerEnd && !edge.markerStart) {
        arrowStyle = "none";
      }
      setFormData({
        label: edge.label || edge.data?.label || "",
        type: edge.data?.type || "request",
        color: edge.style?.stroke || edge.data?.color || "#64748b",
        labelColor: edge.labelStyle?.fill || edge.data?.labelColor || "#374151",
        strokeWidth: edge.style?.strokeWidth || 2,
        strokeDasharray: dashStyle,
        arrowStyle: arrowStyle,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${isNode ? "node" : "connection"}?`)) {
      if (onDelete) {
        onDelete(isNode ? node : edge);
      }
      onClose();
    }
  };

  return (
    <div
      className="absolute right-4 top-4 bottom-4 w-80 backdrop-blur-md rounded-xl transform transition-all duration-300 ease-in-out z-50 overflow-hidden flex flex-col"
      style={{
        backgroundColor: "var(--panel-bg)",
        border: "1px solid var(--border-primary)",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      <div
        className="p-4 flex justify-between items-center"
        style={{
          borderBottom: "1px solid var(--border-primary)",
          backgroundColor: "var(--bg-tertiary)",
        }}
      >
        <h2
          className="text-lg font-bold flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <Info className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
          {isNode ? "Node Details" : "Connection Details"}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {isNode ? (
          <>
            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                  placeholder="Node name"
                />
              ) : (
                <h3
                  className="text-2xl font-bold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {node.data?.label}
                </h3>
              )}
              {isEditing ? (
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="mt-2 w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <option value="subflowNode">Subflow</option>
                  <option value="databaseNode">Database</option>
                  <option value="serverNode">Server</option>
                  <option value="clientNode">Client</option>
                  <option value="loadBalancerNode">Load Balancer</option>
                  <option value="cacheNode">Cache</option>
                  <option value="userNode">User</option>
                </select>
              ) : (
                <span
                  className="inline-block px-2 py-1 rounded text-xs font-medium mt-2"
                  style={{
                    backgroundColor: "var(--interactive-bg)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  {displayType}
                </span>
              )}
            </div>

            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}
              >
                <Activity className="w-4 h-4" /> Description
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 rounded-md text-sm resize-none"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                  placeholder="Node description"
                />
              ) : (
                <p
                  className="leading-relaxed text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {node.data?.description || "No description"}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}
              >
                <Code2 className="w-4 h-4" /> Technologies
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.tech}
                  onChange={(e) =>
                    setFormData({ ...formData, tech: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                  placeholder="e.g., React, Node.js, PostgreSQL (comma-separated)"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {node.data?.tech
                    ? node.data.tech
                        .split(",")
                        .filter((t) => t.trim())
                        .map((tech, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{
                              backgroundColor: "var(--accent-blue-glow)",
                              color: "var(--accent-blue)",
                              border: "1px solid var(--accent-blue)",
                            }}
                          >
                            {tech.trim()}
                          </span>
                        ))
                    : "No technologies specified"}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Label
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                  placeholder="Connection label (e.g., HTTP, TCP)"
                />
              ) : (
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {edge.label || edge.data?.label || "Unnamed Connection"}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Type
              </label>
              {isEditing ? (
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <option value="request">Request</option>
                  <option value="response">Response</option>
                  <option value="sync">Synchronous</option>
                  <option value="async">Asynchronous</option>
                </select>
              ) : (
                <span
                  className="inline-block px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: "var(--interactive-bg)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  {edge.data?.type || "request"}
                </span>
              )}
            </div>

            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Color
              </label>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer"
                    style={{ border: "1px solid var(--border-primary)" }}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-md text-sm"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                    placeholder="#64748b"
                  />
                </div>
              ) : (
                <div
                  className="w-full h-8 rounded"
                  style={{
                    backgroundColor: edge.style?.stroke || edge.data?.color || "#64748b",
                    border: "1px solid var(--border-primary)",
                  }}
                />
              )}
            </div>

            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Label Color
              </label>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.labelColor}
                    onChange={(e) =>
                      setFormData({ ...formData, labelColor: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer"
                    style={{ border: "1px solid var(--border-primary)" }}
                  />
                  <input
                    type="text"
                    value={formData.labelColor}
                    onChange={(e) =>
                      setFormData({ ...formData, labelColor: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-md text-sm"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                    placeholder="#374151"
                  />
                </div>
              ) : (
                <div
                  className="w-full h-8 rounded flex items-center justify-center text-sm font-medium"
                  style={{
                    backgroundColor: edge.labelStyle?.fill || edge.data?.labelColor || "#374151",
                    border: "1px solid var(--border-primary)",
                    color: "white",
                  }}
                >
                  {edge.labelStyle?.fill || edge.data?.labelColor || "#374151"}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Line Style
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <select
                    value={formData.strokeDasharray}
                    onChange={(e) => {
                      setFormData({ ...formData, strokeDasharray: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-md text-sm"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                  <div className="flex items-center gap-3">
                    <label
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Width:
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.strokeWidth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          strokeWidth: parseInt(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span
                      className="text-xs w-8 text-right"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formData.strokeWidth}px
                    </span>
                  </div>
                </div>
              ) : (
                <span
                  className="inline-block px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: "var(--interactive-bg)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  {edge.style?.strokeDasharray === "5,5"
                    ? "Dashed"
                    : edge.style?.strokeDasharray === "2,2"
                    ? "Dotted"
                    : "Solid"}{" "}
                  ({edge.style?.strokeWidth || 2}px)
                </span>
              )}
            </div>

            <div className="mb-6">
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block"
                style={{ color: "var(--text-muted)" }}
              >
                Arrow Style
              </label>
              {isEditing ? (
                <select
                  value={formData.arrowStyle}
                  onChange={(e) =>
                    setFormData({ ...formData, arrowStyle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <option value="none">No Arrow</option>
                  <option value="end">Arrow at End →</option>
                  <option value="start">Arrow at Start ←</option>
                  <option value="both">Both Ends ↔</option>
                </select>
              ) : (
                <span
                  className="inline-block px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: "var(--interactive-bg)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  {edge.markerEnd && edge.markerStart
                    ? "Both Ends ↔"
                    : edge.markerStart
                    ? "Arrow at Start ←"
                    : edge.markerEnd
                    ? "Arrow at End →"
                    : "No Arrow"}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div
        className="p-4 flex gap-2 border-t"
        style={{
          borderTopColor: "var(--border-primary)",
          backgroundColor: "var(--bg-tertiary)",
        }}
      >
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isNode && !formData.label?.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--accent-blue)",
                color: "white",
              }}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: "var(--interactive-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: "var(--accent-blue)",
              color: "white",
            }}
          >
            <Save className="w-4 h-4" />
            Edit
          </button>
        )}
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: "var(--interactive-bg)",
            color: "var(--text-danger, #ef4444)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;
