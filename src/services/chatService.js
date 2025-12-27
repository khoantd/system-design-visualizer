/**
 * AI Chat Service for Architecture Analysis and Modification
 */

/**
 * Sends a chat message to analyze or modify the diagram architecture
 * @param {string} message - User's message
 * @param {Array} nodes - Current diagram nodes
 * @param {Array} edges - Current diagram edges
 * @param {Array} chatHistory - Previous chat messages for context
 * @returns {Promise<{response: string, actions?: Array}>}
 */
export const sendChatMessage = async (message, nodes, edges, chatHistory = []) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
        return {
            response: "API key not configured. Please add VITE_OPENAI_API_KEY to your .env file to enable AI chat functionality.",
            actions: null
        };
    }

    try {
        const diagramContext = formatDiagramContext(nodes, edges);
        
        const systemPrompt = `You are an expert system architect assistant helping users analyze and modify their system design diagrams. You have access to the current diagram state and can suggest modifications.

Current Diagram State:
${diagramContext}

Your capabilities:
1. **Analyze Architecture**: Identify patterns, potential issues, bottlenecks, single points of failure, and suggest improvements.
2. **Suggest Modifications**: Recommend adding, removing, or modifying components.
3. **Explain Components**: Describe the role and best practices for each component type.
4. **Provide Actions**: When the user wants to modify the diagram, return structured actions.

When suggesting diagram modifications, include an "actions" array in your response with the following structure:
- To add a node: { "type": "addNode", "nodeType": "serverNode|databaseNode|cacheNode|loadBalancerNode|clientNode|userNode", "label": "Name", "description": "Description", "tech": "Technologies" }
  Valid nodeType values ONLY: serverNode, databaseNode, cacheNode, loadBalancerNode, clientNode, userNode
  - Use "serverNode" for: API servers, web servers, microservices, workers, queues, gateways, CDN, any backend service
  - Use "databaseNode" for: databases, data stores, file storage
  - Use "cacheNode" for: Redis, Memcached, any caching layer
  - Use "loadBalancerNode" for: load balancers, reverse proxies, API gateways
  - Use "clientNode" for: web apps, mobile apps, frontend clients
  - Use "userNode" for: users, external actors
- To remove a node: { "type": "removeNode", "nodeId": "id" }
- To add an edge: { "type": "addEdge", "source": "sourceNodeId", "target": "targetNodeId", "label": "optional label" }
- To remove an edge: { "type": "removeEdge", "edgeId": "id" }
- To update a node: { "type": "updateNode", "nodeId": "id", "updates": { "label": "new label", "description": "new desc", "tech": "new tech" } }

IMPORTANT: Only use the exact nodeType values listed above. Do not invent new node types.

Format your response as JSON with this structure:
{
  "response": "Your detailed explanation and analysis here...",
  "actions": [] // Array of actions if modifications are suggested, null otherwise
}

Be helpful, concise, and provide actionable insights. When analyzing, consider:
- Scalability patterns
- Fault tolerance and redundancy
- Security considerations
- Performance optimizations
- Cost efficiency
- Industry best practices`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: "user", content: message }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages,
                max_tokens: 2000,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const content = JSON.parse(data.choices[0].message.content);
        return {
            response: content.response || content.message || "I couldn't generate a response.",
            actions: content.actions || null
        };

    } catch (error) {
        console.error("Chat API Error:", error);
        return {
            response: `Error: ${error.message}. Please try again.`,
            actions: null
        };
    }
};

/**
 * Formats the current diagram state into a readable context string
 */
const formatDiagramContext = (nodes, edges) => {
    if (!nodes || nodes.length === 0) {
        return "No diagram loaded. The canvas is empty.";
    }

    const nodesList = nodes.map(node => {
        const data = node.data || {};
        return `- [${node.id}] ${data.label || 'Unnamed'} (Type: ${node.type || 'unknown'})
    Description: ${data.description || 'N/A'}
    Technologies: ${data.tech || 'N/A'}`;
    }).join('\n');

    const edgesList = edges.map(edge => {
        return `- ${edge.source} → ${edge.target}${edge.label ? ` (${edge.label})` : ''}`;
    }).join('\n');

    return `
NODES (${nodes.length}):
${nodesList}

CONNECTIONS (${edges.length}):
${edgesList || 'No connections'}
`;
};

/**
 * Quick analysis prompts for common architecture questions
 */
export const quickAnalysisPrompts = [
    { label: "Analyze scalability", prompt: "Analyze the scalability of this architecture. What are the potential bottlenecks and how can they be addressed?" },
    { label: "Check fault tolerance", prompt: "Evaluate the fault tolerance of this system. Are there any single points of failure?" },
    { label: "Security review", prompt: "Review the security aspects of this architecture. What security measures should be considered?" },
    { label: "Suggest improvements", prompt: "What improvements would you suggest for this architecture to make it more robust and efficient?" },
    { label: "Add caching layer", prompt: "Suggest how to add an effective caching layer to this architecture." },
    { label: "Add load balancing", prompt: "How should I implement load balancing in this architecture?" },
];
