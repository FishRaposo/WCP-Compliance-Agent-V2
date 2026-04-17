# Project Structure

A complete map of the [PROJECT_NAME] codebase.

---

## Directory Tree

```
[PROJECT_DIR]/
├── [SRC_DIR]/                  # Primary source code
│   ├── [MODULE_1]/             # [Module 1 description]
│   ├── [MODULE_2]/             # [Module 2 description]
│   └── [MODULE_3]/             # [Module 3 description]
│
├── [BACKEND_DIR]/              # [Backend description]
│   ├── [FILE_1].[ext]          # [File 1 description]
│   └── [FILE_2].[ext]          # [File 2 description]
│
├── [TESTS_DIR]/                # Test files (mirrors src structure)
│   ├── unit/                   # Unit tests — pure logic
│   ├── integration/            # Integration tests — multiple modules
│   └── e2e/                    # End-to-end tests — full user flows
│
├── docs/                       # All project documentation
│   ├── 01-contributing/        # How to contribute
│   ├── 02-architecture/        # System design
│   ├── 03-api/                 # API reference
│   ├── 04-user-guide/          # End-user manual
│   ├── 05-reference/           # Design docs, specs
│   └── 06-testing/             # Testing documentation
│
├── AGENTS.md                   # AI agent instructions (required)
├── CHANGELOG.md                # Change history (Keep a Changelog) (required)
├── CONTRIBUTING.md             # Human contributor guide (optional)
├── TODO.md                     # Task tracking and roadmap (required)
├── README.md                   # Project homepage (required)
├── SECURITY.md                 # Security policy (optional)
├── CODE_OF_CONDUCT.md          # Community standards (optional)
├── [CONFIG_1]                  # [Config file description]
└── [CONFIG_2]                  # [Config file description]
```

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `AGENTS.md` | Machine-readable instructions for AI coding assistants | Required |
| `CHANGELOG.md` | Complete history of changes, one entry per release | Required |
| `TODO.md` | Task tracking and roadmap | Required |
| `README.md` | Project homepage | Required |
| `CONTRIBUTING.md` | Onboarding guide for human contributors | Optional |
| `SECURITY.md` | Security policy | Optional |
| `CODE_OF_CONDUCT.md` | Community standards | Optional |

---

## Source Code (`[SRC_DIR]/`)

[Describe the main source file or module structure here]

### Key [Modules/Files]

| File/Module | Purpose |
|-------------|---------|
| `[FILE_1].[ext]` | [What it does] |
| `[FILE_2].[ext]` | [What it does] |
| `[FILE_3].[ext]` | [What it does] |

---

## Tests (`[TESTS_DIR]/`)

```
[TESTS_DIR]/
├── unit/
│   ├── [module-1].test.[ext]    # Tests for [module 1]
│   ├── [module-2].test.[ext]    # Tests for [module 2]
│   └── __mocks__/               # Manual mocks
├── integration/
│   ├── [feature-1].test.[ext]   # Integration test for [feature 1]
│   └── [feature-2].test.[ext]   # Integration test for [feature 2]
└── e2e/
    ├── [flow-1].spec.[ext]      # E2E test for [user flow 1]
    └── [flow-2].spec.[ext]      # E2E test for [user flow 2]
```

---

## Configuration Files

| File | Tool | Purpose |
|------|------|---------|
| `[jest.config.js]` | Jest | Unit/integration test configuration |
| `[playwright.config.js]` | Playwright | E2E test configuration |
| `[.eslintrc.*]` | [YOUR_LINT_TOOL] | Code linting rules |
| `[.prettierrc]` | [YOUR_FORMAT_TOOL] | Code formatting rules |
| `[package.json]` | [YOUR_PACKAGE_MANAGER] | Dependencies and scripts |

---

## Design Decisions

Key architectural decisions:

1. **[Decision 1]**: [Why this choice was made]
2. **[Decision 2]**: [Why this choice was made]
3. **[Decision 3]**: [Why this choice was made]

See `docs/02-architecture/` for detailed architecture documentation.
