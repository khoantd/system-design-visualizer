/**
 * Observability Service
 * Integrates with Prometheus, Grafana, Datadog, OpenTelemetry, etc.
 */

import type {
  ObservabilityConfig,
  ServiceMetrics,
  TraceData,
  TraceSpan,
  Alert,
} from '../store/integrationTypes';

// ============================================================================
// Base Observability Client
// ============================================================================

export abstract class ObservabilityClient {
  protected config: ObservabilityConfig;

  constructor(config: ObservabilityConfig) {
    this.config = config;
  }

  abstract fetchMetrics(serviceId: string): Promise<ServiceMetrics>;
  abstract fetchTraces(serviceId: string, limit?: number): Promise<TraceData[]>;
  abstract fetchAlerts(serviceId: string): Promise<Alert[]>;
  abstract testConnection(): Promise<boolean>;
}

// ============================================================================
// Prometheus Client
// ============================================================================

export class PrometheusClient extends ObservabilityClient {
  async fetchMetrics(serviceId: string): Promise<ServiceMetrics> {
    try {
      const endpoint = this.config.endpoint;

      // Query Prometheus for various metrics
      // In production, these would be actual PromQL queries
      const metrics = await this.queryPrometheus([
        `rate(http_requests_total{service="${serviceId}"}[5m])`, // RPS
        `histogram_quantile(0.50, http_request_duration_seconds{service="${serviceId}"})`, // p50
        `histogram_quantile(0.95, http_request_duration_seconds{service="${serviceId}"})`, // p95
        `histogram_quantile(0.99, http_request_duration_seconds{service="${serviceId}"})`, // p99
        `rate(http_requests_total{service="${serviceId}",status=~"5.."}[5m])`, // Error rate
        `process_cpu_seconds_total{service="${serviceId}"}`, // CPU
        `process_resident_memory_bytes{service="${serviceId}"}`, // Memory
      ]);

      return {
        serviceId,
        timestamp: Date.now(),
        rps: metrics[0] || this.generateMockRPS(),
        latency: {
          p50: metrics[1] || this.generateMockLatency(50),
          p95: metrics[2] || this.generateMockLatency(95),
          p99: metrics[3] || this.generateMockLatency(99),
        },
        errorRate: metrics[4] || this.generateMockErrorRate(),
        cpu: metrics[5] || this.generateMockCPU(),
        memory: metrics[6] || this.generateMockMemory(),
        availability: this.calculateAvailability(metrics[4]),
      };
    } catch (error) {
      console.error('Failed to fetch Prometheus metrics:', error);
      return this.getMockMetrics(serviceId);
    }
  }

  async fetchTraces(serviceId: string, limit: number = 10): Promise<TraceData[]> {
    // Prometheus doesn't store traces, redirect to Jaeger/Tempo
    console.log('Prometheus does not support tracing. Use OpenTelemetry or Jaeger.');
    return [];
  }

  async fetchAlerts(serviceId: string): Promise<Alert[]> {
    try {
      // Query Prometheus Alertmanager
      const response = await fetch(`${this.config.endpoint}/api/v1/alerts`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      const alerts = data.data.alerts || [];

      return alerts
        .filter((alert: any) => alert.labels.service === serviceId)
        .map((alert: any) => ({
          id: alert.fingerprint,
          service: serviceId,
          severity: this.mapSeverity(alert.labels.severity),
          title: alert.labels.alertname,
          description: alert.annotations.description || '',
          timestamp: new Date(alert.startsAt).getTime(),
          status: alert.status.state === 'active' ? 'firing' : 'resolved',
          source: 'prometheus',
          url: `${this.config.dashboardUrl}/alerts`,
        }));
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return this.getMockAlerts(serviceId);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/v1/status/config`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async queryPrometheus(queries: string[]): Promise<number[]> {
    // Mock implementation - in production, make actual HTTP requests
    return queries.map(() => Math.random() * 100);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  private mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
      case 'warning':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  private calculateAvailability(errorRate: number): number {
    return Math.max(0, 100 - errorRate);
  }

  // Mock data generators
  private generateMockRPS(): number {
    return Math.floor(Math.random() * 1000) + 100;
  }

  private generateMockLatency(percentile: number): number {
    const base = 50;
    const multiplier = percentile === 50 ? 1 : percentile === 95 ? 3 : 5;
    return base * multiplier + Math.random() * 20;
  }

  private generateMockErrorRate(): number {
    return Math.random() * 5; // 0-5%
  }

  private generateMockCPU(): number {
    return Math.random() * 80 + 10; // 10-90%
  }

  private generateMockMemory(): number {
    return Math.floor(Math.random() * 2048) + 512; // 512-2560 MB
  }

  private getMockMetrics(serviceId: string): ServiceMetrics {
    return {
      serviceId,
      timestamp: Date.now(),
      rps: this.generateMockRPS(),
      latency: {
        p50: this.generateMockLatency(50),
        p95: this.generateMockLatency(95),
        p99: this.generateMockLatency(99),
      },
      errorRate: this.generateMockErrorRate(),
      cpu: this.generateMockCPU(),
      memory: this.generateMockMemory(),
      availability: 99.5,
    };
  }

  private getMockAlerts(serviceId: string): Alert[] {
    return [
      {
        id: '1',
        service: serviceId,
        severity: 'high',
        title: 'High Error Rate',
        description: 'Error rate exceeded 5% threshold',
        timestamp: Date.now() - 600000, // 10 minutes ago
        status: 'firing',
        source: 'prometheus',
      },
    ];
  }
}

// ============================================================================
// OpenTelemetry Client
// ============================================================================

export class OpenTelemetryClient extends ObservabilityClient {
  async fetchMetrics(serviceId: string): Promise<ServiceMetrics> {
    // Similar to Prometheus but uses OTLP protocol
    return new PrometheusClient(this.config).fetchMetrics(serviceId);
  }

  async fetchTraces(serviceId: string, limit: number = 10): Promise<TraceData[]> {
    try {
      // Mock trace data
      return [
        {
          traceId: 'trace-001',
          spans: [
            {
              spanId: 'span-001',
              service: serviceId,
              operation: 'GET /api/users',
              startTime: Date.now() - 5000,
              duration: 150,
              tags: {
                'http.method': 'GET',
                'http.url': '/api/users',
                'http.status_code': '200',
              },
              logs: [
                {
                  timestamp: Date.now() - 4900,
                  message: 'Database query executed',
                  level: 'info',
                },
              ],
            },
            {
              spanId: 'span-002',
              parentSpanId: 'span-001',
              service: 'postgres-db',
              operation: 'SELECT users',
              startTime: Date.now() - 4900,
              duration: 45,
              tags: {
                'db.type': 'postgresql',
                'db.statement': 'SELECT * FROM users LIMIT 100',
              },
            },
            {
              spanId: 'span-003',
              parentSpanId: 'span-001',
              service: 'redis-cache',
              operation: 'GET user:cache',
              startTime: Date.now() - 4850,
              duration: 5,
              tags: {
                'cache.hit': 'true',
                'cache.key': 'user:123',
              },
            },
          ],
          duration: 150,
          services: [serviceId, 'postgres-db', 'redis-cache'],
          timestamp: Date.now() - 5000,
        },
      ];
    } catch (error) {
      console.error('Failed to fetch traces:', error);
      return [];
    }
  }

  async fetchAlerts(serviceId: string): Promise<Alert[]> {
    return [];
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}

// ============================================================================
// Datadog Client
// ============================================================================

export class DatadogClient extends ObservabilityClient {
  async fetchMetrics(serviceId: string): Promise<ServiceMetrics> {
    try {
      // Datadog API endpoint
      const apiKey = this.config.apiKey;
      if (!apiKey) {
        throw new Error('Datadog API key required');
      }

      // Mock implementation - in production, use Datadog API
      return {
        serviceId,
        timestamp: Date.now(),
        rps: Math.floor(Math.random() * 1000) + 100,
        latency: {
          p50: Math.random() * 50 + 20,
          p95: Math.random() * 150 + 80,
          p99: Math.random() * 300 + 150,
        },
        errorRate: Math.random() * 5,
        cpu: Math.random() * 80 + 10,
        memory: Math.floor(Math.random() * 2048) + 512,
        availability: 99.9,
      };
    } catch (error) {
      console.error('Failed to fetch Datadog metrics:', error);
      throw error;
    }
  }

  async fetchTraces(serviceId: string, limit: number = 10): Promise<TraceData[]> {
    // Use Datadog APM API
    return [];
  }

  async fetchAlerts(serviceId: string): Promise<Alert[]> {
    // Use Datadog Monitors API
    return [];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.datadoghq.com/api/v1/validate', {
        headers: {
          'DD-API-KEY': this.config.apiKey || '',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Factory for Creating Observability Clients
// ============================================================================

export class ObservabilityFactory {
  static createClient(config: ObservabilityConfig): ObservabilityClient {
    switch (config.provider) {
      case 'prometheus':
      case 'grafana':
        return new PrometheusClient(config);
      case 'otel':
        return new OpenTelemetryClient(config);
      case 'datadog':
        return new DatadogClient(config);
      default:
        throw new Error(`Unsupported observability provider: ${config.provider}`);
    }
  }
}

// ============================================================================
// Live Metrics Stream (WebSocket/SSE)
// ============================================================================

export class LiveMetricsStream {
  private connections: Map<string, WebSocket | EventSource> = new Map();

  connect(serviceId: string, config: ObservabilityConfig, callback: (metrics: ServiceMetrics) => void) {
    // In production, establish WebSocket/SSE connection
    console.log(`Connecting to live metrics for ${serviceId}...`);

    // Simulate live updates with polling
    const intervalId = setInterval(async () => {
      const client = ObservabilityFactory.createClient(config);
      const metrics = await client.fetchMetrics(serviceId);
      callback(metrics);
    }, 5000); // Update every 5 seconds

    // Store reference for cleanup
    this.connections.set(serviceId, intervalId as any);
  }

  disconnect(serviceId: string) {
    const connection = this.connections.get(serviceId);
    if (connection) {
      if (typeof connection === 'number') {
        clearInterval(connection);
      } else {
        connection.close();
      }
      this.connections.delete(serviceId);
    }
  }

  disconnectAll() {
    for (const [serviceId] of this.connections) {
      this.disconnect(serviceId);
    }
  }
}

// ============================================================================
// Metrics Aggregation & Analysis
// ============================================================================

export class MetricsAnalyzer {
  /**
   * Calculate aggregated metrics across all services
   */
  static aggregateMetrics(metricsMap: Record<string, ServiceMetrics>): {
    totalRPS: number;
    avgLatency: number;
    avgErrorRate: number;
    avgCPU: number;
    totalMemory: number;
    servicesCount: number;
  } {
    const metrics = Object.values(metricsMap);
    const count = metrics.length;

    if (count === 0) {
      return {
        totalRPS: 0,
        avgLatency: 0,
        avgErrorRate: 0,
        avgCPU: 0,
        totalMemory: 0,
        servicesCount: 0,
      };
    }

    return {
      totalRPS: metrics.reduce((sum, m) => sum + m.rps, 0),
      avgLatency: metrics.reduce((sum, m) => sum + m.latency.p50, 0) / count,
      avgErrorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / count,
      avgCPU: metrics.reduce((sum, m) => sum + m.cpu, 0) / count,
      totalMemory: metrics.reduce((sum, m) => sum + m.memory, 0),
      servicesCount: count,
    };
  }

  /**
   * Detect anomalies in metrics
   */
  static detectAnomalies(metrics: ServiceMetrics, baseline: ServiceMetrics): string[] {
    const anomalies: string[] = [];

    // Check for high error rate
    if (metrics.errorRate > baseline.errorRate * 2) {
      anomalies.push(`Error rate ${metrics.errorRate.toFixed(2)}% is 2x higher than baseline`);
    }

    // Check for high latency
    if (metrics.latency.p99 > baseline.latency.p99 * 1.5) {
      anomalies.push(`P99 latency ${metrics.latency.p99.toFixed(0)}ms is 1.5x higher than baseline`);
    }

    // Check for high CPU
    if (metrics.cpu > 80) {
      anomalies.push(`CPU usage ${metrics.cpu.toFixed(1)}% is critically high`);
    }

    // Check for high memory
    if (metrics.memory > 2048) {
      anomalies.push(`Memory usage ${metrics.memory}MB is very high`);
    }

    return anomalies;
  }

  /**
   * Calculate SLA compliance
   */
  static calculateSLA(metrics: ServiceMetrics, slaTargets: {
    availabilityTarget: number; // e.g., 99.9%
    latencyTarget: number; // e.g., 200ms p99
    errorRateTarget: number; // e.g., 1%
  }): {
    compliant: boolean;
    availability: boolean;
    latency: boolean;
    errorRate: boolean;
  } {
    return {
      compliant:
        metrics.availability >= slaTargets.availabilityTarget &&
        metrics.latency.p99 <= slaTargets.latencyTarget &&
        metrics.errorRate <= slaTargets.errorRateTarget,
      availability: metrics.availability >= slaTargets.availabilityTarget,
      latency: metrics.latency.p99 <= slaTargets.latencyTarget,
      errorRate: metrics.errorRate <= slaTargets.errorRateTarget,
    };
  }
}
