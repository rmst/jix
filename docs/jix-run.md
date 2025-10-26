---
title: Jix Run
nav_order: 2
---

# jix run

The `jix run` command provides a powerful way to execute ad-hoc scripts and commands within the context of a Jix manifest. It is conceptually similar to `npm run`, but with the added benefit of Jix's automatic dependency management.

Before executing a command, `jix run` installs only the effects required for the selected run script (scoped install), ensuring they are built and available. After the command finishes, those effects are uninstalled, and the original exit code is preserved.


## The `run` Export

To define runnable commands, a manifest must include a named export called `run`. This export should be an object where each key is a command name and the value defines the command to be executed.

A command's definition can be one of two types:

1.  A string: For simple, one-line shell commands.
2.  A `jix.script` effect: For multi-line scripts or scripts that have their own specific dependencies, which are inferred automatically.

### Example Manifest

Here is an example of a `__jix__.js` manifest that defines several runnable commands and demonstrates dependency inference.

```javascript
// my-app/__jix__.js

// Define a helper script that will be a dependency for another command.
const helper = () => jix.script`
	#!/bin/sh
	echo "I am a helper script!"
`

// Define runnable commands using the 'run' export.
export const run = {
	// A simple command defined as a string.
	hello: 'echo "Hello from your app!"',

	// A command that depends on the 'helper' script.
	// By interpolating ${helper}, we tell Jix that this script depends on it.
	'with-helper': () => jix.script`
		#!/bin/sh
		echo "Running a command with a helper..."
		${helper}
	`
}
```


## Execution Flow

When you execute `jix run <command-name>`, Jix performs the following steps:

1.  Finds Manifest: Locates the `__jix__.js` file in the current directory (or a path provided via `-f/--file`).
2.  Resolves Script + Deps: Looks up the selected entry under `export const run`, validates it is a string or `jix.script`, and infers that script’s dependencies (e.g. interpolated helpers).
3.  Installs Effects: Installs the effects needed for this run script.
4.  Executes Command: Runs the generated script, forwarding any additional arguments.
5.  Cleans Up: Uninstalls effects installed for this run.


## Usage

To run a command defined in the manifest, navigate to the directory containing the `__jix__.js` file and use `jix run`.

```bash
# Run the default entry (if defined)
$ jix run

# Run the simple 'hello' command
$ jix run hello
Hello from your app!

# Run the script-based command with its dependency
$ jix run with-helper
Running a command with a helper...
I am a helper script!
```