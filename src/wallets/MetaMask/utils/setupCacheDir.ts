import path from "node:path"
import fs from "fs-extra"

/**
 * Sets up the cache directory for MetaMask extension
 * Uses the current project's e2e/.cache directory
 * @param cacheDirName Name of the cache directory
 * @returns Path to the cache directory
 */
export async function setupCacheDir(cacheDirName: string): Promise<string> {
  // Use current project's e2e/.cache directory
  const projectRoot = process.cwd()
  const cacheDirPath = path.join(projectRoot, "e2e", ".cache", cacheDirName)

  // Ensure the cache directory exists
  await fs.ensureDir(cacheDirPath)

  return cacheDirPath
}
