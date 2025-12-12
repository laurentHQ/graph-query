#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
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
    edgesByTarget
  };

  graphs.set(absolutePath, indexed);
  return indexed;
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

// Create MCP server
const server = new Server(
  {
    name: 'graph-query',
    version: '1.0.0',
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
      {
        name: 'search_graph',
        description: 'Search for nodes in a knowledge graph by keyword. Searches across node ID, label, and description. Returns matching nodes with their metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: {
              type: 'string',
              description: 'Absolute path to the graph_data.json file (e.g., /mnt/disk_2/ml_project/document_extraction_orchestrator/orchestration/docs/architecture/graph_data.json)',
            },
            query: {
              type: 'string',
              description: 'Search keyword (e.g., "webhook", "extraction", "filesystem")',
            },
            type: {
              type: 'string',
              description: 'Optional: Filter by node type (e.g., "Function", "Workflow", "Concept")',
            },
            layer: {
              type: 'string',
              description: 'Optional: Filter by layer ("workflow", "conceptual", "technical")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)',
            },
          },
          required: ['graph_path', 'query'],
        },
      },
      {
        name: 'get_node',
        description: 'Get detailed information about a specific node including its incoming/outgoing connections and neighbors. Returns the node with full context.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: {
              type: 'string',
              description: 'Absolute path to the graph_data.json file',
            },
            node_id: {
              type: 'string',
              description: 'Node ID (e.g., "tech_endpoint_post", "workflow_ingestion")',
            },
          },
          required: ['graph_path', 'node_id'],
        },
      },
      {
        name: 'get_neighbors',
        description: 'Get all neighboring nodes (connected nodes) of a specific node. Can filter by direction (incoming/outgoing) and edge type.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: {
              type: 'string',
              description: 'Absolute path to the graph_data.json file',
            },
            node_id: {
              type: 'string',
              description: 'Node ID to get neighbors for',
            },
            direction: {
              type: 'string',
              enum: ['incoming', 'outgoing', 'both'],
              description: 'Direction of edges (default: "both")',
            },
            edge_type: {
              type: 'string',
              description: 'Optional: Filter by edge type (e.g., "calls", "implements", "contains")',
            },
          },
          required: ['graph_path', 'node_id'],
        },
      },
      {
        name: 'find_path',
        description: 'Find paths between two nodes in the graph. Uses breadth-first search to find shortest paths. Returns up to 3 paths.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: {
              type: 'string',
              description: 'Absolute path to the graph_data.json file',
            },
            from_id: {
              type: 'string',
              description: 'Start node ID',
            },
            to_id: {
              type: 'string',
              description: 'End node ID',
            },
            max_depth: {
              type: 'number',
              description: 'Maximum path length (default: 5)',
            },
          },
          required: ['graph_path', 'from_id', 'to_id'],
        },
      },
      {
        name: 'get_node_types',
        description: 'Get statistics about node types in the graph. Returns a count of nodes for each type.',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: {
              type: 'string',
              description: 'Absolute path to the graph_data.json file',
            },
          },
          required: ['graph_path'],
        },
      },
      {
        name: 'list_layer',
        description: 'List all nodes in a specific layer (workflow, conceptual, or technical).',
        inputSchema: {
          type: 'object',
          properties: {
            graph_path: {
              type: 'string',
              description: 'Absolute path to the graph_data.json file',
            },
            layer: {
              type: 'string',
              enum: ['workflow', 'conceptual', 'technical'],
              description: 'Layer name',
            },
          },
          required: ['graph_path', 'layer'],
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
      case 'search_graph': {
        const results = searchNodes(graph, args.query, {
          type: args.type,
          layer: args.layer,
          limit: args.limit,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'get_node': {
        const result = getNode(graph, args.node_id);
        if (!result) {
          return {
            content: [
              {
                type: 'text',
                text: `Node not found: ${args.node_id}`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_neighbors': {
        const neighbors = getNeighbors(graph, args.node_id, {
          direction: args.direction,
          edgeType: args.edge_type,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(neighbors, null, 2),
            },
          ],
        };
      }

      case 'find_path': {
        const paths = findPath(graph, args.from_id, args.to_id, args.max_depth);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(paths, null, 2),
            },
          ],
        };
      }

      case 'get_node_types': {
        const types = getNodeTypes(graph);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(types, null, 2),
            },
          ],
        };
      }

      case 'list_layer': {
        const layer = graph.raw.layers[args.layer];
        if (!layer) {
          return {
            content: [
              {
                type: 'text',
                text: `Layer not found: ${args.layer}`,
              },
            ],
            isError: true,
          };
        }

        const nodes = layer.map(id => graph.nodeById.get(id));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(nodes, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Graph Query MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
