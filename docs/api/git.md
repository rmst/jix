# git Namespace

*Source: [src/nux/git/index.js](../../src/nux/git/index.js)*

Git-related helpers.

## Functions

### checkout({ repo, commit })
Create a working tree at a specific commit.
- **Parameters:**
  - `repo` — Repository URL
  - `commit` — Commit hash
- **Returns:** [Effect](./Effect.md) whose `path` points to the checked out tree

*Source: [src/nux/git/index.js](../../src/nux/git/index.js)
