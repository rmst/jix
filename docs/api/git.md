# git Namespace

*Source: [src/jix/git/index.js](../../src/jix/git/index.js)*

Git-related helpers.

## Functions

### checkout({ repo, commit })
Create a working tree at a specific commit.
- **Parameters:**
  - `repo` — Repository URL
  - `commit` — Commit hash
- **Returns:** [Effect](./Effect.md) whose `path` points to the checked out tree

*Source: [src/jix/git/index.js](../../src/jix/git/index.js)
