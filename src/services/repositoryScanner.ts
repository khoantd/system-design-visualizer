/**
 * Repository Scanner Service
 * Analyzes codebases to discover services, dependencies, and architecture
 */

import type {
  RepositoryConfig,
  ServiceDiscoveryResult,
  DiscoveredService,
  ServiceDependency,
  DatabaseSchema,
  APIContract,
} from '../store/integrationTypes';

// ============================================================================
// Main Repository Scanner
// ============================================================================

export class RepositoryScanner {
  private config: RepositoryConfig;

  constructor(config: RepositoryConfig) {
    this.config = config;
  }

  async scan(): Promise<ServiceDiscoveryResult> {
    console.log('Starting repository scan...', this.config);

    const services: DiscoveredService[] = [];
    const dependencies: ServiceDependency[] = [];
    const databases: DatabaseSchema[] = [];
    const apiContracts: APIContract[] = [];

    try {
      // Scan for different types of services
      const packageJsonServices = await this.scanPackageJson();
      const dockerComposeServices = await this.scanDockerCompose();
      const kubernetesServices = await this.scanKubernetes();

      services.push(...packageJsonServices, ...dockerComposeServices, ...kubernetesServices);

      // Extract dependencies
      dependencies.push(...this.extractDependencies(services));

      // Discover databases
      databases.push(...this.discoverDatabases(services));

      // Find API contracts
      apiContracts.push(...await this.findAPIContracts());

      return {
        services,
        dependencies,
        databases,
        apiContracts,
      };
    } catch (error) {
      console.error('Repository scan failed:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Package.json Scanner (Node.js services)
  // ==========================================================================

  private async scanPackageJson(): Promise<DiscoveredService[]> {
    // In a real implementation, this would use the GitHub API or local file system
    // For now, we'll return a mock structure
    console.log('Scanning package.json files...');

    return [
      {
        name: 'api-gateway',
        type: 'backend',
        language: 'javascript',
        framework: 'express',
        packageManager: 'npm',
        entryPoint: 'src/index.js',
        dependencies: ['express', 'axios', 'joi'],
        exposedPorts: [3000],
        environmentVars: ['PORT', 'DATABASE_URL', 'JWT_SECRET'],
        annotations: {
          '@architecture': 'api-gateway',
          '@component': 'backend',
        },
        location: {
          path: '/services/api-gateway',
          files: ['package.json', 'src/index.js', 'src/routes/*.js'],
        },
      },
    ];
  }

  // ==========================================================================
  // Docker Compose Scanner
  // ==========================================================================

  private async scanDockerCompose(): Promise<DiscoveredService[]> {
    console.log('Scanning docker-compose.yml files...');

    // Mock implementation - parse YAML in real version
    return [
      {
        name: 'postgres-db',
        type: 'database',
        language: 'sql',
        framework: 'postgresql',
        packageManager: 'docker',
        entryPoint: undefined,
        dependencies: [],
        exposedPorts: [5432],
        environmentVars: ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'],
        location: {
          path: '/docker-compose.yml',
          files: ['docker-compose.yml'],
        },
      },
      {
        name: 'redis-cache',
        type: 'cache',
        language: 'redis',
        framework: 'redis',
        packageManager: 'docker',
        entryPoint: undefined,
        dependencies: [],
        exposedPorts: [6379],
        environmentVars: [],
        location: {
          path: '/docker-compose.yml',
          files: ['docker-compose.yml'],
        },
      },
    ];
  }

  // ==========================================================================
  // Kubernetes Manifest Scanner
  // ==========================================================================

  private async scanKubernetes(): Promise<DiscoveredService[]> {
    console.log('Scanning Kubernetes manifests...');

    return [
      {
        name: 'user-service',
        type: 'backend',
        language: 'typescript',
        framework: 'nestjs',
        packageManager: 'npm',
        entryPoint: 'dist/main.js',
        dependencies: ['@nestjs/core', 'typeorm', 'pg'],
        exposedPorts: [8080],
        environmentVars: ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'],
        annotations: {
          'app.kubernetes.io/name': 'user-service',
          'app.kubernetes.io/component': 'backend',
        },
        location: {
          path: '/k8s/user-service',
          files: ['deployment.yaml', 'service.yaml'],
        },
      },
    ];
  }

  // ==========================================================================
  // Dependency Extraction (AST-based)
  // ==========================================================================

  private extractDependencies(services: DiscoveredService[]): ServiceDependency[] {
    const dependencies: ServiceDependency[] = [];

    // Mock dependency extraction
    // In real implementation, this would parse import statements, HTTP calls, etc.

    // Example: API Gateway -> User Service
    dependencies.push({
      source: 'api-gateway',
      target: 'user-service',
      type: 'http',
      protocol: 'REST',
      endpoint: '/api/users',
      confidence: 0.95,
    });

    // Example: User Service -> PostgreSQL
    dependencies.push({
      source: 'user-service',
      target: 'postgres-db',
      type: 'database',
      protocol: 'TCP',
      endpoint: 'postgres://localhost:5432',
      confidence: 1.0,
    });

    // Example: User Service -> Redis
    dependencies.push({
      source: 'user-service',
      target: 'redis-cache',
      type: 'cache',
      protocol: 'RESP',
      endpoint: 'redis://localhost:6379',
      confidence: 0.9,
    });

    return dependencies;
  }

  // ==========================================================================
  // Database Discovery
  // ==========================================================================

  private discoverDatabases(services: DiscoveredService[]): DatabaseSchema[] {
    const databases: DatabaseSchema[] = [];

    // Find database services
    const dbServices = services.filter((s) => s.type === 'database');

    for (const service of dbServices) {
      if (service.framework === 'postgresql') {
        databases.push({
          name: service.name,
          type: 'postgresql',
          tables: ['users', 'posts', 'comments', 'sessions'],
          relationships: [
            { from: 'users', to: 'posts', type: 'one-to-many' },
            { from: 'posts', to: 'comments', type: 'one-to-many' },
            { from: 'users', to: 'sessions', type: 'one-to-many' },
          ],
          location: service.location.path,
        });
      }
    }

    return databases;
  }

  // ==========================================================================
  // API Contract Discovery (OpenAPI/Swagger)
  // ==========================================================================

  private async findAPIContracts(): Promise<APIContract[]> {
    console.log('Discovering API contracts...');

    // Mock OpenAPI contract
    return [
      {
        service: 'user-service',
        type: 'openapi',
        version: '3.0.0',
        endpoints: [
          {
            method: 'GET',
            path: '/api/users',
            description: 'Get all users',
            parameters: [
              {
                name: 'page',
                in: 'query',
                required: false,
                type: 'integer',
                description: 'Page number for pagination',
              },
              {
                name: 'limit',
                in: 'query',
                required: false,
                type: 'integer',
                description: 'Number of items per page',
              },
            ],
            responses: {
              '200': { description: 'Success' },
              '500': { description: 'Internal Server Error' },
            },
          },
          {
            method: 'POST',
            path: '/api/users',
            description: 'Create a new user',
            parameters: [
              {
                name: 'body',
                in: 'body',
                required: true,
                type: 'object',
                description: 'User object',
              },
            ],
            responses: {
              '201': { description: 'Created' },
              '400': { description: 'Bad Request' },
            },
          },
          {
            method: 'GET',
            path: '/api/users/{id}',
            description: 'Get user by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                type: 'string',
                description: 'User ID',
              },
            ],
            responses: {
              '200': { description: 'Success' },
              '404': { description: 'Not Found' },
            },
          },
        ],
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    ];
  }
}

// ============================================================================
// AST Parser for Dependency Extraction
// ============================================================================

export class ASTParser {
  /**
   * Parse JavaScript/TypeScript files to extract imports and HTTP calls
   */
  static parseJavaScript(code: string): {
    imports: string[];
    httpCalls: Array<{ method: string; url: string }>;
    databaseCalls: string[];
  } {
    const imports: string[] = [];
    const httpCalls: Array<{ method: string; url: string }> = [];
    const databaseCalls: string[] = [];

    // Simple regex-based parsing (in production, use proper AST parser like Babel)

    // Extract imports
    const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    // Extract HTTP calls (axios, fetch, etc.)
    const httpRegex = /(axios|fetch)\.(get|post|put|delete|patch)\s*\(\s*['"`](.+?)['"`]/g;
    while ((match = httpRegex.exec(code)) !== null) {
      httpCalls.push({
        method: match[2].toUpperCase(),
        url: match[3],
      });
    }

    // Extract database calls (simplified)
    const dbRegex = /(sequelize|typeorm|prisma|mongoose)\.(find|create|update|delete)/g;
    while ((match = dbRegex.exec(code)) !== null) {
      databaseCalls.push(match[2]);
    }

    return { imports, httpCalls, databaseCalls };
  }

  /**
   * Parse Python files to extract imports and API calls
   */
  static parsePython(code: string): {
    imports: string[];
    httpCalls: Array<{ method: string; url: string }>;
    databaseCalls: string[];
  } {
    const imports: string[] = [];
    const httpCalls: Array<{ method: string; url: string }> = [];
    const databaseCalls: string[] = [];

    // Extract imports
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+(.+)/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1] || match[2]);
    }

    // Extract HTTP calls (requests library)
    const httpRegex = /requests\.(get|post|put|delete|patch)\s*\(\s*['"](.+?)['"]/g;
    while ((match = httpRegex.exec(code)) !== null) {
      httpCalls.push({
        method: match[1].toUpperCase(),
        url: match[2],
      });
    }

    return { imports, httpCalls, databaseCalls };
  }
}

// ============================================================================
// Annotation Parser
// ============================================================================

export class AnnotationParser {
  /**
   * Parse custom annotations in code comments
   * Example: @architecture api-gateway, @component backend, @dependency user-service
   */
  static parse(code: string): Record<string, string> {
    const annotations: Record<string, string> = {};
    const annotationRegex = /@(\w+)\s+([^\n@]+)/g;

    let match;
    while ((match = annotationRegex.exec(code)) !== null) {
      const key = `@${match[1]}`;
      const value = match[2].trim();
      annotations[key] = value;
    }

    return annotations;
  }
}

// ============================================================================
// Export Helper Functions
// ============================================================================

/**
 * Convert discovered services to diagram nodes
 */
export function servicesToNodes(services: DiscoveredService[]): any[] {
  return services.map((service, index) => {
    let nodeType = 'serverNode';

    switch (service.type) {
      case 'database':
        nodeType = 'databaseNode';
        break;
      case 'cache':
        nodeType = 'cacheNode';
        break;
      case 'frontend':
        nodeType = 'clientNode';
        break;
      case 'api-gateway':
        nodeType = 'loadBalancerNode';
        break;
    }

    return {
      id: service.name,
      type: nodeType,
      position: { x: 200 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
      data: {
        label: service.name,
        description: `${service.framework || service.language} service`,
        tech: service.framework || service.language,
        // Store additional metadata
        _metadata: {
          language: service.language,
          framework: service.framework,
          exposedPorts: service.exposedPorts,
          location: service.location,
          annotations: service.annotations,
        },
      },
    };
  });
}

/**
 * Convert service dependencies to diagram edges
 */
export function dependenciesToEdges(dependencies: ServiceDependency[]): any[] {
  return dependencies.map((dep) => ({
    id: `${dep.source}-${dep.target}`,
    source: dep.source,
    target: dep.target,
    type: 'default',
    animated: dep.type === 'http',
    label: dep.protocol || dep.type,
    data: {
      label: dep.endpoint || dep.type,
      type: dep.type,
      protocol: dep.protocol,
      confidence: dep.confidence,
    },
    style: {
      stroke: getEdgeColorByType(dep.type),
      strokeWidth: 2,
    },
    markerEnd: { type: 'arrowclosed', color: getEdgeColorByType(dep.type) },
  }));
}

function getEdgeColorByType(type: string): string {
  switch (type) {
    case 'http':
      return '#3b82f6'; // Blue
    case 'database':
      return '#10b981'; // Green
    case 'cache':
      return '#f59e0b'; // Orange
    case 'queue':
      return '#8b5cf6'; // Purple
    case 'grpc':
      return '#ec4899'; // Pink
    default:
      return '#64748b'; // Gray
  }
}
