/**
 * Main entry point for 3D Knowledge Graph visualization
 */

import { initializeScene, setupResizeHandler, startAnimationLoop } from './scene-setup.js';
import { buildLayer, updateExpandIndicator, LAYER_COLORS } from './node-builder.js';
import { buildEdges } from './edge-builder.js';
import { setupInteraction, toggleNetworkDiscovery } from './interaction.js';
import { closeInfoPanel } from './info-panel.js';
import { HierarchyState } from './hierarchy-controller.js';

// Global state
let globalState = null;

/**
 * Rebuild the graph with current hierarchy state
 */
function rebuildGraph() {
  if (!globalState) return;

  const { scene, hierarchyState, graphData, nodeById } = globalState;

  // Remove all existing nodes
  Object.values(globalState.nodeMeshes).forEach(mesh => {
    scene.remove(mesh);
  });

  // Reset state
  globalState.nodeMeshes = {};
  globalState.floatOffsets = {};

  // Get visible nodes from hierarchy
  const visibleTechnicalNodes = Array.from(hierarchyState.visibleNodes).filter(id => {
    const node = nodeById[id];
    return node && node.type !== 'Workflow' && node.type !== 'Concept';
  });

  // Build workflow layer
  const workflowResult = buildLayer('workflow', graphData.layers.workflow, nodeById, 0, scene);
  Object.assign(globalState.nodeMeshes, workflowResult.nodeMeshes);
  Object.assign(globalState.floatOffsets, workflowResult.floatOffsets);

  // Build conceptual layer
  const workflowNodeCount = graphData.layers.workflow.length;
  const angleOffsetForConceptual = workflowNodeCount > 0 ? (Math.PI / workflowNodeCount) : 0;
  const conceptualResult = buildLayer('conceptual', graphData.layers.conceptual, nodeById, angleOffsetForConceptual, scene);
  Object.assign(globalState.nodeMeshes, conceptualResult.nodeMeshes);
  Object.assign(globalState.floatOffsets, conceptualResult.floatOffsets);

  // Build technical layer with hierarchy
  const technicalResult = buildLayer('technical', visibleTechnicalNodes, nodeById, 0, scene, hierarchyState);
  Object.assign(globalState.nodeMeshes, technicalResult.nodeMeshes);
  Object.assign(globalState.floatOffsets, technicalResult.floatOffsets);

  // Rebuild edges
  Object.values(globalState.edgeLines).forEach(line => {
    scene.remove(line);
  });

  const { edgeLines, edgeData } = buildEdges(graphData, globalState.nodeMeshes, scene);
  globalState.edgeLines = edgeLines;
  globalState.edgeData = edgeData;

  console.log(`Rebuilt graph: ${visibleTechnicalNodes.length} technical nodes visible`);
}

/**
 * Toggle node expansion
 * @param {string} nodeId - Node ID
 */
function toggleHierarchyNode(nodeId) {
  if (!globalState || !globalState.hierarchyState) return;

  globalState.hierarchyState.toggleNode(nodeId);

  // Update expand indicator
  const mesh = globalState.nodeMeshes[nodeId];
  if (mesh && mesh.userData.expandIndicator) {
    const isExpanded = globalState.hierarchyState.isExpanded(nodeId);
    updateExpandIndicator(mesh, isExpanded, LAYER_COLORS[mesh.userData.layerName]);
  }

  rebuildGraph();
}

/**
 * Set technical level filter
 * @param {Array} levels - Allowed technical levels
 */
function setTechnicalLevelFilter(levels) {
  if (!globalState || !globalState.hierarchyState) return;

  globalState.hierarchyState.setTechnicalLevelFilter(levels);
  rebuildGraph();
}

/**
 * Set importance filter
 * @param {Array} importanceLevels - Allowed importance levels
 */
function setImportanceFilter(importanceLevels) {
  if (!globalState || !globalState.hierarchyState) return;

  globalState.hierarchyState.setImportanceFilter(importanceLevels);
  rebuildGraph();
}

/**
 * Expand all nodes
 */
function expandAll() {
  if (!globalState || !globalState.hierarchyState) return;

  globalState.hierarchyState.expandAll();
  rebuildGraph();
}

/**
 * Collapse all nodes
 */
function collapseAll() {
  if (!globalState || !globalState.hierarchyState) return;

  globalState.hierarchyState.collapseAll();
  rebuildGraph();
}

/**
 * Initialize the visualization
 * @param {Object} graphData - Graph data from JSON
 */
function initVisualization(graphData) {
  console.log('Initializing 3D Knowledge Graph...');

  // Initialize Three.js scene
  const container = document.getElementById('container');
  const { scene, camera, renderer, controls } = initializeScene(container);

  // Build node index
  const nodeById = {};
  graphData.nodes.forEach(node => {
    nodeById[node.id] = node;
  });

  // Initialize hierarchy state
  const hierarchyState = new HierarchyState(graphData);

  // Get visible nodes from hierarchy
  const visibleTechnicalNodes = Array.from(hierarchyState.visibleNodes).filter(id => {
    const node = nodeById[id];
    return node && node.type !== 'Workflow' && node.type !== 'Concept';
  });

  console.log(`Initial visible technical nodes: ${visibleTechnicalNodes.length}`);

  // Application state
  globalState = {
    scene,
    camera,
    renderer,
    controls,
    graphData,
    hierarchyState,
    nodeMeshes: {},
    floatOffsets: {},
    edgeLines: [],
    edgeData: {},
    nodeById,
    selectedNode: null,
    hoveredNode: null,
    networkDiscoveryActive: false,
    discoveredNodes: new Set()
  };

  // Build layers
  console.log('Building workflow layer...');
  const workflowResult = buildLayer('workflow', graphData.layers.workflow, nodeById, 0, scene);
  Object.assign(globalState.nodeMeshes, workflowResult.nodeMeshes);
  Object.assign(globalState.floatOffsets, workflowResult.floatOffsets);

  console.log('Building conceptual layer...');
  const workflowNodeCount = graphData.layers.workflow.length;
  const angleOffsetForConceptual = workflowNodeCount > 0 ? (Math.PI / workflowNodeCount) : 0;
  const conceptualResult = buildLayer('conceptual', graphData.layers.conceptual, nodeById, angleOffsetForConceptual, scene);
  Object.assign(globalState.nodeMeshes, conceptualResult.nodeMeshes);
  Object.assign(globalState.floatOffsets, conceptualResult.floatOffsets);

  console.log('Building technical layer with hierarchy...');
  const technicalResult = buildLayer('technical', visibleTechnicalNodes, nodeById, 0, scene, hierarchyState);
  Object.assign(globalState.nodeMeshes, technicalResult.nodeMeshes);
  Object.assign(globalState.floatOffsets, technicalResult.floatOffsets);

  // Build edges
  console.log('Building edges...');
  const { edgeLines, edgeData } = buildEdges(graphData, globalState.nodeMeshes, scene);
  globalState.edgeLines = edgeLines;
  globalState.edgeData = edgeData;

  // Setup interaction
  console.log('Setting up interaction...');
  setupInteraction(camera, renderer, globalState);

  // Expose functions to global scope
  window.closeInfoPanel = () => closeInfoPanel(globalState);
  window.toggleNetworkDiscovery = (nodeId) => toggleNetworkDiscovery(nodeId, globalState);
  window.toggleHierarchyNode = toggleHierarchyNode;
  window.setTechnicalLevelFilter = setTechnicalLevelFilter;
  window.setImportanceFilter = setImportanceFilter;
  window.expandAll = expandAll;
  window.collapseAll = collapseAll;

  // Setup resize handler
  setupResizeHandler(camera, renderer);

  // Start animation loop
  console.log('Starting animation loop...');
  startAnimationLoop(renderer, scene, camera, controls, globalState.nodeMeshes, globalState.floatOffsets);

  console.log('Initialization complete!');
}

/**
 * Load graph data and initialize
 */
async function loadAndInitialize() {
  try {
    console.log('Loading graph data...');
    const response = await fetch('graph_data.json');

    if (!response.ok) {
      throw new Error(`Failed to load graph_data.json: ${response.statusText}`);
    }

    const graphData = await response.json();
    console.log('Graph data loaded successfully:', graphData);

    initVisualization(graphData);
  } catch (error) {
    console.error('Error loading graph data:', error);
    document.body.innerHTML = `
      <div style="color: white; padding: 20px; font-family: sans-serif;">
        <h2>Error Loading Graph Data</h2>
        <p>Failed to load graph_data.json. Please ensure the file exists in the same directory.</p>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
}

// Start the application
loadAndInitialize();
