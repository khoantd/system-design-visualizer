import { memo, useState } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Box } from "lucide-react";

const SubflowNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-blue-500"
        handleClassName="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !rounded"
      />
      
      <div
        className="w-full h-full rounded-xl border-2 border-dashed relative pointer-events-none"
        style={{
          backgroundColor: selected 
            ? "rgba(59, 130, 246, 0.08)" 
            : "rgba(100, 116, 139, 0.05)",
          borderColor: selected 
            ? "var(--accent-blue)" 
            : "var(--border-secondary)",
          minWidth: 200,
          minHeight: 150,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 pointer-events-auto transition-opacity duration-200"
          style={{
            backgroundColor: "var(--text-muted)",
            opacity: isHovered || selected ? 1 : 0,
          }}
        />

        {/* Header - clickable area for dragging */}
        <div
          className="absolute top-0 left-0 right-0 px-3 py-2 rounded-t-xl flex items-center gap-2 cursor-grab pointer-events-auto"
          style={{
            backgroundColor: selected 
              ? "rgba(59, 130, 246, 0.15)" 
              : "rgba(100, 116, 139, 0.1)",
            borderBottom: "1px dashed var(--border-secondary)",
          }}
        >
          <Box 
            className="w-4 h-4" 
            style={{ color: selected ? "var(--accent-blue)" : "var(--text-secondary)" }} 
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {data.label || "Subflow"}
          </span>
        </div>

        {/* Content area hint */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ paddingTop: 40 }}
        >
          <span
            className="text-xs opacity-50"
            style={{ color: "var(--text-muted)" }}
          >
            Drag nodes here
          </span>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 pointer-events-auto transition-opacity duration-200"
          style={{
            backgroundColor: "var(--text-muted)",
            opacity: isHovered || selected ? 1 : 0,
          }}
        />
      </div>
    </>
  );
});

SubflowNode.displayName = "SubflowNode";

export default SubflowNode;

