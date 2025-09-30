# How Nux Works

Nux is centered around **manifest** files (named `__nux__.js`). A nux manifest is a JavaScript file that declaratively defines a desired state for a part of your system. It's composed of one or more interdependent effects.


## The Manifest File

Here is the full content of the `__nux__.js` manifest file. This file would typically be placed in its own directory (e.g., `my-tools/__nux__.js`).

The `nux` object is globally available within the manifest file, so no import is needed.

```javascript
// 1. Define a helper script.
// This will be a dependency for our main script.
const helperScript = nux.script`
  #!/bin/sh
  echo "Hello from the helper script!"
`

// 2. Define a main script that calls the helper.
// We use standard JS template interpolation to embed the helperScript effect.
const mainScript = nux.script`
  #!/bin/sh
  echo "Main script is running..."
  # The result of the helperScript effect (its path) will be injected here.
  ${helperScript}
`

// 3. The default export is the final effect to be applied.
// Here, we alias our main script to 'my_command'.
export default nux.alias({
  my_command: mainScript,
})
```


### How it works

A key feature of Nux is automatic dependency inference. When you use JavaScript template literal syntax to embed one effect inside a `nux.script`, the `nux.script` function receives the interpolated value and automatically understands the dependency. It ensures the dependency is built and substitutes its resulting path into the script.

In the example above:

1. `helperScript`: A simple `nux.script` effect is defined. When this effect is realized, its result is the path to the executable script file (e.g., `/home/user/.nux/out/<hash-of-the-script>`).
2. `mainScript`: A second script is defined using a template literal that interpolates `${helperScript}`.
3. **Dependency Resolution**: The `nux.script` tag function receives the `helperScript` effect object as an argument. It records this as a dependency of `mainScript`.
4. **Path Substitution**: Before creating `mainScript`, Nux ensures `helperScript` is built (i.e. the script file is created). It then takes its resulting path and substitutes it into the final content of `mainScript`. The script will contain a line like `~/.nux/out/<hash-of-the-helper-script>`, which executes the helper.
5. **`nux.alias`**: The main script is then symlinked to `~/.nux/bin/my_command`, making it easily accessible (assuming `~/.nux/bin` is in PATH).


## How to apply it

Assuming the manifest file is located at `./my-tools/__nux__.js` you can apply it via

```bash
nux apply ./my-tools
```

You can then run the resulting command `my_command` with the expected output:

```
Main script is running...
Hello from the helper script!
```
