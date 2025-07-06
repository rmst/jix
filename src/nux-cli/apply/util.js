import * as fs from 'node:fs';



// const ROOTNAME = "root.nux.js"
export const ROOTNAME = "__nux__.js"


export function exportsID(path) {
  let text = fs.readFileSync(path, 'utf8');

  return (false
    || text.includes('export const ID')
    || text.includes('export let ID')
    || text.includes('export var ID')
    || text.includes('export { ID }')
  );
}


export function findNuxRoot(path) {

  if (fs.existsSync(`${path}/${ROOTNAME}`)) {
    return `${path}/${ROOTNAME}`;
  }

  const parentDir = path.substring(0, path.lastIndexOf('/'));
  if (parentDir === '' || parentDir === path) {
    throw new Error(`No ${ROOTNAME} file found in any parent directories`);
  }

  return findNuxRoot(parentDir);
}
