# Basic Manifest and Dependency Inference

A Nux **manifest** is a JavaScript file (named `__nux__.js`) that declaratively defines a desired state for a part of your system. It's composed of one or more interdependent effects.

A key feature of Nux is **automatic dependency inference**. When you use standard JavaScript template literal syntax to embed one effect inside a `nux.script` effect, Nux's tag function receives the interpolated value and automatically understands the dependency. It ensures the dependency is built and substitutes its resulting path into the script.

This document walks through a basic manifest that demonstrates this concept.

## The Manifest File

Here is the full content of the `__nux__.js` manifest file. This file would typically be placed in its own directory (e.g., `my-command/__nux__.js`).

The `nux` object is globally available within the manifest file, so no import is needed.

```javascript
/*
  This manifest creates a command that calls a helper script.
  It demonstrates how Nux automatically infers dependencies.
*/

// 1. Define a helper script.
// This will be a dependency for our main script.
const helperScript = nux.script`
  #!/bin/sh
  echo "Hello from the helper script!"
`

// 2. Define a main script that calls the helper.
// We use standard JS template interpolation to embed the helperScript effect.
// Nux's 'script' tag function intercepts this and establishes a dependency.
const mainScript = nux.script`
  #!/bin/sh
  echo "Main script is running..."
  # The result of the helperScript effect (its path) will be injected here.
  ${helperScript}
`

// 3. The default export is the final effect to be applied.
// We alias our main script to 'my_command'.
export default nux.alias({
  my_command: mainScript,
})

// 4. The ID uniquely identifies the manifest.
export const ID = 'nux.docs.nux-apply'
```

### How it works

1.  **`helperScript`**: A simple `nux.script` effect is defined. When this effect is realized, its result is the path to the executable script file (e.g., `/home/user/.nux/out/xxxx-helperScript`).
2.  **`mainScript`**: A second script is defined using a template literal that interpolates `${helperScript}`.
3.  **Dependency Resolution**: The `nux.script` tag function receives the `helperScript` effect object as an argument. It records this as a dependency of `mainScript`.
4.  **Path Substitution**: Before creating `mainScript`, Nux ensures `helperScript` is built. It then takes its resulting path and substitutes it into the final content of `mainScript`. The script will contain a line like `/home/user/.nux/out/xxxx-helperScript`, which executes the helper.
5.  **`nux.alias`**: The main script is then aliased to `my_command`, making it easily accessible.

## How to apply it

Assuming the manifest file is located at `my-command/__nux__.js`:

1.  **Apply the manifest:**
    ```bash
    nux apply ./my-command
    ```

2.  **Run the resulting command:**
    ```bash
    my_command
    ```

    **Expected output:**
    ```
    Main script is running...
    Hello from the helper script!
    ```
