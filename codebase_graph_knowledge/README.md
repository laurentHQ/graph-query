# Code Knowledge Graph Mapper - Skill Documentation

This directory contains the decomposed reference documentation for the Code Knowledge Graph Mapper skill.

## Documentation Structure

### Core Reference
- **[SKILL.md](./SKILL.md)** - Quick reference and entry point

### Detailed References (Load as Needed)
- **[graph-schema.md](./references/graph-schema.md)** - Node types, edge types, JSON structure
- **[layer-definitions.md](./references/layer-definitions.md)** - Workflow, Conceptual, Technical layer guidance
- **[connectivity-rules.md](./references/connectivity-rules.md)** - Rules for correct node relationships
- **[best-practices.md](./references/best-practices.md)** - Abstraction, hierarchy, traceability guidelines
- **[agent-instructions.md](./references/agent-instructions.md)** - Step-by-step graph construction process
- **[graph-examples.md](./references/graph-examples.md)** - Sample graphs and usage patterns
- **[graph-evolution.md](./references/graph-evolution.md)** - Extending and maintaining graphs over time


## Usage

### For Quick Reference
Start with `SKILL.md` - contains:
- When to use this skill
- Quick start guide
- Core principles
- Basic schema template

### For Detailed Guidance
Load specific reference files as needed:
- Building nodes? → See `graph-schema.md`
- Defining layers? → See `layer-definitions.md`
- Ensuring connectivity? → See `connectivity-rules.md`
- Following best practices? → See `best-practices.md`
- Need step-by-step process? → See `agent-instructions.md`
- Want examples? → See `graph-examples.md`
- Updating existing graph? → See `graph-evolution.md`

### For Agents
The decomposed structure allows:
1. **Lightweight initial load**: `SKILL.md` (~2KB)
2. **On-demand detail loading**: Load specific references when needed
3. **Focused context**: Only include relevant sections for the current task

## Benefits of Decomposition

✅ **Reduced token usage**: Load only what's needed
✅ **Faster lookup**: Direct access to specific guidance
✅ **Easier maintenance**: Update individual sections independently
✅ **Better organization**: Clear separation of concerns
✅ **Progressive disclosure**: Start simple, drill down when needed

## Quick Navigation

### When you need to...

| Task | Reference File |
|------|----------------|
| Understand when to use this skill | `SKILL.md` |
| See the JSON structure | `graph-schema.md` |
| Define node types and edges | `graph-schema.md` |
| Understand layer purposes | `layer-definitions.md` |
| Know what to include at each layer | `layer-definitions.md` |
| Ensure correct connectivity | `connectivity-rules.md` |
| Validate your graph | `connectivity-rules.md` |
| Follow best practices | `best-practices.md` |
| Get step-by-step instructions | `agent-instructions.md` |
| See example graphs | `graph-examples.md` |
| Update/extend existing graph | `graph-evolution.md` |

## File Overview

| File | Size | Purpose |
|------|------|---------|
| `SKILL.md` | ~3KB | Quick reference and entry point |
| `graph-schema.md` | ~5KB | Complete schema reference |
| `layer-definitions.md` | ~8KB | Layer-by-layer guidance |
| `connectivity-rules.md` | ~6KB | Connectivity requirements and validation |
| `best-practices.md` | ~7KB | Best practices with examples |
| `agent-instructions.md` | ~10KB | Step-by-step construction process |
| `graph-examples.md` | ~6KB | Complete example graphs |
| `graph-evolution.md` | ~8KB | Extending and maintaining graphs |
| **Total decomposed** | **~53KB** | vs. Original 22KB (with more detail) |

## Migration Complete

✅ All sections extracted from original `claude_skill.md`
✅ GRAPH_EVOLUTION_GUIDE.md integrated as `graph-evolution.md`
✅ Additional examples and details added
✅ Cross-references between files established
✅ Quick navigation guide created
