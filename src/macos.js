import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { sha256 } from './sha256.js';
import { BIN_PATH, NUX_PATH } from './const.js'
import { script, file } from './base.js'


export const launchdJob = (name, config, runscript, root_dir="", timeout=null) => {
  /* 
    see logs: log show --predicate 'senderImagePath CONTAINS "test"' --info

    let name = sha256(JSON.stringify([config, script]))

    TODO: maybe allow JS objects and generate xml?
  
    EXAMPLE:
    ```js
    nux.launchdJob(
      "test",
      dedent`
        <key>StartInterval</key>
        <integer>10</integer>
        <key>RunAtLoad</key>
        <true/>
      `,
      dedent`
        #!/bin/bash
        NOW=$(date +"%Y-%m-%d %H:%M:%S")
        echo "hello launchd"
        echo "$NOW ga" >> ~/text.txt
      `,
      HOME
    ),
    ```

    https://chat.openai.com/g/g-YyyyMT9XH-chatgpt-classic/c/4a977680-d227-4001-a228-5f4b65a19910
  */


  // TODO: the timeout mechanism should be in separate wrapper function

  let label = `com.nux.${name}`

  let exe = `nux_job_${name}`
  let spath = `${BIN_PATH}/${exe}`
  let ppath = `${root_dir}/Library/LaunchAgents/${label}.plist`
  let logpath = `${NUX_PATH}/logs/${name}`

  let timeout_cmd = timeout == null ? "" : `timeout ${timeout}`  

	// technically _with_logs suffix is kinda misleading since we only add timestamps
  // TODO: add script hash to output and status logs so we can track different versions

  let scriptHash = sha256(runscript)

  let wpath = `${BIN_PATH}/${exe}_with_logs`
  let wrapper = script(`${exe}_with_logs`, dedent`
    #!/usr/bin/env zsh -i

    # scripthash=${scriptHash}

    add_timestamp() {
      while IFS= read -r line; do
        printf "%s\t%s\n" "$(date "+%Y-%m-%d %H:%M:%S")" "$line"
      done
    }

    mkdir -p "${NUX_PATH}/status"

    echo "$(date "+%Y-%m-%d %H:%M:%S"),${scriptHash},start" >> "${NUX_PATH}/status/${name}"


    set -o pipefail  # if any of the pipe's process fail output a non-zero exit code 

    # Run the script and process its output
    { ${timeout_cmd} "${spath}" 2>&1 ; } | add_timestamp

    exitcode=$?
    echo "$(date "+%Y-%m-%d %H:%M:%S"),${scriptHash},stop,$exitcode" >> "${NUX_PATH}/status/${name}"
  `)


  let plist = dedent`
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <key>Label</key>
        <string>${label}</string>
        <key>ProgramArguments</key>
        <array>
          <string>${wpath}</string>
        </array>
        <key>StandardErrorPath</key>
        <string>${logpath}</string>
        <key>StandardOutPath</key>
        <string>${logpath}</string>

    ${config}

    </dict>
    </plist>
  `


  let hash = sha256(JSON.stringify([name, wrapper, plist, runscript, root_dir]))

  let load_unload = {
    // TODO: maybe switch to launchctl bootout? i.e. launchctl bootout gui/501/com.nux.$1 (this also exits with proper error codes)
    install: ["execShV1", dedent`
      # hash: ${hash}  (included to trigger load/unload if inputs change)
      output=$(launchctl load "${ppath}" 2>&1)
      echo "$output"
      [[ "$output" != *"Load failed"* ]]  # actually produces an error if it says load failed
    `],
    uninstall: ["execShV1", dedent`
      output=$(launchctl unload "${ppath}" 2>&1)
      echo "$output"
      [[ "$output" != *"Unload failed"* ]]  # actually produces an error if it says unload failed
    `],
  }

  return [
    wrapper,
    script(exe, runscript),  // TODO: do we really always need this in path?
    file(ppath, plist),
    load_unload,
  ]
}

export const nux_macos_user_defaults = () => {
  return [
    script("nj", `launchctl list | grep com.nux.`),
    script("njl", dedent`
      #!/bin/bash
      less +G ${NUX_PATH}/logs/$1
    `),
    // TODO: verify that the path is always gui/501
    script("nji", dedent`
      #!/bin/bash
      launchctl print gui/501/com.nux.$1
    `),
    script("njs", dedent`
      #!/bin/bash
      less +G ${NUX_PATH}/status/$1  # display the end of the log
    `),
    script("timeout", dedent`
      #!/usr/bin/env perl
      alarm shift; exec @ARGV';
    `),

  ]
}

