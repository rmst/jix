# Basic Manifest

A Nux **manifest** is a JavaScript file (named `__nux__.js`) that declaratively defines a desired state for a part of your system. It's composed of one or more interdependent effects.

This document walks through a basic manifest that creates a simple shell script and makes it available as a command in your shell.

## The Manifest File

Here is the full content of the `__nux__.js` manifest file. This file would typically be placed in its own directory (e.g., `my-command/__nux__.js`).

The `nux` object is globally available within the manifest file, so no import is needed.

```javascript
/*
  This manifest creates a simple shell script and aliases it to `my_command`.
*/

// 1. Define a script using nux.script.
// This creates an executable file with the specified content.
const myScript = nux.script`
  #!/bin/sh
  echo "Hello from my_command"
`

// 2. The default export is the final effect to be applied.
// Here, we use nux.alias to create a symlink to our script
// in the ~/.nux/bin directory, making it available in the shell.
export default nux.alias({
  my_command: myScript,
})

// 3. The ID is a required named export that uniquely identifies the manifest.
// It's used by the nux CLI to track the manifest's state.
export const ID = 'nux.examples.basic_usage'
```

### How it works

1.  **`nux.script`**: This effect creates an executable shell script in the Nux store (`~/.nux/out/...`).
2.  **`nux.alias`**: This effect creates a symbolic link from `my_command` in `~/.nux/bin/` to the script created in the previous step.
3.  **`export default`**: The main effect or set of effects to be applied is exported as the default.
4.  **`export const ID`**: This named export provides a unique identifier for the manifest.

## How to apply it

Assuming the manifest file is located at `my-command/__nux__.js`:

1.  **Apply the manifest:**
    ```bash
    nux apply ./my-command
    ```

2.  **Run the resulting command:**
    (You may need to open a new shell or re-source your profile for the `~/.nux/bin` directory to be in your `PATH`)
    ```bash
    my_command
    ```

    **Expected output:**
    ```
    Hello from my_command
    ```