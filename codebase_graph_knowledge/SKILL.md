# Code Knowledge Graph Mapper - Autonomous Skill Reference

---
**name**: Code Knowledge Graph Mapper
**description**: Generate a 3-layer JSON knowledge graph of workflows, concepts, and code from a source repository.
**dependencies**: python>=3.10
---

## Quick Reference

This skill generates **3-layer JSON knowledge graphs** from codebases, capturing workflows, domain concepts, and implementation details.

### When to Use
- User asks for "knowledge graph", "architecture graph", or "workflow/concept/technical layers"
- Understanding how code implements business logic and workflows
- Machine-readable architecture documentation for analysis/visualization

### What You'll Produce
A **valid JSON graph** with:
- **Workflow Layer**: End-to-end flows and system behavior
- **Conceptual Layer**: Domain concepts and design intent
- **Technical Layer**: Hierarchical implementation (Service → Module → File → Class → Method)

---

## Core Execution Process

### Step 1: Clarify Scope (Brief)
Ask if unclear:
- Which services/domains to focus on?
- Interest in workflows, concepts, or technical dependencies?
- Any specific areas for deep dive?

**Default**: Include all major services, balance all three layers.

---

### Step 2: Scan Material

**Look for**:
- Main directories/modules (auth/, orders/, payments/)
- Entrypoints: HTTP routes, CLI commands, event handlers
- Central classes: *Service, *Manager, *Processor
- Frequently used functions

---

### Step 3: Build Top-Down in 3 Passes

#### Pass A: High-Level Structure (Skeleton)

**Create 3-10 Workflows**:
```json
{
  "id": "workflow_user_signup",
  "type": "Workflow",
  "label": "User Signup Flow",
  "description": "Triggered by registration form. Validates email, creates account, sends confirmation.",
  "inferred": false
}
```

**Create 5-20 Concepts**:
```json
{
  "id": "concept_user_auth",
  "type": "Concept",
  "label": "User Authentication",
  "description": "Handles credential validation, session management, and token generation.",
  "inferred": false
}
```

**Create Key Services/Modules**:
```json
{
  "id": "service_auth",
  "type": "Service",
  "technical_level": "service",
  "label": "Auth Service",
  "path": "auth/",
  "description": "Authentication and authorization service.",
  "inferred": false
}
```

**Connect Cross-Layer**:
```json
{
  "edges": [
    {
      "source": "workflow_user_signup",
      "target": "concept_user_auth",
      "type": "includes",
      "layer": "workflow-to-conceptual"
    },
    {
      "source": "concept_user_auth",
      "target": "service_auth",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    }
  ]
}
```

**Verify**: No major workflow/concept is completely disconnected.

---

#### Pass B: Mid-Level Technical (Files & Classes)

**Add Files to each Module/Service**:
```json
{
  "id": "file_auth_handlers_py",
  "type": "File",
  "technical_level": "file",
  "label": "auth/handlers.py",
  "file": "auth/handlers.py",
  "description": "HTTP handlers for authentication endpoints.",
  "inferred": false
}
```

**Add Key Classes**:
```json
{
  "id": "class_auth_service",
  "type": "Class",
  "technical_level": "class",
  "label": "AuthService",
  "file": "auth/service.py",
  "line": 15,
  "description": "Main authentication service class.",
  "inferred": false
}
```

**Create Hierarchy with `contains`**:
```json
{
  "edges": [
    {
      "source": "service_auth",
      "target": "module_auth",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "module_auth",
      "target": "file_auth_handlers_py",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "file_auth_handlers_py",
      "target": "class_auth_service",
      "type": "contains",
      "layer": "technical"
    }
  ]
}
```

**Link to Concepts**:
```json
{
  "source": "concept_user_auth",
  "target": "class_auth_service",
  "type": "implemented_by",
  "layer": "conceptual-to-technical"
}
```

**Verify**: Every File/Class has parent via `contains`.

---

#### Pass C: Fine-Grained (Functions/Methods - SELECTIVE)

**Include Functions/Methods ONLY when**:

✅ **Entry points** → `entrypoint: true`, `importance: "core"`:
- HTTP endpoints (`POST /api/login`)
- CLI commands (`process-orders`)
- Event handlers (`onOrderPlaced`)
- Main functions

✅ **Orchestrators** → `importance: "core"` or `"supporting"`:
- Functions coordinating multiple calls

✅ **Core business logic** → `importance: "core"` or `"supporting"`:
- Domain rules (calculate_tax, authorize_payment)

❌ **Avoid** trivial helpers (format_date, build_url) unless explicitly important.

**Example Function**:
```json
{
  "id": "func_login_user",
  "type": "Function",
  "technical_level": "function",
  "label": "login_user",
  "file": "auth/handlers.py",
  "line": 42,
  "importance": "core",
  "entrypoint": true,
  "description": "HTTP handler for user login. Validates credentials and creates session.",
  "inferred": false
}
```

**Add to Hierarchy**:
```json
{
  "source": "file_auth_handlers_py",
  "target": "func_login_user",
  "type": "contains",
  "layer": "technical"
}
```

**Add Flow Edges**:
```json
{
  "source": "func_login_user",
  "target": "method_validate_credentials",
  "type": "calls",
  "layer": "technical"
}
```

**Verify**: Functions connect to Concepts and have parent Files/Classes.

---

### Step 4: Create JSON & Validate

**Assemble Structure**:
```json
{
  "nodes": [ ... ],
  "edges": [ ... ],
  "layers": {
    "workflow": [ ... ],
    "conceptual": [ ... ],
    "technical": [ ... ]
  }
}
```

**Final Checks**:
- [ ] All edge source/target IDs exist in nodes
- [ ] All nodes registered in layers arrays
- [ ] Valid JSON (no trailing commas, proper quotes)
- [ ] Complete paths: Workflow → Concept → Technical
- [ ] Technical hierarchy complete (all nodes have parents via `contains`)
- [ ] No dangling/orphaned nodes

---

## Essential Schema Reference

### Node Structure
```json
{
  "id": "unique_id",
  "type": "Workflow|Concept|Service|Module|File|Class|Function|Method|Event|Endpoint",
  "label": "Human readable name",
  "description": "1-3 sentences explaining purpose and behavior",
  "technical_level": "service|module|file|class|function|method|endpoint|event",
  "importance": "core|supporting|helper",
  "entrypoint": true,
  "file": "path/to/file.py",
  "line": 42,
  "inferred": false
}
```

### Edge Structure
```json
{
  "source": "source_node_id",
  "target": "target_node_id",
  "type": "contains|calls|imports|implemented_by|includes|etc",
  "layer": "workflow|conceptual|technical|workflow-to-conceptual|conceptual-to-technical"
}
```

### Key Edge Types

**Structural** (Technical hierarchy):
- `contains`: Parent → Child (Service → Module → File → Class → Method)
- `defined_in`: Where something is defined

**Flow/Dependency**:
- `calls`: Function/method calls
- `imports`: Module imports
- `depends_on`: Dependency relationship
- `emits`: Emits event
- `handles`: Handles event

**Cross-Layer** (Top-down only):
- `includes`, `realizes`, `composed_of`: Workflow → Concept
- `implemented_by`, `supported_by`: Concept → Technical

---

## Connectivity Requirements (CRITICAL)

### 1. Workflow Connectivity
✅ Every Workflow → at least one Concept
✅ Workflow → Concept → Technical (complete path)

### 2. Concept Connectivity
✅ Every Concept → at least one Workflow OR Technical node
❌ No isolated concepts without relationships

### 3. Technical Hierarchy
✅ Every technical node has parent via `contains`:
- Module → Service
- File → Module
- Class/Function → File
- Method → Class

✅ All technical nodes reachable from Service/Module

### 4. Cross-Layer Direction
✅ Forward (top-down): Workflow → Concept → Technical
❌ Avoid: Technical → Concept (reverse)

### 5. Layer Registration
✅ Every node in appropriate `layers` array:
- Workflows in `layers.workflow`
- Concepts in `layers.conceptual`
- Technical in `layers.technical`

---

## Best Practices (Essential Rules)

### 1. Abstraction Over Dumps
❌ **Don't**: Include every function/variable
✅ **Do**: Focus on architecturally significant elements
✅ **Do**: Use `technical_level` and `importance` to mark granularity

### 2. Layer Separation
✅ **Clear boundaries**: Workflow = flows, Concept = domain, Technical = code
✅ **Cross-layer edges**: Use proper types and layer designations
❌ **Don't**: Mix concerns or create unclear node types

### 3. Hierarchical Structure
✅ **Always**: Build Service → Module → File → Class → Method hierarchy
✅ **Use**: `contains` edges for parent-child relationships
❌ **Don't**: Create flat structures or orphaned nodes

### 4. Honesty About Inference
✅ **Mark inferred nodes**: `"inferred": true`
✅ **Note assumptions**: "Inferred from directory structure..."
❌ **Don't**: Hallucinate specific details without evidence

### 5. Valid JSON First
✅ **Output**: Valid, parsable JSON
✅ **Then**: Optional natural language explanation
❌ **Never**: Mix prose into JSON or output invalid syntax

---

## Handling Common Scenarios

### Scenario: Limited Information
If code isn't fully visible:
- Infer structure from naming patterns
- Mark with `"inferred": true`
- Note assumptions in descriptions
- Be conservative

### Scenario: User Requests Updates
When extending existing graph:
- **Preserve**: Stable node IDs
- **Add**: New nodes/edges to existing structure
- **Update**: Metadata (file, line, description)
- **Connect**: New nodes to existing hierarchy
- **Verify**: Connectivity still complete

See [graph-evolution.md](./references/graph-evolution.md) for detailed update process.

### Scenario: Deep Dive Request
When user wants detailed view of specific area:
- Add more function/method nodes for that area ONLY
- Mark with `importance: "supporting"` or `"helper"`
- Maintain connectivity to parents and concepts
- Keep rest of graph at high level

---

## Quick Validation Checklist

Before outputting, verify:

- [ ] **Schema**: All nodes have required fields (id, type, label, description)
- [ ] **Edges**: All source/target IDs exist in nodes
- [ ] **Layers**: All nodes registered in appropriate layers arrays
- [ ] **Hierarchy**: Technical nodes have parents via `contains`
- [ ] **Connectivity**: Complete paths from Workflows → Concepts → Technical
- [ ] **JSON**: Valid syntax (no trailing commas, proper quotes)
- [ ] **Granularity**: Only essential functions/methods included
- [ ] **Inference**: Uncertain nodes marked with `inferred: true`

---

## When to Load Detailed References

**Load these when you need**:

| Need | Load Reference |
|------|----------------|
| Complete schema details | [graph-schema.md](./references/graph-schema.md) |
| Layer-specific guidance | [layer-definitions.md](./references/layer-definitions.md) |
| Connectivity validation rules | [connectivity-rules.md](./references/connectivity-rules.md) |
| Best practices deep-dive | [best-practices.md](./references/best-practices.md) |
| Step-by-step detailed process | [agent-instructions.md](./references/agent-instructions.md) |
| Example graphs | [graph-examples.md](./references/graph-examples.md) |
| Update/extension process | [graph-evolution.md](./references/graph-evolution.md) |

---

## Example Output Pattern

```json
{
  "nodes": [
    {
      "id": "workflow_checkout",
      "type": "Workflow",
      "label": "Checkout Flow",
      "description": "From cart review to payment confirmation and order creation."
    },
    {
      "id": "concept_order_checkout",
      "type": "Concept",
      "label": "Order Checkout",
      "description": "Validates cart, calculates totals, and finalizes an order."
    },
    {
      "id": "service_orders",
      "type": "Service",
      "technical_level": "service",
      "label": "Orders Service",
      "description": "Handles order lifecycle and persistence."
    },
    {
      "id": "module_orders",
      "type": "Module",
      "technical_level": "module",
      "label": "orders",
      "path": "orders/"
    },
    {
      "id": "file_checkout_py",
      "type": "File",
      "technical_level": "file",
      "label": "orders/checkout.py",
      "file": "orders/checkout.py"
    },
    {
      "id": "func_process_checkout",
      "type": "Function",
      "technical_level": "function",
      "label": "process_checkout",
      "file": "orders/checkout.py",
      "line": 45,
      "importance": "core",
      "entrypoint": true,
      "description": "Coordinates checkout validation, payment, and order creation."
    }
  ],
  "edges": [
    {
      "source": "workflow_checkout",
      "target": "concept_order_checkout",
      "type": "includes",
      "layer": "workflow-to-conceptual"
    },
    {
      "source": "concept_order_checkout",
      "target": "service_orders",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    },
    {
      "source": "service_orders",
      "target": "module_orders",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "module_orders",
      "target": "file_checkout_py",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "file_checkout_py",
      "target": "func_process_checkout",
      "type": "contains",
      "layer": "technical"
    }
  ],
  "layers": {
    "workflow": ["workflow_checkout"],
    "conceptual": ["concept_order_checkout"],
    "technical": [
      "service_orders",
      "module_orders",
      "file_checkout_py",
      "func_process_checkout"
    ]
  }
}
```

---

## Summary: Key Success Factors

1. ✅ **Build top-down** in 3 passes (high → mid → fine)
2. ✅ **Maintain hierarchy** with `contains` edges
3. ✅ **Ensure connectivity** (Workflow → Concept → Technical)
4. ✅ **Be selective** with fine-grained nodes (only core/entrypoints)
5. ✅ **Mark inference** when uncertain
6. ✅ **Output valid JSON** first, explanation second
7. ✅ **Register all nodes** in layers arrays
8. ✅ **Validate before output** using checklist

This reference provides the **essential 80%** of what you need. Load detailed references only when you need specific guidance or encounter edge cases.
