/**
 * Info panel UI management
 */

import { getNetworkDepth } from './network-discovery.js';

/**
 * Show node information in the info panel
 * @param {string} nodeId - Node ID
 * @param {Object} nodeById - Map of node ID to node data
 * @param {Object} edgeData - Edge data map
 * @param {boolean} networkDiscoveryActive - Whether network discovery is active
 * @param {Set} discoveredNodes - Set of discovered node IDs
 */
export function showNodeInfo(nodeId, nodeById, edgeData, networkDiscoveryActive, discoveredNodes) {
  const node = nodeById[nodeId];
  if (!node) return;

  let html = `<h3>${node.label || node.id}</h3>`;
  html += '<div class="label">Type</div>';
  html += `<div class="value">${node.type}</div>`;

  if (node.description) {
    html += '<div class="label">Description</div>';
    html += `<div class="value">${node.description}</div>`;
  }

  if (node.file) {
    html += '<div class="label">File</div>';
    html += `<div class="value">${node.file}${node.line ? ':' + node.line : ''}</div>`;
  }

  // Outgoing connections
  const connections = edgeData[nodeId];
  if (connections && connections.outgoing.length > 0) {
    html += `<div class="label">Outgoing Connections (${connections.outgoing.length})</div>`;
    connections.outgoing.forEach(conn => {
      const targetNode = nodeById[conn.target];
      html += '<div class="connection outgoing">';
      html += `<strong>${conn.type}</strong> → ${targetNode ? targetNode.label : conn.target}`;
      html += '</div>';
    });
  }

  // Incoming connections
  if (connections && connections.incoming.length > 0) {
    html += `<div class="label">Incoming Connections (${connections.incoming.length})</div>`;
    connections.incoming.forEach(conn => {
      const sourceNode = nodeById[conn.source];
      html += '<div class="connection incoming">';
      html += `${sourceNode ? sourceNode.label : conn.source} → <strong>${conn.type}</strong>`;
      html += '</div>';
    });
  }

  // Action buttons
  html += '<div class="action-buttons">';
  html += `<button class="action-btn${networkDiscoveryActive ? ' active' : ''}" onclick="window.toggleNetworkDiscovery('${nodeId}')">`;
  html += networkDiscoveryActive ? '✓ Network Active' : '🔍 Discover Network';
  html += '</button>';
  html += '</div>';

  // Network stats if discovery is active
  if (networkDiscoveryActive && discoveredNodes.size > 0) {
    const depth = getNetworkDepth(nodeId, discoveredNodes, edgeData);
    html += '<div id="network-stats">';
    html += '<strong>Network Discovery Active</strong><br>';
    html += `Nodes in network: ${discoveredNodes.size}<br>`;
    html += `Depth levels: ${depth}`;
    html += '</div>';
  }

  document.getElementById('info-content').innerHTML = html;
  document.getElementById('info-panel').style.display = 'block';
}

/**
 * Close the info panel
 * @param {Object} state - Application state
 */
export function closeInfoPanel(state) {
  document.getElementById('info-panel').style.display = 'none';

  if (state.selectedNode) {
    state.selectedNode.scale.set(1, 1, 1);
    state.selectedNode = null;
  }

  // Reset network discovery if active
  if (state.networkDiscoveryActive) {
    state.networkDiscoveryActive = false;
    state.discoveredNodes.clear();

    // Reset all node opacities
    Object.keys(state.nodeMeshes).forEach(id => {
      state.nodeMeshes[id].material.opacity = 1.0;
    });
  }

  // Reset edge highlights
  state.edgeLines.forEach(line => {
    line.material.opacity = line.userData.originalOpacity || 0.55;
  });
}
