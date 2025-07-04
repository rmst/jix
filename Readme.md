# Nux

Declarative system configurations using Javascript



### Usage

`nux apply __nux__.js`


#### Cluster management
One use case for nux is to manage one or more machines based on a single git repository containing .js files describing the desired state of those machines.



### Building

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

Two main types of effects:
- pure effects: e.g. built packages and artifacts
- impure effects: e.g. system configuration

#### Rules and assumptions:

For impure effects ordering must not matter, depending on previous configurations they can be applied in arbitrary order except that dependencies are always applied before (obviously)

