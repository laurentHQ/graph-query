# Graph Query MCP Server

Fast MCP server for querying, navigating, and incrementally building knowledge graphs.

## Version

**v2.0.0** - Enhanced with incremental graph building

## Installation

Already installed! The server is configured in:
- `~/.claude/mcp.json`

## Features

✅ **Read Operations** - Search, navigate, query graphs
✅ **Write Operations** - Add nodes, edges, layers incrementally
✅ **Verification** - Check graph integrity and structure
✅ **Persistence** - Save changes with automatic backups

## Usage

The server provides **13 tools** for complete graph management:

### Read Operations (7 tools)

#### 1. **search_graph** - Search for nodes
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "query": "webhook",           // Search keyword
  "type": "Function",            // Optional: filter by node type
  "layer": "technical",          // Optional: filter by layer
  "limit": 20                    // Optional: max results
}
```

**Example searches:**
- `"webhook"` - Find all webhook-related nodes
- `"extraction"` with `type: "Function"` - Find extraction functions
- `"filesystem"` - Find filesystem-related code
- `"idempotency"` - Find idempotency implementations

### 2. **get_node** - Get detailed node info
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "node_id": "tech_endpoint_post"
}
```

**Returns:**
- Node details (id, type, label, description, file, line)
- Incoming connections (what points to this node)
- Outgoing connections (what this node points to)
- Layer membership

### 3. **get_neighbors** - Get connected nodes
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "node_id": "tech_sse_manager",
  "direction": "both",           // "incoming", "outgoing", or "both"
  "edge_type": "calls"           // Optional: filter by edge type
}
```

**Use cases:**
- Find what calls a function
- Find what a function calls
- Trace dependencies

### 4. **find_path** - Find paths between nodes
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "from_id": "workflow_ingestion",
  "to_id": "tech_db_upsert",
  "max_depth": 5                 // Optional: max path length
}
```

**Returns:** Up to 3 shortest paths

### 5. **get_node_types** - Get node type statistics
```javascript
{
  "graph_path": "/path/to/graph_data.json"
}
```

**Returns:**
```json
{
  "Workflow": 3,
  "Concept": 12,
  "Function": 32,
  "File": 48,
  ...
}
```

#### 6. **list_layer** - List all nodes in a layer
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "layer": "workflow"            // "workflow", "conceptual", or "technical"
}
```

#### 7. **get_node_types** - Get node type statistics
```javascript
{
  "graph_path": "/path/to/graph_data.json"
}
```

Returns: `{ "Workflow": 3, "Function": 32, "File": 48, ... }`

---

### Write Operations (5 tools)

#### 8. **add_node** - Add a new node
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "id": "func_myActivity",
  "type": "Function",
  "label": "myActivity",
  "description": "Activity description",
  "file": "src/activities/new.ts",
  "line": 42
}
```

**Node types**: Workflow, Concept, Service, Module, File, Class, Function, Endpoint, Method

#### 9. **add_edge** - Connect two nodes
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "source": "workflow_test",
  "target": "func_myActivity",
  "type": "calls",
  "layer": "workflow-to-technical"
}
```

**Edge types**: calls, uses, contains, implements, includes, signals, triggers, imports

#### 10. **add_to_layer** - Add node to a layer
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "node_id": "func_myActivity",
  "layer": "technical"
}
```

#### 11. **remove_node** - Remove a node
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "node_id": "func_oldActivity"
}
```

Removes node and all connected edges.

#### 12. **remove_edge** - Remove an edge
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "source": "workflow_test",
  "target": "func_oldActivity",
  "type": "calls"
}
```

---

### Verification & Persistence (2 tools)

#### 13. **verify_graph** - Check graph integrity
```javascript
{
  "graph_path": "/path/to/graph_data.json"
}
```

Returns validation report with issues, warnings, and stats.

#### 14. **save_graph** - Persist changes to disk
```javascript
{
  "graph_path": "/path/to/graph_data.json",
  "backup": true,  // Create backup file (default: true)
  "sort": true     // Sort edges (default: true)
}
```

Creates `.backup` file before writing changes.

## Graph Paths

For this project:

**Orchestration graph:**
```
/mnt/disk_2/ml_project/document_extraction_orchestrator/orchestration/docs/architecture/graph_data.json
```

**Results service graph:**
```
/mnt/disk_2/ml_project/document_extraction_orchestrator/results-service/docs/architecture/graph_data.json
```

## Performance

- **In-memory indexing**: Graphs are cached in memory with indexes
- **Fast lookups**: O(1) node lookup, O(edges) neighbor lookup
- **Lazy loading**: Graphs loaded on first use
- **BFS pathfinding**: Efficient path search with depth limits

## Architecture

### Indexes
- `nodeById`: Map of node ID → node object
- `nodesByType`: Map of node type → array of nodes
- `edgesBySource`: Map of source node → outgoing edges
- `edgesByTarget`: Map of target node → incoming edges

### Search Algorithm
Searches across:
- Node ID
- Node label
- Node description (full text)

Case-insensitive substring matching.

## Example Claude Code Usage

```typescript
// Search for webhook implementations
await mcp.call('search_graph', {
  graph_path: '/PATH/TO/graph_data.json',
  query: 'webhook',
  type: 'Function'
});

// Get details about a specific function
await mcp.call('get_node', {
  graph_path: '/PATH/TO/graph_data.json',
  node_id: 'tech_endpoint_post'
});

// Find how workflow connects to database
await mcp.call('find_path', {
  graph_path: '/PATH/TO/graph_data.json',
  from_id: 'workflow_ingestion',
  to_id: 'tech_db_upsert'
});
```

## Troubleshooting

**Server not appearing:**
- Restart Claude Code to reload MCP configuration
- Check `~/.claude/mcp.json`

**Graph not found:**
- Use absolute paths for `graph_path` parameter
- Verify file exists: `ls -la /path/to/graph_data.json`

**Slow performance:**
- First query loads and indexes the graph (1-2 seconds)
- Subsequent queries are fast (< 10ms)
- Graphs are cached per process

## Quick Start: Incremental Building

### Add a new activity to the graph

```javascript
// 1. Add the function node
add_node({
  graph_path: "/path/to/graph_data.json",
  id: "func_validateInput",
  type: "Function",
  label: "validateInput",
  description: "Validates input data",
  file: "src/activities/validation.ts",
  line: 15
})

// 2. Connect workflow to activity
add_edge({
  graph_path: "/path/to/graph_data.json",
  source: "workflow_case_orchestration",
  target: "func_validateInput",
  type: "calls"
})

// 3. Add to technical layer
add_to_layer({
  graph_path: "/path/to/graph_data.json",
  node_id: "func_validateInput",
  layer: "technical"
})

// 4. Verify integrity
verify_graph({
  graph_path: "/path/to/graph_data.json"
})

// 5. Save changes
save_graph({
  graph_path: "/path/to/graph_data.json",
  backup: true
})
```

See [INCREMENTAL_BUILDING.md](./docs/INCREMENTAL_BUILDING.md) for detailed examples.

## Development

Located at: `graph-query/`

**Files:**
- `index.js` - Enhanced server with incremental building
- `index-v1.js` - Original read-only version (backup)
- `package.json` - Dependencies and metadata
- `README.md` - This file
- `INCREMENTAL_BUILDING.md` - Detailed guide for write operations
- `QUICK_START.md` - Quick reference
- `test-incremental-building.js` - Test suite

**To update:**
```bash
cd ~/.claude/mcp-servers/graph-query
# Edit index.js
# Restart Claude Code to reload
```

## Version History

- **v2.0.0** - Added incremental building (add/remove nodes/edges, verify, save)
- **v1.0.0** - Initial release with 6 read-only query tools
