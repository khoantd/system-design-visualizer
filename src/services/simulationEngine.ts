/**
 * Digital Twin Simulation Engine
 * Simulates failures, cascades, and recovery in real-time
 */

import { nanoid } from 'nanoid';
import type {
  HealthState,
  NodeHealth,
  SimulationEvent,
  Incident,
  MockTelemetry,
  CascadeEffect,
  BlastRadius,
  DependencyWeight,
  CircuitBreakerState,
  SLAMetrics,
  BottleneckAnalysis,
} from '../store/simulationTypes';
import type { Diagram, DiagramNode, DiagramEdge } from '../store/types';

// ============================================================================
// Digital Twin Simulation Engine
// ============================================================================

export class SimulationEngine {
  private diagram: Diagram;
  private healthStates: Map<string, HealthState> = new Map();
  private telemetryData: Map<string, MockTelemetry[]> = new Map();
  private events: SimulationEvent[] = [];
  private isRunning: boolean = false;
  private simulationTime: number = 0;
  private intervalId?: NodeJS.Timeout;

  constructor(diagram: Diagram) {
    this.diagram = diagram;
    this.initializeHealthStates();
  }

  // ========================================================================
  // Initialization
  // ========================================================================

  private initializeHealthStates() {
    for (const node of this.diagram.nodes) {
      this.healthStates.set(node.id, {
        health: 100,
        status: 'healthy',
        lastChecked: Date.now(),
        incidents: [],
        sla: {
          availabilityTarget: 99.9,
          availabilityActual: 100,
          latencyTarget: 200,
          latencyActual: 50,
          errorRateTarget: 1,
          errorRateActual: 0.1,
          compliant: true,
        },
      });

      this.telemetryData.set(node.id, []);
    }
  }

  // ========================================================================
  // Simulation Control
  // ========================================================================

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.simulationTime = Date.now();

    // Run simulation loop at 1 second intervals
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.logEvent('info', 'simulation', 'Simulation started', 'Simulation');
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    this.logEvent('info', 'simulation', 'Simulation paused', 'Simulation');
  }

  stop() {
    this.pause();
    this.reset();
    this.logEvent('info', 'simulation', 'Simulation stopped', 'Simulation');
  }

  reset() {
    this.simulationTime = 0;
    this.events = [];
    this.initializeHealthStates();
  }

  private tick() {
    this.simulationTime += 1000;

    // Update telemetry for all nodes
    for (const node of this.diagram.nodes) {
      const telemetry = this.generateTelemetry(node.id);
      this.updateTelemetry(node.id, telemetry);
    }

    // Check for cascade effects
    this.checkCascades();

    // Auto-recovery
    this.processAutoRecovery();

    // Check SLA compliance
    this.checkSLACompliance();
  }

  // ========================================================================
  // Node Failure & Recovery
  // ========================================================================

  failNode(nodeId: string, duration?: number) {
    const healthState = this.healthStates.get(nodeId);
    if (!healthState) return;

    healthState.health = 0;
    healthState.status = 'down';
    healthState.lastChecked = Date.now();

    const incident: Incident = {
      id: nanoid(),
      nodeId,
      type: 'failure',
      timestamp: Date.now(),
      severity: 'critical',
      message: 'Node failed',
      resolved: false,
    };

    healthState.incidents.push(incident);

    this.logEvent('error', nodeId, `Node ${nodeId} failed`, 'node_failed');

    // Auto-recovery after duration
    if (duration && duration > 0) {
      setTimeout(() => {
        this.recoverNode(nodeId);
      }, duration * 1000);
    }

    // Trigger cascade
    this.propagateFailure(nodeId);
  }

  degradeNode(nodeId: string, level: number, duration?: number) {
    const healthState = this.healthStates.get(nodeId);
    if (!healthState) return;

    healthState.health = Math.max(0, Math.min(100, level));
    healthState.status = level < 50 ? 'degraded' : 'healthy';
    healthState.lastChecked = Date.now();

    const incident: Incident = {
      id: nanoid(),
      nodeId,
      type: 'degradation',
      timestamp: Date.now(),
      severity: level < 30 ? 'high' : 'medium',
      message: `Node degraded to ${level}% health`,
      resolved: false,
    };

    healthState.incidents.push(incident);

    this.logEvent('warning', nodeId, `Node ${nodeId} degraded to ${level}%`, 'node_degraded');

    if (duration && duration > 0) {
      setTimeout(() => {
        this.recoverNode(nodeId);
      }, duration * 1000);
    }
  }

  recoverNode(nodeId: string) {
    const healthState = this.healthStates.get(nodeId);
    if (!healthState) return;

    healthState.health = 100;
    healthState.status = 'healthy';
    healthState.lastChecked = Date.now();

    // Mark incidents as resolved
    for (const incident of healthState.incidents) {
      if (!incident.resolved) {
        incident.resolved = true;
        incident.resolvedAt = Date.now();
      }
    }

    this.logEvent('info', nodeId, `Node ${nodeId} recovered`, 'node_recovered');
  }

  // ========================================================================
  // Failure Cascade
  // ========================================================================

  private propagateFailure(failedNodeId: string) {
    const healthState = this.healthStates.get(failedNodeId);
    if (!healthState || healthState.health > 0) return;

    // Find all nodes that depend on this failed node
    const dependentEdges = this.diagram.edges.filter((e) => e.source === failedNodeId);

    for (const edge of dependentEdges) {
      const targetHealth = this.healthStates.get(edge.target);
      if (!targetHealth) continue;

      // Get dependency weight (criticality)
      const criticality = this.getDependencyCriticality(edge);

      // Calculate health impact based on criticality
      let healthImpact = 0;
      switch (criticality) {
        case 'critical':
          healthImpact = 100; // Complete failure
          break;
        case 'high':
          healthImpact = 70;
          break;
        case 'medium':
          healthImpact = 40;
          break;
        case 'low':
          healthImpact = 20;
          break;
      }

      // Apply impact
      const newHealth = Math.max(0, targetHealth.health - healthImpact);

      if (newHealth < targetHealth.health) {
        targetHealth.health = newHealth;
        targetHealth.status = newHealth === 0 ? 'down' : newHealth < 50 ? 'degraded' : 'healthy';
        targetHealth.lastChecked = Date.now();

        this.logEvent(
          newHealth === 0 ? 'error' : 'warning',
          edge.target,
          `Node ${edge.target} affected by failure of ${failedNodeId}. Health: ${newHealth}%`,
          'cascade_started'
        );

        // Continue cascade if node failed
        if (newHealth === 0) {
          this.propagateFailure(edge.target);
        }
      }
    }
  }

  private checkCascades() {
    // Check for cascade effects every tick
    for (const node of this.diagram.nodes) {
      const health = this.healthStates.get(node.id);
      if (health && health.health === 0) {
        // Node is down, check if it should affect others
        this.propagateFailure(node.id);
      }
    }
  }

  private getDependencyCriticality(edge: DiagramEdge): 'critical' | 'high' | 'medium' | 'low' {
    // Check edge data for criticality
    if (edge.data?.criticality) {
      return edge.data.criticality;
    }

    // Default based on edge type
    if (edge.data?.type === 'database') return 'critical';
    if (edge.data?.type === 'cache') return 'medium';
    if (edge.data?.type === 'queue') return 'low';

    return 'medium';
  }

  // ========================================================================
  // Blast Radius Calculation
  // ========================================================================

  calculateBlastRadius(epicenterId: string): BlastRadius {
    const affected = new Set<string>();
    const affectedConnections = new Set<string>();
    const paths: string[][] = [];

    // BFS to find all affected nodes
    const queue: Array<{ nodeId: string; depth: number; path: string[] }> = [
      { nodeId: epicenterId, depth: 0, path: [epicenterId] },
    ];

    let maxDepth = 0;

    while (queue.length > 0) {
      const { nodeId, depth, path } = queue.shift()!;

      if (affected.has(nodeId) && nodeId !== epicenterId) continue;

      affected.add(nodeId);
      maxDepth = Math.max(maxDepth, depth);

      // Find dependent nodes
      const dependentEdges = this.diagram.edges.filter((e) => e.source === nodeId);

      for (const edge of dependentEdges) {
        affectedConnections.add(edge.id);

        const criticality = this.getDependencyCriticality(edge);

        // Only propagate for high/critical dependencies
        if (criticality === 'critical' || criticality === 'high') {
          const newPath = [...path, edge.target];
          paths.push(newPath);
          queue.push({
            nodeId: edge.target,
            depth: depth + 1,
            path: newPath,
          });
        }
      }
    }

    // Find most critical path (longest path with highest criticality)
    const criticalPath = paths.reduce((longest, current) => {
      return current.length > longest.length ? current : longest;
    }, [] as string[]);

    return {
      epicenter: epicenterId,
      radius: maxDepth,
      affectedNodes: Array.from(affected),
      affectedConnections: Array.from(affectedConnections),
      criticalPath,
      estimatedDowntime: maxDepth * 5, // 5 minutes per hop
      servicesImpacted: affected.size,
    };
  }

  // ========================================================================
  // Telemetry Generation
  // ========================================================================

  private generateTelemetry(nodeId: string): MockTelemetry {
    const healthState = this.healthStates.get(nodeId);
    const health = healthState?.health || 100;
    const status = healthState?.status || 'healthy';

    // Base values
    let baseRPS = 100 + Math.random() * 100;
    let baseLatency = 50 + Math.random() * 50;
    let baseErrorRate = 0.1 + Math.random() * 0.4;
    let baseCPU = 30 + Math.random() * 30;
    let baseMemory = 512 + Math.random() * 512;

    // Adjust based on health
    const healthFactor = health / 100;

    if (status === 'down') {
      baseRPS = 0;
      baseLatency = 0;
      baseErrorRate = 100;
      baseCPU = 0;
    } else if (status === 'degraded') {
      baseRPS *= healthFactor;
      baseLatency *= 2 - healthFactor; // Higher latency when degraded
      baseErrorRate *= 2 - healthFactor; // More errors when degraded
      baseCPU *= 1.5; // Higher CPU usage
    }

    return {
      nodeId,
      timestamp: Date.now(),
      rps: Math.round(baseRPS),
      latency: {
        p50: Math.round(baseLatency),
        p95: Math.round(baseLatency * 1.5),
        p99: Math.round(baseLatency * 2),
        avg: Math.round(baseLatency * 1.2),
      },
      errorRate: parseFloat(baseErrorRate.toFixed(2)),
      cpu: Math.round(baseCPU),
      memory: Math.round(baseMemory),
      connections: {
        active: Math.round(baseRPS / 10),
        idle: Math.round(baseRPS / 20),
        failed: Math.round((baseErrorRate / 100) * baseRPS),
      },
      traffic: {
        inbound: parseFloat((baseRPS * 0.001).toFixed(3)),
        outbound: parseFloat((baseRPS * 0.0008).toFixed(3)),
      },
    };
  }

  private updateTelemetry(nodeId: string, data: MockTelemetry) {
    const history = this.telemetryData.get(nodeId) || [];
    history.push(data);

    // Keep only last 100 data points
    if (history.length > 100) {
      history.shift();
    }

    this.telemetryData.set(nodeId, history);
  }

  // ========================================================================
  // SLA Monitoring
  // ========================================================================

  private checkSLACompliance() {
    for (const node of this.diagram.nodes) {
      const healthState = this.healthStates.get(node.id);
      if (!healthState) continue;

      const telemetry = this.telemetryData.get(node.id);
      if (!telemetry || telemetry.length === 0) continue;

      const latestTelemetry = telemetry[telemetry.length - 1];

      // Check availability
      const availabilityActual = healthState.health;
      healthState.sla.availabilityActual = availabilityActual;

      // Check latency
      healthState.sla.latencyActual = latestTelemetry.latency.p99;

      // Check error rate
      healthState.sla.errorRateActual = latestTelemetry.errorRate;

      // Determine compliance
      const compliant =
        availabilityActual >= healthState.sla.availabilityTarget &&
        latestTelemetry.latency.p99 <= healthState.sla.latencyTarget &&
        latestTelemetry.errorRate <= healthState.sla.errorRateTarget;

      if (!compliant && healthState.sla.compliant) {
        // SLA violation just occurred
        this.logEvent('error', node.id, `SLA violation detected for ${node.id}`, 'sla_violated');
      }

      healthState.sla.compliant = compliant;
    }
  }

  // ========================================================================
  // Auto-Recovery
  // ========================================================================

  private processAutoRecovery() {
    for (const node of this.diagram.nodes) {
      const healthState = this.healthStates.get(node.id);
      if (!healthState) continue;

      // Check if node has been down for more than 30 seconds
      const downTime = Date.now() - healthState.lastChecked;
      if (healthState.health === 0 && downTime > 30000) {
        // Attempt recovery
        const recoverySuccess = Math.random() > 0.3; // 70% success rate

        if (recoverySuccess) {
          this.recoverNode(node.id);
          this.logEvent('info', node.id, `Auto-recovery successful for ${node.id}`, 'node_recovered');
        }
      }
    }
  }

  // ========================================================================
  // Event Logging
  // ========================================================================

  private logEvent(
    severity: 'info' | 'warning' | 'error' | 'critical',
    nodeId: string,
    message: string,
    type: SimulationEvent['type']
  ) {
    const event: SimulationEvent = {
      id: nanoid(),
      timestamp: Date.now(),
      type,
      nodeId,
      message,
      severity,
    };

    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  // ========================================================================
  // Getters
  // ========================================================================

  getHealthState(nodeId: string): HealthState | undefined {
    return this.healthStates.get(nodeId);
  }

  getAllHealthStates(): Map<string, HealthState> {
    return this.healthStates;
  }

  getTelemetry(nodeId: string): MockTelemetry[] {
    return this.telemetryData.get(nodeId) || [];
  }

  getEvents(): SimulationEvent[] {
    return this.events;
  }

  getRecentEvents(count: number = 10): SimulationEvent[] {
    return this.events.slice(-count);
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// ============================================================================
// Export singleton instance factory
// ============================================================================

let engineInstance: SimulationEngine | null = null;

export function createSimulationEngine(diagram: Diagram): SimulationEngine {
  engineInstance = new SimulationEngine(diagram);
  return engineInstance;
}

export function getSimulationEngine(): SimulationEngine | null {
  return engineInstance;
}
