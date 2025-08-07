import type { Page } from "@playwright/test"
import type { SupportedChain } from "../../../types"

const CHAIN_DATA_VALUES: Record<SupportedChain, string> = {
  solana: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", // Solana mainnet
  ethereum: "eip155:1", // Ethereum mainnet
  base: "eip155:8453", // Base mainnet
  sui: "sui:mainnet", // Sui mainnet
  polygon: "eip155:137", // Polygon mainnet
  bitcoin: "bip122:000000000019d6689c085ae165831e93", // Bitcoin mainnet
}

export async function importPrivateKey(
  page: Page,
  privateKey: string,
  password: string,
  chain: SupportedChain = "base", // Default to Base instead of Solana
  name?: string, // Optional name for the private key
): Promise<void> {
  console.log(
    `Starting private key import process for Phantom with chain: ${chain}${
      name ? ` and name: ${name}` : ""
    }...`,
  )

  try {
    // Wait for the extension UI to be ready
    await page.waitForLoadState("networkidle")

    // Step 1: Wait for and click "I already have a wallet" button
    await page.waitForSelector('button:has-text("I already have a wallet")', {
      state: "visible",
    })
    await page.click('button:has-text("I already have a wallet")')
    await page.waitForLoadState("networkidle")

    // Step 2: Wait for and click "Import Private Key" button
    await page.waitForSelector('button:has-text("Import Private Key")', {
      state: "visible",
    })
    await page.click('button:has-text("Import Private Key")')
    await page.waitForLoadState("networkidle")

    // Step 3: Select the chain (Phantom defaults to Solana, so we need to change it unless user explicitly wants Solana)
    if (chain !== "solana") {
      console.log(
        `Selecting chain: ${chain} (Phantom defaults to Solana, changing to ${chain})`,
      )

      // Click the chain dropdown button
      await page.waitForSelector("[data-reach-listbox-button]", {
        state: "visible",
      })
      await page.click("[data-reach-listbox-button]")

      // Wait for dropdown options to appear
      await page.waitForSelector('[role="option"]', {
        state: "visible",
      })

      // Click the specific chain option using data-value attribute
      const chainDataValue = CHAIN_DATA_VALUES[chain]
      const chainSelector = `[role="option"][data-value="${chainDataValue}"]`

      await page.waitForSelector(chainSelector, {
        state: "visible",
      })
      await page.click(chainSelector)

      console.log(`Selected chain: ${chain} (${chainDataValue})`)

      // Wait for the selection to be processed
      await page.waitForLoadState("networkidle")
    } else {
      console.log("Using default Solana chain (no selection needed)")
    }

    // Step 4: Enter the private key name (if provided)
    if (name) {
      console.log(`Entering private key name: ${name}`)

      // Target the name input by its name attribute and placeholder
      const nameInput = page.locator('input[name="name"][placeholder="Name"]')
      await nameInput.waitFor({ state: "visible" })
      await nameInput.fill(name)

      console.log(`Private key name "${name}" entered successfully`)
    }

    // Step 5: Enter the private key
    console.log("Entering private key...")

    // Target the private key textarea by its name attribute and placeholder
    const privateKeyTextarea = page.locator(
      'textarea[name="privateKey"][placeholder="Private key"]',
    )
    await privateKeyTextarea.waitFor({ state: "visible" })
    await privateKeyTextarea.fill(privateKey)

    console.log("Private key entered successfully")

    // Step 6: Click the Import button to continue
    console.log("Clicking Import button...")

    const importButton = page.getByTestId("onboarding-form-submit-button")
    await importButton.waitFor({ state: "visible" })
    await importButton.click()

    console.log("Import button clicked")
    await page.waitForLoadState("networkidle")

    // Step 6: Wait for and enter password
    const passwordInput = page.getByTestId("onboarding-form-password-input")
    await passwordInput.waitFor({ state: "visible" })
    await passwordInput.fill(password)

    // Step 7: Wait for and confirm password
    const confirmPasswordInput = page.getByTestId(
      "onboarding-form-confirm-password-input",
    )
    await confirmPasswordInput.waitFor({ state: "visible" })
    await confirmPasswordInput.fill(password)

    // Step 8: Wait for and check terms of service checkbox
    const checkbox = page.getByTestId(
      "onboarding-form-terms-of-service-checkbox",
    )
    await checkbox.waitFor({ state: "visible" })
    await checkbox.click()

    // Wait for the checkbox state to update
    try {
      await page.waitForTimeout(500)
    } catch (error) {
      console.log("Page context changed during checkbox wait (expected)")
    }

    // Step 9: Wait for and click final Continue button to complete setup
    const finalContinueBtn = page.getByTestId("onboarding-form-submit-button")
    await finalContinueBtn.waitFor({ state: "visible" })
    await finalContinueBtn.click()

    await page.waitForLoadState("networkidle")

    // Step 10: Click "Get Started" to finish setup
    const getStartedBtn = page.locator('button:has-text("Get Started")')
    await getStartedBtn.waitFor({ state: "visible" })
    await getStartedBtn.click()

    // After "Get Started", Phantom transitions to main UI and closes the onboarding page
    // This may cause Playwright to throw "page closed" errors, which are expected
    try {
      await page.waitForLoadState("networkidle", { timeout: 3000 })
    } catch (_error) {
      // Expected: Page closes after transitioning to main extension UI
      console.log("Onboarding page closed (expected behavior)")
    }
  } catch (error) {
    console.error("Error during Phantom wallet import:", error)
    throw new Error(`Failed to import Phantom wallet: ${error}`)
  }
}
