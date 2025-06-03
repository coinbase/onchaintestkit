import path from "node:path"
import fs from "fs-extra"
import { setupCacheDir } from "../../MetaMask/utils/setupCacheDir"

const COINBASE_VERSION = "3.117.1"

// Cache directory for pre-extracted extension (using onchainTestKit's existing cache)
const CACHE_DIR_NAME = "coinbase-extension"
// Flag file to indicate successful extraction
const EXTRACTION_COMPLETE_FLAG = ".extraction_complete"

/**
 * Sets up Coinbase by using the pre-extracted extension
 * Assumes extension was already prepared by running the e2e:coinbase:prepare script
 */
export async function setupCoinbase(): Promise<string> {
  const cacheDir = await setupCacheDir(CACHE_DIR_NAME)
  const extractionPath = path.join(cacheDir, `coinbase-${COINBASE_VERSION}`)
  const flagPath = path.join(extractionPath, EXTRACTION_COMPLETE_FLAG)

  // Check if extraction exists and is valid
  if (await fs.pathExists(flagPath)) {
    // Verify the extraction by checking for manifest.json
    const manifestPath = path.join(extractionPath, "manifest.json")
    if (await fs.pathExists(manifestPath)) {
      return extractionPath
    }

    console.warn(
      `Found extraction directory but manifest.json is missing: ${extractionPath}`,
    )
  }

  // If extraction doesn't exist or is invalid, throw an error providing instructions
  throw new Error(
    `Coinbase extension not found at ${extractionPath}. Please run the extraction command before running tests:\nyarn e2e:coinbase:prepare`,
  )
}
