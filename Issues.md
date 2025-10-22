### Fixes

feat(cli-gc): implement basic garbage collection by introducing the new `jix gc` command

implement log rotation for jix.service logs

ui(MarkdownComponent): citations aren't visually distinct from normal text

jix.nix: create test using docker container with Nix installed to test Nix support on non-nixos os

for each effect store its stacktrace to ~/.jix/debug or sth (maybe should be separated for each manifest id?)

### Improvements

In addition to specifying dependencies as array allow specifying them as objects (mapping from name to dependency). this would help debuggability

When printing effect info, resolve host to sth more meaninful than its machineId

Jix directory path (.jix) is hardcoded throughout the codebase - should be configurable

maybe add `jix services` subcommand

cli: Protect against simultaneous runs of `jix install`, implement locking via mkdir (works across all posix systems since mkdir is atomic)

for jix.nixos instead of always clearing out configuration.nix via context provider, add an option to integrate with an existing configuration.nix. in that case we'd just check if configuration.nix imports our root module (which then imports all modules in the modules dir)

cli(jix install): if jix install doesn't find an install path, i.e. we're looking at a jix library file, instead of failing, maybe check all the installed jix roots if they would be affected by the library change. This could be done either via static import analysis or by actually running all jix roots (since they should be side-effect free)

Build processes should be sandboxed by default. escape hatch via buildImpure or sth

(Side-effect free) effects should be run in parallel

add way to extend MANPATH (so we can do `man jix` and `man :mycustomscript:`)

Add typescript support (requires source map support in quickjs https://github.com/bellard/quickjs/issues/352)

feat(advanced-gc): E.g. whenever an effect is uninstalled, we should add it to a gc.json, which records all uninstalled effects with an "unusedSince" date, and then all effects (and their .jix/out results) not used in over 30 days will be deleted.
