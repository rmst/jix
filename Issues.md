
### Bugs

BUG: Before we uninstall / install an effect we need to check if another "nux root" is using the same effect!

BUG: implement garbage collection for unreferenced effects json files, currently they just accumulate



### Improvements

Protect against simultaneous nux installs (i.e. implement locking or sth)

Add tests (which could double as examples)

If nux i doesn't find an install path, i.e. we're looking at a nux library file, instead of failing, maybe check all the installed nux roots if they would be affected by the library change. This could be done either via static import analysis or by actually running all nux roots (since they should be side-effect free)

nux should be embeddable into other applications and support completely contained operation with custom state directories, i.e. it should never hardcode stuff like `~/.nux`

In addition to install and uninstall add a check function which can check if the effect is already (or still) in place. This would allow for re-checking the system but also make it more robust when first applying the effect

eliminate all uses of quickjs std and os modules. use node shims instead

ensure that nux system configuration evaluations are pure. we have to remove os and std and the ability to import binary libraries and maybe more. also we'd have to find a way to send the evaluation result (the effects graph) to the main nux cli. one way of handling this would be to implement the iframes-like feature in quickjs-x (see squickjs-x/Issues.md)

nux.appendLinesTo, i.e. declarative append/remove lines from a config file, e.g. the hosts file

Build processes should be sandboxed by default. escape hatch via buildImpure or sth

Build process output could be hashed and that is used as the input to subsequent effects/derivations. This would require changing the nux install process quite a bit, we wouldn't know beforehand what we actually need to run

Make a job system that abstracts over launchd and systemd and provides options for health checks, and AI health checks and supervision (NODE: systemd dynamicuser https://aistudio.google.com/prompts/1Bm1yjwQX3JyUF99cuKAuFsvdhdVG2uDT)

Maybe make a sandbox that abstracts over sandbox-exec and firejail (or sth)

Maybe move to nix flakes?https://aistudio.google.com/prompts/10uvcPmlcnVG1LcWhBV8WU4-dZ6UuwQJk

Side-effect free effects could be run in parallel (not a priority for me at the moment)

