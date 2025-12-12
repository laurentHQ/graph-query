# Graph Evolution & Extension Guide

This document explains how to extend and maintain an existing code knowledge graph as the codebase grows, while preserving consistency with established structure.

**Use this guide when**:
- User asks to "update the graph for latest changes"
- User says "extend the graph for this new service"
- Working with an evolving codebase over multiple sessions

---

## General Principles of Graph Evolution

### 1. Preserve Stable IDs

✅ **Do**:
- Keep `id` values unchanged for existing nodes
- A function/class/file that still exists with the same role keeps its `id`

❌ **Don't**:
- Change node IDs unnecessarily
- Create new IDs for renamed files unless logical identity changes

**Example**:
```json
// Function moved from orders/checkout.py to orders/flows/checkout_flow.py
// Keep same ID, update metadata
{
  "id": "func_process_checkout",  // ✅ ID unchanged
  "file": "orders/flows/checkout_flow.py",  // Updated path
  "line": 52  // Updated line number
}
```

---

### 2. Prefer Incremental Updates

✅ **Do**:
- Add new nodes/edges to existing graph
- Adjust existing nodes
- Mark removed nodes as deprecated

❌ **Don't**:
- Generate completely new disconnected graph
- Replace everything from scratch

---

### 3. Maintain Hierarchy and Connectivity

Every new node must fit into existing hierarchy:
```
Service → Module → File → Class → Function/Method
```

Every new node should connect to:
- Its **technical parent** via `contains`
- At least one **concept** or **workflow** when appropriate

---

### 4. Be Explicit About Uncertainty

When inferring mappings for new code:
- Set `inferred: true`
- Note assumptions in `description`
- Document what's uncertain

---

### 5. Avoid Duplication

Before creating a new node:
1. Check if equivalent node exists by matching:
   - `type`, `file`, `label`, `path`, `service`
2. If found, **update** instead of creating duplicate

---

## Typical Evolution Scenarios

### Scenario 1: New Feature / Workflow Added

When adding new feature (e.g., "guest checkout", "export report"):

#### Step 1: Add/Extend Workflow Nodes

```json
{
  "id": "workflow_guest_checkout",
  "type": "Workflow",
  "label": "Guest Checkout Flow",
  "description": "Checkout without account creation.",
  "inferred": false
}
```

Connect to relevant `Concept` nodes using `includes` or `realizes`.

#### Step 2: Add/Extend Concept Nodes

If feature introduces new domain ideas:

```json
{
  "id": "concept_guest_order",
  "type": "Concept",
  "label": "Guest Order",
  "description": "Orders placed by users without permanent accounts.",
  "inferred": false
}
```

Link to existing higher-level concepts using `part_of`, `relates_to`.

#### Step 3: Add Technical Nodes

```json
{
  "id": "func_process_guest_checkout",
  "type": "Function",
  "technical_level": "function",
  "label": "process_guest_checkout",
  "file": "orders/guest_checkout.py",
  "line": 30,
  "importance": "core",
  "entrypoint": true,
  "description": "Coordinates guest checkout without full registration.",
  "inferred": false
}
```

Tag with appropriate `technical_level`, `importance`, `entrypoint`.

#### Step 4: Connect Cross-Layer Paths

Ensure path: `Workflow → Concept → Technical`

```json
{
  "edges": [
    {
      "source": "workflow_guest_checkout",
      "target": "concept_guest_order",
      "type": "includes",
      "layer": "workflow-to-conceptual"
    },
    {
      "source": "concept_guest_order",
      "target": "func_process_guest_checkout",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    }
  ]
}
```

---

### Scenario 2: Code Modified or Refactored

When functions/classes are refactored, moved, or renamed:

#### Keep IDs if Logical Identity Remains

If same logical entity moved:
- **Keep** its `id`
- **Update**: `file`, `path`, `line`, `description`
- **Update**: `contains` edges

**Example**:
```json
// Before: orders/checkout.py
// After: orders/flows/checkout_flow.py

{
  "id": "func_process_checkout",  // ID unchanged
  "file": "orders/flows/checkout_flow.py",  // Updated
  "line": 52,  // Updated
  "description": "Refactored into new flows module. Functionality unchanged."
}
```

#### Update Hierarchy Edges

```json
{
  "remove_edges": [
    {
      "source": "file_orders_checkout_py",
      "target": "func_process_checkout"
    }
  ],
  "add_edges": [
    {
      "source": "file_orders_flows_checkout_flow_py",
      "target": "func_process_checkout",
      "type": "contains",
      "layer": "technical"
    }
  ]
}
```

#### Preserve Cross-Layer Intent

Cross-layer edges often remain valid:
- Same concept still implemented, just in new location
- Update only if concept changes or implementation splits/merges

#### Split or Merge Cases

**Split** (one function becomes multiple):
- Keep original node as orchestrator (if still exists)
- Add new function nodes
- Connect to same concept/workflow
- Clarify roles in descriptions

**Merge** (multiple functions collapsed):
- Keep most representative `id`
- Update `description` to reflect new scope
- Remove/deprecate old nodes
- Move incoming edges to new node

---

### Scenario 3: Code Deleted or Feature Removed

When code is removed:

#### Option A: Mark as Deprecated (Historical Traceability)

```json
{
  "id": "func_old_checkout",
  "deprecated": true,
  "description": "Deprecated in v2.0. Replaced by process_checkout_v2."
}
```

#### Option B: Remove Completely (Current-Only Graph)

```json
{
  "remove_nodes": ["func_old_checkout"],
  "remove_edges": [
    { "source": "file_checkout_py", "target": "func_old_checkout" },
    { "source": "concept_checkout", "target": "func_old_checkout" }
  ]
}
```

#### Adjust Workflows and Concepts

- Update workflow descriptions
- Adjust `precedes`/`follows` edges
- Consider marking concepts as deprecated if no longer implemented

#### Avoid Dangling Edges

Ensure any edge pointing to removed node is also removed.

---

## Extension Process for Agent

When user wants to **extend/update existing graph**:

### Step 1: Understand Current Scope

Ask or infer:
- Does user have existing graph JSON?
- Or wants conceptual update description?

If graph provided, parse:
- Node IDs, types, key hierarchies
- Major workflows and concepts
- Current layer distribution

### Step 2: Identify Changes in Codebase

From user input (diffs, new files, descriptions), determine:

- ✅ New features or workflows
- ✅ New modules/services or files
- ✅ Significant new classes/functions
- ⚠️ Refactors: moves/renames
- ❌ Deletions

Focus on **meaningful changes**, not every line-level edit.

### Step 3: Plan Updates by Category

Group changes into:

| Category | Action |
|----------|--------|
| New nodes/edges | Add |
| Existing nodes/edges | Update |
| Removed nodes/edges | Mark deprecated or remove |

### Step 4: Apply Updates While Preserving Structure

#### New Workflow/Concept

- Create new nodes
- Connect to relevant existing concepts and technical nodes

#### New Technical Nodes

- Place in correct hierarchy (`Service → Module → File → Class → Function`)
- Tag with `technical_level`, `importance`, `entrypoint`
- Connect to relevant concepts/workflows via cross-layer edges

#### Modified Code

- Update metadata: `file`, `line`, `description`
- Adjust `contains` edges if parent changed
- Preserve ID and cross-layer intent

#### Removed Code

- Remove or mark deprecated per user preference
- Remove or mark associated edges

### Step 5: Run Connectivity Sanity Check

After applying changes, verify:

- [ ] Every new node has at least one parent (technical nodes via `contains`)
- [ ] All new nodes listed in `layers` arrays
- [ ] Workflows and concepts still connect to technical nodes
- [ ] No edge references non-existent node ID
- [ ] Technical hierarchy complete (all nodes have parents)

### Step 6: Return Result

Choose format based on user preference:

**Option A: Patched Full Graph**
```json
{
  "nodes": [ ... ],  // Complete updated list
  "edges": [ ... ],  // Complete updated list
  "layers": { ... }  // Complete updated registry
}
```

**Option B: Diff-Style Changes**
```json
{
  "add_nodes": [ ... ],
  "add_edges": [ ... ],
  "update_nodes": [ ... ],
  "remove_nodes": [ ... ],
  "remove_edges": [ ... ]
}
```

---

## Maintaining Consistency

### 1. Reuse Patterns and Naming Conventions

Generate IDs consistent with existing ones:
- `func_<name>`
- `file_<path_with_underscores>`
- `workflow_<name>`
- `concept_<domain_name>`

Use similar vocabulary in `label` and `description`.

### 2. Respect Layer Semantics

✅ **Continue using**:
- `Workflow` only for end-to-end flows
- `Concept` only for domain abstractions
- Technical types for implementation details

❌ **Don't**:
- Introduce new types that blur boundaries
- Mix layer concerns

### 3. Respect Edge Semantics

Use existing edge types consistently:
- `contains`, `implemented_by`, `includes`, etc.

Avoid adding new edge types unless:
- Clearly necessary
- Properly documented

### 4. Keep Complexity Manageable

Apply same **technical granularity policy**:
- Add fine-grained nodes only where:
  - User requested deeper insight
  - New logic is core to important workflows
- Avoid flooding with trivial helpers

### 5. Document Unusual Changes

If deviating from existing patterns:
- Note in `description` of relevant nodes
- Provide short explanation alongside JSON

---

## When in Doubt

Prefer **conservative extension**:
- Add fewer nodes with clearer connections
- Rather than many highly speculative nodes

Mark uncertain mappings:
- `inferred: true`
- Clear reasoning in descriptions
- Allow human refinement later

---

## Complete Extension Example

### Original Graph
```json
{
  "nodes": [
    { "id": "workflow_checkout", "type": "Workflow" },
    { "id": "concept_order", "type": "Concept" },
    { "id": "service_orders", "type": "Service" }
  ],
  "edges": [
    { "source": "workflow_checkout", "target": "concept_order", "type": "includes" },
    { "source": "concept_order", "target": "service_orders", "type": "implemented_by" }
  ],
  "layers": {
    "workflow": ["workflow_checkout"],
    "conceptual": ["concept_order"],
    "technical": ["service_orders"]
  }
}
```

### User Adds Guest Checkout Feature

#### Changes Applied
```json
{
  "add_nodes": [
    {
      "id": "workflow_guest_checkout",
      "type": "Workflow",
      "label": "Guest Checkout",
      "description": "Checkout without registration."
    },
    {
      "id": "concept_guest_order",
      "type": "Concept",
      "label": "Guest Order",
      "description": "Orders from non-registered users."
    },
    {
      "id": "file_guest_checkout_py",
      "type": "File",
      "technical_level": "file",
      "file": "orders/guest_checkout.py"
    },
    {
      "id": "func_process_guest",
      "type": "Function",
      "technical_level": "function",
      "file": "orders/guest_checkout.py",
      "line": 30,
      "importance": "core",
      "entrypoint": true
    }
  ],
  "add_edges": [
    {
      "source": "workflow_guest_checkout",
      "target": "concept_guest_order",
      "type": "includes",
      "layer": "workflow-to-conceptual"
    },
    {
      "source": "concept_guest_order",
      "target": "func_process_guest",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    },
    {
      "source": "service_orders",
      "target": "file_guest_checkout_py",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "file_guest_checkout_py",
      "target": "func_process_guest",
      "type": "contains",
      "layer": "technical"
    }
  ],
  "update_layers": {
    "workflow": ["workflow_checkout", "workflow_guest_checkout"],
    "conceptual": ["concept_order", "concept_guest_order"],
    "technical": ["service_orders", "file_guest_checkout_py", "func_process_guest"]
  }
}
```

---

## Benefits of This Approach

By following this guide, Agent will:

✅ **Extend the graph** as codebase grows
✅ **Maintain consistent structure** aligned with main schema
✅ **Provide stable, queryable representation** of evolving architecture
✅ **Enable historical traceability** when needed
✅ **Support iterative development** workflows
