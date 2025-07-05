import * as fs from 'node:fs';
import { EXISTING_HASHES_PATH } from '../nux/context';


export function forceRemove(drvs) {
  const lines = drvs.split('\n').map(line => line.trim()).filter(line => line !== '');
  // console.log(lines)
  let existing = JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, 'utf8'));
  console.log('Before:', existing.length, "derivations");

  // Remove each line from the JSON list
  existing = existing.filter(item => !lines.includes(item));
  console.log('After:', existing.length, "derivations");

  fs.writeFileSync(
    EXISTING_HASHES_PATH,
    JSON.stringify(existing, null, 2),
    'utf8'
  );
}
