/**
 * Utility functions for the 3D knowledge graph
 */

/**
 * Create a text label sprite
 * @param {string} text - Text to display
 * @param {number} colorHex - Color in hex format
 * @returns {THREE.Sprite} Label sprite
 */
export function createLabelSprite(text, colorHex) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 44;
  ctx.font = `bold ${fontSize}px sans-serif`;

  const textWidth = ctx.measureText(text).width;
  canvas.width = textWidth + 60;
  canvas.height = fontSize + 30;

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#' + ('000000' + colorHex.toString(16)).slice(-6);
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 30, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);

  const scaleFactor = 0.12;
  sprite.scale.set(canvas.width * scaleFactor, canvas.height * scaleFactor, 1);

  return sprite;
}

/**
 * Get color for edge based on layer
 * @param {Object} edge - Edge object with layer property
 * @returns {number} Color in hex format
 */
export function getEdgeColor(edge) {
  switch (edge.layer) {
    case 'workflow-to-conceptual': return 0x6ec3ff;
    case 'conceptual-to-technical': return 0xffd46e;
    case 'technical': return 0x9ca3af;
    default: return 0x4b5563;
  }
}

/**
 * Generate random float offset for animation
 * @returns {number} Random offset between 0 and 2π
 */
export function randomFloatOffset() {
  return Math.random() * Math.PI * 2;
}
