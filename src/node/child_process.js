import { monkeyPatchProcess } from "./util.js"


export const execSync = (cmd, options={}) => {
	// https://nodejs.org/api/child_process.html#child_processexecsynccommand-options

	// TODO: mechanism to automatically escape arguments ?
	// TODO: only return stdout and print stderr on error

  // make everything fail if one command fails, TODO: is this a good default?
  // redirect stderr to stdout

  // TODO: this is a hack, we don't escape env values properly
  let env_setup = Object.entries(options.env).map(([k, v]) => `export ${k}="${v}"`).join("\n")

  let wrappedCmd = dedent`
    {
      set -e
      ${env_setup}
      ${cmd}
    } 2>&1
  `

  let proc = std.popen(wrappedCmd, "r")
  // let output = process.readAsString().trim()
  let output = ""

  while (true) {
    let line = proc.getline()
    if (line === null) {
      break;
    }
    output = output + line + '\n'
    // Print the line, getline() does not include the trailing line feed
    if (verbose)
      console.log(line)
  }


  let code = proc.close()

  if(code != 0) {
    throw Error(dedent`
      Command:
      ${cmd}
      failed with error code ${code}. Output:
      ${verbose ? "see above" : output}
    `)
  }

  return output
}