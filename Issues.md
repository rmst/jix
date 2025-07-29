
### Bugs


we should create our own config and also create our own master socket directory (to make multiple connections fast), i.e.
```
Host *
	ControlMaster auto
	ControlPersist 3s
	ControlPath /master/socket/dir/%r@%h:%p
```

no gc: implement garbage collection for unreferenced effects json files, currently they just accumulate

### Improvements

store hashes and effects on target device

cli qol: Create nux init, to create nux_modules dir, add nux_modules dir to jsConfig.json, and maybe more

cli: Protect against simultaneous nux installs (i.e. implement locking or sth)

Add tests (which could double as examples)

cli: if nux install doesn't find an install path, i.e. we're looking at a nux library file, instead of failing, maybe check all the installed nux roots if they would be affected by the library change. This could be done either via static import analysis or by actually running all nux roots (since they should be side-effect free)

nux should be embeddable into other applications and support completely contained operation with custom state directories, i.e. it should never hardcode stuff like `~/.nux`

effect.check: In addition to install and uninstall, add a check function which can check if the effect is already (or still) in place. This would allow for re-checking the system but also make it more robust when first applying the effect

effect.installCheck: In addition to install, uninstall and check add an installCheck function that checks whether basic criteria are met for the effect to be installed, e.g. to write a file we need to have write permission and a file of that name shouldn't already exist. This could probably avoid a lot of partially applied nux installs

eliminate all uses of quickjs std and os modules. use node shims instead

ensure that nux system configuration evaluations are pure. we have to remove os and std and the ability to import binary libraries and maybe more. also we'd have to find a way to send the evaluation result (the effects graph) to the main nux cli. one way of handling this would be to implement the iframes-like feature in quickjs-x (see quickjs-x/Issues.md)


Build processes should be sandboxed by default. escape hatch via buildImpure or sth

Build process output could be hashed and that is used as the input to subsequent effects/derivations. This would require changing the nux install process quite a bit, we wouldn't know beforehand what we actually need to run

Make a job system that abstracts over launchd and systemd and provides options for health checks, and AI health checks and supervision (NODE: systemd dynamicuser https://aistudio.google.com/prompts/1Bm1yjwQX3JyUF99cuKAuFsvdhdVG2uDT)

Maybe make a sandbox that abstracts over sandbox-exec and firejail (or sth)

Maybe move to nix flakes?https://aistudio.google.com/prompts/10uvcPmlcnVG1LcWhBV8WU4-dZ6UuwQJk

Side-effect free effects could be run in parallel (not a priority for me at the moment)

cli: for nux install print how much bigger .nux/out, etc have gotten