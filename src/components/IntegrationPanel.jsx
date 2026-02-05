/**
 * Integration Panel for Phase 2 Features
 * Repository scanning, observability, cost analysis, AI copilot, IaC generation
 */

import { useState } from 'react';
import {
  GitBranch,
  Activity,
  DollarSign,
  Sparkles,
  Code2,
  ChevronRight,
  Play,
  Download,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Zap,
  Shield,
} from 'lucide-react';

export const IntegrationPanel = () => {
  const [activeTab, setActiveTab] = useState('repository');

  const tabs = [
    { id: 'repository', label: 'Repository', icon: GitBranch },
    { id: 'observability', label: 'Observability', icon: Activity },
    { id: 'cost', label: 'Cost Analysis', icon: DollarSign },
    { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
    { id: 'iac', label: 'IaC Generation', icon: Code2 },
  ];

  return (
    <div
      className="fixed right-4 top-20 bottom-4 w-96 rounded-lg shadow-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Integrations
        </h2>
        <button
          className="p-1 rounded hover:bg-opacity-10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 px-2 py-2 border-b overflow-x-auto"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm whitespace-nowrap ${
                isActive ? 'ring-1' : ''
              }`}
              style={{
                backgroundColor: isActive ? 'var(--interactive-active)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                ringColor: isActive ? 'var(--accent-blue)' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'repository' && <RepositoryTab />}
        {activeTab === 'observability' && <ObservabilityTab />}
        {activeTab === 'cost' && <CostAnalysisTab />}
        {activeTab === 'copilot' && <AICopilotTab />}
        {activeTab === 'iac' && <IaCGenerationTab />}
      </div>
    </div>
  );
};

// ============================================================================
// Repository Tab
// ============================================================================

const RepositoryTab = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = async () => {
    setIsScanning(true);
    // Simulate scanning
    setTimeout(() => {
      setScanResult({
        services: 5,
        dependencies: 12,
        databases: 2,
        apis: 8,
      });
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Scan Repository
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Analyze your codebase to automatically discover services and dependencies.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            Repository URL
          </label>
          <input
            type="text"
            placeholder="https://github.com/user/repo"
            className="w-full px-3 py-2 rounded border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            Branch
          </label>
          <input
            type="text"
            defaultValue="main"
            className="w-full px-3 py-2 rounded border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent-blue)',
            color: 'white',
            opacity: isScanning ? 0.6 : 1,
          }}
        >
          <Play className="w-4 h-4" />
          {isScanning ? 'Scanning...' : 'Scan Repository'}
        </button>
      </div>

      {scanResult && (
        <div
          className="mt-4 p-4 rounded border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Scan Results
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Services:</span>
              <span style={{ color: 'var(--text-primary)' }}>{scanResult.services}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Dependencies:</span>
              <span style={{ color: 'var(--text-primary)' }}>{scanResult.dependencies}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Databases:</span>
              <span style={{ color: 'var(--text-primary)' }}>{scanResult.databases}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>API Endpoints:</span>
              <span style={{ color: 'var(--text-primary)' }}>{scanResult.apis}</span>
            </div>
          </div>

          <button
            className="w-full mt-4 px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--interactive-bg)',
              color: 'var(--text-primary)',
            }}
          >
            Import to Diagram
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Observability Tab
// ============================================================================

const ObservabilityTab = () => {
  const metrics = [
    { label: 'RPS', value: '1,234', trend: '+12%', icon: Zap, color: '#3b82f6' },
    { label: 'P99 Latency', value: '245ms', trend: '-5%', icon: TrendingUp, color: '#10b981' },
    { label: 'Error Rate', value: '0.3%', trend: '-2%', icon: AlertCircle, color: '#f59e0b' },
    { label: 'Availability', value: '99.9%', trend: '+0.1%', icon: CheckCircle, color: '#10b981' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Live Metrics
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Connect to Prometheus, Grafana, Datadog, or OpenTelemetry.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="p-3 rounded border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: metric.color }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {metric.label}
                </span>
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {metric.value}
              </div>
              <div className="text-xs mt-1" style={{ color: metric.trend.startsWith('+') ? '#10b981' : '#ef4444' }}>
                {metric.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 mt-4">
        <button
          className="w-full px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--interactive-bg)',
            color: 'var(--text-primary)',
          }}
        >
          Connect Prometheus
        </button>
        <button
          className="w-full px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--interactive-bg)',
            color: 'var(--text-primary)',
          }}
        >
          Connect Datadog
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Cost Analysis Tab
// ============================================================================

const CostAnalysisTab = () => {
  const costData = {
    total: 2456,
    breakdown: [
      { category: 'Compute', amount: 1200, percentage: 49 },
      { category: 'Database', amount: 800, percentage: 33 },
      { category: 'Networking', amount: 300, percentage: 12 },
      { category: 'Storage', amount: 156, percentage: 6 },
    ],
    savings: 782,
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Monthly Cost Estimate
        </h3>
        <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          ${costData.total.toLocaleString()}
        </div>
      </div>

      <div className="space-y-2">
        {costData.breakdown.map((item) => (
          <div key={item.category}>
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: 'var(--text-secondary)' }}>{item.category}</span>
              <span style={{ color: 'var(--text-primary)' }}>${item.amount}</span>
            </div>
            <div
              className="h-2 rounded-full"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: 'var(--accent-blue)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="p-4 rounded border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--accent-emerald)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Potential Savings
          </span>
        </div>
        <div className="text-2xl font-bold" style={{ color: 'var(--accent-emerald)' }}>
          ${costData.savings}/month
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          32% cost reduction with recommended optimizations
        </p>
      </div>

      <button
        className="w-full px-4 py-2 rounded text-sm font-medium transition-colors"
        style={{
          backgroundColor: 'var(--accent-blue)',
          color: 'white',
        }}
      >
        View Recommendations
      </button>
    </div>
  );
};

// ============================================================================
// AI Copilot Tab
// ============================================================================

const AICopilotTab = () => {
  const [query, setQuery] = useState('');

  const suggestions = [
    { id: 1, title: 'Add caching layer', impact: 'High', type: 'Performance' },
    { id: 2, title: 'Implement circuit breaker', impact: 'High', type: 'Reliability' },
    { id: 3, title: 'Add load balancer', impact: 'Medium', type: 'Scalability' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Ask AI Copilot
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Get intelligent suggestions and architectural insights.
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Show me services that touch PII data..."
          className="w-full px-3 py-2 pr-10 rounded border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded"
          style={{
            backgroundColor: 'var(--accent-blue)',
            color: 'white',
          }}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          AI Suggestions
        </h4>
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 rounded border cursor-pointer hover:bg-opacity-5 transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {suggestion.title}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: suggestion.impact === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                    color: suggestion.impact === 'High' ? '#ef4444' : '#f97316',
                  }}
                >
                  {suggestion.impact}
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {suggestion.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="w-full px-4 py-2 rounded text-sm font-medium transition-colors"
        style={{
          backgroundColor: 'var(--interactive-bg)',
          color: 'var(--text-primary)',
        }}
      >
        Run Security Review
      </button>
    </div>
  );
};

// ============================================================================
// IaC Generation Tab
// ============================================================================

const IaCGenerationTab = () => {
  const [provider, setProvider] = useState('terraform');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Generate Infrastructure as Code
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Export your diagram as deployable infrastructure code.
        </p>
      </div>

      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
          Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full px-3 py-2 rounded border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="terraform">Terraform</option>
          <option value="kubernetes">Kubernetes</option>
          <option value="cloudformation">AWS CloudFormation</option>
          <option value="pulumi">Pulumi</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded" />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Include networking
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded" />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Include security groups
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded" />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Include monitoring
          </span>
        </label>
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-medium transition-colors"
        style={{
          backgroundColor: 'var(--accent-blue)',
          color: 'white',
        }}
      >
        <Code2 className="w-4 h-4" />
        Generate {provider}
      </button>

      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
        style={{
          backgroundColor: 'var(--interactive-bg)',
          color: 'var(--text-primary)',
        }}
      >
        <Download className="w-4 h-4" />
        Download Files
      </button>
    </div>
  );
};
