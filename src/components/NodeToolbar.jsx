import {
  Database,
  Globe,
  Layers,
  Plus,
  Server,
  Smartphone,
} from "lucide-react";

const NodeToolbar = ({ onAddNode }) => {
  const nodeTypeConfigs = [
    {
      type: "databaseNode",
      label: "Database",
      icon: Database,
      color: "emerald",
    },
    {
      type: "serverNode",
      label: "Server",
      icon: Server,
      color: "blue",
    },
    {
      type: "clientNode",
      label: "Client",
      icon: Smartphone,
      color: "purple",
    },
    {
      type: "loadBalancerNode",
      label: "Load Balancer",
      icon: Globe,
      color: "orange",
    },
    {
      type: "cacheNode",
      label: "Cache",
      icon: Layers,
      color: "yellow",
    },
  ];

  return (
    <div
      className="absolute top-4 left-4 z-10 flex flex-col gap-2 p-2 rounded-lg backdrop-blur-md"
      style={{
        backgroundColor: "var(--panel-bg)",
        border: "1px solid var(--border-primary)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="px-3 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
        style={{ color: "var(--text-muted)" }}
      >
        <Plus className="w-3 h-3" />
        Add Node
      </div>
      <div className="flex flex-col gap-1">
        {nodeTypeConfigs.map((config) => {
          const Icon = config.icon;
          return (
            <button
              key={config.type}
              onClick={() => onAddNode(config.type)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all"
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
                e.currentTarget.style.backgroundColor = "var(--interactive-bg)";
                e.currentTarget.style.borderColor = "var(--border-primary)";
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NodeToolbar;

