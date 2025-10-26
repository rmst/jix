---
parent: API Reference
title: git
nav_order: 10
---

# git

Source: [`src/jix/git/index.js`](https://github.com/rmst/jix/blob/main/src/jix/git/index.js)

Git repository operations namespace.

## Functions

### checkout
Source: [`src/jix/git/index.js#L4-23`](https://github.com/rmst/jix/blob/main/src/jix/git/index.js#L4-23)

```javascript
checkout({repo, commit})
```

Clone a git repository and checkout a specific commit, including submodules.

**Parameters:**

- `repo` (string, required) - Git repository URL
- `commit` (string, required) - Commit hash to checkout

**Returns:** Effect representing the repository directory (without `.git` directory)

The checkout is shallow (depth 1) and submodules are initialized. The `.git` directory is removed from the output.
