/**
 * Hierarchy controller for collapsible/expandable technical layer
 */

/**
 * Build hierarchy tree from flat nodes using "contains" edges
 * @param {Array} nodes - Flat array of nodes
 * @param {Array} edges - Array of edges
 * @returns {Object} Map of nodeId to children array
 */
export function buildHierarchyTree(nodes, edges) {
  const hierarchyMap = {};

  // Initialize empty children arrays
  nodes.forEach(node => {
    hierarchyMap[node.id] = {
      node,
      children: [],
      parent: null
    };
  });

  // Build parent-child relationships from "contains" edges
  edges.forEach(edge => {
    if (edge.type === 'contains') {
      const parent = hierarchyMap[edge.source];
      const child = hierarchyMap[edge.target];

      if (parent && child) {
        parent.children.push(edge.target);
        child.parent = edge.source;
      }
    }
  });

  return hierarchyMap;
}

/**
 * Get all root nodes (nodes without parents in hierarchy)
 * @param {Object} hierarchyMap - Hierarchy map
 * @param {Array} layerNodeIds - Node IDs in the layer
 * @returns {Array} Root node IDs
 */
export function getRootNodes(hierarchyMap, layerNodeIds) {
  return layerNodeIds.filter(id => {
    const item = hierarchyMap[id];
    return item && !item.parent;
  });
}

/**
 * Get all descendants of a node
 * @param {string} nodeId - Node ID
 * @param {Object} hierarchyMap - Hierarchy map
 * @returns {Set} Set of descendant node IDs
 */
export function getDescendants(nodeId, hierarchyMap) {
  const descendants = new Set();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    const item = hierarchyMap[current];

    if (item && item.children) {
      item.children.forEach(childId => {
        descendants.add(childId);
        queue.push(childId);
      });
    }
  }

  return descendants;
}

/**
 * Filter nodes by technical level
 * @param {Array} nodes - Array of nodes
 * @param {Array} allowedLevels - Allowed technical levels
 * @returns {Set} Set of filtered node IDs
 */
export function filterByTechnicalLevel(nodes, allowedLevels) {
  const filtered = new Set();

  nodes.forEach(node => {
    if (!node.technical_level || allowedLevels.includes(node.technical_level)) {
      filtered.add(node.id);
    }
  });

  return filtered;
}

/**
 * Filter nodes by importance
 * @param {Array} nodes - Array of nodes
 * @param {Array} allowedImportance - Allowed importance levels
 * @returns {Set} Set of filtered node IDs
 */
export function filterByImportance(nodes, allowedImportance) {
  const filtered = new Set();

  nodes.forEach(node => {
    // Always include nodes without importance metadata (workflow, conceptual layers)
    if (!node.importance || allowedImportance.includes(node.importance)) {
      filtered.add(node.id);
    }
  });

  return filtered;
}

/**
 * Hierarchy state manager
 */
export class HierarchyState {
  constructor(graph) {
    this.graph = graph;
    this.hierarchyMap = buildHierarchyTree(graph.nodes, graph.edges);
    this.expandedNodes = new Set();
    this.collapsedNodes = new Set();
    this.visibleNodes = new Set();
    this.technicalLevelFilter = ['service', 'file', 'endpoint', 'class', 'method', 'resource'];
    this.importanceFilter = ['core', 'supporting', 'helper'];

    // Initialize: all root nodes expanded, show top levels by default
    this.initializeDefaultState();
  }

  /**
   * Initialize default expanded/collapsed state
   */
  initializeDefaultState() {
    const technicalNodes = this.graph.layers.technical || [];
    const rootNodes = getRootNodes(this.hierarchyMap, technicalNodes);

    // Expand root nodes (services) by default
    rootNodes.forEach(id => {
      this.expandedNodes.add(id);
    });

    // Calculate initial visible nodes
    this.updateVisibleNodes();
  }

  /**
   * Update visible nodes based on current state
   */
  updateVisibleNodes() {
    this.visibleNodes.clear();

    // Always show workflow and conceptual layers
    (this.graph.layers.workflow || []).forEach(id => this.visibleNodes.add(id));
    (this.graph.layers.conceptual || []).forEach(id => this.visibleNodes.add(id));

    // Process technical layer with hierarchy
    const technicalNodes = this.graph.layers.technical || [];
    const rootNodes = getRootNodes(this.hierarchyMap, technicalNodes);

    // Add root nodes and their expanded children
    rootNodes.forEach(rootId => {
      this.addNodeAndExpandedChildren(rootId);
    });

    // Apply filters
    this.applyFilters();
  }

  /**
   * Recursively add node and its expanded children
   * @param {string} nodeId - Node ID
   */
  addNodeAndExpandedChildren(nodeId) {
    const item = this.hierarchyMap[nodeId];
    if (!item) return;

    // Add the node itself
    this.visibleNodes.add(nodeId);

    // If expanded, add children
    if (this.expandedNodes.has(nodeId)) {
      item.children.forEach(childId => {
        this.addNodeAndExpandedChildren(childId);
      });
    }
  }

  /**
   * Apply technical level and importance filters
   */
  applyFilters() {
    const nodeById = {};
    this.graph.nodes.forEach(n => { nodeById[n.id] = n; });

    const filtered = new Set();

    this.visibleNodes.forEach(id => {
      const node = nodeById[id];
      if (!node) return;

      // Check technical level filter
      if (node.technical_level && !this.technicalLevelFilter.includes(node.technical_level)) {
        return;
      }

      // Check importance filter
      if (node.importance && !this.importanceFilter.includes(node.importance)) {
        return;
      }

      filtered.add(id);
    });

    this.visibleNodes = filtered;
  }

  /**
   * Expand a node
   * @param {string} nodeId - Node ID
   */
  expandNode(nodeId) {
    this.expandedNodes.add(nodeId);
    this.collapsedNodes.delete(nodeId);
    this.updateVisibleNodes();
  }

  /**
   * Collapse a node
   * @param {string} nodeId - Node ID
   */
  collapseNode(nodeId) {
    this.collapsedNodes.add(nodeId);
    this.expandedNodes.delete(nodeId);
    this.updateVisibleNodes();
  }

  /**
   * Toggle node expansion
   * @param {string} nodeId - Node ID
   */
  toggleNode(nodeId) {
    if (this.expandedNodes.has(nodeId)) {
      this.collapseNode(nodeId);
    } else {
      this.expandNode(nodeId);
    }
  }

  /**
   * Expand all nodes
   */
  expandAll() {
    const technicalNodes = this.graph.layers.technical || [];
    technicalNodes.forEach(id => {
      const item = this.hierarchyMap[id];
      if (item && item.children.length > 0) {
        this.expandedNodes.add(id);
      }
    });
    this.collapsedNodes.clear();
    this.updateVisibleNodes();
  }

  /**
   * Collapse all nodes
   */
  collapseAll() {
    this.expandedNodes.clear();
    const technicalNodes = this.graph.layers.technical || [];
    const rootNodes = getRootNodes(this.hierarchyMap, technicalNodes);

    // Keep root nodes expanded
    rootNodes.forEach(id => this.expandedNodes.add(id));

    this.updateVisibleNodes();
  }

  /**
   * Set technical level filter
   * @param {Array} levels - Allowed technical levels
   */
  setTechnicalLevelFilter(levels) {
    this.technicalLevelFilter = levels;
    this.updateVisibleNodes();
  }

  /**
   * Set importance filter
   * @param {Array} importanceLevels - Allowed importance levels
   */
  setImportanceFilter(importanceLevels) {
    this.importanceFilter = importanceLevels;
    this.updateVisibleNodes();
  }

  /**
   * Check if node is expanded
   * @param {string} nodeId - Node ID
   * @returns {boolean}
   */
  isExpanded(nodeId) {
    return this.expandedNodes.has(nodeId);
  }

  /**
   * Check if node is visible
   * @param {string} nodeId - Node ID
   * @returns {boolean}
   */
  isVisible(nodeId) {
    return this.visibleNodes.has(nodeId);
  }

  /**
   * Check if node has children
   * @param {string} nodeId - Node ID
   * @returns {boolean}
   */
  hasChildren(nodeId) {
    const item = this.hierarchyMap[nodeId];
    return item && item.children && item.children.length > 0;
  }
}
