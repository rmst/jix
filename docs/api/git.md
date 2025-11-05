---
parent: API Reference
title: git
nav_order: 10
---

# git

Source: [`src/jix/git/index.js`](https://github.com/rmst/jix/blob/95d2999/src/jix/git/index.js)

Git repository operations namespace.

## `git()`
Source: [`src/jix/git/index.js#L4`](https://github.com/rmst/jix/blob/95d2999/src/jix/git/index.js#L4)

Get a reference to the git command.

**Returns:** [Effect](./Effect.md) representing the git command

On NixOS, returns `nix.pkgs.git.git`. Otherwise, returns an effect for the existing `git` command.

---

## `checkout({repo, commit})`
Source: [`src/jix/git/index.js#L15`](https://github.com/rmst/jix/blob/95d2999/src/jix/git/index.js#L15)

Clone a git repository and checkout a specific commit, including submodules.

**Parameters:**

- `repo` (string, required) - Git repository URL
- `commit` (string, required) - Commit hash to checkout

**Returns:** [Effect](./Effect.md) representing the repository directory (without `.git` directory)

The checkout is shallow (depth 1) and submodules are initialized. The `.git` directory is removed from the output.
