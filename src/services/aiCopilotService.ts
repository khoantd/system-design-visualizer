/**
 * AI-Powered Architectural Copilot Service
 * Natural language queries, pattern suggestions, ADR generation, security review
 */

import type {
  AIQuery,
  AIResponse,
  AISuggestion,
  ArchitectureDecisionRecord,
  DesignPattern,
  AIIntent,
} from '../store/integrationTypes';
import type { Diagram, DiagramNode } from '../store/types';

// ============================================================================
// AI Copilot Main Class
// ============================================================================

export class AIArchitecturalCopilot {
  private apiKey?: string;
  private model: string = 'gpt-4';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * Process natural language query about the architecture
   */
  async query(query: AIQuery): Promise<AIResponse> {
    const { query: userQuery, context, intent } = query;

    // Detect intent if not provided
    const detectedIntent = intent || this.detectIntent(userQuery);

    switch (detectedIntent) {
      case 'search':
        return await this.handleSearch(userQuery, context.currentDiagram);
      case 'analyze':
        return await this.handleAnalysis(userQuery, context.currentDiagram);
      case 'recommend':
        return await this.handleRecommendation(userQuery, context.currentDiagram);
      case 'security':
        return await this.handleSecurityReview(context.currentDiagram);
      case 'cost':
        return await this.handleCostAnalysis(context.currentDiagram);
      case 'document':
        return await this.handleDocumentation(userQuery, context.currentDiagram);
      default:
        return await this.handleGeneral(userQuery, context.currentDiagram);
    }
  }

  /**
   * Detect user intent from query
   */
  private detectIntent(query: string): AIIntent {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('find') || lowerQuery.includes('show') || lowerQuery.includes('where')) {
      return 'search';
    }
    if (lowerQuery.includes('analyze') || lowerQuery.includes('explain') || lowerQuery.includes('why')) {
      return 'analyze';
    }
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('improve')) {
      return 'recommend';
    }
    if (lowerQuery.includes('security') || lowerQuery.includes('vulnerable') || lowerQuery.includes('exposed')) {
      return 'security';
    }
    if (lowerQuery.includes('cost') || lowerQuery.includes('expensive') || lowerQuery.includes('optimize')) {
      return 'cost';
    }
    if (lowerQuery.includes('document') || lowerQuery.includes('describe') || lowerQuery.includes('explain')) {
      return 'document';
    }

    return 'search';
  }

  /**
   * Handle search queries (e.g., "Show me all services that touch PII data")
   */
  private async handleSearch(query: string, diagram: Diagram): Promise<AIResponse> {
    const highlightedNodes: string[] = [];

    // Simple keyword matching (in production, use AI/NLP)
    const keywords = query.toLowerCase().split(' ');

    for (const node of diagram.nodes) {
      const nodeText = `${node.data.label} ${node.data.description} ${node.data.tech}`.toLowerCase();

      // Check if any keywords match
      for (const keyword of keywords) {
        if (keyword.length > 3 && nodeText.includes(keyword)) {
          highlightedNodes.push(node.id);
          break;
        }
      }
    }

    return {
      type: 'highlight',
      content: `Found ${highlightedNodes.length} services matching your query.`,
      highlightedNodes,
      confidence: 0.7,
    };
  }

  /**
   * Handle analysis queries
   */
  private async handleAnalysis(query: string, diagram: Diagram): Promise<AIResponse> {
    const analysis = this.analyzeArchitecture(diagram);

    return {
      type: 'text',
      content: `**Architecture Analysis:**

**Complexity:** ${analysis.complexity}
**Services:** ${analysis.serviceCount}
**Dependencies:** ${analysis.dependencyCount}
**Potential Issues:** ${analysis.issues.length}

${analysis.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

**Recommendations:**
${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
`,
      confidence: 0.85,
    };
  }

  /**
   * Handle recommendation queries
   */
  private async handleRecommendation(query: string, diagram: Diagram): Promise<AIResponse> {
    const suggestions = await this.generateSuggestions(diagram);

    return {
      type: 'suggestion',
      content: `I found ${suggestions.length} recommendations for your architecture:`,
      suggestions,
      confidence: 0.8,
    };
  }

  /**
   * Handle security review
   */
  private async handleSecurityReview(diagram: Diagram): Promise<AIResponse> {
    const securityIssues: AISuggestion[] = [];

    // Check for exposed databases
    const databases = diagram.nodes.filter((n) => n.type === 'databaseNode');
    const exposedDBs = databases.filter((db) => {
      // Check if database has direct connection from internet-facing services
      const incomingEdges = diagram.edges.filter((e) => e.target === db.id);
      return incomingEdges.some((edge) => {
        const source = diagram.nodes.find((n) => n.id === edge.source);
        return source?.type === 'loadBalancerNode';
      });
    });

    if (exposedDBs.length > 0) {
      securityIssues.push({
        id: 'sec-001',
        type: 'security',
        title: 'Database directly exposed to internet',
        description: `${exposedDBs.length} database(s) appear to be directly accessible from internet-facing services. This is a security risk.`,
        impact: 'high',
        effort: 'medium',
        affectedNodes: exposedDBs.map((db) => db.id),
        implementation: 'Add an application layer between the load balancer and database. Never expose databases directly.',
        reasoning: 'Direct database exposure increases attack surface and makes it easier for attackers to exploit SQL injection or brute-force attacks.',
      });
    }

    // Check for missing TLS/encryption
    const unencryptedConnections = diagram.edges.filter(
      (e) => !e.data?.encrypted && !e.label?.toLowerCase().includes('tls')
    );

    if (unencryptedConnections.length > 0) {
      securityIssues.push({
        id: 'sec-002',
        type: 'security',
        title: 'Unencrypted connections detected',
        description: `${unencryptedConnections.length} connection(s) appear to lack TLS encryption.`,
        impact: 'high',
        effort: 'low',
        affectedNodes: unencryptedConnections.flatMap((e) => [e.source, e.target]),
        implementation: 'Enable TLS 1.3 for all connections. Use SSL certificates from a trusted CA.',
        reasoning: 'Unencrypted traffic can be intercepted and read by attackers (man-in-the-middle attacks).',
      });
    }

    return {
      type: 'suggestion',
      content: `**Security Review Complete**\n\nFound ${securityIssues.length} security issue(s):`,
      suggestions: securityIssues,
      confidence: 0.9,
    };
  }

  /**
   * Handle cost analysis
   */
  private async handleCostAnalysis(diagram: Diagram): Promise<AIResponse> {
    // Simplified cost analysis
    const nodeCount = diagram.nodes.length;
    const estimatedMonthlyCost = nodeCount * 50; // $50 per service (rough estimate)

    return {
      type: 'text',
      content: `**Cost Analysis:**

**Services:** ${nodeCount}
**Estimated Monthly Cost:** $${estimatedMonthlyCost}

**Cost Optimization Opportunities:**
1. Consider serverless functions for intermittent workloads (potential 40-60% savings)
2. Use reserved instances for steady-state services (33% savings)
3. Implement auto-scaling to reduce over-provisioning
4. Use managed services to reduce operational overhead

**Breakdown by Service:**
${diagram.nodes.map((n, i) => `${i + 1}. ${n.data.label}: ~$50/month`).join('\n')}
`,
      confidence: 0.7,
    };
  }

  /**
   * Handle documentation generation
   */
  private async handleDocumentation(query: string, diagram: Diagram): Promise<AIResponse> {
    const doc = this.generateDocumentation(diagram);

    return {
      type: 'documentation',
      content: doc,
      confidence: 0.95,
    };
  }

  /**
   * Handle general queries
   */
  private async handleGeneral(query: string, diagram: Diagram): Promise<AIResponse> {
    return {
      type: 'text',
      content: `I understand you're asking about: "${query}"\n\nYour architecture has ${diagram.nodes.length} services and ${diagram.edges.length} connections. How can I help you analyze or improve it?`,
      confidence: 0.6,
    };
  }

  /**
   * Analyze architecture for issues
   */
  private analyzeArchitecture(diagram: Diagram): {
    complexity: string;
    serviceCount: number;
    dependencyCount: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for circular dependencies
    const cycles = this.detectCycles(diagram);
    if (cycles.length > 0) {
      issues.push(`Circular dependency detected: ${cycles.join(' → ')}`);
      recommendations.push('Break circular dependencies by introducing events or message queues');
    }

    // Check for single points of failure
    const spofs = diagram.nodes.filter((node) => {
      const dependents = diagram.edges.filter((e) => e.source === node.id).length;
      return dependents > 3; // More than 3 services depend on this
    });

    if (spofs.length > 0) {
      issues.push(`${spofs.length} potential single point(s) of failure: ${spofs.map((n) => n.data.label).join(', ')}`);
      recommendations.push('Add redundancy and failover for critical services');
    }

    // Determine complexity
    const complexity =
      diagram.nodes.length < 5
        ? 'Low'
        : diagram.nodes.length < 15
        ? 'Medium'
        : diagram.nodes.length < 30
        ? 'High'
        : 'Very High';

    return {
      complexity,
      serviceCount: diagram.nodes.length,
      dependencyCount: diagram.edges.length,
      issues,
      recommendations,
    };
  }

  /**
   * Detect circular dependencies
   */
  private detectCycles(diagram: Diagram): string[] {
    // Simplified cycle detection (DFS-based)
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (nodeId: string, path: string[]): boolean => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recStack.add(nodeId);

        const outgoing = diagram.edges.filter((e) => e.source === nodeId);
        for (const edge of outgoing) {
          if (!visited.has(edge.target) && dfs(edge.target, [...path, nodeId])) {
            return true;
          } else if (recStack.has(edge.target)) {
            const node = diagram.nodes.find((n) => n.id === edge.target);
            cycles.push(`${[...path, nodeId, node?.data.label].join(' → ')}`);
            return true;
          }
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const node of diagram.nodes) {
      dfs(node.id, []);
    }

    return cycles;
  }

  /**
   * Generate architectural suggestions
   */
  async generateSuggestions(diagram: Diagram): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Suggest caching layer if missing
    const hasCacheNode = diagram.nodes.some((n) => n.type === 'cacheNode');
    const hasDatabase = diagram.nodes.some((n) => n.type === 'databaseNode');

    if (hasDatabase && !hasCacheNode && diagram.nodes.length > 3) {
      suggestions.push({
        id: 'sug-001',
        type: 'performance',
        title: 'Add caching layer',
        description: 'Consider adding Redis or Memcached to reduce database load and improve response times.',
        impact: 'high',
        effort: 'low',
        affectedNodes: diagram.nodes.filter((n) => n.type === 'databaseNode').map((n) => n.id),
        implementation: 'Add a cache node between your application servers and database. Cache frequently accessed data.',
        reasoning: 'Caching can reduce database queries by 70-90% and improve response times by 10-100x.',
      });
    }

    // Suggest load balancer if multiple servers without one
    const hasLoadBalancer = diagram.nodes.some((n) => n.type === 'loadBalancerNode');
    const serverCount = diagram.nodes.filter((n) => n.type === 'serverNode').length;

    if (serverCount >= 2 && !hasLoadBalancer) {
      suggestions.push({
        id: 'sug-002',
        type: 'pattern',
        title: 'Add load balancer',
        description: 'Multiple servers detected without a load balancer. This limits scalability and availability.',
        impact: 'high',
        effort: 'medium',
        affectedNodes: diagram.nodes.filter((n) => n.type === 'serverNode').map((n) => n.id),
        implementation: 'Add an ALB/NLB (AWS) or equivalent load balancer to distribute traffic across servers.',
        reasoning: 'Load balancing enables horizontal scaling, improves availability, and allows zero-downtime deployments.',
      });
    }

    return suggestions;
  }

  /**
   * Generate architecture documentation
   */
  private generateDocumentation(diagram: Diagram): string {
    return `# ${diagram.name} - Architecture Documentation

## Overview
This architecture consists of ${diagram.nodes.length} services and ${diagram.edges.length} connections.

## Components

${diagram.nodes
  .map(
    (node) => `### ${node.data.label}
**Type:** ${node.type}
**Technology:** ${node.data.tech || 'Not specified'}
**Description:** ${node.data.description || 'No description provided'}
`
  )
  .join('\n')}

## Data Flow

${diagram.edges
  .map((edge) => {
    const source = diagram.nodes.find((n) => n.id === edge.source);
    const target = diagram.nodes.find((n) => n.id === edge.target);
    return `- **${source?.data.label}** → **${target?.data.label}**: ${edge.label || edge.data?.label || 'Connection'}`;
  })
  .join('\n')}

## Recommendations

1. Implement monitoring and observability
2. Add automated testing
3. Document API contracts
4. Set up CI/CD pipelines
5. Implement disaster recovery plan

---
*Generated by AI Architectural Copilot*
`;
  }

  /**
   * Generate Architecture Decision Record (ADR)
   */
  async generateADR(change: string, diagram: Diagram): Promise<ArchitectureDecisionRecord> {
    const now = Date.now();

    return {
      id: `adr-${now}`,
      title: `ADR: ${change}`,
      date: now,
      status: 'proposed',
      context: `The current architecture consists of ${diagram.nodes.length} services. A change is being considered: ${change}`,
      decision: `Implement ${change} to improve the architecture.`,
      consequences: [
        'Improved system reliability',
        'May require additional infrastructure costs',
        'Team will need training on new component',
      ],
      alternatives: ['Keep current architecture', 'Implement alternative solution'],
      relatedNodes: [],
    };
  }

  /**
   * Suggest design patterns
   */
  async suggestPatterns(diagram: Diagram): Promise<DesignPattern[]> {
    const patterns: DesignPattern[] = [];

    // Suggest CQRS if there are many read/write operations
    if (diagram.nodes.length > 5) {
      patterns.push({
        name: 'CQRS (Command Query Responsibility Segregation)',
        category: 'architectural',
        description: 'Separate read and write operations to optimize performance and scalability',
        applicability: 'Useful when read and write workloads differ significantly',
        benefits: [
          'Optimized read/write performance',
          'Independent scaling of reads and writes',
          'Simpler read models',
        ],
        drawbacks: ['Increased complexity', 'Eventual consistency challenges', 'More infrastructure'],
        implementation: 'Create separate databases for reads and writes. Use event sourcing to sync.',
      });
    }

    // Suggest Event Sourcing for complex workflows
    patterns.push({
      name: 'Event Sourcing',
      category: 'data',
      description: 'Store all changes as a sequence of events rather than current state',
      applicability: 'Systems requiring audit trails, temporal queries, or event replay',
      benefits: ['Complete audit trail', 'Time travel queries', 'Event replay capability'],
      drawbacks: ['Complexity', 'Storage overhead', 'Learning curve'],
      implementation: 'Use Kafka or EventStore to store all domain events. Build projections for queries.',
    });

    return patterns;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const aiCopilot = new AIArchitecturalCopilot();
