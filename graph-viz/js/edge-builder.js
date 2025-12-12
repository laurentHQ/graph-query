/**
 * Edge/connection creation and management
 */

import { getEdgeColor } from './utils.js';

/**
 * Build all edges from graph data
 * @param {Object} graph - Graph data with edges array
 * @param {Object} nodeMeshes - Map of node ID to mesh
 * @param {THREE.Scene} scene - Three.js scene
 * @returns {Object} edgeLines array and edgeData map
 */
export function buildEdges(graph, nodeMeshes, scene) {
  const edgeLines = [];
  const edgeData = {};

  graph.edges.forEach(edge => {
    const srcMesh = nodeMeshes[edge.source];
    const tgtMesh = nodeMeshes[edge.target];
    if (!srcMesh || !tgtMesh) return;

    const points = [
      srcMesh.position.clone(),
      tgtMesh.position.clone()
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: getEdgeColor(edge),
      transparent: true,
      opacity: 0.55
    });

    const line = new THREE.Line(geometry, material);
    line.userData.edge = edge;
    line.userData.originalOpacity = 0.55;
    scene.add(line);
    edgeLines.push(line);

    // Store edge data for lookups
    if (!edgeData[edge.source]) {
      edgeData[edge.source] = { outgoing: [], incoming: [] };
    }
    if (!edgeData[edge.target]) {
      edgeData[edge.target] = { outgoing: [], incoming: [] };
    }

    edgeData[edge.source].outgoing.push({
      target: edge.target,
      type: edge.type,
      layer: edge.layer,
      line
    });

    edgeData[edge.target].incoming.push({
      source: edge.source,
      type: edge.type,
      layer: edge.layer,
      line
    });
  });

  return { edgeLines, edgeData };
}

/**
 * Highlight connections for a specific node
 * @param {string} nodeId - Node ID
 * @param {Object} edgeData - Edge data map
 * @param {Array} edgeLines - Array of edge lines
 */
export function highlightConnections(nodeId, edgeData, edgeLines) {
  // Reset all edges to low opacity
  edgeLines.forEach(line => {
    line.material.opacity = 0.15;
  });

  // Highlight connected edges
  const connections = edgeData[nodeId];
  if (connections) {
    connections.outgoing.forEach(conn => {
      conn.line.material.opacity = 1.0;
    });
    connections.incoming.forEach(conn => {
      conn.line.material.opacity = 1.0;
    });
  }
}

/**
 * Reset all edge highlights to original opacity
 * @param {Array} edgeLines - Array of edge lines
 */
export function resetEdgeHighlights(edgeLines) {
  edgeLines.forEach(line => {
    line.material.opacity = line.userData.originalOpacity || 0.55;
  });
}
