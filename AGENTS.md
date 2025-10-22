# Jix

### Important: At the start of every new conversation
- Read all of the following documents:
	- docs/how-jix-works.md
	- docs/cli/Readme.md
	- docs/api/Readme.md
- Read through **all** examples in examples/
- Check the last few git commits (and list the files changed) to get a feeling for what has been worked on recently.

### Building vs. Discussing
Only start to modify files and act if you are absolutely confident. If the user asks you to do something that is not really possible, don't try to make best-effort modifications or implement workarounds. Instead get back to the user and explain the situation to him and the possible options and then let the user decide how to proceed.

### Jix CLI
The jix CLI entry point is `src/jix-cli/main.js` and is, in addition to writing their own jix code, the main way users interact with jix.

### Node API
We're using a Quickjs-based Javascript engine with a very incomplete Node.js API shim. If you do something requiring Node API imports (e.g. `node:fs`), look at `quickjs-x/qjsx-node/node/*` first, to see what is available.

### Building
Important: Read `Makefile`. **Always** use `$TMPDIR/jix-build` as BUILD_DIR (never use the default).

### General Instructions
- Use tabs instead of spaces for indentation
- Omit end-of-line semicolons in js/jsx/ts/tsx
- Prefer Array map over for-loops

### Code comments
Never write comments describing what changed compared the previous version of the code. Comments should always describe the current situation. Change notes go in the commit message.

### Git commits
Never commit without being explicitly asked to. When making a commit, always add `Co-Authored-By: ai <noreply@ai.simonramstedt.com>` as the last line of the commit message. Before making a commit check if the commit fixed a bug or implemented a feature listed in Issues.md (and if so remove it as part of the commit). Don't include trivial details. All commit messages should with a type such "feat" or "fix". Be careful not to include \n charaters instead of proper newlines.

### Commands
When the user says "generate-docs-123" read docs/AGENTS.md and follow the instructions.
