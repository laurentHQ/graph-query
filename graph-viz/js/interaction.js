/**
 * Mouse interaction handling
 */

import { highlightConnections, resetEdgeHighlights } from './edge-builder.js';
import { showNodeInfo } from './info-panel.js';
import { discoverNetwork } from './network-discovery.js';

/**
 * Setup mouse interaction handlers
 * @param {THREE.Camera} camera - Three.js camera
 * @param {THREE.Renderer} renderer - Three.js renderer
 * @param {Object} state - Application state
 */
export function setupInteraction(camera, renderer, state) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Mouse move handler for hover effects
  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const meshArray = Object.values(state.nodeMeshes);
    const intersects = raycaster.intersectObjects(meshArray, false);

    if (intersects.length > 0) {
      const newHovered = intersects[0].object;
      if (state.hoveredNode !== newHovered) {
        if (state.hoveredNode && state.hoveredNode !== state.selectedNode) {
          state.hoveredNode.scale.set(1, 1, 1);
        }
        state.hoveredNode = newHovered;
        if (state.hoveredNode !== state.selectedNode) {
          state.hoveredNode.scale.set(1.2, 1.2, 1.2);
        }
        renderer.domElement.style.cursor = 'pointer';
      }
    } else {
      if (state.hoveredNode && state.hoveredNode !== state.selectedNode) {
        state.hoveredNode.scale.set(1, 1, 1);
      }
      state.hoveredNode = null;
      renderer.domElement.style.cursor = 'default';
    }
  }

  // Double click handler for hierarchy expansion
  function onDoubleClick() {
    if (!state.hoveredNode) return;

    const nodeId = state.hoveredNode.userData.nodeId;
    if (nodeId && state.hierarchyState && state.hierarchyState.hasChildren(nodeId)) {
      window.toggleHierarchyNode(nodeId);
    }
  }

  // Mouse click handler for selection
  function onMouseClick() {
    if (!state.hoveredNode) return;

    // Reset previous selection
    if (state.selectedNode) {
      state.selectedNode.scale.set(1, 1, 1);
    }

    // Set new selection
    state.selectedNode = state.hoveredNode;
    state.selectedNode.scale.set(1.3, 1.3, 1.3);

    // Find node ID
    const nodeId = findNodeId(state.selectedNode, state.nodeMeshes);
    if (nodeId) {
      showNodeInfo(nodeId, state.nodeById, state.edgeData, state.networkDiscoveryActive, state.discoveredNodes);
      highlightConnections(nodeId, state.edgeData, state.edgeLines);
    }
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onMouseClick);
  window.addEventListener('dblclick', onDoubleClick);
}

/**
 * Find node ID from mesh
 * @param {THREE.Mesh} mesh - Node mesh
 * @param {Object} nodeMeshes - Map of node ID to mesh
 * @returns {string|null} Node ID or null
 */
function findNodeId(mesh, nodeMeshes) {
  for (const id in nodeMeshes) {
    if (nodeMeshes[id] === mesh) {
      return id;
    }
  }
  return null;
}

/**
 * Toggle network discovery mode
 * @param {string} nodeId - Node ID
 * @param {Object} state - Application state
 */
export function toggleNetworkDiscovery(nodeId, state) {
  if (state.networkDiscoveryActive) {
    // Deactivate network discovery
    state.networkDiscoveryActive = false;
    state.discoveredNodes.clear();

    // Reset all node opacities and scales
    Object.keys(state.nodeMeshes).forEach(id => {
      const mesh = state.nodeMeshes[id];
      mesh.material.opacity = 1.0;
      // Reset scale (unless it's selected or hovered)
      if (mesh !== state.selectedNode && mesh !== state.hoveredNode) {
        mesh.scale.set(1.0, 1.0, 1.0);
      }
    });

    // Reset edges to show only direct connections
    highlightConnections(nodeId, state.edgeData, state.edgeLines);

    console.log('❌ Network discovery deactivated');
  } else {
    // Activate network discovery
    state.networkDiscoveryActive = true;
    const maxDepth = 5; // Increased depth to ensure full network discovery
    state.discoveredNodes = discoverNetwork(nodeId, maxDepth, state.edgeData, state.hierarchyState);

    console.log('✅ Network discovery activated');
    console.log(`📊 Discovered ${state.discoveredNodes.size} nodes in deep network (including hierarchy)`);

    // Log discovered nodes by type
    const discoveredByType = {};
    state.discoveredNodes.forEach(id => {
      const node = state.nodeById[id];
      if (node) {
        const type = node.type || 'Unknown';
        discoveredByType[type] = (discoveredByType[type] || 0) + 1;
      }
    });
    console.log('📋 Discovered node types:', discoveredByType);

    // Dim non-discovered nodes dramatically
    Object.keys(state.nodeMeshes).forEach(id => {
      const mesh = state.nodeMeshes[id];
      if (state.discoveredNodes.has(id)) {
        mesh.material.opacity = 1.0;
        // Slightly enlarge discovered nodes for emphasis
        mesh.scale.set(1.1, 1.1, 1.1);
      } else {
        mesh.material.opacity = 0.15; // More dramatic dimming
        mesh.scale.set(1.0, 1.0, 1.0);
      }
    });

    // Highlight all edges within the discovered network
    let discoveredEdgeCount = 0;
    state.edgeLines.forEach(line => {
      const edge = line.userData.edge;
      if (state.discoveredNodes.has(edge.source) && state.discoveredNodes.has(edge.target)) {
        line.material.opacity = 0.9; // Brighter edge highlighting
        discoveredEdgeCount++;
      } else {
        line.material.opacity = 0.03; // Nearly invisible
      }
    });
    console.log(`🔗 Highlighted ${discoveredEdgeCount} edges in discovered network`);
  }

  // Refresh the info panel
  showNodeInfo(nodeId, state.nodeById, state.edgeData, state.networkDiscoveryActive, state.discoveredNodes);
}
