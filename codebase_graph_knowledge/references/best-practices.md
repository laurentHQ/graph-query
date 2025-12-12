# Best Practices for Knowledge Graph Construction

Follow these principles when building and maintaining the code knowledge graph.

---

## 1. Abstraction, Not Raw Dumps

### Principle
Focus on elements that matter for understanding architecture, workflows, and domain logic.

### Guidelines

❌ **Avoid**:
- Representing every single function or variable
- Including low-level implementation details without business value
- Creating nodes for trivial utilities

✅ **Do**:
- Use `technical_level` to distinguish core structures from details
- Use `importance` to mark core vs. supporting vs. helper functions
- Focus on architecturally significant elements

### Example

```json
// ❌ Too granular
{ "id": "var_user_email", "type": "Variable", "label": "userEmail" }

// ✅ Appropriate level
{
  "id": "func_validate_user",
  "type": "Function",
  "technical_level": "function",
  "importance": "core",
  "label": "validateUser"
}
```

---

## 2. Layer Clarity and Separation

### Principle
Keep workflow, conceptual, and technical concerns clearly separated.

### Guidelines

✅ **Clear boundaries**:
- Workflow nodes describe **end-to-end flows**
- Concept nodes represent **domain abstractions**
- Technical nodes show **implementation details**

✅ **Use cross-layer edges properly**:
- Workflow → Concept: `includes`, `realizes`, `composed_of`
- Concept → Technical: `implemented_by`, `supported_by`

❌ **Avoid**:
- Mixing concerns within a single node
- Unclear node types that blur layer boundaries
- Direct Workflow → Technical edges without Concept mediation (when concepts exist)

### Example

```json
// ✅ Good: Clear layer separation
{
  "nodes": [
    { "id": "workflow_checkout", "type": "Workflow", "label": "Checkout Flow" },
    { "id": "concept_payment", "type": "Concept", "label": "Payment Processing" },
    { "id": "service_payment", "type": "Service", "label": "Payment Service" }
  ],
  "edges": [
    { "source": "workflow_checkout", "target": "concept_payment", "type": "includes" },
    { "source": "concept_payment", "target": "service_payment", "type": "implemented_by" }
  ]
}
```

---

## 3. Hierarchical Technical Modeling

### Principle
Structure the technical layer top-down with clear containment relationships.

### Guidelines

✅ **Always use hierarchy**:
```
Service → Module → File → Class → Function/Method
```

✅ **Use `contains` edges** to represent parent-child relationships

✅ **Ensure every node is reachable** from at least one top-level Service or Module

❌ **Avoid**:
- Flat technical structures without hierarchy
- Orphaned nodes with no parent
- Inconsistent containment patterns

### Example

```json
{
  "edges": [
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
      "target": "func_process",
      "type": "contains",
      "layer": "technical"
    }
  ]
}
```

---

## 4. Traceability

### Principle
Enable tracing from high-level abstractions down to concrete implementations.

### Guidelines

✅ **Connect technical nodes back to concepts and workflows**:
- Use `implemented_by`, `supported_by` edges
- Ensure complete paths exist: Workflow → Concept → Technical

✅ **Include metadata for code location**:
- `file`: File path
- `line`: Line number
- `service`: Parent service name
- `package`: Package/namespace

✅ **Prefer explicit edges over implicit assumptions**

### Example

```json
{
  "id": "func_authorize_payment",
  "type": "Function",
  "technical_level": "function",
  "label": "authorizePayment",
  "file": "payments/authorization.py",
  "line": 156,
  "service": "payment_service",
  "importance": "core",
  "description": "Authorizes payment with external gateway.",
  "inferred": false
}
```

---

## 5. Honesty About Inference

### Principle
Be transparent when inferring structure from limited information.

### Guidelines

✅ **Mark inferred nodes**:
```json
{
  "id": "concept_inventory",
  "type": "Concept",
  "label": "Inventory Management",
  "description": "Inferred from directory structure. Full implementation not yet visible.",
  "inferred": true
}
```

✅ **Reflect uncertainty in descriptions**:
- "Appears to handle..."
- "Likely implements..."
- "Inferred from naming patterns..."

❌ **Avoid**:
- Confident claims without supporting evidence
- Hallucinating specific technical details
- Creating nodes for unverified code

---

## 6. Avoid Overconfident Hallucinations

### Principle
Only include what you can support from visible code or clear naming patterns.

### Guidelines

✅ **Conservative approach**:
- If code isn't visible, mark as `inferred: true`
- Note assumptions in descriptions
- Use conditional language

❌ **Don't**:
- Invent implementation details not supported by code
- Create complex call chains without evidence
- Assume specific parameters or return types without seeing signatures

### Example

```json
// ❌ Overconfident
{
  "id": "func_process_payment",
  "description": "Processes payment, validates credit card via Stripe API, stores transaction in PostgreSQL transactions table with ACID guarantees."
}

// ✅ Honest about scope
{
  "id": "func_process_payment",
  "description": "Processes payment. Implementation details not fully visible. Appears to interact with external payment gateway.",
  "inferred": true
}
```

---

## 7. JSON First, Prose Second

### Principle
The primary output is valid JSON. Explanations are secondary.

### Guidelines

✅ **Always ensure valid JSON**:
- No trailing commas
- Double-quoted keys and strings
- Properly closed arrays and objects
- No syntax errors

✅ **Output structure**:
```
1. Valid JSON graph
2. (Optional) Natural language explanation
```

❌ **Never**:
- Mix prose into JSON structure
- Output JSON with syntax errors
- Embed markdown formatting in JSON strings

---

## 8. Iterative Refinement and Updates

### Principle
Build on existing structure rather than starting from scratch.

### Guidelines

When user provides additional information:

✅ **Extend the existing graph**:
- Add new nodes and edges
- Preserve stable node IDs
- Maintain existing hierarchies
- Update descriptions when assumptions change

✅ **Mark corrections clearly**:
```json
{
  "id": "service_auth",
  "description": "Authentication service. Updated: Now includes OAuth support (previously JWT-only).",
  "inferred": false
}
```

❌ **Avoid**:
- Regenerating entire graph from scratch
- Changing stable node IDs unnecessarily
- Breaking existing cross-layer connections

---

## 9. Connectivity Correctness

### Principle
Ensure meaningful paths from high-level abstractions to implementations.

### Guidelines

✅ **Apply connectivity rules** (see [connectivity-rules.md](./connectivity-rules.md)):
- Every Workflow connects to Concepts
- Every Concept connects to Technical nodes
- Technical hierarchy is complete
- No dangling edges

✅ **Avoid isolated islands** of disconnected nodes

✅ **Use validation checklist** before finalizing:
- [ ] All edge IDs reference existing nodes
- [ ] All nodes registered in `layers`
- [ ] Complete paths exist from Workflows to Technical
- [ ] Technical hierarchy is correct

---

## 10. Granularity Control

### Principle
Include appropriate level of detail for the use case.

### Guidelines

✅ **Default granularity**:
- Always: Services, Modules, Files, key Classes
- Selectively: Functions/Methods that are:
  - Entry points (`entrypoint: true`)
  - Orchestrators
  - Core business logic (`importance: "core"`)

✅ **Deep dive mode** (when requested):
- Add more function/method nodes for specific areas
- Mark with `importance: "supporting"` or `"helper"`
- Maintain connectivity to parents

❌ **Avoid**:
- Including every trivial helper function by default
- Creating noise with low-value nodes
- Flat dumps of all code symbols

### Granularity Matrix

| Element | Always Include | Include Selectively | Usually Exclude |
|---------|----------------|---------------------|-----------------|
| Service | ✅ | - | - |
| Module | ✅ | - | - |
| File | ✅ | - | - |
| Key Class | ✅ | - | - |
| Entrypoint Function | ✅ | - | - |
| Orchestrator Function | - | ✅ | - |
| Core Business Logic | - | ✅ | - |
| Helper/Utility | - | Only if important | ✅ |
| Variables | - | - | ✅ |

---

## Summary Checklist

Before outputting a knowledge graph, verify:

- [ ] **Abstraction**: Focused on architecturally significant elements
- [ ] **Layer clarity**: Clear separation between workflow, conceptual, technical
- [ ] **Hierarchy**: Technical layer structured top-down with `contains` edges
- [ ] **Traceability**: Metadata includes file paths and line numbers
- [ ] **Honesty**: Inferred nodes marked with `inferred: true`
- [ ] **No hallucinations**: Only include supported details
- [ ] **Valid JSON**: No syntax errors, properly formatted
- [ ] **Iterative**: Extends existing structure when applicable
- [ ] **Connectivity**: Complete paths from workflows to implementations
- [ ] **Granularity**: Appropriate level of detail for use case
