import { BrowserContext } from "@playwright/test"

/**
 * Discovers and retrieves the unique identifier for a browser extension
 * @param context The browser context from Playwright
 * @param extensionName The name of the extension to find
 * @returns The extension's unique identifier
 */
export async function getExtensionId(
  context: BrowserContext,
  extensionName: string,
): Promise<string> {
  console.log(`🔍 Searching for extension: "${extensionName}"`)

  // Create temporary page to access extension data
  const tempPage = await context.newPage()
  await tempPage.goto("chrome://extensions")

  // Fetch extension data using Chrome's management API
  const rawExtensionData: { id: string; name: string }[] =
    await tempPage.evaluate("chrome.management.getAll()")
  const extensionId = rawExtensionData.find(
    extension => extensionName.toLowerCase() === extension.name.toLowerCase(),
  )?.id
  // Clean up the temporary page
  await tempPage.close()

  // Handle case where extension wasn't found
  if (!extensionId) {
    throw new Error(`Unable to find extension "${extensionName}"`)
  }

  return extensionId
}
