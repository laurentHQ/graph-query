/**
 * Node mesh creation and positioning
 */

import { createLabelSprite, randomFloatOffset } from './utils.js';

// Layer configuration
export const LAYER_Y = {
  workflow: 120,      // top
  conceptual: 0,      // middle
  technical: -120     // bottom
};

export const LAYER_COLORS = {
  workflow: 0x2e7bcf,     // blue
  conceptual: 0xf2b544,   // yellow
  technical: 0x9ca3af     // grey
};

/**
 * Create a node mesh
 * @param {Object} node - Node data
 * @param {string} layerName - Layer name (workflow, conceptual, technical)
 * @param {number} index - Node index in layer
 * @param {number} total - Total nodes in layer
 * @param {number} angleOffset - Optional angle offset for rotation
 * @param {THREE.Scene} scene - Three.js scene
 * @param {Object} hierarchyState - Optional hierarchy state for expand/collapse indicators
 * @param {Object} hierarchyInfo - Optional hierarchy position info {depth, indexAtDepth, totalAtDepth}
 * @returns {THREE.Mesh} Node mesh
 */
export function createNodeMesh(node, layerName, index, total, angleOffset, scene, hierarchyState, hierarchyInfo) {
  const radius = 10;
  const height = 4;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
  const material = new THREE.MeshStandardMaterial({
    color: LAYER_COLORS[layerName] || 0x888888,
    metalness: 0.2,
    roughness: 0.35
  });
  const mesh = new THREE.Mesh(geometry, material);

  const baseY = LAYER_Y[layerName];
  let x, z, y;

  // Position nodes based on layer type
  if (layerName === 'workflow' || layerName === 'conceptual') {
    // Circular arrangement for first two layers
    const circleRadius = layerName === 'conceptual' ? 50 : 100; // Conceptual radius reduced by half
    const angle = (index / total) * Math.PI * 2 + (angleOffset || 0);
    x = Math.cos(angle) * circleRadius;
    z = Math.sin(angle) * circleRadius;
    y = baseY;
  } else if (layerName === 'technical' && hierarchyInfo) {
    // Hierarchical pyramid arrangement for technical layer
    const { depth, indexAtDepth, totalAtDepth } = hierarchyInfo;

    // Vertical spacing between hierarchy levels (top = roots, bottom = leaves)
    // Pyramid grows DOWNWARD: deeper levels have more negative Y
    const levelHeight = 50;
    y = baseY - (depth * levelHeight);

    // Horizontal arrangement: circular with radius proportional to depth (pyramid shape)
    // Deeper levels have larger radius (wider at bottom)
    const baseRadius = 40;
    const radiusGrowth = 30; // How much wider each level gets
    const circleRadius = baseRadius + (depth * radiusGrowth);

    if (totalAtDepth === 1) {
      // Single node at this level - place at center
      x = 0;
      z = 0;
    } else {
      // Multiple nodes - arrange in circle
      const angle = (indexAtDepth / totalAtDepth) * Math.PI * 2;
      x = Math.cos(angle) * circleRadius;
      z = Math.sin(angle) * circleRadius;
    }
  } else if (layerName === 'technical') {
    // Fallback: triangular grid for technical layer (when no hierarchy info)
    const spacing = 60;
    const row = Math.floor((-1 + Math.sqrt(1 + 8 * index)) / 2);
    const posInRow = index - (row * (row + 1)) / 2;
    const maxInRow = row + 1;

    x = (posInRow - (maxInRow - 1) / 2) * spacing;
    z = row * spacing * 0.866; // sqrt(3)/2 for equilateral triangles
    y = baseY;
  } else {
    // Fallback to linear arrangement
    const spacing = 60;
    const totalWidth = (total - 1) * spacing;
    x = -totalWidth / 2 + index * spacing;
    z = 0;
    y = baseY;
  }

  mesh.position.set(x, y, z);
  mesh.userData.baseY = baseY;
  mesh.userData.layerName = layerName;
  mesh.userData.nodeId = node.id;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(mesh);

  // Add label
  const labelColor = LAYER_COLORS[layerName] || 0xffffff;
  const label = createLabelSprite(node.label || node.id, labelColor);
  label.position.set(0, height * 0.9, 0);
  mesh.add(label);

  // Add expand/collapse indicator if node has children
  if (hierarchyState && hierarchyState.hasChildren(node.id)) {
    const isExpanded = hierarchyState.isExpanded(node.id);
    const indicator = createExpandIndicator(isExpanded, labelColor);
    indicator.position.set(0, height * 1.8, 0);
    mesh.add(indicator);
    mesh.userData.expandIndicator = indicator;
  }

  return mesh;
}

/**
 * Create expand/collapse indicator sprite
 * @param {boolean} isExpanded - Whether node is expanded
 * @param {number} colorHex - Color in hex format
 * @returns {THREE.Sprite} Indicator sprite
 */
function createExpandIndicator(isExpanded, colorHex) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const size = 32;
  canvas.width = size;
  canvas.height = size;

  // Draw circle background
  ctx.fillStyle = `rgba(0, 0, 0, 0.6)`;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw +/- symbol
  ctx.strokeStyle = '#' + ('000000' + colorHex.toString(16)).slice(-6);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  if (isExpanded) {
    // Draw minus (-)
    ctx.beginPath();
    ctx.moveTo(size * 0.3, size / 2);
    ctx.lineTo(size * 0.7, size / 2);
    ctx.stroke();
  } else {
    // Draw plus (+)
    ctx.beginPath();
    ctx.moveTo(size * 0.3, size / 2);
    ctx.lineTo(size * 0.7, size / 2);
    ctx.moveTo(size / 2, size * 0.3);
    ctx.lineTo(size / 2, size * 0.7);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);

  sprite.scale.set(8, 8, 1);

  return sprite;
}

/**
 * Update expand/collapse indicator for a node
 * @param {THREE.Mesh} mesh - Node mesh
 * @param {boolean} isExpanded - Whether node is expanded
 * @param {number} colorHex - Color in hex format
 */
export function updateExpandIndicator(mesh, isExpanded, colorHex) {
  if (mesh.userData.expandIndicator) {
    mesh.remove(mesh.userData.expandIndicator);
  }

  const indicator = createExpandIndicator(isExpanded, colorHex || LAYER_COLORS[mesh.userData.layerName]);
  const height = 4;
  indicator.position.set(0, height * 1.8, 0);
  mesh.add(indicator);
  mesh.userData.expandIndicator = indicator;
}

/**
 * Create a circular guide line
 * @param {number} radius - Circle radius
 * @param {number} y - Y position
 * @param {number} color - Line color
 * @param {THREE.Scene} scene - Three.js scene
 */
function createCircleGuide(radius, y, color, scene) {
  const segments = 64;
  const geometry = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3,
    linewidth: 1
  });

  const line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
}

/**
 * Create a layer plane
 * @param {string} layerName - Layer name
 * @param {number} y - Y position
 * @param {number} size - Plane size
 * @param {number} color - Plane color
 * @param {THREE.Scene} scene - Three.js scene
 */
function createLayerPlane(layerName, y, size, color, scene) {
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = Math.PI / 2; // Rotate to be horizontal
  plane.position.y = y;
  scene.add(plane);

  // Add grid helper for the plane
  const gridHelper = new THREE.GridHelper(size, 10, color, color);
  gridHelper.position.y = y;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.2;
  scene.add(gridHelper);

  // Add layer label at the edge of the plane
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#' + ('000000' + color.toString(16)).slice(-6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(layerName.toUpperCase() + ' LAYER', canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(80, 20, 1);
  sprite.position.set(size / 2 - 40, y + 5, 0);
  scene.add(sprite);

  return plane;
}

/**
 * Create a layer label (text only, no plane)
 * @param {string} layerName - Layer name
 * @param {number} y - Y position
 * @param {number} color - Label color
 * @param {THREE.Scene} scene - Three.js scene
 */
function createLayerLabel(layerName, y, color, scene) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#' + ('000000' + color.toString(16)).slice(-6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(layerName.toUpperCase() + ' LAYER', canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(80, 20, 1);
  sprite.position.set(150, y + 5, 0); // Position at edge
  scene.add(sprite);
}

/**
 * Calculate hierarchy depth for each node
 * @param {Array} nodeIds - Array of node IDs
 * @param {Object} hierarchyState - Hierarchy state with hierarchyMap
 * @returns {Map} Map of nodeId to depth
 */
function calculateNodeDepths(nodeIds, hierarchyState) {
  const depths = new Map();

  // BFS to calculate depth of each node
  function getDepth(nodeId, visited = new Set()) {
    if (depths.has(nodeId)) return depths.get(nodeId);
    if (visited.has(nodeId)) return 0; // Circular reference protection

    visited.add(nodeId);
    const item = hierarchyState.hierarchyMap[nodeId];

    if (!item || !item.parent) {
      // Root node
      depths.set(nodeId, 0);
      return 0;
    }

    // Depth = parent depth + 1
    const parentDepth = getDepth(item.parent, visited);
    const depth = parentDepth + 1;
    depths.set(nodeId, depth);
    return depth;
  }

  // Calculate depth for all nodes
  nodeIds.forEach(id => getDepth(id));

  return depths;
}

/**
 * Build all nodes for a layer
 * @param {string} layerName - Layer name
 * @param {Array} nodeIds - Array of node IDs
 * @param {Object} nodeById - Map of node ID to node data
 * @param {number} angleOffset - Optional angle offset
 * @param {THREE.Scene} scene - Three.js scene
 * @param {Object} hierarchyState - Optional hierarchy state
 * @returns {Object} nodeMeshes and floatOffsets maps
 */
export function buildLayer(layerName, nodeIds, nodeById, angleOffset, scene, hierarchyState) {
  const total = nodeIds.length;
  const nodeMeshes = {};
  const floatOffsets = {};
  const layerMeshes = [];

  // Calculate hierarchy info for technical layer
  let nodeDepths = null;
  let nodesByDepth = null;

  if (layerName === 'technical' && hierarchyState) {
    nodeDepths = calculateNodeDepths(nodeIds, hierarchyState);

    // Group nodes by depth
    nodesByDepth = new Map();
    nodeIds.forEach(id => {
      const depth = nodeDepths.get(id) || 0;
      if (!nodesByDepth.has(depth)) {
        nodesByDepth.set(depth, []);
      }
      nodesByDepth.get(depth).push(id);
    });

    console.log('=== Technical Layer Hierarchy ===');
    console.log(`Total nodes: ${nodeIds.length}`);
    nodesByDepth.forEach((nodes, depth) => {
      console.log(`  Level ${depth}: ${nodes.length} nodes`);
    });
  }

  // First pass: create all nodes
  console.log(`\n=== Building ${layerName} layer (${nodeIds.length} nodes) ===`);

  for (let i = 0; i < nodeIds.length; i++) {
    const id = nodeIds[i];
    const node = nodeById[id];
    if (!node) continue;

    let hierarchyInfo = null;
    if (layerName === 'technical' && nodeDepths && nodesByDepth) {
      const depth = nodeDepths.get(id) || 0;
      const nodesAtDepth = nodesByDepth.get(depth);
      const indexAtDepth = nodesAtDepth.indexOf(id);

      hierarchyInfo = {
        depth: depth,
        indexAtDepth: indexAtDepth,
        totalAtDepth: nodesAtDepth.length
      };
    }

    const mesh = createNodeMesh(node, layerName, i, total, angleOffset, scene, hierarchyState, hierarchyInfo);

    // Log position for each node
    const pos = mesh.position;
    const depthInfo = hierarchyInfo ? ` [depth=${hierarchyInfo.depth}, ${hierarchyInfo.indexAtDepth + 1}/${hierarchyInfo.totalAtDepth}]` : '';
    console.log(`  ${node.label || id}${depthInfo}: (x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)})`);

    nodeMeshes[id] = mesh;
    floatOffsets[mesh.uuid] = randomFloatOffset();
    layerMeshes.push({ id, mesh });
  }

  // Second pass: center technical layer
  if (layerName === 'technical' && layerMeshes.length > 0) {
    centerTechnicalLayer(layerMeshes);
  } else {
    logLayerInfo(layerName, layerMeshes);
  }

  // Third pass: create visual guides (planes and circles)
  const layerColor = LAYER_COLORS[layerName] || 0x888888;

  if (layerName === 'workflow' || layerName === 'conceptual') {
    // Create plane at layer height
    const baseY = LAYER_Y[layerName];
    createLayerPlane(layerName, baseY, 300, layerColor, scene);

    // Create circle guide where nodes are positioned
    const circleRadius = layerName === 'conceptual' ? 50 : 100; // Match the node positioning radius
    createCircleGuide(circleRadius, baseY, layerColor, scene);

    console.log(`  ✓ Created plane and circle guide (radius=${circleRadius}) for ${layerName} layer at y=${baseY}`);
  } else if (layerName === 'technical' && nodesByDepth) {
    // Create label only (no plane) at base of technical layer
    const baseY = LAYER_Y[layerName];
    createLayerLabel(layerName, baseY, layerColor, scene);

    // Create circle guides for each depth level
    const levelHeight = 50;
    const baseRadius = 40;
    const radiusGrowth = 30;

    console.log(`\n=== Creating circle guides for technical layer ===`);
    nodesByDepth.forEach((nodes, depth) => {
      const y = baseY - (depth * levelHeight);
      const circleRadius = baseRadius + (depth * radiusGrowth);

      if (nodes.length > 1) {
        // Only create circle if there are multiple nodes at this level
        createCircleGuide(circleRadius, y, layerColor, scene);
        console.log(`  Level ${depth}: circle guide (radius=${circleRadius}) at y=${y}`);
      } else {
        console.log(`  Level ${depth}: single node at y=${y}, no circle needed`);
      }

      // Determine hierarchy level names from nodes at this depth
      const levelNames = new Set();
      nodes.forEach(nodeId => {
        const node = nodeById[nodeId];
        if (node && node.technical_level) {
          levelNames.add(node.technical_level);
        }
      });

      // Create label showing level name(s) and node count
      const levelNamesStr = Array.from(levelNames).join('/').toUpperCase() || `LEVEL ${depth}`;
      const labelText = `${levelNamesStr} (${nodes.length})`;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 512;
      canvas.height = 64;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#' + ('000000' + layerColor.toString(16)).slice(-6);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(60, 10, 1);
      sprite.position.set(circleRadius + 40, y, 0);
      scene.add(sprite);

      console.log(`  Level ${depth}: ${levelNamesStr} (${nodes.length} nodes)`);
    });
  }

  return { nodeMeshes, floatOffsets };
}

/**
 * Center the technical layer around origin
 * @param {Array} layerMeshes - Array of {id, mesh} objects
 */
function centerTechnicalLayer(layerMeshes) {
  // Calculate current geometric center
  let sumX = 0, sumZ = 0;
  for (const item of layerMeshes) {
    sumX += item.mesh.position.x;
    sumZ += item.mesh.position.z;
  }
  const centerX = sumX / layerMeshes.length;
  const centerZ = sumZ / layerMeshes.length;

  console.log('\n=== Technical Layer BEFORE Centering ===');
  console.log('Node count:', layerMeshes.length);
  console.log(`Geometric center: (x=${centerX.toFixed(3)}, z=${centerZ.toFixed(3)})`);

  // Apply centering offset
  for (const item of layerMeshes) {
    item.mesh.position.x -= centerX;
    item.mesh.position.z -= centerZ;
  }

  // Verify centering
  sumX = 0; sumZ = 0;
  for (const item of layerMeshes) {
    sumX += item.mesh.position.x;
    sumZ += item.mesh.position.z;
  }
  const newCenterX = sumX / layerMeshes.length;
  const newCenterZ = sumZ / layerMeshes.length;

  console.log('\n=== Technical Layer AFTER Centering ===');
  console.log(`Geometric center: (x=${newCenterX.toFixed(3)}, z=${newCenterZ.toFixed(3)})`);
  console.log('\nFinal positions:');
  layerMeshes.forEach(item => {
    const pos = item.mesh.position;
    const nodeId = item.mesh.userData.nodeId;
    console.log(`  ${nodeId}: (x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)})`);
  });
}

/**
 * Log layer information
 * @param {string} layerName - Layer name
 * @param {Array} layerMeshes - Array of {id, mesh} objects
 */
function logLayerInfo(layerName, layerMeshes) {
  if (layerMeshes.length === 0) return;

  let sumX = 0, sumZ = 0;
  for (const item of layerMeshes) {
    sumX += item.mesh.position.x;
    sumZ += item.mesh.position.z;
  }

  console.log(`Layer: ${layerName}`);
  console.log(`  Node count: ${layerMeshes.length}`);
  console.log(`  Geometric center: (x=${(sumX/layerMeshes.length).toFixed(3)}, z=${(sumZ/layerMeshes.length).toFixed(3)})`);
}
