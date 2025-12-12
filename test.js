#!/usr/bin/env node

/**
 * Simple test script for graph-query MCP server
 * Usage: node test.js
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Import the graph loading and query functions
const graphPath = '/mnt/disk_2/ml_project/document_extraction_orchestrator/results-service/docs/graph_data.json';

console.log('🧪 Testing Graph Query MCP Server\n');

// Test 1: Load graph
console.log('Test 1: Load graph file');
try {
  const content = readFileSync(graphPath, 'utf-8');
  const graph = JSON.parse(content);
  console.log(`✅ Loaded graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges\n`);
} catch (error) {
  console.error(`❌ Failed to load graph: ${error.message}\n`);
  process.exit(1);
}

// Test 2: Build indexes
console.log('Test 2: Build indexes');
try {
  const content = readFileSync(graphPath, 'utf-8');
  const graph = JSON.parse(content);

  const nodeById = new Map();
  const nodesByType = new Map();

  for (const node of graph.nodes) {
    nodeById.set(node.id, node);
    if (!nodesByType.has(node.type)) {
      nodesByType.set(node.type, []);
    }
    nodesByType.get(node.type).push(node);
  }

  console.log(`✅ Built indexes:`);
  console.log(`   - ${nodeById.size} nodes indexed by ID`);
  console.log(`   - ${nodesByType.size} node types:`);
  for (const [type, nodes] of nodesByType) {
    console.log(`     - ${type}: ${nodes.length} nodes`);
  }
  console.log();
} catch (error) {
  console.error(`❌ Failed to build indexes: ${error.message}\n`);
  process.exit(1);
}

// Test 3: Search functionality
console.log('Test 3: Search for "webhook"');
try {
  const content = readFileSync(graphPath, 'utf-8');
  const graph = JSON.parse(content);

  const query = 'webhook';
  const results = [];

  for (const node of graph.nodes) {
    const searchText = `${node.id} ${node.label} ${node.description || ''}`.toLowerCase();
    if (searchText.includes(query.toLowerCase())) {
      results.push(node);
    }
  }

  console.log(`✅ Found ${results.length} nodes matching "${query}":`);
  results.slice(0, 3).forEach(node => {
    console.log(`   - ${node.id} (${node.type}): ${node.label}`);
  });
  console.log();
} catch (error) {
  console.error(`❌ Search failed: ${error.message}\n`);
  process.exit(1);
}

// Test 4: Get neighbors
console.log('Test 4: Get neighbors of "tech_endpoint_post"');
try {
  const content = readFileSync(graphPath, 'utf-8');
  const graph = JSON.parse(content);

  const nodeId = 'tech_endpoint_post';
  const edgesBySource = new Map();

  for (const edge of graph.edges) {
    if (!edgesBySource.has(edge.source)) {
      edgesBySource.set(edge.source, []);
    }
    edgesBySource.get(edge.source).push(edge);
  }

  const outgoing = edgesBySource.get(nodeId) || [];
  console.log(`✅ Node "${nodeId}" has ${outgoing.length} outgoing edges:`);
  outgoing.forEach(edge => {
    console.log(`   - ${edge.type} → ${edge.target}`);
  });
  console.log();
} catch (error) {
  console.error(`❌ Get neighbors failed: ${error.message}\n`);
  process.exit(1);
}

console.log('🎉 All tests passed!\n');
console.log('📝 Next steps:');
console.log('   1. Restart Claude Code to load the MCP server');
console.log('   2. The server will be available as "graph-query" tools');
console.log('   3. Use search_graph, get_node, get_neighbors, find_path tools\n');
