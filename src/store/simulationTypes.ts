/**
 * Type definitions for Phase 1: Real-time & Active Visualization
 * Covers: Simulation, failure cascades, telemetry, validation
 */

// ============================================================================
// Digital Twin & Health State Types
// ============================================================================

export type NodeHealth = 'healthy' | 'degraded' | 'down' | 'recovering';
export type ServiceStatus = 'running' | 'starting' | 'stopping' | 'stopped' | 'failed';

export interface HealthState {
  health: number; // 0-100
  status: NodeHealth;
  lastChecked: number; // timestamp
  incidents: Incident[];
  sla: SLAMetrics;
}

export interface Incident {
  id: string;
  nodeId: string;
  type: 'failure' | 'degradation' | 'recovery';
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  resolved: boolean;
  resolvedAt?: number;
}

export interface SLAMetrics {
  availabilityTarget: number; // e.g., 99.9
  availabilityActual: number;
  latencyTarget: number; // ms
  latencyActual: number;
  errorRateTarget: number; // percentage
  errorRateActual: number;
  compliant: boolean;
}

// ============================================================================
// Simulation Engine Types
// ============================================================================

export interface SimulationConfig {
  speed: number; // 1x, 2x, 5x, 10x
  autoRecovery: boolean;
  autoRecoveryDelay: number; // seconds
  cascadeEnabled: boolean;
  telemetryEnabled: boolean;
  randomFailures: boolean;
  randomFailureInterval: number; // seconds
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number; // simulation time in ms
  startTime: number;
  config: SimulationConfig;
  scenarios: SimulationScenario[];
  activeScenario?: string;
  events: SimulationEvent[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  actions: SimulationAction[];
}

export interface SimulationAction {
  id: string;
  time: number; // seconds from start
  type: 'fail' | 'degrade' | 'recover' | 'spike' | 'stress';
  target: string; // node id
  params?: {
    degradationLevel?: number; // 0-100
    duration?: number; // seconds
    trafficMultiplier?: number;
  };
}

export interface SimulationEvent {
  id: string;
  timestamp: number;
  type: 'node_failed' | 'node_degraded' | 'node_recovered' | 'cascade_started' | 'sla_violated' | 'traffic_spike';
  nodeId: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, any>;
}

// ============================================================================
// Failure Cascade Types
// ============================================================================

export interface DependencyWeight {
  source: string;
  target: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  timeout: number; // ms
  retryPolicy: RetryPolicy;
  circuitBreaker?: CircuitBreakerConfig;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffTime: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number; // number of failures before opening
  timeout: number; // ms to wait before half-open
  halfOpenRequests: number; // requests to test in half-open state
}

export interface CircuitBreakerState {
  edgeId: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

export interface CascadeEffect {
  sourceNodeId: string;
  affectedNodeIds: string[];
  depth: number;
  totalImpact: number; // percentage of system affected
  propagationPath: string[][]; // array of paths
}

export interface BlastRadius {
  epicenter: string;
  radius: number; // depth of cascade
  affectedNodes: string[];
  affectedConnections: string[];
  criticalPath: string[]; // most critical path
  estimatedDowntime: number; // minutes
  servicesImpacted: number;
}

// ============================================================================
// Telemetry Types
// ============================================================================

export interface MockTelemetry {
  nodeId: string;
  timestamp: number;
  rps: number; // requests per second
  latency: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  errorRate: number; // percentage
  cpu: number; // percentage
  memory: number; // MB
  connections: {
    active: number;
    idle: number;
    failed: number;
  };
  traffic: {
    inbound: number; // MB/s
    outbound: number; // MB/s
  };
}

export interface TrafficPattern {
  nodeId: string;
  pattern: 'constant' | 'sine' | 'spike' | 'random' | 'burst';
  baseRPS: number;
  amplitude?: number;
  frequency?: number; // for sine wave
  spikeProbability?: number; // for random spikes
}

// ============================================================================
// Architecture Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationIssue {
  id: string;
  type: 'circular_dependency' | 'spof' | 'anti_pattern' | 'security' | 'performance' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedNodes: string[];
  affectedEdges: string[];
  recommendation: string;
  autoFixable: boolean;
}

export interface ValidationWarning {
  id: string;
  type: string;
  message: string;
  affectedNodes: string[];
}

export interface ValidationSuggestion {
  id: string;
  category: 'reliability' | 'performance' | 'security' | 'cost' | 'scalability';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  implementation: string;
}

export interface AntiPattern {
  name: string;
  description: string;
  detection: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediation: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  standard: 'SOC2' | 'HIPAA' | 'PCI-DSS' | 'GDPR' | 'custom';
  description: string;
  check: (diagram: any) => boolean;
  remediation: string;
}

// ============================================================================
// SLA & Monitoring Types
// ============================================================================

export interface SLADefinition {
  nodeId: string;
  name: string;
  targets: {
    availability: number; // percentage
    latencyP99: number; // ms
    errorRate: number; // percentage
  };
  timeWindow: number; // minutes
  violations: SLAViolation[];
}

export interface SLAViolation {
  id: string;
  slaId: string;
  nodeId: string;
  metric: 'availability' | 'latency' | 'errorRate';
  target: number;
  actual: number;
  timestamp: number;
  duration: number; // ms
  resolved: boolean;
}

export interface BottleneckAnalysis {
  nodeId: string;
  type: 'cpu' | 'memory' | 'network' | 'database' | 'queue';
  severity: number; // 0-100
  impact: string[];
  cause: string;
  recommendation: string;
}

// ============================================================================
// Recovery Strategy Types
// ============================================================================

export interface RecoveryStrategy {
  nodeId: string;
  type: 'auto' | 'manual' | 'failover' | 'circuit_breaker';
  enabled: boolean;
  delay: number; // seconds before recovery starts
  steps: RecoveryStep[];
  successRate: number; // percentage
}

export interface RecoveryStep {
  order: number;
  action: 'restart' | 'failover' | 'scale_up' | 'clear_cache' | 'drain_traffic';
  params?: Record<string, any>;
  duration: number; // expected duration in seconds
}

export interface FailoverTarget {
  primaryNodeId: string;
  failoverNodeId: string;
  automatic: boolean;
  healthCheckInterval: number; // seconds
  failoverThreshold: number; // number of failed checks
}

// ============================================================================
// Simulation Store State
// ============================================================================

export interface SimulationStoreState {
  // Simulation state
  simulation: SimulationState;

  // Health states for all nodes
  healthStates: {
    [nodeId: string]: HealthState;
  };

  // Telemetry data
  telemetry: {
    [nodeId: string]: MockTelemetry[];
  };

  // Dependency weights
  dependencyWeights: {
    [edgeId: string]: DependencyWeight;
  };

  // Circuit breakers
  circuitBreakers: {
    [edgeId: string]: CircuitBreakerState;
  };

  // SLA definitions
  slas: {
    [nodeId: string]: SLADefinition;
  };

  // Recovery strategies
  recoveryStrategies: {
    [nodeId: string]: RecoveryStrategy;
  };

  // Validation results
  validation?: ValidationResult;

  // Blast radius cache
  blastRadiusCache: {
    [nodeId: string]: BlastRadius;
  };
}

// ============================================================================
// Simulation Actions
// ============================================================================

export interface SimulationActions {
  // Simulation control
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;

  // Node control
  failNode: (nodeId: string, duration?: number) => void;
  degradeNode: (nodeId: string, level: number, duration?: number) => void;
  recoverNode: (nodeId: string) => void;

  // Scenario management
  loadScenario: (scenario: SimulationScenario) => void;
  createScenario: (name: string, description: string) => string;
  addActionToScenario: (scenarioId: string, action: SimulationAction) => void;

  // Cascade simulation
  simulateCascade: (epicenter: string) => CascadeEffect;
  calculateBlastRadius: (nodeId: string) => BlastRadius;

  // Telemetry
  updateTelemetry: (nodeId: string, data: MockTelemetry) => void;
  generateMockTelemetry: (nodeId: string) => MockTelemetry;

  // Validation
  validateArchitecture: () => ValidationResult;
  detectCircularDependencies: () => string[][];
  detectSinglePointsOfFailure: () => string[];
  detectAntiPatterns: () => AntiPattern[];

  // SLA management
  defineSLA: (nodeId: string, definition: SLADefinition) => void;
  checkSLACompliance: (nodeId: string) => boolean;

  // Recovery
  setRecoveryStrategy: (nodeId: string, strategy: RecoveryStrategy) => void;
  triggerRecovery: (nodeId: string) => void;
}
