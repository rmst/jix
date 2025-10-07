### Fixes

feat(cli-gc): implement basic garbage collection by introducing the new `nux gc` command

implement log rotation for nux.service logs

ui(MarkdownComponent): citations aren't visually distinct from normal text

### Improvements

maybe add `nux services` subcommand

cli: Protect against simultaneous runs of `nux apply`, implement locking via mkdir (works across all posix systems since mkdir is atomic)

Add tests (which could double as examples)

cli(nux apply): if nux install doesn't find an install path, i.e. we're looking at a nux library file, instead of failing, maybe check all the installed nux roots if they would be affected by the library change. This could be done either via static import analysis or by actually running all nux roots (since they should be side-effect free)

eliminate all uses of quickjs std and os modules. use node shims instead

ensure that nux system configuration evaluations are pure. we have to remove os and std and the ability to import binary libraries and maybe more. also we'd have to find a way to send the evaluation result (the effects graph) to the main nux cli. one way of handling this would be to implement the iframes-like feature in quickjs-x (see quickjs-x/Issues.md)

Build processes should be sandboxed by default. escape hatch via buildImpure or sth

(Side-effect free) effects should be run in parallel

add way to extend MANPATH (so we can do `man nux` and `man :mycustomscript:`)

Add typescript support (requires source map support in quickjs https://github.com/bellard/quickjs/issues/352)

feat(advanced-gc): E.g. whenever an effect is uninstalled, we should add it to a gc.json, which records all uninstalled effects with an "unusedSince" date, and then all effects (and their .nux/out results) not used in over 30 days will be deleted.
