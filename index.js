#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Graph cache
const graphs = new Map();

// Load graph from file
function loadGraph(graphPath) {
  const absolutePath = resolve(graphPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Graph file not found: ${absolutePath}`);
  }

  if (graphs.has(absolutePath)) {
    return graphs.get(absolutePath);
  }

  const content = readFileSync(absolutePath, 'utf-8');
  const graph = JSON.parse(content);

  // Build indexes for fast lookup
  const nodeById = new Map();
  const nodesByType = new Map();
  const edgesBySource = new Map();
  const edgesByTarget = new Map();

  // Index nodes
  for (const node of graph.nodes) {
    nodeById.set(node.id, node);

    if (!nodesByType.has(node.type)) {
      nodesByType.set(node.type, []);
    }
    nodesByType.get(node.type).push(node);
  }

  // Index edges
  for (const edge of graph.edges) {
    if (!edgesBySource.has(edge.source)) {
      edgesBySource.set(edge.source, []);
    }
    edgesBySource.get(edge.source).push(edge);

    if (!edgesByTarget.has(edge.target)) {
      edgesByTarget.set(edge.target, []);
    }
    edgesByTarget.get(edge.target).push(edge);
  }

  const indexed = {
    raw: graph,
    nodeById,
    nodesByType,
    edgesBySource,
    edgesByTarget,
    path: absolutePath
  };

  graphs.set(absolutePath, indexed);
  return indexed;
}

// Invalidate cache for a graph
function invalidateGraph(graphPath) {
  const absolutePath = resolve(graphPath);
  graphs.delete(absolutePath);
}

// Search nodes by keyword
function searchNodes(graph, query, options = {}) {
  const { type, layer, limit = 20 } = options;
  const queryLower = query.toLowerCase();
  const results = [];

  for (const node of graph.raw.nodes) {
    // Filter by type
    if (type && node.type !== type) continue;

    // Filter by layer
    if (layer && graph.raw.layers[layer] && !graph.raw.layers[layer].includes(node.id)) {
      continue;
    }

    // Search in id, label, description
    const searchText = `${node.id} ${node.label} ${node.description || ''}`.toLowerCase();
    if (searchText.includes(queryLower)) {
      results.push(node);
      if (results.length >= limit) break;
    }
  }

  return results;
}

// Get node with full context
function getNode(graph, nodeId) {
  const node = graph.nodeById.get(nodeId);
  if (!node) return null;

  // Get incoming edges (what points to this)
  const incoming = graph.edgesByTarget.get(nodeId) || [];

  // Get outgoing edges (what this points to)
  const outgoing = graph.edgesBySource.get(nodeId) || [];

  // Get neighbor nodes
  const incomingNodes = incoming.map(e => ({
    ...graph.nodeById.get(e.source),
    edgeType: e.type
  }));

  const outgoingNodes = outgoing.map(e => ({
    ...graph.nodeById.get(e.target),
    edgeType: e.type
  }));

  return {
    node,
    incoming: incomingNodes,
    outgoing: outgoingNodes,
    layer: findNodeLayer(graph, nodeId)
  };
}

// Find which layer a node belongs to
function findNodeLayer(graph, nodeId) {
  for (const [layerName, nodeIds] of Object.entries(graph.raw.layers)) {
    if (nodeIds.includes(nodeId)) {
      return layerName;
    }
  }
  return null;
}

// Get all neighbors (both incoming and outgoing)
function getNeighbors(graph, nodeId, options = {}) {
  const { direction = 'both', edgeType } = options;
  const neighbors = [];

  if (direction === 'incoming' || direction === 'both') {
    const incoming = graph.edgesByTarget.get(nodeId) || [];
    for (const edge of incoming) {
      if (edgeType && edge.type !== edgeType) continue;
      const node = graph.nodeById.get(edge.source);
      if (node) {
        neighbors.push({
          node,
          edgeType: edge.type,
          direction: 'incoming'
        });
      }
    }
  }

  if (direction === 'outgoing' || direction === 'both') {
    const outgoing = graph.edgesBySource.get(nodeId) || [];
    for (const edge of outgoing) {
      if (edgeType && edge.type !== edgeType) continue;
      const node = graph.nodeById.get(edge.target);
      if (node) {
        neighbors.push({
          node,
          edgeType: edge.type,
          direction: 'outgoing'
        });
      }
    }
  }

  return neighbors;
}

// Find path between two nodes (BFS)
function findPath(graph, fromId, toId, maxDepth = 5) {
  if (fromId === toId) return [[fromId]];

  const queue = [[fromId]];
  const visited = new Set([fromId]);
  const paths = [];

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (path.length > maxDepth) continue;

    const outgoing = graph.edgesBySource.get(current) || [];

    for (const edge of outgoing) {
      const next = edge.target;

      if (next === toId) {
        paths.push([...path, next]);
        if (paths.length >= 3) return paths; // Return first 3 paths
        continue;
      }

      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }

  return paths;
}

// List all node types
function getNodeTypes(graph) {
  const types = new Map();
  for (const [type, nodes] of graph.nodesByType.entries()) {
    types.set(type, nodes.length);
  }
  return Object.fromEntries(types);
}

// Add node to graph
function addNode(graph, nodeData) {
  const { id, type, label, description, file, line, inferred = false } = nodeData;

  // Check if node already exists
  if (graph.nodeById.has(id)) {
    throw new Error(`Node already exists: ${id}`);
  }

  // Validate required fields
  if (!id || !type || !label) {
    throw new Error('Missing required fields: id, type, label');
  }

  // Create node
  const node = { id, type, label, description, inferred };
  if (file) node.file = file;
  if (line) node.line = line;

  // Add to graph
  graph.raw.nodes.push(node);
  graph.nodeById.set(id, node);

  if (!graph.nodesByType.has(type)) {
    graph.nodesByType.set(type, []);
  }
  graph.nodesByType.get(type).push(node);

  return { success: true, node };
}

// Add edge to graph
function addEdge(graph, edgeData) {
  const { source, target, type, layer, description } = edgeData;

  // Validate nodes exist
  if (!graph.nodeById.has(source)) {
    throw new Error(`Source node not found: ${source}`);
  }
  if (!graph.nodeById.has(target)) {
    throw new Error(`Target node not found: ${target}`);
  }

  // Check if edge already exists
  const existingEdges = graph.edgesBySource.get(source) || [];
  const duplicate = existingEdges.find(e => e.target === target && e.type === type);
  if (duplicate) {
    throw new Error(`Edge already exists: ${source} --${type}--> ${target}`);
  }

  // Create edge
  const edge = { source, target, type };
  if (layer) edge.layer = layer;
  if (description) edge.description = description;

  // Add to graph
  graph.raw.edges.push(edge);

  if (!graph.edgesBySource.has(source)) {
    graph.edgesBySource.set(source, []);
  }
  graph.edgesBySource.get(source).push(edge);

  if (!graph.edgesByTarget.has(target)) {
    graph.edgesByTarget.set(target, []);
  }
  graph.edgesByTarget.get(target).push(edge);

  return { success: true, edge };
}

// Add node to layer
function addToLayer(graph, nodeId, layerName) {
  // Validate node exists
  if (!graph.nodeById.has(nodeId)) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  // Create layer if it doesn't exist
  if (!graph.raw.layers[layerName]) {
    graph.raw.layers[layerName] = [];
  }

  // Check if already in layer
  if (graph.raw.layers[layerName].includes(nodeId)) {
    throw new Error(`Node already in layer: ${nodeId} in ${layerName}`);
  }

  // Add to layer
  graph.raw.layers[layerName].push(nodeId);

  return { success: true, layer: layerName, nodeId };
}

// Remove node from graph
function removeNode(graph, nodeId) {
  // Check if node exists
  if (!graph.nodeById.has(nodeId)) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const node = graph.nodeById.get(nodeId);

  // Remove all edges connected to this node
  graph.raw.edges = graph.raw.edges.filter(e => e.source !== nodeId && e.target !== nodeId);

  // Remove from nodes array
  graph.raw.nodes = graph.raw.nodes.filter(n => n.id !== nodeId);

  // Remove from indexes
  graph.nodeById.delete(nodeId);

  const typeNodes = graph.nodesByType.get(node.type) || [];
  graph.nodesByType.set(node.type, typeNodes.filter(n => n.id !== nodeId));

  graph.edgesBySource.delete(nodeId);
  graph.edgesByTarget.delete(nodeId);

  // Remove from all layers
  for (const layerName in graph.raw.layers) {
    graph.raw.layers[layerName] = graph.raw.layers[layerName].filter(id => id !== nodeId);
  }

  return { success: true, removed: nodeId };
}

// Remove edge from graph
function removeEdge(graph, source, target, type) {
  // Find edge
  const edges = graph.edgesBySource.get(source) || [];
  const edge = edges.find(e => e.target === target && e.type === type);

  if (!edge) {
    throw new Error(`Edge not found: ${source} --${type}--> ${target}`);
  }

  // Remove from edges array
  graph.raw.edges = graph.raw.edges.filter(e =>
    !(e.source === source && e.target === target && e.type === type)
  );

  // Remove from indexes
  graph.edgesBySource.set(
    source,
    (graph.edgesBySource.get(source) || []).filter(e =>
      !(e.target === target && e.type === type)
    )
  );

  graph.edgesByTarget.set(
    target,
    (graph.edgesByTarget.get(target) || []).filter(e =>
      !(e.source === source && e.type === type)
    )
  );

  return { success: true, removed: { source, target, type } };
}

// Verify graph integrity
function verifyGraph(graph) {
  const issues = [];
  const warnings = [];

  // Check 1: All edges have valid source/target nodes
  for (const edge of graph.raw.edges) {
    if (!graph.nodeById.has(edge.source)) {
      issues.push(`Edge has invalid source: ${edge.source} --${edge.type}--> ${edge.target}`);
    }
    if (!graph.nodeById.has(edge.target)) {
      issues.push(`Edge has invalid target: ${edge.source} --${edge.type}--> ${edge.target}`);
    }
  }

  // Check 2: All nodes in layers exist
  for (const [layerName, nodeIds] of Object.entries(graph.raw.layers)) {
    for (const nodeId of nodeIds) {
      if (!graph.nodeById.has(nodeId)) {
        issues.push(`Layer ${layerName} references non-existent node: ${nodeId}`);
      }
    }
  }

  // Check 3: Find orphaned nodes (no edges)
  const orphaned = [];
  for (const node of graph.raw.nodes) {
    const incoming = graph.edgesByTarget.get(node.id) || [];
    const outgoing = graph.edgesBySource.get(node.id) || [];
    if (incoming.length === 0 && outgoing.length === 0) {
      orphaned.push(node.id);
    }
  }

  if (orphaned.length > 0) {
    warnings.push(`${orphaned.length} orphaned nodes: ${orphaned.slice(0, 5).join(', ')}${orphaned.length > 5 ? '...' : ''}`);
  }

  // Check 4: Duplicate edges
  const edgeKeys = new Set();
  const duplicates = [];
  for (const edge of graph.raw.edges) {
    const key = `${edge.source}:${edge.type}:${edge.target}`;
    if (edgeKeys.has(key)) {
      duplicates.push(key);
    }
    edgeKeys.add(key);
  }

  if (duplicates.length > 0) {
    issues.push(`${duplicates.length} duplicate edges found`);
  }

  // Check 5: Node coverage in layers
  const nodesInLayers = new Set();
  for (const nodeIds of Object.values(graph.raw.layers)) {
    nodeIds.forEach(id => nodesInLayers.add(id));
  }

  const nodesNotInLayers = graph.raw.nodes.filter(n => !nodesInLayers.has(n.id));
  if (nodesNotInLayers.length > 0) {
    warnings.push(`${nodesNotInLayers.length} nodes not in any layer: ${nodesNotInLayers.slice(0, 5).map(n => n.id).join(', ')}${nodesNotInLayers.length > 5 ? '...' : ''}`);
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    stats: {
      nodes: graph.raw.nodes.length,
      edges: graph.raw.edges.length,
      layers: Object.keys(graph.raw.layers).length,
      orphaned: orphaned.length
    }
  };
}

// Save graph to file
function saveGraph(graph, options = {}) {
  const { backup = true, sort = true } = options;

  // Create backup if requested
  if (backup && existsSync(graph.path)) {
    const backupPath = `${graph.path}.backup`;
    const content = readFileSync(graph.path, 'utf-8');
    writeFileSync(backupPath, content);
  }

  // Sort edges by source for readability
  if (sort) {
    graph.raw.edges.sort((a, b) => {
      if (a.source < b.source) return -1;
      if (a.source > b.source) return 1;
      if (a.target < b.target) return -1;
      if (a.target > b.target) return 1;
      return 0;
    });
  }

  // Write to file
  const content = JSON.stringify(graph.raw, null, 2);
  writeFileSync(graph.path, content);

  // Invalidate cache so it reloads on next access
  invalidateGraph(graph.path);

  return {
    success: true,
    path: graph.path,
    backup: backup ? `${graph.path}.backup` : null
  };
}

// Create MCP server
const server = new Server(
  {
    name: 'graph-query-enhanced',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Read operations
      {
        name: 'search_graph',
        description: 'Search for nodes in a knowledge graph by keyword. Searches across node ID, label, and description.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            query: { type: 'string', description: 'Search keyword' },
            type: { type: 'string', description: 'Optional: Filter by node type' },
            layer: { type: 'string', description: 'Optional: Filter by layer' },
            limit: { type: 'number', description: 'Maximum results (default: 20)' },
          },
          required: ['graph_path', 'query'],
        },
      },
      {
        name: 'get_node',
        description: 'Get detailed information about a specific node including connections.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            node_id: { type: 'string', description: 'Node ID' },
          },
          required: ['graph_path', 'node_id'],
        },
      },
      {
        name: 'get_neighbors',
        description: 'Get all neighboring nodes (connected nodes) of a specific node.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            node_id: { type: 'string', description: 'Node ID' },
            direction: { type: 'string', enum: ['incoming', 'outgoing', 'both'], description: 'Direction (default: both)' },
            edge_type: { type: 'string', description: 'Optional: Filter by edge type' },
          },
          required: ['graph_path', 'node_id'],
        },
      },
      {
        name: 'find_path',
        description: 'Find paths between two nodes in the graph using BFS.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            from_id: { type: 'string', description: 'Start node ID' },
            to_id: { type: 'string', description: 'End node ID' },
            max_depth: { type: 'number', description: 'Maximum path length (default: 5)' },
          },
          required: ['graph_path', 'from_id', 'to_id'],
        },
      },
      {
        name: 'get_node_types',
        description: 'Get statistics about node types in the graph.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
          },
          required: ['graph_path'],
        },
      },
      {
        name: 'list_layer',
        description: 'List all nodes in a specific layer.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            layer: { type: 'string', enum: ['workflow', 'conceptual', 'technical'], description: 'Layer name' },
          },
          required: ['graph_path', 'layer'],
        },
      },

      // Write operations
      {
        name: 'add_node',
        description: 'Add a new node to the graph. Changes are in-memory until save_graph is called.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            id: { type: 'string', description: 'Unique node ID (e.g., "func_myFunction")' },
            type: { type: 'string', description: 'Node type (Workflow, Concept, Service, Module, File, Class, Function, Endpoint, Method)' },
            label: { type: 'string', description: 'Human-readable label' },
            description: { type: 'string', description: 'Detailed description' },
            file: { type: 'string', description: 'Optional: Source file path' },
            line: { type: 'number', description: 'Optional: Line number in file' },
            inferred: { type: 'boolean', description: 'Optional: Whether node is inferred (default: false)' },
          },
          required: ['graph_path', 'id', 'type', 'label'],
        },
      },
      {
        name: 'add_edge',
        description: 'Add a new edge to the graph. Changes are in-memory until save_graph is called.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            source: { type: 'string', description: 'Source node ID' },
            target: { type: 'string', description: 'Target node ID' },
            type: { type: 'string', description: 'Edge type (calls, uses, contains, implements, includes, etc.)' },
            layer: { type: 'string', description: 'Optional: Layer name' },
            description: { type: 'string', description: 'Optional: Edge description' },
          },
          required: ['graph_path', 'source', 'target', 'type'],
        },
      },
      {
        name: 'add_to_layer',
        description: 'Add a node to a layer. Creates layer if it doesn\'t exist.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            node_id: { type: 'string', description: 'Node ID to add' },
            layer: { type: 'string', description: 'Layer name (workflow, conceptual, technical, or custom)' },
          },
          required: ['graph_path', 'node_id', 'layer'],
        },
      },
      {
        name: 'remove_node',
        description: 'Remove a node and all its edges from the graph. Changes are in-memory until save_graph is called.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            node_id: { type: 'string', description: 'Node ID to remove' },
          },
          required: ['graph_path', 'node_id'],
        },
      },
      {
        name: 'remove_edge',
        description: 'Remove an edge from the graph. Changes are in-memory until save_graph is called.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            source: { type: 'string', description: 'Source node ID' },
            target: { type: 'string', description: 'Target node ID' },
            type: { type: 'string', description: 'Edge type' },
          },
          required: ['graph_path', 'source', 'target', 'type'],
        },
      },
      {
        name: 'verify_graph',
        description: 'Verify graph integrity and check for issues like invalid edges, orphaned nodes, duplicates.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
          },
          required: ['graph_path'],
        },
      },
      {
        name: 'save_graph',
        description: 'Save all in-memory changes to the graph file. Creates backup by default.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: { type: 'string', description: 'Absolute path to graph_data.json' },
            backup: { type: 'boolean', description: 'Create backup before saving (default: true)' },
            sort: { type: 'boolean', description: 'Sort edges for readability (default: true)' },
          },
          required: ['graph_path'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const graph = loadGraph(args.graph_path);

    switch (name) {
      // Read operations
      case 'search_graph': {
        const results = searchNodes(graph, args.query, {
          type: args.type,
          layer: args.layer,
          limit: args.limit,
        });
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      }

      case 'get_node': {
        const result = getNode(graph, args.node_id);
        if (!result) {
          return {
            content: [{ type: 'text', text: `Node not found: ${args.node_id}` }],
            isError: true,
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_neighbors': {
        const neighbors = getNeighbors(graph, args.node_id, {
          direction: args.direction,
          edgeType: args.edge_type,
        });
        return { content: [{ type: 'text', text: JSON.stringify(neighbors, null, 2) }] };
      }

      case 'find_path': {
        const paths = findPath(graph, args.from_id, args.to_id, args.max_depth);
        return { content: [{ type: 'text', text: JSON.stringify(paths, null, 2) }] };
      }

      case 'get_node_types': {
        const types = getNodeTypes(graph);
        return { content: [{ type: 'text', text: JSON.stringify(types, null, 2) }] };
      }

      case 'list_layer': {
        const layer = graph.raw.layers[args.layer];
        if (!layer) {
          return {
            content: [{ type: 'text', text: `Layer not found: ${args.layer}` }],
            isError: true,
          };
        }
        const nodes = layer.map(id => graph.nodeById.get(id));
        return { content: [{ type: 'text', text: JSON.stringify(nodes, null, 2) }] };
      }

      // Write operations
      case 'add_node': {
        const result = addNode(graph, args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'add_edge': {
        const result = addEdge(graph, args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'add_to_layer': {
        const result = addToLayer(graph, args.node_id, args.layer);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'remove_node': {
        const result = removeNode(graph, args.node_id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'remove_edge': {
        const result = removeEdge(graph, args.source, args.target, args.type);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'verify_graph': {
        const result = verifyGraph(graph);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'save_graph': {
        const result = saveGraph(graph, {
          backup: args.backup !== false,
          sort: args.sort !== false,
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Graph Query MCP Server (Enhanced) running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
