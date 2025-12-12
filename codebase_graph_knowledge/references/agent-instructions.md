# Agent Instructions - Step-by-Step Graph Construction

This guide provides the detailed process for building a code knowledge graph from top-down.

---

## Overview

When a user asks for graph-based analysis, follow this **top-down, gradual construction process** in three passes.

---

## Step 1: Clarify Scope (Brief)

Before starting, quickly clarify:

### Questions to Ask (if needed)
- What part of the repository should I focus on?
- Which services or domains are most important?
- Are you more interested in:
  - **Workflows** (end-to-end flows)?
  - **Domain concepts** (business logic)?
  - **Technical dependencies** (call graphs)?

### Default Assumptions
If user doesn't specify:
- Include all major services/modules
- Balance all three layers equally
- Focus on core functionality over helpers

---

## Step 2: Scan Provided Material

Analyze the codebase to identify key elements:

### What to Look For

**Main directories and modules**:
- Service-level directories (`auth/`, `orders/`, `payments/`)
- Top-level packages or namespaces
- Microservice boundaries

**Important entrypoints**:
- HTTP route handlers (`@app.route`, `@router.get`)
- CLI commands (`if __name__ == "__main__"`)
- Event handlers (`@consumer.on`, `addEventListener`)
- Scheduled jobs (`@celery.task`, cron jobs)

**Central classes and services**:
- Classes with names like `*Service`, `*Manager`, `*Processor`
- Frequently imported modules
- Core domain entities

**Frequently used functions**:
- Functions called from multiple places
- Functions with names suggesting business logic
- Orchestrator functions coordinating multiple operations

---

## Step 3: Build Graph Top-Down (Three Passes)

### Pass A: High-Level Structure

**Goal**: Create the skeleton with 3-10 workflows, 5-20 concepts, key services.

#### 3A-1. Identify Major Workflows

Create `Workflow` nodes for:
- Major user journeys (signup, checkout, report generation)
- System processes (batch jobs, data sync, backups)
- Event-driven flows (order fulfillment, notifications)

**Example**:
```json
{
  "id": "workflow_user_signup",
  "type": "Workflow",
  "label": "User Signup Flow",
  "description": "Triggered by registration form. Validates email, creates account, sends confirmation.",
  "inferred": false
}
```

#### 3A-2. Identify Core Concepts

Create `Concept` nodes for:
- Domain abstractions (Authentication, Order Processing, Billing)
- Service boundaries (User Service, Payment Service)
- Key domain events (OrderPlaced, PaymentSucceeded)

**Example**:
```json
{
  "id": "concept_user_auth",
  "type": "Concept",
  "label": "User Authentication",
  "description": "Handles credential validation, session management, and token generation.",
  "inferred": false
}
```

#### 3A-3. Identify Key Services/Modules

Create `Service` and `Module` nodes for:
- Top-level services
- Major modules/packages
- Domain boundaries

**Example**:
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

#### 3A-4. Connect High-Level Layers

Create cross-layer edges:

**Workflow → Concept**:
```json
{
  "source": "workflow_user_signup",
  "target": "concept_user_auth",
  "type": "includes",
  "layer": "workflow-to-conceptual"
}
```

**Concept → Service**:
```json
{
  "source": "concept_user_auth",
  "target": "service_auth",
  "type": "implemented_by",
  "layer": "conceptual-to-technical"
}
```

#### 3A-5. Verify Connectivity

Ensure:
- [ ] No workflow is completely disconnected from concepts
- [ ] Major concepts link to at least one service/module
- [ ] Cross-layer edges flow correctly (top-down)

---

### Pass B: Mid-Level Technical

**Goal**: Add Files and Classes, connect them to concepts and hierarchy.

#### 3B-1. Add File Nodes

For each Module/Service, add `File` nodes:

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

#### 3B-2. Add Class Nodes

For each File, add key `Class` nodes:

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

#### 3B-3. Create Containment Hierarchy

Use `contains` edges:

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

#### 3B-4. Link to Concepts

For each Concept, link to Files/Classes that implement it:

```json
{
  "source": "concept_user_auth",
  "target": "class_auth_service",
  "type": "implemented_by",
  "layer": "conceptual-to-technical"
}
```

#### 3B-5. Verify Mid-Level Connectivity

Ensure:
- [ ] Every File has a parent Module/Service via `contains`
- [ ] Every Class has a parent File via `contains`
- [ ] Major concepts connect to at least one File or Class

---

### Pass C: Focused Fine-Grained Technical

**Goal**: Add Functions/Methods/Endpoints selectively for important workflows and concepts.

#### 3C-1. Identify Important Functions

For each important workflow and concept, add Function/Method nodes **only when**:

**Entry points** (`entrypoint: true`, `importance: "core"`):
- HTTP endpoints
- CLI commands
- Event handlers
- Main functions

**Orchestrators** (`importance: "core"` or `"supporting"`):
- Functions coordinating multiple calls
- Functions implementing workflow steps

**Core business logic** (`importance: "core"` or `"supporting"`):
- Domain rule implementations
- Validation logic
- Business calculations

#### 3C-2. Create Function/Method Nodes

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

**Example Method**:
```json
{
  "id": "method_validate_credentials",
  "type": "Method",
  "technical_level": "method",
  "label": "validate_credentials",
  "file": "auth/service.py",
  "line": 78,
  "importance": "core",
  "entrypoint": false,
  "description": "Validates username and password against database.",
  "inferred": false
}
```

#### 3C-3. Add to Hierarchy

Connect to parent File or Class:

```json
{
  "source": "file_auth_handlers_py",
  "target": "func_login_user",
  "type": "contains",
  "layer": "technical"
}
```

#### 3C-4. Add Flow Edges

Add `calls`, `emits`, `handles` edges when visible:

```json
{
  "source": "func_login_user",
  "target": "method_validate_credentials",
  "type": "calls",
  "layer": "technical"
}
```

#### 3C-5. Link to Concepts

Ensure important functions connect to concepts:

```json
{
  "source": "concept_user_auth",
  "target": "func_login_user",
  "type": "implemented_by",
  "layer": "conceptual-to-technical"
}
```

#### 3C-6. Verify Fine-Grained Connectivity

Ensure:
- [ ] Every Function/Method has a parent File or Class
- [ ] Important functions link to at least one Concept
- [ ] No function-level nodes are isolated
- [ ] Flow edges accurately represent visible calls

---

## Step 4: Create the JSON Graph

Assemble all nodes and edges into the standard structure:

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

### Final Validation Checklist

- [ ] All edge `source`/`target` IDs exist in `nodes`
- [ ] All nodes are registered in appropriate `layers` arrays
- [ ] JSON is syntactically valid (no trailing commas, proper quotes)
- [ ] Paths exist from workflows → concepts → technical nodes
- [ ] Technical hierarchy is complete (all nodes have parents via `contains`)
- [ ] No dangling or orphaned nodes

---

## Step 5: Support Iterative Updates

When user provides new information later:

### 5A. Extend with New Nodes/Edges

**Process**:
1. Identify what changed (new files, modules, features)
2. Create new nodes following same patterns
3. Connect to existing hierarchy using `contains`
4. Add cross-layer edges to related concepts/workflows
5. Update `layers` arrays

**Example**:
```json
// User adds new guest checkout feature
{
  "add_nodes": [
    {
      "id": "workflow_guest_checkout",
      "type": "Workflow",
      "label": "Guest Checkout Flow"
    },
    {
      "id": "func_process_guest_checkout",
      "type": "Function",
      "technical_level": "function",
      "label": "process_guest_checkout",
      "file": "orders/guest.py",
      "line": 30
    }
  ],
  "add_edges": [
    {
      "source": "workflow_guest_checkout",
      "target": "concept_order_checkout",
      "type": "includes"
    },
    {
      "source": "file_orders_guest_py",
      "target": "func_process_guest_checkout",
      "type": "contains"
    }
  ]
}
```

### 5B. Update Existing Nodes

If connectivity assumptions change:

```json
{
  "update_nodes": [
    {
      "id": "concept_order_checkout",
      "description": "Updated: Now supports both registered and guest users.",
      "inferred": false
    }
  ]
}
```

### 5C. Double-Check Connectivity

After updates:
- [ ] New nodes have parents
- [ ] New nodes registered in `layers`
- [ ] Cross-layer paths still complete
- [ ] No broken edge references

---

## Step 6: Optionally Describe

If requested, provide natural-language explanation:

### What to Explain

**Key workflows**:
- How they flow from start to finish
- What services they touch
- What business outcomes they achieve

**Concept-to-implementation mappings**:
- Which concepts are most central
- How they're implemented technically
- Where to find their code

**Architecture patterns**:
- Layered architecture
- Microservices structure
- Event-driven patterns
- Hexagonal/clean architecture

### Example Explanation

```
The User Signup workflow (workflow_user_signup) begins with the registration form submission.
It leverages the User Authentication concept (concept_user_auth), which is implemented by
the AuthService class in auth/service.py. The main entry point is the register_user function
(func_register_user) at line 156, which orchestrates email validation, account creation,
and confirmation email sending.
```

---

## Step 7: Respect User Constraints

Adapt based on user preferences:

### Constraint Examples

**"Only conceptual + technical, no workflows"**:
- Omit workflow layer entirely
- Focus on concept-to-technical mappings

**"Technical-only call graph"**:
- Fill only technical layer
- Focus on `calls` and `depends_on` edges
- Still use same JSON structure

**"Drill down into orders module"**:
- Add more granular Function/Method nodes for `orders/`
- Mark with `importance: "supporting"` or `"helper"`
- Ensure they connect to parent Files/Classes
- Connect to related Concepts

**"Show only core functionality"**:
- Filter to `importance: "core"` nodes only
- Exclude helpers and supporting functions
- Focus on entrypoints and main business logic

---

## Quick Reference: Process Summary

```
1. Clarify Scope
   └─ Which services? What focus?

2. Scan Material
   └─ Directories, entrypoints, classes, functions

3. Build Top-Down (3 passes)
   ├─ Pass A: High-level (Workflows, Concepts, Services)
   ├─ Pass B: Mid-level (Files, Classes)
   └─ Pass C: Fine-grained (Functions, Methods - selective)

4. Create JSON
   └─ Assemble, validate, check connectivity

5. Support Iteration
   └─ Extend with new info, preserve structure

6. Optionally Describe
   └─ Natural language explanation

7. Respect Constraints
   └─ Adapt to user preferences
```

---

## Common Pitfalls to Avoid

### ❌ Don't
- Start bottom-up with low-level functions
- Create nodes without connecting them to hierarchy
- Include every helper function by default
- Generate invalid JSON
- Change stable node IDs unnecessarily
- Create disconnected graph islands

### ✅ Do
- Build top-down: workflows → concepts → services → details
- Maintain complete hierarchy with `contains` edges
- Be selective about fine-grained technical nodes
- Validate JSON syntax before outputting
- Preserve existing node IDs during updates
- Ensure complete cross-layer connectivity
