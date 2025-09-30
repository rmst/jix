# nux run

The `nux run` command provides a powerful way to execute ad-hoc scripts and commands within the context of a Nux manifest. It is conceptually similar to `npm run`, but with the added benefit of Nux's automatic dependency management.

Before executing a command, `nux run` applies only the effects required for the selected run script (scoped install), ensuring they are built and available. After the command finishes, those effects are uninstalled, and the original exit code is preserved.


## The `run` Export

To define runnable commands, a manifest must include a named export called `run`. This export should be an object where each key is a command name and the value defines the command to be executed.

A command's definition can be one of two types:

1.  **A string**: For simple, one-line shell commands.
2.  **A `nux.script` effect**: For multi-line scripts or scripts that have their own specific dependencies, which are inferred automatically.

### Example Manifest

Here is an example of a `__nux__.js` manifest that defines several runnable commands and demonstrates dependency inference. A `default` export is not needed when you only intend to use `nux run`.

```javascript
// my-app/__nux__.js

// Define a helper script that will be a dependency for another command.
const helper = nux.script`
  #!/bin/sh
  echo "I am a helper script!"
`

// Define runnable commands using the 'run' export.
export const run = {
  // A simple command defined as a string.
  hello: 'echo "Hello from your app!"',

  // A command that depends on the 'helper' script.
  // By interpolating ${helper}, we tell Nux that this script depends on it.
  'with-helper': nux.script`
    #!/bin/sh
    echo "Running a command with a helper..."
    ${helper}
  `
}
```


## Execution Flow

When you execute `nux run <command-name>`, Nux performs the following steps:

1.  **Finds Manifest**: Locates the `__nux__.js` file in the current directory.
2.  **Resolves Script + Deps**: Looks up the selected entry under `export const run`, validates it is a string or `nux.script`, and infers only that script’s dependencies (e.g. interpolated helpers).
3.  **Applies Scoped Effects**: Applies just the effects needed for this run script (scoped install), failing fast if stale state for the same run id is still active.
4.  **Executes Command**: Runs the generated script via `/bin/sh`, forwarding any additional arguments.
5.  **Cleans Up**: Uninstalls effects installed for this run, preserving and returning the script’s exit code.


## Usage

To run a command defined in the manifest, navigate to the directory containing the `__nux__.js` file and use `nux run`.

```bash
# Run the simple 'hello' command
$ nux run hello
Hello from your app!

# Run the script-based command with its dependency
$ nux run with-helper
Running a command with a helper...
I am a helper script!
```
