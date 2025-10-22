import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { UserError } from '../core/UserError.js';

/**
 * Creates or updates a jsconfig.json in the given directory to include
 * '.jix/modules' in the module resolution paths for VS Code.
 * This operation is synchronous.
 *
 * @param {string} projectDir The absolute or relative path to the project's root directory.
 */
export function installJsConfig(projectDir) {
  const configPath = `${projectDir}/jsconfig.json`;

  try {
    let config = {};
    const existed = existsSync(configPath)

    if (existed) {
      // File exists, read and parse it.
      try {
        config = JSON.parse(readFileSync(configPath, 'utf8'));
      } catch (err) {
        throw new UserError(`Failed to parse ${configPath}: ${err.message}`);
      }
    }

    // --- Safely navigate and modify the config object ---

    // Ensure compilerOptions and paths objects exist.
    config.compilerOptions = config.compilerOptions || {};
    config.compilerOptions.paths = config.compilerOptions.paths || {};

    // Ensure baseUrl is set, as it's required for paths to work.
    const needsBaseUrl = !config.compilerOptions.baseUrl
    if (needsBaseUrl) {
      config.compilerOptions.baseUrl = ".";
    }

    // Get the existing list for the "*" wildcard, or an empty array.
    const existingPaths = config.compilerOptions.paths['*'] || [];

    // Check if .jix/modules/* is already in the paths
    const alreadyHasNuxPath = existingPaths.includes('.jix/modules/*')

    // Ensure include array exists with the desired patterns
    const desiredInclude = ['**/*.js', './.jix/**/*.js']
    const existingInclude = config.include || []
    const hasCorrectInclude = desiredInclude.every(pattern => existingInclude.includes(pattern))

    if (!alreadyHasNuxPath || needsBaseUrl || !hasCorrectInclude) {
      // Use a Set to add our paths and automatically handle duplicates.
      // This ensures ".jix/modules/*" is first
      const newPaths = new Set([
        '.jix/modules/*',
        ...existingPaths,
      ]);

      // Assign the updated, unique list back to the config.
      config.compilerOptions.paths['*'] = [...newPaths];

      // Set the include array
      config.include = desiredInclude

      // --- Write the updated config back to disk ---
      const content = JSON.stringify(config, null, 2);
      writeFileSync(configPath, content, 'utf8');

      return existed ? 'updated' : 'created'
    }

    return null

  } catch (error) {
    if (error instanceof UserError) {
      throw error;
    }
    throw new UserError(`Failed to update ${configPath}: ${error.message}`);
  }
}
