# Quick Start Guide

## ✅ Installation Complete

The MCP server is installed and configured. **Restart Claude Code** to activate it.

## 📍 Graph Locations

```bash
# repo service (139 nodes)
/PATH/TO/graph_data.json

```

## 🚀 Quick Examples

### Search for webhook code
```javascript
mcp__graph-query__search_graph({
  graph_path: "/PATH/TO//graph_data.json",
  query: "webhook",
  type: "Function",
  limit: 10
})
```

### Get function details
```javascript
mcp__graph-query__get_node({
  graph_path: "/PATH/TO//graph_data.json",
  node_id: "func_case_orchestration_workflow"
})
```

### Find what calls a function
```javascript
mcp__graph-query__get_neighbors({
  graph_path: "/PATH/TO//graph_data.json",
  node_id: "func_start_extraction_job",
  direction: "incoming"
})
```

### Trace workflow to implementation
```javascript
mcp__graph-query__find_path({
  graph_path: "/PATH/TO//graph_data.json",
  from_id: "workflow_case_orchestration",
  to_id: "func_retrieve_ocr_results"
})
```

### See all node types
```javascript
mcp__graph-query__get_node_types({
  graph_path: "/PATH/TO//graph_data.json"
})
```

### List workflow layer
```javascript
mcp__graph-query__list_layer({
  graph_path: "/PATH/TO//graph_data.json",
  layer: "workflow"
})
```

## 🎯 Common Use Cases

### "Where is feature X implemented?"
1. `search_graph` with keyword
2. `get_node` for each result
3. Check `file` and `line` fields

### "What depends on this function?"
1. `get_neighbors` with `direction: "incoming"`
2. Trace back through callers

### "How does workflow Y work?"
1. `get_node` on workflow node
2. `get_neighbors` with `direction: "outgoing"`
3. Follow `calls` and `implements` edges

### "Find all database operations"
1. `search_graph` with `query: "database"`
2. Filter by `type: "Function"` or `type: "Method"`

## 🔍 Search Tips

- **Keywords**: Use domain terms (webhook, extraction, lock, redis, postgres)
- **Type filters**: Narrow by Function, Workflow, Concept, File, Class
- **Layer filters**: Focus on workflow (business), conceptual (domain), or technical (implementation)
- **Descriptions**: Search includes full descriptions with technical details

## ⚡ Performance Notes

- First query per graph: ~1-2 seconds (loads + indexes)
- Subsequent queries: < 10ms (cached in memory)
- BFS pathfinding: Fast for typical graphs (< 100ms)
- Memory usage: ~5-10MB per graph

## 🐛 Troubleshooting

**Tools not appearing:**
- Restart Claude Code completely
- Check config: `cat ~/.claude/mcp.json`
- Verify server: `node ~/.claude/mcp-servers/graph-query/index.js`

**"Graph file not found":**
- Use absolute paths (start with `/`)
- Check file exists: `ls -la /path/to/graph_data.json`
- See "Graph Locations" section above

**Slow performance:**
- Normal for first query (indexing)
- If always slow, check graph file size
- Large graphs (> 1000 nodes) may need optimization

## 📊 Current Stats

**Orchestration graph:**
- 139 nodes (3 workflows, 12 concepts, 124 technical)
- 178 edges
- Complete 3-layer coverage

**Results service graph:**
- 13 nodes (3 workflows, 3 concepts, 7 technical)
- 13 edges
- Focused on ingestion/monitoring/retrieval

## 🔄 Next Steps

1. **Restart Claude Code** to load the server
2. Try a search: `search_graph` with `query: "webhook"`
3. Explore results with `get_node`
4. Navigate relationships with `get_neighbors`

Happy exploring! 🎉
