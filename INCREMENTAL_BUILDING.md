# Incremental Graph Building Guide

## Overview

The enhanced graph-query MCP server now supports incremental graph building, allowing you to add nodes, edges, and layers programmatically without manually editing JSON files.

## New MCP Tools

### Write Operations

#### 1. **add_node** - Add a new node

```javascript
mcp__graph-query__add_node({
  graph_path: "/path/to/graph_data.json",
  id: "func_myNewActivity",           // Unique ID (required)
  type: "Function",                    // Node type (required)
  label: "myNewActivity",              // Human-readable label (required)
  description: "Activity that does X", // Detailed description (optional)
  file: "src/activities/new.ts",      // Source file (optional)
  line: 42,                            // Line number (optional)
  inferred: false                      // Whether inferred (optional, default: false)
})
```

**Node Types:**
- `Workflow` - Business workflow
- `Concept` - Domain concept
- `Service` - Service component
- `Module` - Code module
- `File` - Source file
- `Class` - Class definition
- `Function` - Function/method
- `Endpoint` - HTTP endpoint
- `Method` - Method/operation

**Response:**
```json
{
  "success": true,
  "node": { "id": "func_myNewActivity", ... }
}
```

**Errors:**
- Node ID already exists
- Missing required fields (id, type, label)

#### 2. **add_edge** - Connect two nodes

```javascript
mcp__graph-query__add_edge({
  graph_path: "/path/to/graph_data.json",
  source: "workflow_case_orchestration", // Source node ID (required)
  target: "func_myNewActivity",          // Target node ID (required)
  type: "calls",                         // Edge type (required)
  layer: "workflow-to-technical",        // Layer name (optional)
  description: "Workflow calls activity" // Description (optional)
})
```

**Edge Types:**
- `calls` - Function/workflow calls
- `uses` - Activity uses client
- `contains` - Module contains file
- `implements` - Client implements concept
- `includes` - Workflow includes concept
- `signals` - Webhook signals workflow
- `triggers` - Event triggers action
- `imports` - File imports module

**Response:**
```json
{
  "success": true,
  "edge": { "source": "...", "target": "...", "type": "..." }
}
```

**Errors:**
- Source or target node not found
- Edge already exists
- Invalid node IDs

#### 3. **add_to_layer** - Add node to a layer

```javascript
mcp__graph-query__add_to_layer({
  graph_path: "/path/to/graph_data.json",
  node_id: "func_myNewActivity",
  layer: "technical"  // workflow, conceptual, technical, or custom
})
```

**Standard Layers:**
- `workflow` - Business workflows
- `conceptual` - Domain concepts
- `technical` - Implementation (modules, files, classes, functions)

**Response:**
```json
{
  "success": true,
  "layer": "technical",
  "nodeId": "func_myNewActivity"
}
```

**Errors:**
- Node not found
- Node already in layer

#### 4. **remove_node** - Remove a node

```javascript
mcp__graph-query__remove_node({
  graph_path: "/path/to/graph_data.json",
  node_id: "func_oldActivity"
})
```

**Behavior:**
- Removes node from graph
- Removes all edges connected to this node
- Removes node from all layers
- Changes are in-memory until `save_graph`

**Response:**
```json
{
  "success": true,
  "removed": "func_oldActivity"
}
```

#### 5. **remove_edge** - Remove an edge

```javascript
mcp__graph-query__remove_edge({
  graph_path: "/path/to/graph_data.json",
  source: "workflow_test",
  target: "func_oldActivity",
  type: "calls"
})
```

**Response:**
```json
{
  "success": true,
  "removed": { "source": "...", "target": "...", "type": "..." }
}
```

### Verification & Persistence

#### 6. **verify_graph** - Check graph integrity

```javascript
mcp__graph-query__verify_graph({
  graph_path: "/path/to/graph_data.json"
})
```

**Checks performed:**
- ✅ All edges have valid source/target nodes
- ✅ All layer references point to existing nodes
- ⚠️  Orphaned nodes (no connections)
- ⚠️  Nodes not in any layer
- ❌ Duplicate edges

**Response:**
```json
{
  "valid": true,
  "issues": [],
  "warnings": [
    "2 orphaned nodes: node1, node2",
    "5 nodes not in any layer: ..."
  ],
  "stats": {
    "nodes": 112,
    "edges": 187,
    "layers": 3,
    "orphaned": 2
  }
}
```

#### 7. **save_graph** - Persist changes to disk

```javascript
mcp__graph-query__save_graph({
  graph_path: "/path/to/graph_data.json",
  backup: true,  // Create .backup file (default: true)
  sort: true     // Sort edges for readability (default: true)
})
```

**Behavior:**
- Creates backup file (graph_data.json.backup)
- Sorts edges by source → target
- Writes formatted JSON (2-space indent)
- Invalidates cache (forces reload on next access)

**Response:**
```json
{
  "success": true,
  "path": "/path/to/graph_data.json",
  "backup": "/path/to/graph_data.json.backup"
}
```

## Workflow Examples

### Example 1: Add a new activity and connect it

```javascript
// Step 1: Add the function node
mcp__graph-query__add_node({
  graph_path: "/mnt/.../orchestration/docs/architecture/graph_data.json",
  id: "func_validateInput",
  type: "Function",
  label: "validateInput",
  description: "Activity that validates input data before processing",
  file: "src/temporal/activities/validation.ts",
  line: 15
})

// Step 2: Connect workflow to activity
mcp__graph-query__add_edge({
  graph_path: "/mnt/.../orchestration/docs/architecture/graph_data.json",
  source: "workflow_case_orchestration",
  target: "func_validateInput",
  type: "calls",
  layer: "workflow-to-technical"
})

// Step 3: Add to technical layer
mcp__graph-query__add_to_layer({
  graph_path: "/mnt/.../orchestration/docs/architecture/graph_data.json",
  node_id: "func_validateInput",
  layer: "technical"
})

// Step 4: Verify integrity
mcp__graph-query__verify_graph({
  graph_path: "/mnt/.../orchestration/docs/architecture/graph_data.json"
})

// Step 5: Save changes
mcp__graph-query__save_graph({
  graph_path: "/mnt/.../orchestration/docs/architecture/graph_data.json",
  backup: true,
  sort: true
})
```

### Example 2: Add a new service client integration

```javascript
// Add service client class
mcp__graph-query__add_node({
  graph_path: "/mnt/.../graph_data.json",
  id: "class_GeneratedNotificationServiceClient",
  type: "Class",
  label: "GeneratedNotificationServiceClient",
  description: "Generated client for Notification Service API",
  file: "src/temporal/clients/generated.ts"
})

// Add client method
mcp__graph-query__add_node({
  graph_path: "/mnt/.../graph_data.json",
  id: "method_sendNotification",
  type: "Method",
  label: "sendNotification",
  description: "Sends notification via Notification Service"
})

// Connect client to method
mcp__graph-query__add_edge({
  graph_path: "/mnt/.../graph_data.json",
  source: "class_GeneratedNotificationServiceClient",
  target: "method_sendNotification",
  type: "contains",
  layer: "technical"
})

// Add notification concept
mcp__graph-query__add_node({
  graph_path: "/mnt/.../graph_data.json",
  id: "concept_notifications",
  type: "Concept",
  label: "Notifications",
  description: "User notification and alert management"
})

// Connect client to concept
mcp__graph-query__add_edge({
  graph_path: "/mnt/.../graph_data.json",
  source: "class_GeneratedNotificationServiceClient",
  target: "concept_notifications",
  type: "implements",
  layer: "technical-to-conceptual"
})

// Add activity that uses the client
mcp__graph-query__add_node({
  graph_path: "/mnt/.../graph_data.json",
  id: "func_sendNotification",
  type: "Function",
  label: "sendNotification",
  description: "Activity: sends notification to user",
  file: "src/temporal/activities/notifications.ts",
  line: 10
})

// Connect activity to client
mcp__graph-query__add_edge({
  graph_path: "/mnt/.../graph_data.json",
  source: "func_sendNotification",
  target: "class_GeneratedNotificationServiceClient",
  type: "uses",
  layer: "technical"
})

// Connect workflow to activity
mcp__graph-query__add_edge({
  graph_path: "/mnt/.../graph_data.json",
  source: "workflow_case_orchestration",
  target: "func_sendNotification",
  type: "calls",
  layer: "workflow-to-technical"
})

// Add nodes to layers
mcp__graph-query__add_to_layer({
  graph_path: "/mnt/.../graph_data.json",
  node_id: "concept_notifications",
  layer: "conceptual"
})

mcp__graph-query__add_to_layer({
  graph_path: "/mnt/.../graph_data.json",
  node_id: "func_sendNotification",
  layer: "technical"
})

// Verify and save
mcp__graph-query__verify_graph({
  graph_path: "/mnt/.../graph_data.json"
})

mcp__graph-query__save_graph({
  graph_path: "/mnt/.../graph_data.json"
})
```

### Example 3: Bulk node creation (multiple files)

```javascript
// Add multiple files in a module
const files = [
  { id: "file_validation_ts", label: "validation.ts", file: "src/utils/validation.ts" },
  { id: "file_formatting_ts", label: "formatting.ts", file: "src/utils/formatting.ts" },
  { id: "file_logging_ts", label: "logging.ts", file: "src/utils/logging.ts" }
];

files.forEach(fileData => {
  mcp__graph-query__add_node({
    graph_path: "/mnt/.../graph_data.json",
    id: fileData.id,
    type: "File",
    label: fileData.label,
    description: `Source file: ${fileData.file}`,
    file: fileData.file
  });

  // Connect module to file
  mcp__graph-query__add_edge({
    graph_path: "/mnt/.../graph_data.json",
    source: "module_utils",
    target: fileData.id,
    type: "contains",
    layer: "technical"
  });
});

// Verify and save
mcp__graph-query__verify_graph({
  graph_path: "/mnt/.../graph_data.json"
})

mcp__graph-query__save_graph({
  graph_path: "/mnt/.../graph_data.json"
})
```

## Best Practices

### 1. Always Verify Before Saving

```javascript
// Check integrity first
const result = mcp__graph-query__verify_graph({ graph_path: "..." });

if (result.valid) {
  // Safe to save
  mcp__graph-query__save_graph({ graph_path: "..." });
} else {
  // Fix issues first
  console.log("Issues:", result.issues);
}
```

### 2. Use Consistent Naming Conventions

- **IDs**: `{type}_{name}` (e.g., `func_startOCRJob`, `class_BeeduClient`)
- **Types**: Use standard types (Workflow, Concept, Function, etc.)
- **Layers**: Stick to workflow, conceptual, technical

### 3. Add Edges After Nodes

```javascript
// ✅ Good: Create nodes first, then edges
add_node({ id: "node1", ... });
add_node({ id: "node2", ... });
add_edge({ source: "node1", target: "node2", ... });

// ❌ Bad: Edge before nodes exist
add_edge({ source: "node1", target: "node2", ... });  // Will fail
add_node({ id: "node1", ... });
```

### 4. Use Descriptive Descriptions

```javascript
// ✅ Good: Detailed description
add_node({
  id: "func_validatePayment",
  description: "Activity that validates payment data with fraud detection, checks amount limits, and verifies payment method"
})

// ❌ Bad: Vague description
add_node({
  id: "func_validatePayment",
  description: "Validates payment"
})
```

### 5. Backup Before Major Changes

```javascript
// Always create backup
mcp__graph-query__save_graph({
  graph_path: "...",
  backup: true  // Creates .backup file
})
```

## Troubleshooting

### Error: "Node already exists"

```javascript
// Check if node exists first
const existing = mcp__graph-query__get_node({
  graph_path: "...",
  node_id: "func_myActivity"
});

if (!existing) {
  // Safe to add
  mcp__graph-query__add_node({ ... });
}
```

### Error: "Edge already exists"

```javascript
// Check existing edges
const neighbors = mcp__graph-query__get_neighbors({
  graph_path: "...",
  node_id: "workflow_test",
  direction: "outgoing"
});

// Check if target already connected
const alreadyConnected = neighbors.some(n => n.node.id === "func_target");
```

### Warning: "Orphaned nodes"

Orphaned nodes have no connections. To fix:

```javascript
// Add at least one edge
mcp__graph-query__add_edge({
  source: "parent_node",
  target: "orphaned_node",
  type: "contains"
});
```

### Warning: "Nodes not in any layer"

```javascript
// Add to appropriate layer
mcp__graph-query__add_to_layer({
  node_id: "unlayered_node",
  layer: "technical"  // or workflow/conceptual
});
```

## Performance Notes

- **In-memory operations**: Changes are cached until `save_graph`
- **Batch operations**: Add multiple nodes/edges before saving
- **Cache invalidation**: `save_graph` clears cache, forces reload
- **File I/O**: Only on `loadGraph` and `save_graph`

## Version

Enhanced graph-query v2.0.0 with incremental building support
