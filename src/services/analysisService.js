import { MarkerType } from 'reactflow';
import { nanoid } from 'nanoid';

/**
 * Analyzes an image using OpenAI's GPT-4o to generate a Mermaid diagram.
 * @param {File} imageFile 
 * @returns {Promise<string>} Mermaid diagram string
 */
export const generateMermaidFromImage = async (imageFile) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (apiKey) {
        return generateMermaidWithOpenAI(imageFile, apiKey);
    } else {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(getMockMermaid());
            }, 1500);
        });
    }
};

/**
 * Converts a Mermaid diagram string to React Flow nodes and edges.
 * @param {string} mermaidCode 
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
/**
 * Generates a C4 Component diagram from a functional specification
 * @param {string} specification - Functional specification text
 * @param {string} frontendTech - Frontend technology choice (reactjs, vuejs)
 * @param {string} backendTech - Backend technology choice (nodejs, python-fastapi)
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
export const generateC4ComponentFromSpec = async (specification, frontendTech, backendTech) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (apiKey) {
        return generateC4WithOpenAI(specification, frontendTech, backendTech, apiKey);
    } else {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(getMockC4Components(frontendTech, backendTech));
            }, 1500);
        });
    }
};

const generateC4WithOpenAI = async (specification, frontendTech, backendTech, apiKey) => {
    const frontendTechMap = {
        'reactjs': 'React.js with React Router, Redux/Zustand for state management',
        'vuejs': 'Vue.js with Vue Router, Pinia/Vuex for state management',
    };

    const backendTechMap = {
        'nodejs': 'Node.js with Express.js or NestJS, TypeORM/Prisma for ORM',
        'python-fastapi': 'Python with FastAPI, SQLAlchemy for ORM, Pydantic for validation',
    };

    const frontendStack = frontendTechMap[frontendTech] || frontendTechMap['reactjs'];
    const backendStack = backendTechMap[backendTech] || backendTechMap['nodejs'];

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a software architect expert in C4 model diagrams. Generate a C4 Component-level diagram based on the functional specification provided.

Technology Stack:
- Frontend: ${frontendStack}
- Backend: ${backendStack}

Return ONLY a valid JSON object (no markdown formatting) with this structure:
{
  "nodes": [
    { 
      "id": "unique-string-id", 
      "type": "one of: clientNode, serverNode, databaseNode, loadBalancerNode, cacheNode, userNode, subflowNode", 
      "position": { "x": number, "y": number }, 
      "data": { 
        "label": "Component Name", 
        "description": "C4 component description explaining responsibility", 
        "tech": "Specific technologies used" 
      }
    }
  ],
  "edges": [
    { "id": "unique-edge-id", "source": "sourceNodeId", "target": "targetNodeId", "animated": true, "label": "interaction description (e.g., 'REST API', 'WebSocket', 'SQL')" }
  ]
}

C4 Component Guidelines:
1. Use "userNode" for actors/users
2. Use "clientNode" for frontend components (UI components, pages, state management)
3. Use "serverNode" for backend components (controllers, services, APIs, workers)
4. Use "databaseNode" for data stores (databases, file storage)
5. Use "cacheNode" for caching layers (Redis, in-memory cache)
6. Use "loadBalancerNode" for API gateways, reverse proxies
7. Use "subflowNode" for grouping related components (containers)

Component Naming:
- Frontend: Use names like "Auth UI", "Dashboard Page", "State Store", "API Client"
- Backend: Use names like "Auth Controller", "User Service", "Order Repository", "Message Queue"

Position Layout:
- Users at top (y: 0-50)
- Frontend components (y: 150-300)
- API Gateway/Load Balancer (y: 400)
- Backend services (y: 500-700)
- Databases and caches at bottom (y: 800-900)
- Spread horizontally (x: 50-800) to avoid overlap

Create a comprehensive component diagram that shows:
1. All major UI components based on the specification
2. Backend services/controllers for each feature
3. Data access layers/repositories
4. External integrations if mentioned
5. Clear data flow between components`
                    },
                    {
                        role: "user",
                        content: `Generate a C4 Component diagram for this functional specification:\n\n${specification}`
                    }
                ],
                max_tokens: 4000,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error("Invalid response format from OpenAI API");
        }

        let result;
        try {
            result = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError);
            throw new Error("Failed to parse JSON response from OpenAI");
        }

        // Validate and ensure proper structure
        if (!result || typeof result !== 'object') {
            throw new Error("Invalid result structure from OpenAI");
        }

        if (!result.nodes) result.nodes = [];
        if (!result.edges) result.edges = [];

        // Validate nodes have required properties
        const validNodeTypes = ['clientNode', 'serverNode', 'databaseNode', 'loadBalancerNode', 'cacheNode', 'userNode', 'subflowNode'];
        
        result.nodes = result.nodes.map((node, index) => {
            const validatedNode = { ...node };
            
            if (!validatedNode.id) {
                validatedNode.id = nanoid();
            }
            
            if (!validatedNode.type || !validNodeTypes.includes(validatedNode.type)) {
                validatedNode.type = 'serverNode';
            }
            
            if (!validatedNode.position || typeof validatedNode.position.x !== 'number' || typeof validatedNode.position.y !== 'number') {
                validatedNode.position = { x: 100 + (index % 4) * 200, y: 100 + Math.floor(index / 4) * 150 };
            }
            
            if (!validatedNode.data) {
                validatedNode.data = { label: `Component ${index + 1}`, description: '', tech: '' };
            }

            // Handle subflowNode special properties
            if (validatedNode.type === 'subflowNode') {
                validatedNode.style = validatedNode.style || { width: 400, height: 300 };
                validatedNode.zIndex = -1;
            }
            
            return validatedNode;
        });

        // Validate edges
        result.edges = result.edges.map((edge, index) => ({
            ...edge,
            id: edge.id || nanoid(),
            type: 'straight',
            animated: edge.animated !== false,
        }));

        return result;

    } catch (error) {
        console.error("OpenAI API Error:", error);
        alert("Failed to generate C4 components with AI. Using sample data.");
        return getMockC4Components(frontendTech, backendTech);
    }
};

const getMockC4Components = (frontendTech, backendTech) => {
    const frontendLabel = frontendTech === 'vuejs' ? 'Vue.js' : 'React';
    const backendLabel = backendTech === 'python-fastapi' ? 'FastAPI' : 'Node.js/Express';
    
    const nodes = [
        {
            id: 'user',
            type: 'userNode',
            position: { x: 350, y: 0 },
            data: {
                label: 'End User',
                description: 'User interacting with the web application',
                tech: 'Web Browser'
            },
        },
        {
            id: 'spa',
            type: 'clientNode',
            position: { x: 100, y: 150 },
            data: {
                label: 'SPA Frontend',
                description: 'Single Page Application handling user interface',
                tech: frontendLabel
            },
        },
        {
            id: 'state-store',
            type: 'clientNode',
            position: { x: 350, y: 150 },
            data: {
                label: 'State Management',
                description: 'Client-side state management for application data',
                tech: frontendTech === 'vuejs' ? 'Pinia' : 'Redux/Zustand'
            },
        },
        {
            id: 'api-client',
            type: 'clientNode',
            position: { x: 600, y: 150 },
            data: {
                label: 'API Client',
                description: 'HTTP client for backend communication',
                tech: 'Axios/Fetch'
            },
        },
        {
            id: 'api-gateway',
            type: 'loadBalancerNode',
            position: { x: 350, y: 350 },
            data: {
                label: 'API Gateway',
                description: 'Entry point for all API requests, handles routing and auth',
                tech: 'NGINX/Kong'
            },
        },
        {
            id: 'auth-service',
            type: 'serverNode',
            position: { x: 100, y: 500 },
            data: {
                label: 'Auth Service',
                description: 'Handles authentication and authorization',
                tech: backendLabel
            },
        },
        {
            id: 'user-service',
            type: 'serverNode',
            position: { x: 350, y: 500 },
            data: {
                label: 'User Service',
                description: 'Manages user profiles and preferences',
                tech: backendLabel
            },
        },
        {
            id: 'business-service',
            type: 'serverNode',
            position: { x: 600, y: 500 },
            data: {
                label: 'Business Service',
                description: 'Core business logic and operations',
                tech: backendLabel
            },
        },
        {
            id: 'cache',
            type: 'cacheNode',
            position: { x: 100, y: 700 },
            data: {
                label: 'Cache Layer',
                description: 'Caches frequently accessed data',
                tech: 'Redis'
            },
        },
        {
            id: 'primary-db',
            type: 'databaseNode',
            position: { x: 350, y: 700 },
            data: {
                label: 'Primary Database',
                description: 'Main data store for application data',
                tech: 'PostgreSQL'
            },
        },
        {
            id: 'file-storage',
            type: 'databaseNode',
            position: { x: 600, y: 700 },
            data: {
                label: 'File Storage',
                description: 'Stores uploaded files and media',
                tech: 'S3/MinIO'
            },
        },
    ];

    const edges = [
        { id: 'e1', source: 'user', target: 'spa', animated: true, label: 'Uses' },
        { id: 'e2', source: 'spa', target: 'state-store', animated: true, label: 'Updates' },
        { id: 'e3', source: 'spa', target: 'api-client', animated: true, label: 'Calls' },
        { id: 'e4', source: 'api-client', target: 'api-gateway', animated: true, label: 'HTTPS' },
        { id: 'e5', source: 'api-gateway', target: 'auth-service', animated: true, label: 'Routes' },
        { id: 'e6', source: 'api-gateway', target: 'user-service', animated: true, label: 'Routes' },
        { id: 'e7', source: 'api-gateway', target: 'business-service', animated: true, label: 'Routes' },
        { id: 'e8', source: 'auth-service', target: 'cache', animated: true, label: 'Session' },
        { id: 'e9', source: 'auth-service', target: 'primary-db', animated: true, label: 'SQL' },
        { id: 'e10', source: 'user-service', target: 'primary-db', animated: true, label: 'SQL' },
        { id: 'e11', source: 'business-service', target: 'primary-db', animated: true, label: 'SQL' },
        { id: 'e12', source: 'business-service', target: 'file-storage', animated: true, label: 'S3 API' },
    ];

    return { nodes, edges };
};

export const convertMermaidToFlow = async (mermaidCode) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (apiKey) {
        return convertToFlowWithOpenAI(mermaidCode, apiKey);
    } else {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(getMockGraph());
            }, 1500);
        });
    }
};

const generateMermaidWithOpenAI = async (file, apiKey) => {
    try {
        const base64Image = await toBase64(file);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a system architecture expert. Analyze the provided system design diagram image and convert it into a Mermaid JS diagram.
            
            Return ONLY the Mermaid code string. Do not include markdown code blocks (like \`\`\`mermaid).
            
            Rules:
            1. Use 'graph TD' or 'graph LR' based on the layout.
            2. Use appropriate shapes for components (cylinder for databases, rect for servers, etc).
            3. Ensure directionality of arrows matches the image.`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Convert this system design to Mermaid." },
                            { type: "image_url", image_url: { url: base64Image } }
                        ]
                    }
                ],
                max_tokens: 4000
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        let content = data.choices[0].message.content;
        // Clean up markdown code blocks if present
        content = content.replace(/^```mermaid\n/, '').replace(/^```\n/, '').replace(/```$/, '');
        return content.trim();

    } catch (error) {
        console.error("OpenAI API Error:", error);
        alert("Failed to analyze image with AI. Falling back to mock data.");
        return getMockMermaid();
    }
};

const convertToFlowWithOpenAI = async (mermaidCode, apiKey) => {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a system architecture expert. Convert the provided Mermaid diagram code into a structured graph format for React Flow.
            
            Return ONLY a valid JSON object (no markdown formatting) with this structure:
            {
              "nodes": [
                { 
                  "id": "string", 
                  "type": "one of: clientNode, serverNode, databaseNode, loadBalancerNode, cacheNode", 
                  "position": { "x": number, "y": number }, 
                  "data": { 
                    "label": "string", 
                    "description": "brief description of role inferred from context", 
                    "tech": "inferred technologies" 
                  } 
                }
              ],
              "edges": [
                { "id": "string", "source": "nodeId", "target": "nodeId", "animated": true, "label": "optional connection label" }
              ]
            }
            
            Rules:
            1. Map Mermaid shapes/names to the most appropriate node type.
            2. Space out the position coordinates (x, y) so the graph is readable.
            3. Ensure all source and target IDs in edges exist in the nodes array.`
                    },
                    {
                        role: "user",
                        content: `Convert this Mermaid code to React Flow JSON:\n\n${mermaidCode}`
                    }
                ],
                max_tokens: 4000,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error("Invalid response format from OpenAI API");
        }

        let result;
        try {
            result = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError);
            console.error("Response content:", data.choices[0].message.content);
            throw new Error("Failed to parse JSON response from OpenAI");
        }
        
        // Validate result structure
        if (!result || typeof result !== 'object') {
            console.error("Invalid result structure:", result);
            throw new Error("Invalid result structure from OpenAI");
        }

        // Ensure nodes and edges arrays exist
        if (!result.nodes) {
            result.nodes = [];
        }
        if (!result.edges) {
            result.edges = [];
        }

        // Validate and ensure all nodes have position property
        if (Array.isArray(result.nodes)) {
            result.nodes = result.nodes.map((node, index) => {
                if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
                    // Default position if missing or invalid
                    return {
                        ...node,
                        position: { x: 250 + (index % 3) * 200, y: 100 + Math.floor(index / 3) * 150 }
                    };
                }
                return node;
            });
        } else {
            console.warn("result.nodes is not an array, converting to empty array");
            result.nodes = [];
        }

        // Ensure edges is an array
        if (!Array.isArray(result.edges)) {
            console.warn("result.edges is not an array, converting to empty array");
            result.edges = [];
        }
        
        return result;

    } catch (error) {
        console.error("OpenAI API Error:", error);
        alert("Failed to convert Mermaid to Flow. Falling back to mock data.");
        return getMockGraph();
    }
};

const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const getMockMermaid = () => {
    return `graph TD
    Client[Client / Browser] -->|HTTPS| LB[Load Balancer]
    LB --> Web1[Web Server 1]
    LB --> Web2[Web Server 2]
    Web1 --> DB[(Primary Database)]
    Web2 --> DB
    Web1 -.-> Cache[(Redis Cache)]`;
};

/**
 * Generates code design from selected components with design patterns
 * @param {Object} params - Generation parameters
 * @param {Array} params.nodes - Selected component nodes
 * @param {Array} params.edges - Relevant edges between components
 * @param {Array} params.patterns - Selected design patterns
 * @param {string} params.language - Target programming language
 * @param {string} params.outputFormat - Output format (scaffolding, interfaces, class-diagram)
 * @returns {Promise<{code: string, description: string, patterns: Array}>}
 */
export const generateCodeFromComponents = async (params) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (apiKey) {
        return generateCodeWithOpenAI(params, apiKey);
    } else {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(getMockCodeGeneration(params));
            }, 1500);
        });
    }
};

const generateCodeWithOpenAI = async (params, apiKey) => {
    const { nodes, edges, patterns, language, outputFormat } = params;

    const languageMap = {
        'typescript': 'TypeScript with strict typing, interfaces, and modern ES6+ features',
        'javascript': 'JavaScript ES6+ with JSDoc comments for type hints',
        'python': 'Python 3.x with type hints, dataclasses, and ABC for interfaces',
        'java': 'Java 17+ with records, interfaces, and modern features',
    };

    const outputFormatMap = {
        'scaffolding': 'Generate a complete folder structure with boilerplate code files. Show file paths and their contents.',
        'interfaces': 'Generate interface/type definitions, contracts, and abstract classes that define the component boundaries.',
        'class-diagram': 'Generate a text-based UML class diagram showing classes, interfaces, relationships, and methods.',
    };

    const languageSpec = languageMap[language] || languageMap['typescript'];
    const outputSpec = outputFormatMap[outputFormat] || outputFormatMap['scaffolding'];

    const componentsSummary = nodes.map(n => ({
        name: n.data?.label || n.id,
        type: n.type,
        description: n.data?.description || '',
        tech: n.data?.tech || '',
    }));

    const relationshipsSummary = edges.map(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        const targetNode = nodes.find(n => n.id === e.target);
        return {
            from: sourceNode?.data?.label || e.source,
            to: targetNode?.data?.label || e.target,
            label: e.label || 'connects to',
        };
    });

    const patternsSummary = patterns.map(p => p.label).join(', ') || 'No specific patterns selected';

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a senior software architect expert in design patterns and clean code architecture. Generate production-quality code based on the provided system components and design patterns.

Language: ${languageSpec}
Output Format: ${outputSpec}

Design Pattern Guidelines:
- Repository Pattern: Create abstract repository interfaces and concrete implementations for data access
- Factory Pattern: Create factory classes/functions for object instantiation
- Singleton Pattern: Implement thread-safe singleton for shared resources
- Observer/Pub-Sub: Create event emitter/subscriber interfaces
- Strategy Pattern: Define strategy interfaces with interchangeable implementations
- Facade Pattern: Create simplified interfaces for complex subsystems
- Adapter Pattern: Create adapters for external service integration
- Decorator Pattern: Implement decorators for extending functionality
- Command Pattern: Encapsulate requests as command objects
- MVC/MVVM: Separate concerns into Model, View, Controller/ViewModel layers

Return a JSON object with this structure:
{
  "code": "The generated code as a string with proper formatting and file separators",
  "description": "Brief explanation of the generated architecture and how patterns are applied",
  "patterns": ["List of patterns actually applied in the code"]
}

Code Quality Requirements:
1. Use proper naming conventions for the target language
2. Include necessary imports/dependencies
3. Add meaningful comments explaining pattern usage
4. Ensure code is syntactically correct and follows best practices
5. For scaffolding: Use clear file path comments like "// === FILE: src/services/UserService.ts ===" to separate files`
                    },
                    {
                        role: "user",
                        content: `Generate ${language} code for these system components:

Components:
${JSON.stringify(componentsSummary, null, 2)}

Relationships:
${JSON.stringify(relationshipsSummary, null, 2)}

Design Patterns to Apply: ${patternsSummary}

Output Format: ${outputFormat}`
                    }
                ],
                max_tokens: 4000,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error("Invalid response format from OpenAI API");
        }

        let result;
        try {
            result = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError);
            throw new Error("Failed to parse JSON response from OpenAI");
        }

        if (!result.code) {
            throw new Error("No code generated");
        }

        return {
            code: result.code,
            description: result.description || 'Code generated successfully',
            patterns: result.patterns || [],
        };

    } catch (error) {
        console.error("OpenAI API Error:", error);
        alert("Failed to generate code with AI. Using sample code.");
        return getMockCodeGeneration(params);
    }
};

const getMockCodeGeneration = (params) => {
    const { nodes, patterns, language, outputFormat } = params;
    
    const componentNames = nodes.map(n => n.data?.label || n.id);
    const patternNames = patterns.map(p => p.label);

    if (language === 'typescript' || language === 'javascript') {
        if (outputFormat === 'interfaces') {
            return {
                code: `// === FILE: src/types/index.ts ===

// Base Entity Interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Repository Interface (Repository Pattern)
export interface IRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Service Interface
export interface IService<T extends BaseEntity> {
  get(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  remove(id: string): Promise<boolean>;
}

// Event Types (Observer Pattern)
export type EventHandler<T = unknown> = (data: T) => void;

export interface IEventEmitter {
  on<T>(event: string, handler: EventHandler<T>): void;
  off<T>(event: string, handler: EventHandler<T>): void;
  emit<T>(event: string, data: T): void;
}

// Cache Interface (Strategy Pattern)
export interface ICacheStrategy {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

// Generated Component Interfaces
${componentNames.map(name => {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
    return `
export interface I${safeName} {
  initialize(): Promise<void>;
  execute(): Promise<void>;
  dispose(): Promise<void>;
}`;
}).join('\n')}
`,
                description: `Generated TypeScript interfaces for ${componentNames.length} components with Repository, Observer, and Strategy patterns.`,
                patterns: ['Repository Pattern', 'Observer Pattern', 'Strategy Pattern'],
            };
        }

        if (outputFormat === 'class-diagram') {
            return {
                code: `// UML Class Diagram (Text Representation)
// ==========================================

┌─────────────────────────────────────────┐
│           <<interface>>                 │
│           IRepository<T>                │
├─────────────────────────────────────────┤
│ + findById(id: string): T               │
│ + findAll(): T[]                        │
│ + create(entity: T): T                  │
│ + update(id: string, entity: T): T      │
│ + delete(id: string): boolean           │
└─────────────────────────────────────────┘
                    △
                    │ implements
                    │
┌─────────────────────────────────────────┐
│           BaseRepository<T>             │
├─────────────────────────────────────────┤
│ - database: IDatabase                   │
├─────────────────────────────────────────┤
│ + findById(id: string): T               │
│ + findAll(): T[]                        │
│ + create(entity: T): T                  │
│ + update(id: string, entity: T): T      │
│ + delete(id: string): boolean           │
└─────────────────────────────────────────┘

${componentNames.map(name => {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
    return `
┌─────────────────────────────────────────┐
│              ${safeName.padEnd(27)}│
├─────────────────────────────────────────┤
│ - repository: IRepository               │
│ - cache: ICacheStrategy                 │
├─────────────────────────────────────────┤
│ + initialize(): void                    │
│ + execute(): void                       │
│ + dispose(): void                       │
└─────────────────────────────────────────┘`;
}).join('\n')}

// Relationships:
// - Services ──────> Repositories (dependency)
// - Services ──────> Cache (dependency)
// - Controllers ───> Services (dependency)
// - Facade ────────> Multiple Services (aggregation)
`,
                description: `Generated UML class diagram for ${componentNames.length} components showing class relationships and interfaces.`,
                patterns: patternNames.length > 0 ? patternNames : ['Repository Pattern'],
            };
        }

        // Default: scaffolding
        return {
            code: `// === FILE: src/index.ts ===
export * from './types';
export * from './services';
export * from './repositories';

// === FILE: src/types/index.ts ===
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// === FILE: src/repositories/BaseRepository.ts ===
import { BaseEntity, IRepository } from '../types';

export abstract class BaseRepository<T extends BaseEntity> implements IRepository<T> {
  protected abstract tableName: string;

  async findById(id: string): Promise<T | null> {
    // Implementation depends on your database choice
    throw new Error('Method not implemented');
  }

  async findAll(): Promise<T[]> {
    throw new Error('Method not implemented');
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    throw new Error('Method not implemented');
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    throw new Error('Method not implemented');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('Method not implemented');
  }
}

// === FILE: src/services/BaseService.ts ===
import { BaseEntity, IRepository } from '../types';

export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: IRepository<T>) {}

  async get(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async getAll(): Promise<T[]> {
    return this.repository.findAll();
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}

${componentNames.map(name => {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = safeName.charAt(0).toUpperCase() + safeName.slice(1);
    return `
// === FILE: src/services/${fileName}Service.ts ===
import { BaseService } from './BaseService';
import { BaseEntity, IRepository } from '../types';

export interface ${safeName}Entity extends BaseEntity {
  name: string;
  // Add component-specific fields
}

export class ${fileName}Service extends BaseService<${safeName}Entity> {
  constructor(repository: IRepository<${safeName}Entity>) {
    super(repository);
  }

  // Add component-specific methods
  async process(): Promise<void> {
    console.log('Processing ${name}...');
  }
}`;
}).join('\n')}
`,
            description: `Generated code scaffolding for ${componentNames.length} components with Repository Pattern and Service Layer.`,
            patterns: ['Repository Pattern', 'Service Layer'],
        };
    }

    if (language === 'python') {
        return {
            code: `# === FILE: src/__init__.py ===
from .types import *
from .services import *
from .repositories import *

# === FILE: src/types.py ===
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Generic, TypeVar, Optional, List
import uuid

@dataclass
class BaseEntity:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

T = TypeVar('T', bound=BaseEntity)

class IRepository(ABC, Generic[T]):
    @abstractmethod
    async def find_by_id(self, id: str) -> Optional[T]:
        pass

    @abstractmethod
    async def find_all(self) -> List[T]:
        pass

    @abstractmethod
    async def create(self, entity: T) -> T:
        pass

    @abstractmethod
    async def update(self, id: str, entity: T) -> T:
        pass

    @abstractmethod
    async def delete(self, id: str) -> bool:
        pass

# === FILE: src/repositories/base_repository.py ===
from typing import Generic, TypeVar, Optional, List
from ..types import BaseEntity, IRepository

T = TypeVar('T', bound=BaseEntity)

class BaseRepository(IRepository[T], Generic[T]):
    def __init__(self):
        self._storage: dict[str, T] = {}

    async def find_by_id(self, id: str) -> Optional[T]:
        return self._storage.get(id)

    async def find_all(self) -> List[T]:
        return list(self._storage.values())

    async def create(self, entity: T) -> T:
        self._storage[entity.id] = entity
        return entity

    async def update(self, id: str, entity: T) -> T:
        self._storage[id] = entity
        return entity

    async def delete(self, id: str) -> bool:
        if id in self._storage:
            del self._storage[id]
            return True
        return False

# === FILE: src/services/base_service.py ===
from typing import Generic, TypeVar, Optional, List
from ..types import BaseEntity, IRepository

T = TypeVar('T', bound=BaseEntity)

class BaseService(Generic[T]):
    def __init__(self, repository: IRepository[T]):
        self._repository = repository

    async def get(self, id: str) -> Optional[T]:
        return await self._repository.find_by_id(id)

    async def get_all(self) -> List[T]:
        return await self._repository.find_all()

    async def create(self, entity: T) -> T:
        return await self._repository.create(entity)

    async def update(self, id: str, entity: T) -> T:
        return await self._repository.update(id, entity)

    async def remove(self, id: str) -> bool:
        return await self._repository.delete(id)

${componentNames.map(name => {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `
# === FILE: src/services/${safeName}_service.py ===
from dataclasses import dataclass
from ..types import BaseEntity, IRepository
from .base_service import BaseService

@dataclass
class ${safeName.charAt(0).toUpperCase() + safeName.slice(1)}Entity(BaseEntity):
    name: str = ""
    # Add component-specific fields

class ${safeName.charAt(0).toUpperCase() + safeName.slice(1)}Service(BaseService[${safeName.charAt(0).toUpperCase() + safeName.slice(1)}Entity]):
    def __init__(self, repository: IRepository[${safeName.charAt(0).toUpperCase() + safeName.slice(1)}Entity]):
        super().__init__(repository)

    async def process(self) -> None:
        print(f"Processing ${name}...")`;
}).join('\n')}
`,
            description: `Generated Python code scaffolding for ${componentNames.length} components with Repository Pattern and Service Layer.`,
            patterns: ['Repository Pattern', 'Service Layer'],
        };
    }

    // Java fallback
    return {
        code: `// === FILE: src/main/java/com/app/types/BaseEntity.java ===
package com.app.types;

import java.time.LocalDateTime;
import java.util.UUID;

public abstract class BaseEntity {
    private String id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BaseEntity() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

// === FILE: src/main/java/com/app/repositories/IRepository.java ===
package com.app.repositories;

import com.app.types.BaseEntity;
import java.util.List;
import java.util.Optional;

public interface IRepository<T extends BaseEntity> {
    Optional<T> findById(String id);
    List<T> findAll();
    T create(T entity);
    T update(String id, T entity);
    boolean delete(String id);
}

// === FILE: src/main/java/com/app/services/BaseService.java ===
package com.app.services;

import com.app.types.BaseEntity;
import com.app.repositories.IRepository;
import java.util.List;
import java.util.Optional;

public abstract class BaseService<T extends BaseEntity> {
    protected final IRepository<T> repository;

    public BaseService(IRepository<T> repository) {
        this.repository = repository;
    }

    public Optional<T> get(String id) {
        return repository.findById(id);
    }

    public List<T> getAll() {
        return repository.findAll();
    }

    public T create(T entity) {
        return repository.create(entity);
    }

    public T update(String id, T entity) {
        return repository.update(id, entity);
    }

    public boolean remove(String id) {
        return repository.delete(id);
    }
}
`,
        description: `Generated Java code scaffolding for ${componentNames.length} components with Repository Pattern and Service Layer.`,
        patterns: ['Repository Pattern', 'Service Layer'],
    };
};

const getMockGraph = () => {
    // This is a hardcoded "standard" 3-tier architecture for demo purposes
    const nodes = [
        {
            id: 'client',
            type: 'clientNode',
            position: { x: 250, y: 0 },
            data: {
                label: 'Client / Browser',
                description: 'The user interface running in the browser. Sends requests to the Load Balancer.',
                tech: 'React, Mobile App'
            },
        },
        {
            id: 'lb',
            type: 'loadBalancerNode',
            position: { x: 250, y: 150 },
            data: {
                label: 'Load Balancer',
                description: 'Distributes incoming network traffic across multiple servers to ensure reliability and performance.',
                tech: 'NGINX, AWS ALB'
            },
        },
        {
            id: 'web-server-1',
            type: 'serverNode',
            position: { x: 100, y: 300 },
            data: {
                label: 'Web Server 1',
                description: 'Handles application logic and processes user requests.',
                tech: 'Node.js, Express'
            },
        },
        {
            id: 'web-server-2',
            type: 'serverNode',
            position: { x: 400, y: 300 },
            data: {
                label: 'Web Server 2',
                description: 'Secondary server for horizontal scaling and high availability.',
                tech: 'Node.js, Express'
            },
        },
        {
            id: 'db-primary',
            type: 'databaseNode',
            position: { x: 250, y: 450 },
            data: {
                label: 'Primary Database',
                description: 'Stores persistent data. Handles write operations.',
                tech: 'PostgreSQL, MongoDB'
            },
        },
        {
            id: 'cache',
            type: 'cacheNode',
            position: { x: 50, y: 450 },
            data: {
                label: 'Redis Cache',
                description: 'Stores frequently accessed data to reduce database load.',
                tech: 'Redis'
            },
        },
    ];

    const edges = [
        { id: 'e1', source: 'client', target: 'lb', animated: true, label: 'HTTPS' },
        { id: 'e2', source: 'lb', target: 'web-server-1', animated: true },
        { id: 'e3', source: 'lb', target: 'web-server-2', animated: true },
        { id: 'e4', source: 'web-server-1', target: 'db-primary', animated: true },
        { id: 'e5', source: 'web-server-2', target: 'db-primary', animated: true },
        { id: 'e6', source: 'web-server-1', target: 'cache', type: 'smoothstep', style: { strokeDasharray: '5,5' } },
    ];

    return { nodes, edges };
};
