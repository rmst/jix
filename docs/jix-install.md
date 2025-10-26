---
title: Jix Install
parent: Getting Started
nav_order: 1
---

# Jix Install

Jix is centered around manifest files (named `__jix__.js`). A jix manifest is a JavaScript file that declaratively defines a desired state to be installed via `jix install` or scripts to be run via `jix run`.


## The Manifest File

Here is the full content of the `__jix__.js` manifest file (e.g., `my-tools/__jix__.js`). The `jix` object is globally available within the manifest file, so no import is needed.

```javascript
// will be run on `jix install`
export const install = () => {

	// 1. Define a helper script.
	// This will be a dependency for our main script.
	const helperScript = jix.script`
		#!/bin/sh
		echo "Hello from the helper script!"
	`

	// 2. Define a main script that calls the helper.
	// We use standard JS template interpolation to embed the helperScript effect.
	const mainScript = jix.script`
		#!/bin/sh
		echo "Main script is running..."
		# The result of the helperScript effect (its path) will be injected here.
		${helperScript}
	`

	// 3. Here, we alias our main script to 'my_command'.
	jix.alias({
		my_command: mainScript,
	})
}
```


### How it works

A key feature of Jix is automatic dependency inference. When you use JavaScript template literal syntax to embed one effect inside a `jix.script`, the `jix.script` function receives the interpolated value and automatically understands the dependency. It ensures the dependency is built and substitutes its resulting path into the script.

In the example above:

1. `helperScript`: A simple `jix.script` effect is defined. When this effect is realized, its result is the path to the executable script file (e.g., `/home/user/.jix/out/<hash-of-the-script>`).
2. `mainScript`: A second script is defined using a template literal that interpolates `${helperScript}`.
3. Dependency Resolution: Before creating `mainScript`, Jix ensures `helperScript` is built (i.e. the script file is created). It then takes its resulting path and substitutes it into the final content of `mainScript`. The script will contain a line like `~/.jix/out/<hash-of-the-helper-script>`, which executes the helper.
4. `jix.alias`: The main script is then symlinked to `~/.jix/bin/my_command`, making it easily accessible (assuming `~/.jix/bin` is in PATH).


## How to install it

Assuming the manifest file is located at `./my-tools/__jix__.js` you can install it via

```bash
cd my-tools && jix install  # or jix install -f ./my-tools
```

You can then run the resulting command `my_command` with the expected output:

```
Main script is running...
Hello from the helper script!
```


### Multiple Install Targets

You can also export an object with multiple named install configurations:

```javascript
export const install = {
	default: () => {
		// Default install behavior
		jix.alias({ my_tool: jix.script`echo "default"` })
	},
	minimal: () => {
		// Minimal installation
		jix.alias({ my_tool: jix.script`echo "minimal"` })
	},
	full: () => {
		// Full installation with all features
		jix.alias({ my_tool: jix.script`echo "full"` })
	}
}
```

Install a specific configuration with:
```bash
jix install  # installs 'default'
jix install minimal  # installs 'minimal'
jix install full  # installs 'full'
```
