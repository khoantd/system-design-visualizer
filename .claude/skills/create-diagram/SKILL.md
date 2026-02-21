---
name: create-diagram
description: Generate a system design diagram in the System Design Visualizer format. Use when asked to create, design, or diagram a system architecture.
argument-hint: <system description>
---

Generate a system architecture diagram in the JSON format used by this app.

## System description

$ARGUMENTS

## Instructions

1. Analyze the system description and identify all components, services, and their relationships.

2. Produce a JSON object with `nodes` and `edges` arrays following the schema below.

3. After the JSON, write the diagram to `diagram-output.json` in the project root using the Write tool so the user can import it via the app's Load panel.

4. Summarize what was generated (component count, key architectural decisions).

---

## Node schema

```ts
{
  id: string,           // kebab-case, unique, descriptive (e.g. "auth-service")
  type: NodeType,       // see valid types below
  position: { x: number, y: number },
  data: {
    label: string,      // short display name (e.g. "Auth Service")
    description: string, // 1–2 sentences explaining responsibility
    tech: string        // comma-separated technologies (e.g. "Node.js, JWT, bcrypt")
  },
  // subflowNode only:
  style?: { width: number, height: number },
  zIndex?: -1
}
```

### Valid node types

| Type | Use for |
|---|---|
| `userNode` | Human actors, end users |
| `clientNode` | Frontend apps, SPAs, mobile clients, browsers |
| `loadBalancerNode` | Load balancers, API gateways, reverse proxies, CDN |
| `serverNode` | Backend services, APIs, workers, microservices |
| `cacheNode` | Redis, Memcached, in-memory caches |
| `databaseNode` | Relational DBs, NoSQL, object storage, queues |
| `subflowNode` | Logical grouping container (place BEFORE the nodes it contains) |

Invalid types are silently downgraded to `serverNode` by the app — always use a valid type.

## Edge schema

```ts
{
  id: string,          // e.g. "e-client-lb"
  source: string,      // node id
  target: string,      // node id
  label: string,       // protocol or action (e.g. "HTTPS", "gRPC", "SQL", "Pub/Sub")
  animated: true,
  type: "straight"
}
```

## Layout guidelines

Position nodes so the diagram flows **top-to-bottom** (users at top, data stores at bottom).

| Layer | y range | Examples |
|---|---|---|
| Users / actors | 0–50 | userNode |
| Client / frontend | 150–250 | clientNode |
| Edge / gateway | 350–400 | loadBalancerNode |
| Services | 500–700 | serverNode |
| Cache | 750–800 | cacheNode |
| Databases | 850–950 | databaseNode |

Spread nodes horizontally so they don't overlap. Use x steps of ~220px between siblings. Center each layer around x=400. For `subflowNode` containers use `style: { width: 420, height: 280 }` and set `zIndex: -1`.

## Output format

Output the complete JSON block first, then invoke the Write tool to save it as `diagram-output.json`.

```json
{
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

The file is importable directly via the app's **Load** panel (saved diagrams sidebar) or can be pasted into the JSON import feature.
