/**
 * Three.js scene setup and configuration
 */

/**
 * Initialize Three.js scene, camera, renderer, and controls
 * @param {HTMLElement} container - Container element for the renderer
 * @returns {Object} Scene components (scene, camera, renderer, controls)
 */
export function initializeScene(container) {
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071820);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    5000
  );
  camera.position.set(0, 160, 320);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.target.set(0, 0, 0);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(100, 200, 100);
  scene.add(directional);

  // Grid floor
  const grid = new THREE.GridHelper(600, 20, 0x123b4a, 0x0b2530);
  grid.position.y = -200;
  scene.add(grid);

  return { scene, camera, renderer, controls };
}

/**
 * Setup window resize handler
 * @param {THREE.Camera} camera - Three.js camera
 * @param {THREE.Renderer} renderer - Three.js renderer
 */
export function setupResizeHandler(camera, renderer) {
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}

/**
 * Animation loop
 * @param {THREE.Renderer} renderer - Three.js renderer
 * @param {THREE.Scene} scene - Three.js scene
 * @param {THREE.Camera} camera - Three.js camera
 * @param {THREE.OrbitControls} controls - Orbit controls
 * @param {Object} nodeMeshes - Map of node ID to mesh
 * @param {Object} floatOffsets - Map of mesh UUID to float offset
 */
export function startAnimationLoop(renderer, scene, camera, controls, nodeMeshes, floatOffsets) {
  function animate(time) {
    requestAnimationFrame(animate);

    const t = time * 0.001;

    // Subtle floating animation for nodes
    Object.keys(nodeMeshes).forEach(id => {
      const mesh = nodeMeshes[id];
      const baseY = mesh.userData.baseY || 0;
      const phase = floatOffsets[mesh.uuid] || 0;
      mesh.position.y = baseY + Math.sin(t * 0.6 + phase) * 3.0;
    });

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
