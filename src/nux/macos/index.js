
import { dedent } from '../dedent.js';
import * as nux from '../base.js'
import { effect } from '../effect.js';
import context from '../context.js';
import { launchdJob } from './launchd.js';


const timeout_script = nux.script`
  #!/usr/bin/env perl
  alarm shift; exec @ARGV;
`

export const macosUtilScripts = nux.alias({
  timeout: timeout_script,
  nj: nux.script`launchctl list | grep com.nux.`,
  njl: nux.script`
    #!/bin/bash
    less +G ${context.NUX_PATH}/logs/$1
  `,
  // TODO: verify that the path is always gui/501
  nji: nux.script`
    #!/bin/bash
    launchctl print gui/501/com.nux.$1
  `,
  njs: nux.script`
    #!/bin/bash
    less +G ${context.NUX_PATH}/status/$1  # display the end of the log
  `,
  njopen: nux.script`
    open ${context.HOME}/Library/LaunchAgents
  `
})




export default {
  macosUtilScripts,
  launchdJob,
}