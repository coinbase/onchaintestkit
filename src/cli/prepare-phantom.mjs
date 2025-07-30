#!/usr/bin/env node

/**
 * This script extracts the Phantom Wallet extension
 * to be used by Playwright tests.
 *
 * Expects a zip file to be present in the cache directory.
 * Run this before running tests to ensure the extension
 * is ready and to avoid race conditions during test execution.
 */

import path from "path"
import { fileURLToPath } from "url"
import extract from "extract-zip"
import fs from "fs-extra"

// Support for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Constants for Phantom Wallet
const PHANTOM_VERSION = "25.27.0" // Update this version as needed
const EXTRACTION_COMPLETE_FLAG = ".extraction_complete"

/**
 * Set up the cache directory structure
 */
async function setupCacheDir(cacheDirName) {
  const projectRoot = process.cwd()
  const cacheDirPath = path.join(projectRoot, "example", "frontend", "e2e", ".cache", cacheDirName)

  // Ensure the cache directory exists
  await fs.ensureDir(cacheDirPath)

  return cacheDirPath
}

/**
 * Prepares the Phantom Wallet extension by extracting it from a zip file
 */
async function setupPhantomExtraction() {
  console.log(`Preparing Phantom Wallet extension v${PHANTOM_VERSION}...`)

  // Set up the cache directory
  const cacheDir = await setupCacheDir("phantom-extension")
  const extractionPath = path.join(cacheDir, `phantom-${PHANTOM_VERSION}`)
  const flagPath = path.join(extractionPath, EXTRACTION_COMPLETE_FLAG)

  // Look for the zip file
  const zipPath = path.join(cacheDir, `phantom-${PHANTOM_VERSION}.zip`)
  console.log(`Looking for Phantom Wallet extension zip at: ${zipPath}`)

  // Check if zip file exists
  if (!(await fs.pathExists(zipPath))) {
    throw new Error(
      `Phantom wallet zip file not found at ${zipPath}. Please ensure the zip file is placed in the cache directory.`
    )
  }

  // Verify the zip file is not empty
  const stats = await fs.stat(zipPath)
  if (stats.size === 0) {
    throw new Error(
      `Phantom wallet zip file at ${zipPath} is empty. Please provide a valid zip file.`
    )
  }

  console.log(`Found Phantom wallet zip file (${stats.size} bytes)`)

  // Clean any existing extraction directory
  if (await fs.pathExists(extractionPath)) {
    console.log(`Cleaning existing directory: ${extractionPath}`)
    await fs.emptyDir(extractionPath)
  }

  // Extract the ZIP file
  console.log(`Extracting to: ${extractionPath}`)
  try {
    await extract(zipPath, { dir: extractionPath })

    // Verify extraction succeeded
    const manifestPath = path.join(extractionPath, "manifest.json")
    if (!(await fs.pathExists(manifestPath))) {
      throw new Error(
        `Extraction failed: manifest.json not found at ${manifestPath}`
      )
    }

    // Read and validate manifest
    const manifest = await fs.readJson(manifestPath)
    console.log(`Extracted Phantom extension: ${manifest.name} v${manifest.version}`)

    // Create flag file to indicate successful extraction
    await fs.writeFile(flagPath, new Date().toISOString())

    console.log(
      `Phantom Wallet extension successfully prepared at: ${extractionPath}`
    )
    return extractionPath
  } catch (error) {
    console.error(`Error extracting ZIP: ${error.message}`)
    // Clean up on failure
    try {
      await fs.emptyDir(extractionPath)
    } catch (cleanupError) {
      console.error(`Failed to clean up: ${cleanupError.message}`)
    }

    throw new Error(`Extraction failed: ${error.message}`)
  }
}

async function main() {
  try {
    console.log("Preparing Phantom Wallet extension for tests...")

    // Run the setup function
    const extensionPath = await setupPhantomExtraction()
    console.log(
      `Phantom Wallet extension prepared successfully at: ${extensionPath}`
    )
    console.log("You can now run the tests!")

    process.exit(0)
  } catch (error) {
    console.error("Failed to prepare Phantom Wallet extension:")
    console.error(error)
    process.exit(1)
  }
}

// Run the main function with proper promise handling
main().catch(error => {
  console.error("Unhandled error in main function:", error)
  process.exit(1)
}) 