import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { sha256 } from './sha256.js';
import { BIN_PATH, NUX_PATH } from './const.js'
import * as base from './base.js'


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
  let wpath = `${BIN_PATH}/nux_job_${name}`
  let ppath = `${root_dir}/Library/LaunchAgents/${label}.plist`
  let logpath = `${NUX_PATH}/logs/${name}`

  let timeout_cmd = timeout == null ? "" : `timeout ${timeout}`  

	// technically _with_logs suffix is kinda misleading since we only add timestamps
  // TODO: add script hash to output and status logs so we can track different versions

  let wrapper = base.script`
    #!/usr/bin/env zsh -i

    scripthash=$(basename ${runscript})

    add_timestamp() {
      while IFS= read -r line; do
        printf "%s\t%s\n" "$(date "+%Y-%m-%d %H:%M:%S")" "$line"
      done
    }

    mkdir -p "${NUX_PATH}/status"

    echo "$(date "+%Y-%m-%d %H:%M:%S"),$scriptHash,start" >> "${NUX_PATH}/status/${name}"


    set -o pipefail  # if any of the pipe's process fail output a non-zero exit code 

    # Run the script and process its output
    { ${timeout_cmd} "${runscript}" 2>&1 ; } | add_timestamp

    exitcode=$?
    echo "$(date "+%Y-%m-%d %H:%M:%S"),$scripthash,stop,$exitcode" >> "${NUX_PATH}/status/${name}"
  `

  wrapper = base.symlink(wrapper, wpath)

  let plist = base.textfile`
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <key>Label</key>
        <string>${label}</string>
        <key>ProgramArguments</key>
        <array>
          <string>${wrapper}</string>
        </array>
        <key>StandardErrorPath</key>
        <string>${logpath}</string>
        <key>StandardOutPath</key>
        <string>${logpath}</string>

    ${config}

    </dict>
    </plist>
  `

  let load_unload = {
    // https://chat.openai.com/g/g-YyyyMT9XH-chatgpt-classic/c/2c6eb981-9987-4ac6-8cb3-48877d315b48
    // TODO: maybe switch to launchctl bootout? i.e. launchctl bootout gui/501/com.nux.$1 (this also exits with proper error codes)

    install: ["execShV1", dedent`
      launchctl bootstrap gui/$(id -u) "${ppath}"
      # output=$(launchctl load "${ppath}" 2>&1)
      # echo "$output"
      # [[ "$output" != *"Load failed"* ]]  # actually produces an error if it says load failed
    `],
    uninstall: ["execShV1", dedent`
      launchctl list | grep -q ${label} && launchctl bootout user/$(id -u) "${label}" || true
      # output=$(launchctl unload "${ppath}" 2>&1)
      # echo "$output"
      # [[ "$output" != *"Unload failed"* ]]  # actually produces an error if it says unload failed
    `],
    dependencies: [ base.symlink(plist, ppath) ]
  }

  return [
    load_unload,
  ]
}

export const nux_macos_user_defaults = () => {
  return [
    base.script_old("nj", `launchctl list | grep com.nux.`),
    base.script_old("njl", dedent`
      #!/bin/bash
      less +G ${NUX_PATH}/logs/$1
    `),
    // TODO: verify that the path is always gui/501
    base.script_old("nji", dedent`
      #!/bin/bash
      launchctl print gui/501/com.nux.$1
    `),
    base.script_old("njs", dedent`
      #!/bin/bash
      less +G ${NUX_PATH}/status/$1  # display the end of the log
    `),
    base.script_old("timeout", dedent`
      #!/usr/bin/env perl
      alarm shift; exec @ARGV';
    `),

  ]
}

