# Nux

### Important: At the start of every new conversation
- Read all of the following documents:
	- docs/how-nux-works.md
	- docs/cli/Readme.md
	- docs/api/Readme.md
- Read through **all** examples in examples/
- Check the last few git commits (and list the files changed) to get a feeling for what has been worked on recently.

### Nux CLI
The nux CLI entry point is `src/nux-cli/main.js` and is, in addition to writing their own nux code, the main way users interact with nux.

### Building
Important: Read `Makefile`. **Always** use `$TMPDIR/nux-build` as BUILD_DIR (never use the default).

### General Instructions
- Use tabs instead of spaces for indentation
- Omit end-of-line semicolons in js/jsx/ts/tsx

### Code comments
Never write comments describing what changed compared the previous version of the code. Comments should always describe the current situation. Change notes go in the commit message.

### Git commits
Never commit without being explicitly asked to. When making a commit, always add "Co-Authored-By AI" (no colon) as the last line of the commit message. Before making a commit check if the commit fixed a bug or implemented a feature listed in Issues.md (and if so remove it as part of the commit). Don't include trivial details. All commit messages should with a type such "feat" or "fix". Be careful not to include \n charaters instead of proper newlines.

### Commands
When the user says "generate-docs-123" read docs/AGENTS.md and follow the instructions.