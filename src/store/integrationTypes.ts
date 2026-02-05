/**
 * Type definitions for Phase 2: Intelligence & Integration
 * Covers: Repository scanning, observability, cost analysis, AI copilot, IaC
 */

// ============================================================================
// Repository & Code Discovery Types
// ============================================================================

export interface RepositoryConfig {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'local';
  url?: string;
  branch?: string;
  token?: string;
  localPath?: string;
}

export interface ServiceDiscoveryResult {
  services: DiscoveredService[];
  dependencies: ServiceDependency[];
  databases: DatabaseSchema[];
  apiContracts: APIContract[];
}

export interface DiscoveredService {
  name: string;
  type: 'backend' | 'frontend' | 'database' | 'cache' | 'queue' | 'api-gateway';
  language: string;
  framework?: string;
  packageManager?: string;
  entryPoint?: string;
  dependencies: string[];
  exposedPorts?: number[];
  environmentVars?: string[];
  annotations?: Record<string, string>;
  location: {
    path: string;
    files: string[];
  };
}

export interface ServiceDependency {
  source: string;
  target: string;
  type: 'http' | 'grpc' | 'database' | 'cache' | 'queue' | 'internal';
  protocol?: string;
  endpoint?: string;
  confidence: number; // 0-1
}

export interface DatabaseSchema {
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'elasticsearch';
  tables?: string[];
  relationships?: DatabaseRelationship[];
  location?: string;
}

export interface DatabaseRelationship {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface APIContract {
  service: string;
  type: 'openapi' | 'graphql' | 'grpc' | 'rest';
  version?: string;
  endpoints: APIEndpoint[];
  schemas?: Record<string, any>;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description?: string;
  parameters?: APIParameter[];
  responses?: Record<string, any>;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'body' | 'header';
  required: boolean;
  type: string;
  description?: string;
}

// ============================================================================
// Observability & Monitoring Types
// ============================================================================

export interface ObservabilityConfig {
  provider: 'prometheus' | 'grafana' | 'datadog' | 'newrelic' | 'otel';
  endpoint: string;
  apiKey?: string;
  dashboardUrl?: string;
  enabled: boolean;
}

export interface ServiceMetrics {
  serviceId: string;
  timestamp: number;
  rps: number; // Requests per second
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number; // Percentage
  cpu: number; // Percentage
  memory: number; // MB
  availability: number; // Percentage (uptime)
}

export interface TraceData {
  traceId: string;
  spans: TraceSpan[];
  duration: number;
  services: string[];
  timestamp: number;
}

export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: number;
  duration: number;
  tags?: Record<string, string>;
  logs?: SpanLog[];
}

export interface SpanLog {
  timestamp: number;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface Alert {
  id: string;
  service: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: number;
  status: 'firing' | 'resolved';
  source: string;
  url?: string;
}

// ============================================================================
// Cost & Resource Optimization Types
// ============================================================================

export interface CloudResource {
  id: string;
  nodeId: string;
  provider: 'aws' | 'gcp' | 'azure';
  resourceType: string; // e.g., 'EC2', 'Lambda', 'RDS'
  region: string;
  instanceType?: string;
  instanceCount?: number;
  storage?: {
    type: string;
    sizeGB: number;
  };
  networking?: {
    bandwidth: number; // GB/month
    crossAZ: boolean;
    crossRegion: boolean;
  };
}

export interface CostEstimate {
  nodeId: string;
  monthlyCost: number;
  breakdown: CostBreakdown[];
  recommendations?: CostRecommendation[];
}

export interface CostBreakdown {
  category: 'compute' | 'storage' | 'networking' | 'database' | 'other';
  monthlyCost: number;
  details: string;
}

export interface CostRecommendation {
  type: 'right-size' | 'reserved-instance' | 'spot-instance' | 'serverless' | 'storage-tier';
  currentCost: number;
  projectedCost: number;
  savings: number;
  savingsPercentage: number;
  description: string;
  implementation: string;
}

export interface SustainabilityMetrics {
  nodeId: string;
  carbonFootprint: number; // kg CO2/month
  powerConsumption: number; // kWh/month
  region: string;
  recommendations?: string[];
}

// ============================================================================
// AI Copilot Types
// ============================================================================

export interface AIQuery {
  query: string;
  context: {
    currentDiagram: any;
    selectedNodes?: string[];
    intent?: AIIntent;
  };
}

export type AIIntent =
  | 'search'
  | 'analyze'
  | 'recommend'
  | 'generate'
  | 'refactor'
  | 'document'
  | 'security'
  | 'cost';

export interface AIResponse {
  type: 'text' | 'highlight' | 'suggestion' | 'documentation' | 'code';
  content: string;
  highlightedNodes?: string[];
  suggestions?: AISuggestion[];
  confidence?: number;
}

export interface AISuggestion {
  id: string;
  type: 'pattern' | 'refactor' | 'security' | 'performance' | 'cost';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  affectedNodes: string[];
  implementation?: string;
  reasoning?: string;
}

export interface ArchitectureDecisionRecord {
  id: string;
  title: string;
  date: number;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  context: string;
  decision: string;
  consequences: string[];
  alternatives?: string[];
  relatedNodes: string[];
}

export interface DesignPattern {
  name: string;
  category: 'architectural' | 'integration' | 'data' | 'deployment';
  description: string;
  applicability: string;
  benefits: string[];
  drawbacks: string[];
  implementation: string;
}

// ============================================================================
// Infrastructure as Code (IaC) Types
// ============================================================================

export interface IaCConfig {
  provider: 'terraform' | 'kubernetes' | 'cloudformation' | 'pulumi' | 'ansible';
  cloudProvider?: 'aws' | 'gcp' | 'azure';
  language?: 'typescript' | 'python' | 'go' | 'yaml' | 'hcl';
  options?: IaCOptions;
}

export interface IaCOptions {
  modulesEnabled?: boolean;
  bestPractices?: boolean;
  includeNetworking?: boolean;
  includeMonitoring?: boolean;
  includeSecurity?: boolean;
  environment?: 'dev' | 'staging' | 'production';
}

export interface IaCOutput {
  provider: string;
  files: IaCFile[];
  previewUrl?: string;
  estimatedCost?: number;
  resources: IaCResource[];
}

export interface IaCFile {
  path: string;
  content: string;
  language: string;
  description?: string;
}

export interface IaCResource {
  type: string;
  name: string;
  provider: string;
  properties: Record<string, any>;
  dependencies?: string[];
}

export interface TerraformModule {
  name: string;
  source?: string;
  version?: string;
  variables: TerraformVariable[];
  outputs: TerraformOutput[];
  resources: any[];
}

export interface TerraformVariable {
  name: string;
  type: string;
  description?: string;
  default?: any;
  validation?: any;
}

export interface TerraformOutput {
  name: string;
  value: string;
  description?: string;
  sensitive?: boolean;
}

export interface KubernetesManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: any;
}

// ============================================================================
// Integration Store State
// ============================================================================

export interface IntegrationState {
  // Repository & Discovery
  repository?: RepositoryConfig;
  discoveredServices: DiscoveredService[];
  isScanning: boolean;
  scanProgress?: number;

  // Observability
  observability: {
    [nodeId: string]: {
      config?: ObservabilityConfig;
      metrics?: ServiceMetrics;
      alerts?: Alert[];
      traces?: TraceData[];
    };
  };
  liveMode: boolean;

  // Cost & Resources
  cloudResources: {
    [nodeId: string]: CloudResource;
  };
  costEstimates: {
    [nodeId: string]: CostEstimate;
  };
  sustainability: {
    [nodeId: string]: SustainabilityMetrics;
  };

  // AI Copilot
  aiQueries: AIQuery[];
  aiResponses: AIResponse[];
  suggestions: AISuggestion[];
  adrs: ArchitectureDecisionRecord[];

  // IaC
  iacConfigs: {
    [provider: string]: IaCConfig;
  };
  generatedIaC?: IaCOutput;
  isGenerating: boolean;
}

// ============================================================================
// Integration Actions
// ============================================================================

export interface IntegrationActions {
  // Repository Scanning
  connectRepository: (config: RepositoryConfig) => Promise<void>;
  scanRepository: () => Promise<ServiceDiscoveryResult>;
  importDiscoveredServices: (result: ServiceDiscoveryResult) => void;

  // Observability
  connectObservability: (nodeId: string, config: ObservabilityConfig) => Promise<void>;
  fetchMetrics: (nodeId: string) => Promise<ServiceMetrics>;
  fetchTraces: (nodeId: string) => Promise<TraceData[]>;
  fetchAlerts: (nodeId: string) => Promise<Alert[]>;
  toggleLiveMode: (enabled: boolean) => void;

  // Cost Management
  attachCloudResource: (nodeId: string, resource: CloudResource) => void;
  calculateCost: (nodeId: string) => Promise<CostEstimate>;
  calculateTotalCost: () => number;
  getSustainabilityMetrics: (nodeId: string) => Promise<SustainabilityMetrics>;

  // AI Copilot
  queryAI: (query: string, intent?: AIIntent) => Promise<AIResponse>;
  applySuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  generateADR: (change: string) => Promise<ArchitectureDecisionRecord>;
  suggestPatterns: () => Promise<DesignPattern[]>;

  // IaC Generation
  generateTerraform: (options?: IaCOptions) => Promise<IaCOutput>;
  generateKubernetes: (options?: IaCOptions) => Promise<IaCOutput>;
  generateCloudFormation: (options?: IaCOptions) => Promise<IaCOutput>;
  generatePulumi: (language: 'typescript' | 'python', options?: IaCOptions) => Promise<IaCOutput>;
  previewIaC: (output: IaCOutput) => Promise<string>;
  downloadIaC: (output: IaCOutput) => void;
}
