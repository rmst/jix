import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Creates or updates a jsconfig.json in the given directory to include
 * 'nux_modules' in the module resolution paths for VS Code.
 * This operation is synchronous.
 *
 * @param {string} projectDir The absolute or relative path to the project's root directory.
 */
export function installJsConfig(projectDir) {
  const configPath = `${projectDir}/jsconfig.json`;

  try {
    let config = {};

    if (existsSync(configPath)) {
      // File exists, read and parse it.
      config = JSON.parse(readFileSync(configPath, 'utf8'));
    }

    // --- Safely navigate and modify the config object ---

    // Ensure compilerOptions and paths objects exist.
    config.compilerOptions = config.compilerOptions || {};
    config.compilerOptions.paths = config.compilerOptions.paths || {};

    // Ensure baseUrl is set, as it's required for paths to work.
    if (!config.compilerOptions.baseUrl) {
      config.compilerOptions.baseUrl = ".";
    }

    // Get the existing list for the "*" wildcard, or an empty array.
    const existingPaths = config.compilerOptions.paths['*'] || [];

    // Use a Set to add our paths and automatically handle duplicates.
    // This ensures "nux_modules/*" is first
    const newPaths = new Set([
      'nux_modules/*',
      ...existingPaths,
    ]);
    
    // Assign the updated, unique list back to the config.
    config.compilerOptions.paths['*'] = [...newPaths];

    // --- Write the updated config back to disk ---
    const content = JSON.stringify(config, null, 2);
    writeFileSync(configPath, content, 'utf8');

  } catch (error) {
    // console.log(`Failed to update ${configPath}:`, error);
    // You could re-throw the error if the caller needs to handle it.
    throw error;
  }
}
