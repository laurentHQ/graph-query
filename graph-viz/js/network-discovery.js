/**
 * Network discovery algorithm
 */

/**
 * Discover connected network from a starting node
 * Includes both edge connections AND hierarchical relationships (parents/children)
 * @param {string} startNodeId - Starting node ID
 * @param {number} maxDepth - Maximum depth to traverse
 * @param {Object} edgeData - Edge data map
 * @param {Object} hierarchyState - Optional hierarchy state for including parent/child relationships
 * @returns {Set} Set of discovered node IDs
 */
export function discoverNetwork(startNodeId, maxDepth, edgeData, hierarchyState = null) {
  const discovered = new Set();
  const queue = [{ id: startNodeId, depth: 0 }];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.id) || current.depth > maxDepth) continue;

    visited.add(current.id);
    discovered.add(current.id);

    // 1. Follow edge connections (calls, depends_on, imports, etc.)
    const connections = edgeData[current.id];
    if (connections) {
      // Add outgoing connections
      connections.outgoing.forEach(conn => {
        if (!visited.has(conn.target)) {
          queue.push({ id: conn.target, depth: current.depth + 1 });
        }
      });

      // Add incoming connections
      connections.incoming.forEach(conn => {
        if (!visited.has(conn.source)) {
          queue.push({ id: conn.source, depth: current.depth + 1 });
        }
      });
    }

    // 2. Follow hierarchical relationships (contains edges)
    if (hierarchyState && hierarchyState.hierarchyMap) {
      const item = hierarchyState.hierarchyMap[current.id];

      if (item) {
        // Add parent node
        if (item.parent && !visited.has(item.parent)) {
          queue.push({ id: item.parent, depth: current.depth + 1 });
        }

        // Add all children nodes
        if (item.children) {
          item.children.forEach(childId => {
            if (!visited.has(childId)) {
              queue.push({ id: childId, depth: current.depth + 1 });
            }
          });
        }
      }
    }
  }

  console.log(`🔍 Network Discovery: Found ${discovered.size} nodes in network (max depth: ${maxDepth})`);
  return discovered;
}

/**
 * Calculate network depth from starting node
 * @param {string} startNodeId - Starting node ID
 * @param {Set} discoveredNodes - Set of discovered node IDs
 * @param {Object} edgeData - Edge data map
 * @returns {number} Maximum depth of network
 */
export function getNetworkDepth(startNodeId, discoveredNodes, edgeData) {
  let maxDepth = 0;
  const queue = [{ id: startNodeId, depth: 0 }];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.id)) continue;

    visited.add(current.id);
    maxDepth = Math.max(maxDepth, current.depth);

    const connections = edgeData[current.id];
    if (connections) {
      connections.outgoing.forEach(conn => {
        if (!visited.has(conn.target) && discoveredNodes.has(conn.target)) {
          queue.push({ id: conn.target, depth: current.depth + 1 });
        }
      });

      connections.incoming.forEach(conn => {
        if (!visited.has(conn.source) && discoveredNodes.has(conn.source)) {
          queue.push({ id: conn.source, depth: current.depth + 1 });
        }
      });
    }
  }

  return maxDepth;
}
