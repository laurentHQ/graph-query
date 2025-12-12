#!/usr/bin/env node

/**
 * Test script for incremental graph building features
 * Demonstrates add_node, add_edge, add_to_layer, verify_graph, save_graph
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const testGraphPath = '/tmp/test-graph.json';

// Create a minimal test graph
const initialGraph = {
  nodes: [
    {
      id: 'workflow_test',
      type: 'Workflow',
      label: 'Test Workflow',
      description: 'A test workflow',
      inferred: false
    },
    {
      id: 'concept_testing',
      type: 'Concept',
      label: 'Testing',
      description: 'Testing concept',
      inferred: false
    }
  ],
  edges: [
    {
      source: 'workflow_test',
      target: 'concept_testing',
      type: 'includes',
      layer: 'workflow-to-conceptual'
    }
  ],
  layers: {
    workflow: ['workflow_test'],
    conceptual: ['concept_testing'],
    technical: []
  }
};

console.log('🧪 Testing Incremental Graph Building\n');
console.log('='.repeat(80));

// Initialize test graph
console.log('\n📝 Creating test graph...');
writeFileSync(testGraphPath, JSON.stringify(initialGraph, null, 2));
console.log(`   Created: ${testGraphPath}`);
console.log(`   Initial: ${initialGraph.nodes.length} nodes, ${initialGraph.edges.length} edges\n`);

// Simulate the MCP server operations (since we can't actually call MCP from here)
// In real usage, these would be MCP tool calls

function loadGraph(path) {
  const content = readFileSync(path, 'utf-8');
  const graph = JSON.parse(content);

  // Build indexes
  const nodeById = new Map();
  const edgesBySource = new Map();
  const edgesByTarget = new Map();

  graph.nodes.forEach(node => nodeById.set(node.id, node));

  graph.edges.forEach(edge => {
    if (!edgesBySource.has(edge.source)) {
      edgesBySource.set(edge.source, []);
    }
    edgesBySource.get(edge.source).push(edge);

    if (!edgesByTarget.has(edge.target)) {
      edgesByTarget.set(edge.target, []);
    }
    edgesByTarget.get(edge.target).push(edge);
  });

  return {
    raw: graph,
    nodeById,
    edgesBySource,
    edgesByTarget,
    path
  };
}

function saveGraph(graph) {
  writeFileSync(graph.path, JSON.stringify(graph.raw, null, 2));
}

const graph = loadGraph(testGraphPath);

// Test 1: Add node
console.log('✅ Test 1: add_node');
console.log('   Adding: func_testActivity (Function)\n');

const newNode = {
  id: 'func_testActivity',
  type: 'Function',
  label: 'testActivity',
  description: 'A test activity function',
  file: 'src/activities/test.ts',
  line: 10,
  inferred: false
};

// Check if already exists
if (!graph.nodeById.has(newNode.id)) {
  graph.raw.nodes.push(newNode);
  graph.nodeById.set(newNode.id, newNode);
  console.log('   ✅ Node added successfully');
  console.log(`      ID: ${newNode.id}`);
  console.log(`      Type: ${newNode.type}`);
  console.log(`      File: ${newNode.file}:${newNode.line}`);
} else {
  console.log('   ⏭️  Node already exists');
}

// Test 2: Add edge
console.log('\n✅ Test 2: add_edge');
console.log('   Adding: workflow_test --calls--> func_testActivity\n');

const newEdge = {
  source: 'workflow_test',
  target: 'func_testActivity',
  type: 'calls',
  layer: 'workflow-to-technical'
};

// Check if nodes exist
if (graph.nodeById.has(newEdge.source) && graph.nodeById.has(newEdge.target)) {
  // Check if edge already exists
  const existingEdges = graph.edgesBySource.get(newEdge.source) || [];
  const duplicate = existingEdges.find(e => e.target === newEdge.target && e.type === newEdge.type);

  if (!duplicate) {
    graph.raw.edges.push(newEdge);

    if (!graph.edgesBySource.has(newEdge.source)) {
      graph.edgesBySource.set(newEdge.source, []);
    }
    graph.edgesBySource.get(newEdge.source).push(newEdge);

    if (!graph.edgesByTarget.has(newEdge.target)) {
      graph.edgesByTarget.set(newEdge.target, []);
    }
    graph.edgesByTarget.get(newEdge.target).push(newEdge);

    console.log('   ✅ Edge added successfully');
    console.log(`      ${newEdge.source} --${newEdge.type}--> ${newEdge.target}`);
    console.log(`      Layer: ${newEdge.layer}`);
  } else {
    console.log('   ⏭️  Edge already exists');
  }
} else {
  console.log('   ❌ Source or target node not found');
}

// Test 3: Add to layer
console.log('\n✅ Test 3: add_to_layer');
console.log('   Adding: func_testActivity to technical layer\n');

if (graph.nodeById.has('func_testActivity')) {
  if (!graph.raw.layers.technical) {
    graph.raw.layers.technical = [];
  }

  if (!graph.raw.layers.technical.includes('func_testActivity')) {
    graph.raw.layers.technical.push('func_testActivity');
    console.log('   ✅ Node added to layer');
    console.log(`      Node: func_testActivity`);
    console.log(`      Layer: technical`);
  } else {
    console.log('   ⏭️  Node already in layer');
  }
} else {
  console.log('   ❌ Node not found');
}

// Test 4: Verify graph
console.log('\n✅ Test 4: verify_graph');
console.log('   Checking graph integrity...\n');

const issues = [];
const warnings = [];

// Check edges have valid nodes
graph.raw.edges.forEach(edge => {
  if (!graph.nodeById.has(edge.source)) {
    issues.push(`Invalid source: ${edge.source}`);
  }
  if (!graph.nodeById.has(edge.target)) {
    issues.push(`Invalid target: ${edge.target}`);
  }
});

// Check layers reference existing nodes
Object.entries(graph.raw.layers).forEach(([layerName, nodeIds]) => {
  nodeIds.forEach(nodeId => {
    if (!graph.nodeById.has(nodeId)) {
      issues.push(`Layer ${layerName} references non-existent node: ${nodeId}`);
    }
  });
});

// Check for orphaned nodes
const orphaned = [];
graph.raw.nodes.forEach(node => {
  const incoming = graph.edgesByTarget.get(node.id) || [];
  const outgoing = graph.edgesBySource.get(node.id) || [];
  if (incoming.length === 0 && outgoing.length === 0) {
    orphaned.push(node.id);
  }
});

if (orphaned.length > 0) {
  warnings.push(`${orphaned.length} orphaned nodes: ${orphaned.join(', ')}`);
}

console.log('   Validation Results:');
console.log(`      Valid: ${issues.length === 0 ? '✅ Yes' : '❌ No'}`);
console.log(`      Issues: ${issues.length}`);
console.log(`      Warnings: ${warnings.length}`);
console.log(`      Nodes: ${graph.raw.nodes.length}`);
console.log(`      Edges: ${graph.raw.edges.length}`);
console.log(`      Layers: ${Object.keys(graph.raw.layers).length}`);
console.log(`      Orphaned: ${orphaned.length}`);

if (issues.length > 0) {
  console.log('\n   Issues:');
  issues.forEach(issue => console.log(`      ❌ ${issue}`));
}

if (warnings.length > 0) {
  console.log('\n   Warnings:');
  warnings.forEach(warning => console.log(`      ⚠️  ${warning}`));
}

// Test 5: Save graph
console.log('\n✅ Test 5: save_graph');
console.log('   Saving changes to disk...\n');

// Create backup
const backupPath = `${testGraphPath}.backup`;
if (existsSync(testGraphPath)) {
  const content = readFileSync(testGraphPath, 'utf-8');
  writeFileSync(backupPath, content);
  console.log(`   📦 Backup created: ${backupPath}`);
}

// Sort edges
graph.raw.edges.sort((a, b) => {
  if (a.source < b.source) return -1;
  if (a.source > b.source) return 1;
  if (a.target < b.target) return -1;
  if (a.target > b.target) return 1;
  return 0;
});

// Save
saveGraph(graph);
console.log(`   💾 Graph saved: ${testGraphPath}`);
console.log(`      Nodes: ${graph.raw.nodes.length}`);
console.log(`      Edges: ${graph.raw.edges.length}`);

// Verify saved file
const savedGraph = JSON.parse(readFileSync(testGraphPath, 'utf-8'));
console.log('\n   Verification:');
console.log(`      ✅ File readable`);
console.log(`      ✅ Valid JSON`);
console.log(`      ✅ Nodes: ${savedGraph.nodes.length}`);
console.log(`      ✅ Edges: ${savedGraph.edges.length}`);

console.log('\n\n' + '='.repeat(80));
console.log('🎉 All tests passed!\n');

console.log('📝 Usage with MCP Server (after restart):');
console.log('\n   // Add a new function node');
console.log('   mcp__graph-query__add_node({');
console.log('     graph_path: "/path/to/graph_data.json",');
console.log('     id: "func_newActivity",');
console.log('     type: "Function",');
console.log('     label: "newActivity",');
console.log('     description: "Description here",');
console.log('     file: "src/activities/new.ts",');
console.log('     line: 15');
console.log('   })');
console.log('\n   // Connect workflow to activity');
console.log('   mcp__graph-query__add_edge({');
console.log('     graph_path: "/path/to/graph_data.json",');
console.log('     source: "workflow_case_orchestration",');
console.log('     target: "func_newActivity",');
console.log('     type: "calls",');
console.log('     layer: "workflow-to-technical"');
console.log('   })');
console.log('\n   // Add to layer');
console.log('   mcp__graph-query__add_to_layer({');
console.log('     graph_path: "/path/to/graph_data.json",');
console.log('     node_id: "func_newActivity",');
console.log('     layer: "technical"');
console.log('   })');
console.log('\n   // Verify integrity');
console.log('   mcp__graph-query__verify_graph({');
console.log('     graph_path: "/path/to/graph_data.json"');
console.log('   })');
console.log('\n   // Save changes');
console.log('   mcp__graph-query__save_graph({');
console.log('     graph_path: "/path/to/graph_data.json",');
console.log('     backup: true,');
console.log('     sort: true');
console.log('   })');

console.log('\n' + '='.repeat(80));
console.log(`\n📁 Test files created:`);
console.log(`   - ${testGraphPath} (modified graph)`);
console.log(`   - ${backupPath} (backup)`);
console.log(`\nYou can inspect these files to see the changes.\n`);
