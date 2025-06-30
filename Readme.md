# Nux

Declarative system configurations using Javascript


### Build

```bash
git clone --recurse-submodules $PATH_TO_THIS_REPO
```

```bash
make all
```

### Goals
Bootstrapability: nux is (and should remain) buildable (on Linux) with nothing other than `make` and `gcc`


### Development

To update quickjs-x submodule run
```bash
git submodule update --remote quickjs-x
```

Note that quickjs-x only provides a very minimal Node.js standard library shim. Most functions aren't implemented. If we're missing something add a comment in this section of the readme so we can fix it. 



### The Effects System

