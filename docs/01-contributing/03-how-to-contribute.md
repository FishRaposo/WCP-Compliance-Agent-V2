# How to Contribute

Step-by-step guide to making contributions to [PROJECT_NAME].

> For projects with human contributors, see [CONTRIBUTING.md](../../../CONTRIBUTING.md) (optional) at the project root.

---

## Quick Contribution Flow

```
Fork → Clone → Branch → Code → Test → Document → PR
```

---

## Step-by-Step

### 1. Pick a Task

- Browse open issues on [GitHub Issues](https://github.com/[GITHUB_REPO]/issues)
- Look for `good first issue` labels if you're new
- Check [TODO.md](../../../TODO.md) for the full task backlog
- Comment on the issue to claim it

### 2. Set Up Your Environment

See [Installation Guide](./01-installation.md) if you haven't already.

### 3. Create a Branch

```bash
git checkout -b [branch-type]/[TODO-ID]-[short-description]
```

Examples:
- `git checkout -b feature/F001-achievements`
- `git checkout -b fix/B001-icon-resize`
- `git checkout -b docs/api-reference`

### 4. Make Your Changes

- Follow code style conventions (see `AGENTS.md` > Conventions)
- Write in [LANGUAGE] (variable names, comments, all text)
- Add [DOC_COMMENT_FORMAT] to all new public functions

### 5. Write Tests

```bash
# Run existing tests to ensure you haven't broken anything
[YOUR_TEST_COMMAND]

# Add new tests for your changes
# Unit tests: [TESTS_DIR]/unit/[module].test.[ext]
# Integration tests: [TESTS_DIR]/integration/[feature].test.[ext]

# Check coverage
[YOUR_PACKAGE_MANAGER] run test:coverage
```

Your changes must not drop coverage below [COVERAGE_THRESHOLD]%.

### 6. Update Documentation

Before submitting, update:

- [ ] **`CHANGELOG.md`** — Add entry to `[Unreleased]` section
- [ ] **`TODO.md`** — Mark completed items as `- [x]`
- [ ] **`docs/`** — Update relevant section (API, user guide, etc.)

### 7. Commit

```bash
git add .
git commit -m "feat(scope): description (#TODO-ID)"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) format.

### 8. Push and Open PR

```bash
git push origin [your-branch-name]
```

Then open a Pull Request on GitHub with:
- Clear title following the format: `type: description (#TODO-ID)`
- Description of what changed and why
- Reference to the TODO/issue it closes

---

## PR Checklist

Before requesting review:

- [ ] All tests pass: `[YOUR_TEST_COMMAND]`
- [ ] Coverage maintained: `[YOUR_PACKAGE_MANAGER] run test:coverage`
- [ ] CHANGELOG.md updated
- [ ] TODO.md updated
- [ ] Relevant docs updated
- [ ] Code follows project style
- [ ] Commits follow Conventional Commits

---

## After Your PR is Merged

1. Delete your branch
2. Pull the latest `main`
3. Pick your next task from [TODO.md](../../../TODO.md)

---

## Need Help?

- Open a [GitHub Discussion](https://github.com/[GITHUB_REPO]/discussions)
- Comment on the relevant issue
- Check [Troubleshooting](../06-testing/04-troubleshooting.md) for test-related problems
