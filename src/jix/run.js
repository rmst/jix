import { dedent } from './dedent';
import { effect } from './effect';

/**
  @param {{install?: string, uninstall?: string, dependencies?: Array, path?: string, str?: string}} obj
*/
export const run = ({ install = null, uninstall = null, ...other }) => {
  let extraLines = dedent`
    set -e  # error script if single command fails
    set -o pipefail  # error on piped command fails
    set -u  # error on unset variables
  `;

  return effect({
    install: install ? ["execShV1", `${extraLines}\n${install}`] : ["noop"],
    uninstall: uninstall ? ["execShV1", `${extraLines}\n${uninstall}`] : ["noop"],
    ...other
  });
};
