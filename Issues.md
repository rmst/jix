

BUG: Before we uninstall / install an effect we need to check if another "nux system" is using the same effect!


Improvement: nux.appendLinesTo

Improvement: build processes should be sandboxed by default. escape hatch via buildImpure or sth

Improvement: build process output could be hashed and that is used as the input to subsequent effects/derivations. This would require changing the nux install process quite a bit, we wouldn't know beforehand what we actually need to run

Improvement: Make a job system that abstracts over launchd and systemd and provides options for health checks, and AI health checks and supervision

Improvement: Maybe make a sandbox that abstracts over sandbox-exec and firejail (or sth)

Improvement: Maybe move to nix flakes?https://aistudio.google.com/prompts/10uvcPmlcnVG1LcWhBV8WU4-dZ6UuwQJk

Improvement: side-effect free effects could be run in parallel (not a priority for me at the moment)
