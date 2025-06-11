#!/usr/bin/env node

/**
 * This script extracts the Coinbase Wallet extension
 * to be used by Playwright tests.
 *
 * Run this before running tests in CI to ensure the extension
 * is ready and to avoid race conditions during test execution.
 */

import path from "path"
import { fileURLToPath } from "url"
import extract from "extract-zip"
import fs from "fs-extra"

// Support for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Constants for Coinbase Wallet
const COINBASE_VERSION = "3.117.1"
const EXTRACTION_COMPLETE_FLAG = ".extraction_complete"

/**
 * Set up the cache directory structure
 */
async function setupCacheDir(cacheDirName) {
  // Check if we're in the frontend directory or need to navigate to it
  const currentDir = process.cwd()
  console.log(`Current working directory: ${currentDir}`)

  let basePath

  // Check if we're already in the frontend directory
  if (await fs.pathExists(path.join(currentDir, "next.config.js"))) {
    // We're in the frontend directory, use current dir
    basePath = currentDir
    console.log("Running from frontend directory")
  } else {
    // We're likely in the project root, navigate to frontend
    basePath = path.join(currentDir, "example", "frontend")
    console.log("Running from project root, using frontend directory")
  }

  const cacheDirPath = path.join(basePath, "e2e", ".cache", cacheDirName)
  console.log(`Using cache directory: ${cacheDirPath}`)

  // Ensure the cache directory exists
  await fs.ensureDir(cacheDirPath)

  return cacheDirPath
}

/**
 * Find the Coinbase Wallet extension zip file
 */
async function findCoinbaseZip(cacheDir) {
  console.log(`Looking for Coinbase zip files in: ${cacheDir}`)

  const possibleNames = [
    "coinbase-wallet-extension.zip",
    "coinbase-wallet.zip",
    "coinbase.zip",
    `coinbase-${COINBASE_VERSION}.zip`,
  ]

  // Check if cache directory exists
  if (!(await fs.pathExists(cacheDir))) {
    console.log(`Cache directory does not exist: ${cacheDir}`)
    return null
  }

  // List all files in the cache directory for debugging
  try {
    const allFiles = await fs.readdir(cacheDir)
    console.log(`Files in cache directory: ${allFiles.join(", ")}`)
  } catch (error) {
    console.log(`Could not read cache directory: ${error.message}`)
  }

  for (const zipName of possibleNames) {
    const zipPath = path.join(cacheDir, zipName)
    if (await fs.pathExists(zipPath)) {
      console.log(`Found Coinbase Wallet zip: ${zipPath}`)
      return zipPath
    }
  }

  // Also check in the cache directory itself for any .zip files
  try {
    const files = await fs.readdir(cacheDir)
    const zipFiles = files.filter(file => file.endsWith(".zip"))

    if (zipFiles.length === 1) {
      const zipPath = path.join(cacheDir, zipFiles[0])
      console.log(`Found single zip file: ${zipPath}`)
      return zipPath
    }

    if (zipFiles.length > 1) {
      console.log(`Multiple zip files found: ${zipFiles.join(", ")}`)
      console.log(`Using first one: ${zipFiles[0]}`)
      return path.join(cacheDir, zipFiles[0])
    }
  } catch (error) {
    console.log(`Error reading cache directory: ${error.message}`)
  }

  return null
}

/**
 * Prepares the Coinbase Wallet extension by extracting it
 */
async function setupCoinbaseExtraction() {
  console.log(`Preparing Coinbase Wallet extension v${COINBASE_VERSION}...`)

  // Set up the cache directory
  const cacheDir = await setupCacheDir("coinbase-extension")
  const extractionPath = path.join(cacheDir, `coinbase-${COINBASE_VERSION}`)
  const flagPath = path.join(extractionPath, EXTRACTION_COMPLETE_FLAG)

  // Path to the pre-downloaded zip file
  const zipPath = await findCoinbaseZip(cacheDir)

  // Check if zip exists
  if (zipPath === null) {
    throw new Error(`Coinbase Wallet zip file not found in: ${cacheDir}`)
  }

  // Check if already extracted and valid
  if (await fs.pathExists(flagPath)) {
    const manifestPath = path.join(extractionPath, "manifest.json")
    if (await fs.pathExists(manifestPath)) {
      console.log(`Extension already extracted at: ${extractionPath}`)
      return extractionPath
    }
  }

  // Clean any existing extraction directory
  if (await fs.pathExists(extractionPath)) {
    console.log(`Cleaning existing directory: ${extractionPath}`)
    await fs.emptyDir(extractionPath)
  }

  // Extract the zip directly to the target location
  console.log(`Extracting ${zipPath} to: ${extractionPath}`)
  try {
    await extract(zipPath, { dir: extractionPath })

    // Verify extraction succeeded by checking for manifest.json
    const manifestPath = path.join(extractionPath, "manifest.json")
    if (!(await fs.pathExists(manifestPath))) {
      // Sometimes the extension files are in a subdirectory
      // Check if there's a single subdirectory containing the extension
      const items = await fs.readdir(extractionPath)
      const directories = []

      for (const item of items) {
        const itemPath = path.join(extractionPath, item)
        const stat = await fs.stat(itemPath)
        if (stat.isDirectory()) {
          directories.push(item)
        }
      }

      if (directories.length === 1) {
        const subDirPath = path.join(extractionPath, directories[0])
        const subManifestPath = path.join(subDirPath, "manifest.json")

        if (await fs.pathExists(subManifestPath)) {
          console.log(
            `Moving extension files from subdirectory: ${directories[0]}`,
          )
          // Move all files from subdirectory to extraction path
          const subItems = await fs.readdir(subDirPath)
          for (const subItem of subItems) {
            await fs.move(
              path.join(subDirPath, subItem),
              path.join(extractionPath, subItem),
              { overwrite: true },
            )
          }
          // Remove the now-empty subdirectory
          await fs.remove(subDirPath)
        } else {
          // Check if this is a nested structure (extension-id/version/files)
          const subItems = await fs.readdir(subDirPath)
          const subDirectories = []

          for (const subItem of subItems) {
            const subItemPath = path.join(subDirPath, subItem)
            const subStat = await fs.stat(subItemPath)
            if (subStat.isDirectory()) {
              subDirectories.push(subItem)
            }
          }

          // Check if there's exactly one subdirectory (version directory)
          if (subDirectories.length === 1) {
            const versionDirPath = path.join(subDirPath, subDirectories[0])
            const versionManifestPath = path.join(
              versionDirPath,
              "manifest.json",
            )

            if (await fs.pathExists(versionManifestPath)) {
              console.log(
                `Moving extension files from nested structure: ${directories[0]}/${subDirectories[0]}`,
              )
              // Move all files from version directory to extraction path
              const versionItems = await fs.readdir(versionDirPath)
              for (const versionItem of versionItems) {
                await fs.move(
                  path.join(versionDirPath, versionItem),
                  path.join(extractionPath, versionItem),
                  { overwrite: true },
                )
              }
              // Remove the now-empty directory structure
              await fs.remove(subDirPath)
            }
          }
        }
      } else if (directories.length > 1) {
        // Multiple directories - check each one for manifest.json
        console.log(`Multiple directories found: ${directories.join(", ")}`)
        for (const dir of directories) {
          const subDirPath = path.join(extractionPath, dir)
          const subManifestPath = path.join(subDirPath, "manifest.json")

          if (await fs.pathExists(subManifestPath)) {
            console.log(`Found manifest in directory: ${dir}`)
            console.log(`Moving extension files from subdirectory: ${dir}`)
            // Move all files from subdirectory to extraction path
            const subItems = await fs.readdir(subDirPath)
            for (const subItem of subItems) {
              await fs.move(
                path.join(subDirPath, subItem),
                path.join(extractionPath, subItem),
                { overwrite: true },
              )
            }
            // Remove the now-empty subdirectory
            await fs.remove(subDirPath)
            break
          }
        }
      }

      // Final check for manifest.json
      if (!(await fs.pathExists(manifestPath))) {
        throw new Error(
          `Extraction failed: manifest.json not found at ${manifestPath}\nThe zip file may not contain a valid Coinbase Wallet extension.`,
        )
      }
    }

    // Create flag file to indicate successful extraction
    await fs.writeFile(flagPath, new Date().toISOString())

    console.log(
      `Coinbase Wallet extension successfully prepared at: ${extractionPath}`,
    )
    return extractionPath
  } catch (error) {
    console.error(`Error extracting zip: ${error.message}`)
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
    console.log("Preparing Coinbase Wallet extension for tests...")

    // Run the setup function
    const extensionPath = await setupCoinbaseExtraction()
    console.log(
      `Coinbase Wallet extension prepared successfully at: ${extensionPath}`,
    )
    console.log("You can now run the tests!")

    process.exit(0)
  } catch (error) {
    console.error("Failed to prepare Coinbase Wallet extension:")
    console.error(error)
    process.exit(1)
  }
}

// Run the main function with proper promise handling
main().catch(error => {
  console.error("Unhandled error in main function:", error)
  process.exit(1)
})
