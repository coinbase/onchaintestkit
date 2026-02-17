import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { SupportedChain } from '../../../types';
const CHAIN_DATA_VALUES: Record<SupportedChain, string> = {
  solana: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Solana mainnet
  ethereum: 'eip155:1', // Ethereum mainnet
  base: 'eip155:8453', // Base mainnet
  sui: 'sui:mainnet', // Sui mainnet
  polygon: 'eip155:137', // Polygon mainnet
  bitcoin: 'bip122:000000000019d6689c085ae165831e93', // Bitcoin mainnet
};
/**
 * Imports a new single-chain account via private key on the Phantom Home page
 * @param page - The Phantom extension page
 * @param name - The display name for the imported account
 * @param chain - The chain to import the account on
 * @param privateKey - The private key to import
 */
export const addNewAccount = async (
  page: Page,
  name: string,
  chain: SupportedChain,
  privateKey: string,
): Promise<void> => {
  console.log('Implemented but not tested, code is commented');
  // Ensure UI is ready
  //   await page.waitForLoadState("domcontentloaded")
  //   await page.waitForLoadState("networkidle")

  //   // Open settings / account menu
  //   await page.getByTestId("settings-menu-open-button").click()
  //   await page.getByTestId("sidebar_menu-button-add_account").click()

  //   if (chain !== "solana") {
  //     console.log(
  //       `Selecting chain: ${chain} (Phantom defaults to Solana, changing to ${chain})`,
  //     )

  //     // Click the chain dropdown button
  //     await page.waitForSelector("[data-reach-listbox-button]", {
  //       state: "visible",
  //     })
  //     await page.click("[data-reach-listbox-button]")

  //     // Wait for dropdown options to appear
  //     await page.waitForSelector('[role="option"]', {
  //       state: "visible",
  //     })

  //     // Click the specific chain option using data-value attribute
  //     const chainDataValue = CHAIN_DATA_VALUES[chain]
  //     const chainSelector = `[role="option"][data-value="${chainDataValue}"]`

  //     await page.waitForSelector(chainSelector, {
  //       state: "visible",
  //     })
  //     await page.click(chainSelector)

  //     console.log(`Selected chain: ${chain} (${chainDataValue})`)

  //     // Wait for the selection to be processed
  //     await page.waitForLoadState("networkidle")
  //   } else {
  //     console.log("Using default Solana chain (no selection needed)")
  //   }

  //   // Step 4: Enter the private key name (if provided)
  //   if (name) {
  //     console.log(`Entering private key name: ${name}`)

  //     // Target the name input by its name attribute and placeholder
  //     const nameInput = page.locator('input[name="name"][placeholder="Name"]')
  //     await nameInput.waitFor({ state: "visible" })
  //     await nameInput.fill(name)

  //     console.log(`Private key name "${name}" entered successfully`)
  //   }

  //   // Step 5: Enter the private key
  //   console.log("Entering private key...")

  //   // Target the private key textarea by its name attribute and placeholder
  //   const privateKeyTextarea = page.locator(
  //     'textarea[name="privateKey"][placeholder="Private key"]',
  //   )
  //   await privateKeyTextarea.waitFor({ state: "visible" })
  //   await privateKeyTextarea.fill(privateKey)

  //   // Step 6: Click the Import button to continue
  //   await page.waitForTimeout(10000)

  //   const importButton = page.getByTestId("onboarding-form-submit-button")
  //   await importButton.waitFor({ state: "visible" })

  //   // Wait for the button to become enabled (form validation must pass)
  //   await importButton.waitFor({ state: "attached" })
  //   await expect(importButton).toBeEnabled({ timeout: 10000 })

  //   await importButton.click()

  //   await page.waitForLoadState("networkidle")
  //   await page.waitForTimeout(3000)

  //   // Small settle time
  //   await page.waitForLoadState("networkidle")
};
