# Architecture Overview

High-level architecture of [PROJECT_NAME].

---

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                   [PROJECT_NAME]                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐     ┌─────────────┐               │
│  │  [LAYER_1]  │────>│  [LAYER_2]  │               │
│  │  [tech]     │     │  [tech]     │               │
│  └─────────────┘     └─────────────┘               │
│         │                   │                       │
│         ▼                   ▼                       │
│  ┌─────────────────────────────────┐               │
│  │         [PERSISTENCE_LAYER]     │               │
│  │         [storage tech]          │               │
│  └─────────────────────────────────┘               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Layers

### [Layer 1] — [Technology]

**Purpose**: [What this layer does]  
**Location**: `[SRC_DIR]/[layer1]/`  
**Key files**:
- `[file1].[ext]` — [description]
- `[file2].[ext]` — [description]

**Responsibilities**:
- [Responsibility 1]
- [Responsibility 2]

### [Layer 2] — [Technology]

**Purpose**: [What this layer does]  
**Location**: `[SRC_DIR]/[layer2]/`  
**Key files**:
- `[file1].[ext]` — [description]

### [Persistence Layer] — [Technology]

**Purpose**: [How data is stored and retrieved]  
**Location**: [Where]  
**Technology**: [localStorage / PostgreSQL / Redis / files / etc.]

---

## Data Flow

```
[USER ACTION]
      │
      ▼
[INPUT HANDLER]
      │
      ▼
[BUSINESS LOGIC]
      │
      ▼
[STATE/PERSISTENCE]
      │
      ▼
[OUTPUT/UI UPDATE]
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [Decision 1] | [Choice made] | [Why] |
| [Decision 2] | [Choice made] | [Why] |
| [Decision 3] | [Choice made] | [Why] |

---

## What We Deliberately Did Not Use

| Rejected | Considered | Reason for rejection |
|----------|------------|----------------------|
| [Tech 1] | Yes | [Why we didn't use it] |
| [Tech 2] | Yes | [Why we didn't use it] |

---

## Performance Characteristics

| Operation | Expected Time | Notes |
|-----------|--------------|-------|
| [Operation 1] | [time] | [notes] |
| [Operation 2] | [time] | [notes] |

---

## Known Architectural Limitations

1. **[Limitation 1]**: [Description and why it was accepted]
2. **[Limitation 2]**: [Description and why it was accepted]

See `TODO.md` #T001 for the planned refactoring.

---

## Related Docs

- [[Layer Name] Deep Dive](./02-layer.md)
- [API Reference](../03-api/)
- [Design Vision](../05-reference/01-design-vision.md)
