# Knowledge Graph Examples

This document provides complete example graphs for common scenarios.

---

## Example 1: Simple E-Commerce Checkout Flow

### Scenario
Python monolith with `auth/`, `orders/`, and `payments/` packages. Focus on checkout workflow.

### Complete Graph

```json
{
  "nodes": [
    {
      "id": "workflow_checkout",
      "type": "Workflow",
      "label": "Checkout Flow",
      "description": "From cart review to payment confirmation and order creation.",
      "inferred": false
    },
    {
      "id": "concept_order_checkout",
      "type": "Concept",
      "label": "Order Checkout",
      "description": "Validates cart, calculates totals, and finalizes an order.",
      "inferred": false
    },
    {
      "id": "concept_payment_auth",
      "type": "Concept",
      "label": "Payment Authorization",
      "description": "Authorizes payment with external gateway before order creation.",
      "inferred": false
    },
    {
      "id": "service_orders",
      "type": "Service",
      "technical_level": "service",
      "label": "Orders Service",
      "path": "orders/",
      "description": "Handles order lifecycle and persistence.",
      "inferred": false
    },
    {
      "id": "module_orders",
      "type": "Module",
      "technical_level": "module",
      "label": "orders",
      "path": "orders/",
      "package": "orders",
      "description": "Orders domain module.",
      "inferred": false
    },
    {
      "id": "file_orders_checkout_py",
      "type": "File",
      "technical_level": "file",
      "label": "orders/checkout.py",
      "file": "orders/checkout.py",
      "description": "Checkout orchestration logic.",
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
      "description": "Coordinates checkout validation, payment, and order creation.",
      "inferred": false
    },
    {
      "id": "service_payments",
      "type": "Service",
      "technical_level": "service",
      "label": "Payments Service",
      "path": "payments/",
      "description": "Payment processing and gateway integration.",
      "inferred": false
    },
    {
      "id": "file_payments_gateway_py",
      "type": "File",
      "technical_level": "file",
      "label": "payments/gateway.py",
      "file": "payments/gateway.py",
      "description": "Payment gateway adapter.",
      "inferred": false
    },
    {
      "id": "func_authorize_payment",
      "type": "Function",
      "technical_level": "function",
      "label": "authorize_payment",
      "file": "payments/gateway.py",
      "line": 78,
      "importance": "core",
      "entrypoint": false,
      "description": "Authorizes payment with Stripe gateway.",
      "inferred": false
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
      "source": "workflow_checkout",
      "target": "concept_payment_auth",
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
      "source": "concept_payment_auth",
      "target": "service_payments",
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
      "target": "file_orders_checkout_py",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "file_orders_checkout_py",
      "target": "func_process_checkout",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "service_payments",
      "target": "file_payments_gateway_py",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "file_payments_gateway_py",
      "target": "func_authorize_payment",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "func_process_checkout",
      "target": "func_authorize_payment",
      "type": "calls",
      "layer": "technical"
    }
  ],
  "layers": {
    "workflow": ["workflow_checkout"],
    "conceptual": ["concept_order_checkout", "concept_payment_auth"],
    "technical": [
      "service_orders",
      "module_orders",
      "file_orders_checkout_py",
      "func_process_checkout",
      "service_payments",
      "file_payments_gateway_py",
      "func_authorize_payment"
    ]
  }
}
```

---

## Example 2: Microservices with Event-Driven Architecture

### Scenario
Order service emits events, inventory service handles them.

### Complete Graph

```json
{
  "nodes": [
    {
      "id": "workflow_order_fulfillment",
      "type": "Workflow",
      "label": "Order Fulfillment Flow",
      "description": "Order placed → inventory reserved → shipment created → notification sent.",
      "inferred": false
    },
    {
      "id": "concept_inventory_reservation",
      "type": "Concept",
      "label": "Inventory Reservation",
      "description": "Reserves inventory items for confirmed orders.",
      "inferred": false
    },
    {
      "id": "event_order_placed",
      "type": "Event",
      "label": "OrderPlaced",
      "description": "Domain event emitted when order is successfully placed.",
      "inferred": false
    },
    {
      "id": "service_orders",
      "type": "Service",
      "technical_level": "service",
      "label": "Orders Service",
      "description": "Order management microservice.",
      "inferred": false
    },
    {
      "id": "func_place_order",
      "type": "Function",
      "technical_level": "function",
      "label": "place_order",
      "file": "orders/handlers.py",
      "line": 120,
      "importance": "core",
      "entrypoint": true,
      "description": "HTTP endpoint to place new order. Emits OrderPlaced event.",
      "inferred": false
    },
    {
      "id": "service_inventory",
      "type": "Service",
      "technical_level": "service",
      "label": "Inventory Service",
      "description": "Inventory management microservice.",
      "inferred": false
    },
    {
      "id": "func_handle_order_placed",
      "type": "EventHandler",
      "technical_level": "event",
      "label": "handle_order_placed",
      "file": "inventory/handlers.py",
      "line": 45,
      "importance": "core",
      "entrypoint": true,
      "description": "Event handler for OrderPlaced. Reserves inventory items.",
      "inferred": false
    }
  ],
  "edges": [
    {
      "source": "workflow_order_fulfillment",
      "target": "concept_inventory_reservation",
      "type": "includes",
      "layer": "workflow-to-conceptual"
    },
    {
      "source": "concept_inventory_reservation",
      "target": "service_inventory",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    },
    {
      "source": "service_orders",
      "target": "func_place_order",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "service_inventory",
      "target": "func_handle_order_placed",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "func_place_order",
      "target": "event_order_placed",
      "type": "emits",
      "layer": "technical"
    },
    {
      "source": "func_handle_order_placed",
      "target": "event_order_placed",
      "type": "handles",
      "layer": "technical"
    }
  ],
  "layers": {
    "workflow": ["workflow_order_fulfillment"],
    "conceptual": ["concept_inventory_reservation", "event_order_placed"],
    "technical": [
      "service_orders",
      "func_place_order",
      "service_inventory",
      "func_handle_order_placed"
    ]
  }
}
```

---

## Example 3: Class-Based Architecture with Methods

### Scenario
OOP-style service with classes and methods.

### Complete Graph

```json
{
  "nodes": [
    {
      "id": "concept_user_auth",
      "type": "Concept",
      "label": "User Authentication",
      "description": "Manages user login, logout, and session tokens.",
      "inferred": false
    },
    {
      "id": "file_auth_service_py",
      "type": "File",
      "technical_level": "file",
      "label": "auth/service.py",
      "file": "auth/service.py",
      "description": "Authentication service implementation.",
      "inferred": false
    },
    {
      "id": "class_auth_service",
      "type": "Class",
      "technical_level": "class",
      "label": "AuthService",
      "file": "auth/service.py",
      "line": 15,
      "description": "Main authentication service class.",
      "inferred": false
    },
    {
      "id": "method_login",
      "type": "Method",
      "technical_level": "method",
      "label": "login",
      "file": "auth/service.py",
      "line": 28,
      "importance": "core",
      "description": "Authenticates user credentials and creates session.",
      "inferred": false
    },
    {
      "id": "method_validate_token",
      "type": "Method",
      "technical_level": "method",
      "label": "validate_token",
      "file": "auth/service.py",
      "line": 56,
      "importance": "core",
      "description": "Validates JWT token and returns user identity.",
      "inferred": false
    }
  ],
  "edges": [
    {
      "source": "concept_user_auth",
      "target": "class_auth_service",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    },
    {
      "source": "file_auth_service_py",
      "target": "class_auth_service",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "class_auth_service",
      "target": "method_login",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "class_auth_service",
      "target": "method_validate_token",
      "type": "contains",
      "layer": "technical"
    }
  ],
  "layers": {
    "workflow": [],
    "conceptual": ["concept_user_auth"],
    "technical": [
      "file_auth_service_py",
      "class_auth_service",
      "method_login",
      "method_validate_token"
    ]
  }
}
```

---

## Example 4: Inferred Structure from Limited Information

### Scenario
Only directory structure and naming patterns visible.

### Complete Graph

```json
{
  "nodes": [
    {
      "id": "concept_notification_system",
      "type": "Concept",
      "label": "Notification System",
      "description": "Inferred from notifications/ directory. Appears to handle email and SMS notifications.",
      "inferred": true
    },
    {
      "id": "service_notifications",
      "type": "Service",
      "technical_level": "service",
      "label": "Notifications Service",
      "path": "notifications/",
      "description": "Notification service. Implementation details not yet visible.",
      "inferred": true
    },
    {
      "id": "file_notifications_email_py",
      "type": "File",
      "technical_level": "file",
      "label": "notifications/email.py",
      "file": "notifications/email.py",
      "description": "Likely handles email sending. Not yet analyzed.",
      "inferred": true
    }
  ],
  "edges": [
    {
      "source": "concept_notification_system",
      "target": "service_notifications",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    },
    {
      "source": "service_notifications",
      "target": "file_notifications_email_py",
      "type": "contains",
      "layer": "technical"
    }
  ],
  "layers": {
    "workflow": [],
    "conceptual": ["concept_notification_system"],
    "technical": ["service_notifications", "file_notifications_email_py"]
  }
}
```

**Note**: All nodes marked with `"inferred": true` to indicate uncertainty.

---

## Example 5: Update/Extension Scenario

### Original Graph (Simplified)

```json
{
  "nodes": [
    {
      "id": "workflow_checkout",
      "type": "Workflow",
      "label": "Checkout Flow"
    },
    {
      "id": "concept_order_checkout",
      "type": "Concept",
      "label": "Order Checkout"
    },
    {
      "id": "service_orders",
      "type": "Service",
      "label": "Orders Service"
    }
  ],
  "edges": [
    {
      "source": "workflow_checkout",
      "target": "concept_order_checkout",
      "type": "includes"
    },
    {
      "source": "concept_order_checkout",
      "target": "service_orders",
      "type": "implemented_by"
    }
  ]
}
```

### New Feature: Guest Checkout

User adds `orders/guest_checkout.py` with guest checkout logic.

### Extended Graph (Changes Only)

```json
{
  "add_nodes": [
    {
      "id": "workflow_guest_checkout",
      "type": "Workflow",
      "label": "Guest Checkout Flow",
      "description": "Checkout without account creation. Uses temporary guest token.",
      "inferred": false
    },
    {
      "id": "concept_guest_order",
      "type": "Concept",
      "label": "Guest Order",
      "description": "Orders placed by users without permanent accounts.",
      "inferred": false
    },
    {
      "id": "file_orders_guest_checkout_py",
      "type": "File",
      "technical_level": "file",
      "label": "orders/guest_checkout.py",
      "file": "orders/guest_checkout.py",
      "description": "Guest checkout implementation.",
      "inferred": false
    },
    {
      "id": "func_process_guest_checkout",
      "type": "Function",
      "technical_level": "function",
      "label": "process_guest_checkout",
      "file": "orders/guest_checkout.py",
      "line": 30,
      "importance": "core",
      "entrypoint": true,
      "description": "Processes checkout for guest users.",
      "inferred": false
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
      "target": "func_process_guest_checkout",
      "type": "implemented_by",
      "layer": "conceptual-to-technical"
    },
    {
      "source": "service_orders",
      "target": "file_orders_guest_checkout_py",
      "type": "contains",
      "layer": "technical"
    },
    {
      "source": "file_orders_guest_checkout_py",
      "target": "func_process_guest_checkout",
      "type": "contains",
      "layer": "technical"
    }
  ],
  "update_layers": {
    "workflow": ["workflow_checkout", "workflow_guest_checkout"],
    "conceptual": ["concept_order_checkout", "concept_guest_order"],
    "technical": [
      "service_orders",
      "file_orders_guest_checkout_py",
      "func_process_guest_checkout"
    ]
  }
}
```

---

## Usage Patterns

### Pattern 1: Start with Workflow
When user describes a use case or user journey, start with workflow layer and work down.

### Pattern 2: Start with Code
When user provides code without context, start with technical layer and infer concepts/workflows.

### Pattern 3: Iterative Refinement
Build skeleton first, then progressively add detail as user provides more information.

### Pattern 4: Focused Deep Dive
Create high-level structure for entire codebase, then drill down into specific area with fine-grained detail.

### Pattern 5: Technical-Only
For pure dependency analysis, focus only on technical layer with `calls`, `imports`, `depends_on` edges.
