---
parent: CLI Reference
title: jix init
nav_order: 1
---

# jix init

Source: [`src/jix-cli/init/index.js`](https://github.com/rmst/jix/blob/95d2999/src/jix-cli/init/index.js)

Initialize a new jix environment.

## Usage

```
jix init [--vscode]
```

## Description

Initialize jix support in the current working directory.

This creates `.jix/modules` directory, sets up editor hints, and links the jix libs locally.

## Options

- `--vscode` - Create `.vscode/tasks.json` with jix commands

## Examples

```bash
jix init
jix init --vscode
```

## Behavior

- Creates `.jix/modules` directory if it doesn't exist
- Sets up symlinks to jix and jix-cli modules
- Creates `.jix/.gitignore` with recommended exclusions
- Creates or updates `jsconfig.json` for editor support
- If `--vscode` is specified, creates or updates `.vscode/tasks.json` with jix tasks
