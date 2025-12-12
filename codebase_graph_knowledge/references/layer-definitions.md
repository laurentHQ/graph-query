# Layer Definitions & Extraction Guidance

## Overview

The knowledge graph consists of three distinct layers, each serving a different purpose in understanding the codebase.

---

## 1. Workflow Layer

### Purpose
Represents **how services are used** and **how the system behaves end-to-end**.

### Typical Nodes

**Type**: `Workflow`

**Examples**:
- "User Signup Flow"
- "Order Checkout Flow"
- "Password Reset Flow"
- "Data Export Pipeline"
- "Batch Processing Job"

### Node Description Should Include

- **Trigger**: User action or external event that starts the workflow
- **Main steps**: High-level sequence of actions
- **Key services/Concepts**: What domain concepts and services are involved

### Workflow Edges

| Edge Type | Usage | Example |
|-----------|-------|---------|
| `precedes` / `follows` | Step ordering within workflow | Step A → Step B |
| `includes` | Workflow incorporates concept | "Checkout" includes "Payment Authorization" |
| `uses` / `invokes_service` | Workflow uses service/API | "Export" uses "Storage API" |
| `branch_to` | Conditional branching | If condition → Alternative path |

### Extraction Hints

Look for:
- **Controller code**: HTTP route handlers, API controllers
- **Entrypoints**: CLI commands, scheduled jobs, event consumers
- **Orchestrator services**: Services that coordinate multiple operations
- **Event handlers**: Functions triggered by domain events

**Group related actions** into a single workflow when they are part of:
- A coherent user journey (signup → verification → onboarding)
- A system process (order placement → payment → fulfillment)
- A batch operation (nightly report generation)

### Example

```json
{
  "id": "workflow_user_signup",
  "type": "Workflow",
  "label": "User Signup Flow",
  "description": "Triggered by user registration form submission. Validates email, creates account, sends confirmation email.",
  "inferred": false
}
```

---

## 2. Conceptual Layer

### Purpose
Represents **domain logic and design intent** - the "what" and "why" behind the code.

### Typical Nodes

**Types**: `Concept`, `Service` (conceptual level), `Event` (domain-level)

**Examples**:
- "User Authentication"
- "Inventory Reservation"
- "Payment Authorization"
- "Notification Policy"
- "Order Service" (as domain boundary)
- "OrderPlaced" (domain event)

### Node Description Should Include

- **Responsibility**: What domain concern does this represent?
- **Key behaviors**: What operations or rules does it encapsulate?
- **Relationships**: How does it relate to other concepts?

### Conceptual Edges

| Edge Type | Usage | Example |
|-----------|-------|---------|
| `part_of` | Concept hierarchy | "Order Validation" part_of "Order Fulfillment" |
| `relates_to` | Loose conceptual connection | "Billing" relates_to "Subscription" |
| `implemented_by` | Links to technical implementation | "Auth" implemented_by "AuthService" |
| `supported_by` | Supported by technical component | "Notifications" supported_by "EmailModule" |
| `specializes` / `generalizes` | Inheritance-like relationships | "AdminAuth" specializes "Auth" |

### Extraction Hints

Infer concepts from:

**Directory/Module names**:
- `auth/` → "User Authentication"
- `billing/` → "Billing Management"
- `orders/` → "Order Processing"

**Class/Function names**:
- `AuthService` → "Authentication Service"
- `OrderProcessor` → "Order Processing"
- `PaymentGatewayAdapter` → "Payment Integration"

**Comments and docstrings**:
- "Handles user session management" → "Session Management"
- "Validates inventory before checkout" → "Inventory Validation"

**Configuration names**:
- `notification_policies` → "Notification Policy"

### Granularity Guidance

Keep concepts **stable and relatively coarse-grained**:

✅ **Good**: "User Authentication", "Order Fulfillment", "Payment Processing"

❌ **Too fine-grained**: "Email Validation", "Password Hashing", "Tax Calculation" (these are better as technical functions)

### Example

```json
{
  "id": "concept_user_authentication",
  "type": "Concept",
  "label": "User Authentication",
  "description": "Manages user identity verification through credentials (password, OAuth, etc.) and session/token management.",
  "inferred": false
}
```

---

## 3. Technical Layer

### Purpose
Represents **implementation details** with **hierarchical granularity** from services down to individual functions.

### Hierarchical Structure

```
High Level:    Service, Module, File
Mid Level:     Class, API, Event (technical)
Fine Level:    Function, Method, Endpoint, EventHandler, DatabaseTable
```

### Node Types and Metadata

| Node Type | technical_level | When to Include | Metadata |
|-----------|-----------------|-----------------|----------|
| `Service` | `"service"` | Always | `service`, `path` |
| `Module` | `"module"` | Always | `package`, `path` |
| `File` | `"file"` | Always | `file`, `path` |
| `Class` | `"class"` | Key classes | `file`, `line` |
| `Function` | `"function"` | Entrypoints, orchestrators, core logic | `file`, `line`, `importance`, `entrypoint` |
| `Method` | `"method"` | Important methods only | `file`, `line`, `importance` |
| `Endpoint` | `"endpoint"` | HTTP/API endpoints | `file`, `line`, `entrypoint: true` |
| `EventHandler` | `"event"` | Event handlers | `file`, `line`, `entrypoint: true` |

### Technical Edges

#### Structural
- `contains`: Hierarchical containment (Service → Module → File → Class → Method)
- `defined_in`: Where something is defined

#### Flow/Dependency
- `calls`: Function/method calls
- `imports`: Module imports
- `depends_on`: Dependency relationship
- `emits`: Emits event/message
- `handles`: Handles event/message
- `uses`: Uses/utilizes

### Technical Granularity Policy

#### Always Include

- **Services**: Top-level service boundaries
- **Modules/Packages**: All significant modules
- **Files**: All relevant source files
- **Key Classes**: Classes that implement domain concepts or coordinate behavior

#### Include Functions/Methods Only When

1. **Entry points**:
   - HTTP endpoints (`POST /api/users`)
   - CLI commands (`process-orders`)
   - Event handlers (`onOrderPlaced`)
   - Main functions
   - Set: `entrypoint: true`, `importance: "core"`

2. **Orchestrators**:
   - Functions that coordinate multiple calls or steps
   - Set: `importance: "core"` or `"supporting"`

3. **Core business logic**:
   - Functions implementing important domain rules
   - Examples: `calculate_tax`, `authorize_payment`, `validate_inventory`
   - Set: `importance: "core"` or `"supporting"`

#### Avoid (Low-level Helpers)

❌ **Do not include** trivial helper functions unless explicitly important:
- `format_date()`, `build_url()`, `sanitize_string()`
- Low-level utilities with narrow, non-business behavior
- Unless they are specifically marked as important for analysis

### Deep Dive Mode

When the user asks for **detailed view of specific module/service**:
- Add more function/method nodes for that area only
- Mark them with appropriate `importance`: `"supporting"` or `"helper"`
- Ensure they remain connected to their parent classes/files

### Hierarchical Technical Structure Example

```
Service "Orders Service" (technical_level: "service")
  └─contains→ Module "orders" (technical_level: "module")
      └─contains→ File "orders/checkout.py" (technical_level: "file")
          ├─contains→ Class "CheckoutProcessor" (technical_level: "class")
          │   ├─contains→ Method "process_checkout" (technical_level: "method", importance: "core", entrypoint: true)
          │   └─contains→ Method "validate_cart" (technical_level: "method", importance: "supporting")
          └─contains→ Function "calculate_shipping" (technical_level: "function", importance: "core")
```

### Example Technical Nodes

```json
[
  {
    "id": "service_orders",
    "type": "Service",
    "technical_level": "service",
    "label": "Orders Service",
    "description": "Handles order lifecycle, checkout, and fulfillment.",
    "inferred": false
  },
  {
    "id": "file_checkout_py",
    "type": "File",
    "technical_level": "file",
    "label": "orders/checkout.py",
    "file": "orders/checkout.py",
    "description": "Checkout orchestration and validation logic.",
    "inferred": false
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
    "description": "Main checkout orchestrator. Validates cart, processes payment, creates order.",
    "inferred": false
  },
  {
    "id": "func_format_price",
    "type": "Function",
    "technical_level": "function",
    "label": "format_price",
    "file": "orders/utils.py",
    "line": 12,
    "importance": "helper",
    "entrypoint": false,
    "description": "Formats price as currency string. (Low-level helper - include only if explicitly requested)",
    "inferred": false
  }
]
```

---

## Extraction Strategy by Layer

### Phase 1: Workflow Layer
- Scan entrypoints (routes, CLI, handlers)
- Identify major user journeys and system processes
- Create 3-10 Workflow nodes
- Keep high-level and business-focused

### Phase 2: Conceptual Layer
- Analyze module/directory structure
- Extract domain concepts from naming patterns
- Identify service boundaries
- Create 5-20 Concept nodes
- Link to Workflows via `includes`, `realizes`

### Phase 3: Technical Layer

**Pass A - High Level**:
- Create Service and Module nodes for all major components
- Link to Concepts via `implemented_by`

**Pass B - Mid Level**:
- Add File nodes for all relevant source files
- Add Class nodes for key domain classes
- Use `contains` edges to build hierarchy

**Pass C - Fine Level** (selective):
- Add Function/Method/Endpoint nodes only for:
  - Entrypoints
  - Orchestrators
  - Core business logic
- Connect via `contains` and `calls` edges
- Ensure connectivity back to Concepts

---

## Layer Interaction Summary

```
┌─────────────────────────────────────────────────┐
│            Workflow Layer                       │
│  (End-to-end flows, user journeys)              │
└─────────────────┬───────────────────────────────┘
                  │ includes, realizes
                  ↓
┌─────────────────────────────────────────────────┐
│         Conceptual Layer                        │
│  (Domain concepts, design intent)               │
└─────────────────┬───────────────────────────────┘
                  │ implemented_by, supported_by
                  ↓
┌─────────────────────────────────────────────────┐
│          Technical Layer                        │
│  (Hierarchical implementation details)          │
│                                                 │
│  Service → Module → File → Class → Method       │
└─────────────────────────────────────────────────┘
```
