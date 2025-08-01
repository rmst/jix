
This is an unusual and non-trivial project. If you don't understand something ask the user, he is the original author.

### Formatting
Only use tabs for indentation. If you encouter a file using spaces, warn the user.

### CLI
The nux CLI entry point is `src/nux-cli/main.js` and is, in addition to writing their own nux code, the main way users interact with nux.

### Nuxpkgs
The directory `src/nuxpkgs` contains build recipes to build certain important open-source software packages.

### Git
Never commit without permission from the user. When committing include `Co-Authored-By: Gemini-CLI <noreply@google.com>` at the end.

Ideally, changes to `src/nuxpkgs` should be committed separately from other changes, notify the user if necessary.
