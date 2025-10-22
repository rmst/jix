import { script, customEffect } from './base';
import { shellEscape } from './util';

/**
 * @param {*} path
 * @param {string} line
 */
export const appendToFile = (path, line) => {
  if (line.includes("\n"))
    throw Error("Currently we only can append single line at a time");

  line = shellEscape(line);

  let removeLine = script`
    #!/bin/sh
    # Find the line number of the last exact, full-line match.
    # grep -F: fixed string (no regex), -x: exact line match, -n: line number
    line_to_del=$(grep -Fxn -- "$2" "$1" | tail -n 1 | cut -d: -f1)

    if [ -n "$line_to_del" ]; then
      # Use printf to pipe the "delete" command to ed.
      # ed -s: run ed in silent mode.
      printf '%s\n' "\${line_to_del}d" w | ed -s "$1"
    fi
  `;

  return customEffect({
    install: jix.dedent`
      # add missing newline if necessary
      [ -s '${path}' ] && [ -n "$(tail -c 1 '${path}')" ] && echo >> '${path}'
      
      # add line
      echo ${line} >> '${path}'
    `,
    uninstall: `${removeLine} '${path}' ${line}`,
  })
}
