import type { Page } from "@playwright/test"

/**
 * Enables test mode in Phantom wallet to support testnets like Base Sepolia
 * @param page - The Playwright page object for the Phantom wallet
 */
export async function enableTestMode(page: Page): Promise<void> {
  console.log("Enabling test mode for Phantom wallet...")

  try {
    // Wait for the wallet UI to be ready
    await page.waitForLoadState("networkidle")

    // Step 1: Click the "More" button (three dots menu)
    await page.click('button[aria-label="More"]')
    await page.waitForLoadState("networkidle")
    console.log("Clicked More button")

    // Step 2: Click "Wallet Settings" using getByTestId
    await page.getByTestId("context-menu-item-Wallet Settings").click()
    await page.waitForLoadState("networkidle")
    console.log("Opened Wallet Settings")

    // Step 3: Click "Developer Settings" using ID
    await page.click("button#settings-item-developer-settings")
    await page.waitForLoadState("networkidle")
    console.log("Opened Developer Settings")

    // Step 4: Click the "Testnet Mode" toggle using getByTestId
    await page.getByTestId("toggleTestNetwork").click()
    await page.waitForLoadState("networkidle")
    console.log("Toggled Testnet Mode")

    // Step 5: Click "Ethereum" to access network selection
    await page.click('button:has-text("Ethereum"):has-text("Ethereum Sepolia")')
    await page.waitForLoadState("networkidle")
    console.log("Opened Ethereum network selection")

    // Step 6: Select "Base Sepolia"
    await page.click('button:has-text("Base Sepolia")')
    await page.waitForLoadState("networkidle")
    console.log("Selected Base Sepolia network")

    console.log(
      "✅ Test mode enabled successfully! Base Sepolia is now available.",
    )

    // Short delay to allow UI to stabilize
    await page.waitForTimeout(2000)
  } catch (error) {
    console.error("Error enabling test mode:", error)
    throw new Error(`Failed to enable test mode in Phantom wallet: ${error}`)
  }
}
