# Connectivity and Consistency Rules

These rules ensure correct and consistent relationships between nodes across all layers.

---

## 1. Workflow Connectivity

Every `Workflow` node **must**:

- Connect to **at least one `Concept`** node via:
  - `includes`, `realizes`, or `composed_of` edges
  - Layer: `"workflow-to-conceptual"`

- Connect (directly or indirectly through concepts) to **at least one technical node** when code is visible:
  - `Service`, `Module`, `Endpoint`, etc.

**Example**:
```
Workflow "User Signup"
  └─includes→ Concept "User Registration"
      └─implemented_by→ Function "createUser"
```

---

## 2. Concept Connectivity

Every `Concept` node **must** connect to:

- **At least one `Workflow`** (when applicable), AND/OR
- **At least one technical node** that implements/supports it via:
  - `implemented_by` or `supported_by` edges
  - Layer: `"conceptual-to-technical"`

**Avoid** isolated concepts with no relationships unless explicitly modeling standalone concepts.

**Mark isolated nodes** clearly in descriptions with `inferred: true` if uncertain.

**Example**:
```
Concept "Payment Authorization"
  ├─part_of→ Workflow "Checkout Flow"
  └─implemented_by→ Service "Payment Service"
```

---

## 3. Technical Hierarchy Connectivity

Every lower-level technical node **must have a clear parent**:

### Containment Rules

| Child Node | Parent Node | Relationship |
|------------|-------------|--------------|
| `Module` | `Service` or parent module | `contains` |
| `File` | Exactly one `Module` | `contains` |
| `Class` | `File` | `contains` |
| `Function` (top-level) | `File` | `contains` |
| `Method` | `Class` | `contains` |

### Requirements

- Use `contains` edges with `layer: "technical"`
- Every technical node must be **reachable via `contains` chain** from at least one `Service` or top-level module
- No orphaned technical nodes when parent information is available

**Example Hierarchy**:
```
Service "Orders Service"
  └─contains→ Module "orders"
      └─contains→ File "orders/checkout.py"
          ├─contains→ Class "CheckoutProcessor"
          │   └─contains→ Method "process"
          └─contains→ Function "validate_cart"
```

---

## 4. Cross-Layer Connectivity

### Allowed Cross-Layer Directions

**Forward (top-down)**:
- `Workflow` → `Concept`: Use `includes`, `realizes`
- `Concept` → Technical: Use `implemented_by`, `supported_by`

**Avoid reverse cross-layer edges** (e.g., technical → Concept) unless clearly justified and documented.

### Path Requirement

For each major workflow and concept, ensure **at least one complete path**:

```
Workflow → Concept → Technical node(s)
```

When underlying code and description allow this connectivity.

**Example Complete Path**:
```
Workflow "Order Checkout"
  └─includes→ Concept "Order Validation"
      └─implemented_by→ Service "Orders Service"
          └─contains→ Module "orders"
              └─contains→ File "validators.py"
                  └─contains→ Function "validate_order"
```

---

## 5. No Dangling IDs and Layer Registration

### ID Validation

- Every `source` and `target` in `edges` **must** refer to an existing node `id`
- No references to non-existent nodes

### Layer Registration

Every node **must** be listed in the appropriate `layers` array:

- `Workflow` nodes → `layers.workflow`
- `Concept` nodes → `layers.conceptual`
- Technical nodes → `layers.technical`

### When Adding New Nodes

When refining the graph with new nodes:

1. Create corresponding edges to connect to parent/higher-level nodes
2. Register in the correct layer list
3. Verify parent `contains` edges exist for technical hierarchy

---

## 6. Connectivity Checks (Pre-Finalization)

Before finalizing the graph, verify:

### Reachability
- From each `Workflow`, can you follow edges to at least one `Concept`?
- From each key `Concept`, can you reach at least one technical element?

### Hierarchy Correctness
- No technical node appears at a child level without a parent `contains` edge
- All `contains` edges point in the correct direction (parent → child)

### Consistency
- No obviously mismatched edges (e.g., `contains` from `Function` to `Module`)
- Edge types match the relationship (structural vs. flow vs. cross-layer)
- Layer designations are correct for each edge

---

## Handling Missing Information

When connectivity cannot be guaranteed due to missing information:

### What to Do

1. **Connect as far as possible** using the rules above
2. **Mark uncertain nodes** with `inferred: true`
3. **Document assumptions** in node `description` fields
4. **Note missing links** explicitly

### Example

```json
{
  "id": "concept_billing_logic",
  "type": "Concept",
  "label": "Billing Logic",
  "description": "Handles subscription billing. Implementation details not yet visible in provided code.",
  "inferred": true
}
```

---

## Common Violations to Avoid

### ❌ Isolated Workflow
```
Workflow "User Login"  [No edges to any Concept]
```
**Fix**: Add `includes` edge to relevant Concept.

### ❌ Orphaned Technical Node
```
Function "calculateTax"  [No parent File or Class]
```
**Fix**: Add `contains` edge from parent `File`.

### ❌ Concept with No Implementation
```
Concept "Inventory Management"  [No edges to any technical nodes]
```
**Fix**: Add `implemented_by` edge to relevant `Service` or `Module`.

### ❌ Reverse Cross-Layer Edge
```
Class "UserRepository" ─implemented_by→ Concept "User Data Access"
```
**Fix**: Reverse direction: `Concept ─implemented_by→ Class`.

### ❌ Dangling Edge Reference
```
Edge: { source: "func_foo", target: "class_bar_missing" }
[class_bar_missing does not exist in nodes]
```
**Fix**: Either add `class_bar_missing` to nodes or remove the edge.

---

## Validation Checklist

Use this checklist before outputting the final graph:

- [ ] Every Workflow connects to at least one Concept
- [ ] Every Concept connects to at least one Workflow or technical node
- [ ] Every technical node has a parent via `contains` (except top-level Services/Modules)
- [ ] All edge source/target IDs exist in nodes array
- [ ] All nodes are registered in the correct layers arrays
- [ ] Cross-layer edges flow in the correct direction (Workflow → Concept → Technical)
- [ ] No obviously inconsistent edge types or layer designations
- [ ] At least one complete path from major Workflows through Concepts to Technical nodes
