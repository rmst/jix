import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { sha256 } from './sha256.js';
import { BIN_PATH, NUX_PATH } from './const.js'
import { script, file } from './base.js'


export const launchdJob = (name, config, runscript, root_dir="") => {
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

  let label = `com.nux.${name}`

  let exe = `nux_job_${name}`
  let spath = `${BIN_PATH}/${exe}`
  let ppath = `${root_dir}/Library/LaunchAgents/${label}.plist`
  let logpath = `${NUX_PATH}/logs/${name}`


  let wpath = `${BIN_PATH}/nix_jobs_logwrapper`
  let wrapper = script("nix_jobs_logwrapper", dedent`
    #!/bin/sh
    add_timestamp() {
      while IFS= read -r line; do
        printf "%s\t%s\n" "$(date "+%Y-%m-%d %H:%M:%S")" "$line"
      done
    }

    # Run the script and process its output
    ("$1" 2>&1) | add_timestamp
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
          <string>${spath}</string>
        </array>
        <key>StandardErrorPath</key>
        <string>${logpath}</string>
        <key>StandardOutPath</key>
        <string>${logpath}</string>

    ${config}

    </dict>
    </plist>
  `


  let hash = sha256(JSON.stringify([name, plist, runscript, root_dir]))

  let load_unload = {
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

export const nux_macos_defaults = () => {
  return [
    script("nux_jobs", `launchctl list | grep com.nux.`),
  ]
}