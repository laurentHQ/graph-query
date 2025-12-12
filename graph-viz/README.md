# 3D Knowledge Graph - Modular Architecture

## Structure

```
results-service/docs/
├── index.html              # Main HTML entry point
├── graph_data.json         # Graph data (unchanged)
├── js/                     # ES6 modules
│   ├── main.js            # Entry point & initialization
│   ├── scene-setup.js     # Three.js scene, camera, renderer, controls
│   ├── node-builder.js    # Node mesh creation & positioning
│   ├── edge-builder.js    # Edge/connection rendering
│   ├── interaction.js     # Mouse events, raycasting, selection
│   ├── info-panel.js      # Info panel UI logic
│   ├── network-discovery.js # Network discovery algorithm
│   └── utils.js           # Helper functions (labels, colors)
└── README.md              # This file
```

## Modules Overview

### `main.js`
**Entry point** - Orchestrates initialization, loads graph data, and wires modules together.

**Key functions:**
- `initVisualization(graphData)` - Main initialization
- `loadAndInitialize()` - Async data loading

### `scene-setup.js`
**Three.js setup** - Scene, camera, renderer, lights, controls, and animation loop.

**Exports:**
- `initializeScene(container)` - Initialize Three.js components
- `setupResizeHandler(camera, renderer)` - Window resize handling
- `startAnimationLoop(...)` - Main render loop

### `node-builder.js`
**Node creation** - Creates and positions node meshes with labels.

**Exports:**
- `LAYER_Y` - Y-axis positions for layers
- `LAYER_COLORS` - Color scheme for layers
- `createNodeMesh(...)` - Create single node mesh
- `buildLayer(...)` - Build all nodes in a layer

**Features:**
- Circular arrangement for workflow/conceptual layers
- Triangular grid for technical layer
- Automatic centering for technical layer

### `edge-builder.js`
**Edge creation** - Builds connections between nodes.

**Exports:**
- `buildEdges(graph, nodeMeshes, scene)` - Create all edges
- `highlightConnections(nodeId, edgeData, edgeLines)` - Highlight specific connections
- `resetEdgeHighlights(edgeLines)` - Reset all edges to default opacity

### `interaction.js`
**Mouse interaction** - Hover, click, and selection handling.

**Exports:**
- `setupInteraction(camera, renderer, state)` - Initialize mouse handlers
- `toggleNetworkDiscovery(nodeId, state)` - Toggle network discovery mode

**Features:**
- Raycasting for node detection
- Hover effects (1.2x scale)
- Click selection (1.3x scale)

### `info-panel.js`
**UI panel** - Displays node information and connections.

**Exports:**
- `showNodeInfo(...)` - Display node details in panel
- `closeInfoPanel(state)` - Close panel and reset state

**Displays:**
- Node type, description, file location
- Incoming/outgoing connections
- Network discovery stats

### `network-discovery.js`
**Graph traversal** - BFS algorithm for network exploration.

**Exports:**
- `discoverNetwork(startNodeId, maxDepth, edgeData)` - Find connected nodes
- `getNetworkDepth(startNodeId, discoveredNodes, edgeData)` - Calculate network depth

### `utils.js`
**Helper functions** - Reusable utilities.

**Exports:**
- `createLabelSprite(text, colorHex)` - Create text labels
- `getEdgeColor(edge)` - Get edge color by layer
- `randomFloatOffset()` - Random animation offset

## Running the Application

### Requirements
- **Local server** required (ES6 modules don't work with `file://` protocol)

### Option 1: Python HTTP Server
```bash
cd results-service/docs
python3 -m http.server 8080
# Open http://localhost:8080
```

### Option 2: Node.js HTTP Server
```bash
npm install -g http-server
cd results-service/docs
http-server -p 8080
# Open http://localhost:8080
```

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

## Development Workflow

### Adding a New Feature

1. **Identify the appropriate module** (or create new one)
2. **Export new functions** from the module
3. **Import in dependent modules** or `main.js`
4. **Update state object** if needed (in `main.js`)

### Example: Adding a new visualization mode

1. Create `js/hierarchy-view.js`
2. Export functions like `enableHierarchyMode(state)`
3. Import in `main.js` or `interaction.js`
4. Wire up UI controls

## Benefits of Modular Structure

✅ **Maintainability** - Each module has single responsibility
✅ **Testability** - Can test modules independently
✅ **Extensibility** - Easy to add new features
✅ **Reusability** - Modules can be reused across projects
✅ **Readability** - ~100-200 lines per module vs 800+ lines monolith
✅ **Collaboration** - Multiple developers can work on different modules

## Migration Notes

### Changes from Original
- ✅ Functionality identical to original monolithic version
- ✅ `graph_data.json` format unchanged
- ✅ CSS and HTML structure unchanged
- ✅ All features preserved (hover, click, network discovery, info panel)

### Breaking Changes
- ⚠️ **Requires local server** (ES6 modules)
- ⚠️ Browser must support ES6 modules (all modern browsers do)

## Next Steps

This modular structure is ready for the **collapsible hierarchy feature** (issue `document_extraction_orchestrator-5d7`):

1. Create `js/hierarchy-controller.js` for collapse/expand logic
2. Extend `node-builder.js` to support hierarchical rendering
3. Update `graph_data.json` schema to include `children` and `technical_level`
4. Add UI controls in `index.html`

The clean separation of concerns makes adding this feature straightforward!
