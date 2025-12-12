# Graph Schema Reference

## Node Types

All nodes share common fields:

### Required Fields
- `id`: Stable, unique string identifier
- `type`: Node type (see below)
- `label`: Short human-readable name
- `description`: 1–3 sentence explanation

### Node Type Values
- `Workflow`: End-to-end user/system flows
- `Concept`: Domain concepts and design intent
- `Service`: Technical service boundary
- `Module`: Code module/package
- `File`: Source code file
- `Class`: Class definition
- `Function`: Top-level function
- `Method`: Class method
- `Event`: Event/message
- `API`: API endpoint
- `Endpoint`: HTTP endpoint
- `EventHandler`: Event handler function

### Optional Metadata

#### Structural
- `file`: File path
- `line`: Line number
- `package`: Package/namespace
- `path`: Directory path
- `service`: Parent service name

#### Granularity/Importance
- `technical_level`: One of:
  - `"service"` - Service boundary
  - `"module"` - Module/package
  - `"file"` - Source file
  - `"class"` - Class definition
  - `"function"` - Top-level function
  - `"method"` - Class method
  - `"endpoint"` - HTTP endpoint
  - `"event"` - Event/message

- `importance`: One of:
  - `"core"` - Core business logic
  - `"supporting"` - Supporting functionality
  - `"helper"` - Helper/utility function

- `entrypoint`: Boolean
  - `true` for HTTP handlers, CLI commands, event handlers
  - `false` or omitted otherwise

#### Other
- `inferred`: Boolean - marks inferred/assumed nodes
- `tags`: Array of strings - additional categorization

---

## Edge Types

Edges capture relationships between nodes.

### Edge Structure
```json
{
  "source": "source_node_id",
  "target": "target_node_id",
  "type": "relationship_type",
  "layer": "layer_designation"
}
```

### Edge Types by Category

#### Structural / Technical
- `contains`: Parent-child containment (Service → Module → File → Class → Method)
- `defined_in`: Where something is defined
- `imports`: Module imports
- `depends_on`: Dependency relationship
- `uses`: Uses/utilizes relationship

#### Flow / Execution
- `calls`: Function/method calls
- `emits`: Emits event/message
- `handles`: Handles event/message

#### Cross-Layer (Workflow → Conceptual)
- `includes`: Workflow includes concept
- `realizes`: Workflow realizes concept
- `composed_of`: Workflow composed of concepts

#### Cross-Layer (Conceptual → Technical)
- `implemented_by`: Concept implemented by technical node
- `supported_by`: Concept supported by technical node

#### Workflow Internal
- `precedes`: Step A precedes step B
- `follows`: Step A follows step B
- `branch_to`: Conditional branch
- `joins_from`: Join point

#### Conceptual
- `part_of`: Hierarchical containment
- `specializes`: Specialization relationship
- `generalizes`: Generalization relationship
- `relates_to`: Loose conceptual connection

### Layer Designation

Edge `layer` field must be one of:
- `"workflow"` - Within workflow layer
- `"conceptual"` - Within conceptual layer
- `"technical"` - Within technical layer
- `"workflow-to-conceptual"` - Cross-layer: workflow → concept
- `"conceptual-to-technical"` - Cross-layer: concept → technical

---

## Technical Hierarchy Pattern

Use `contains` edges to build hierarchical structure:

```
Service (technical_level: "service")
  └─contains→ Module (technical_level: "module")
      └─contains→ File (technical_level: "file")
          ├─contains→ Class (technical_level: "class")
          │   └─contains→ Method (technical_level: "method")
          └─contains→ Function (technical_level: "function")
```

---

## JSON Structure Template

```json
{
  "nodes": [
    {
      "id": "workflow_user_signup",
      "type": "Workflow",
      "label": "User Signup Flow",
      "description": "End-to-end flow from registration to confirmation email.",
      "inferred": false
    },
    {
      "id": "concept_user_registration",
      "type": "Concept",
      "label": "User Registration",
      "description": "Handles capturing and validating user details.",
      "inferred": false
    },
    {
      "id": "service_auth",
      "type": "Service",
      "technical_level": "service",
      "label": "Auth Service",
      "description": "Authentication and authorization service.",
      "inferred": false
    },
    {
      "id": "func_create_user",
      "type": "Function",
      "technical_level": "function",
      "label": "createUser",
      "file": "user_service/account.py",
      "line": 28,
      "importance": "core",
      "entrypoint": false,
      "description": "Creates a user record in the database.",
      "inferred": false
    }
  ],
  "edges": [
    {
      "source": "workflow_user_signup",
      "target": "concept_user_registration",
      "type": "includes",
      "layer": "workflow-to-conceptual"
    },
    {
      "source": "concept_user_registration",
      "target": "func_create_user",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    },
    {
      "source": "func_create_user",
      "target": "class_user_repo",
      "type": "calls",
      "layer": "technical"
    }
  ],
  "layers": {
    "workflow": ["workflow_user_signup"],
    "conceptual": ["concept_user_registration"],
    "technical": ["service_auth", "func_create_user", "class_user_repo"]
  }
}
```

### JSON Validation Rules

**Must ensure**:
- No trailing commas
- Double-quoted keys and strings
- All arrays and objects properly closed
- All edge `source`/`target` IDs exist in `nodes`
- All node IDs appear in appropriate `layers` arrays
- Valid JSON that can be parsed without errors
