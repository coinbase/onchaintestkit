import type { Page } from "@playwright/test"
import { waitForCondition } from "../../../utils/waitFor"

export async function importWalletFromPrivateKey(
  page: Page,
  privateKey: string,
) {
  // Click account menu button
  await page.locator('[data-testid="account-menu-icon"]').click()

  // Click add account button in menu
  await page
    .locator('[data-testid="multichain-account-menu-popover-action-button"]')
    .click()

  // Click import account button
  await page
    .locator(
      ".multichain-account-menu-popover div.mm-box.mm-box--padding-4:nth-child(2) > div.mm-box:nth-child(2) > button",
    )
    .click()

  // Fill in private key input
  await page
    .locator(".multichain-account-menu-popover input#private-key-box")
    .fill(privateKey)

  // Click import button
  const importButton = page.locator(
    '[data-testid="import-account-confirm-button"]',
  )
  await importButton.click()

  // Wait for import button to disappear, indicating success
  const isImportButtonHidden = await waitForCondition(
    async () => importButton.isHidden(),
    1_000,
    false,
  )

  if (!isImportButtonHidden) {
    // If button still visible, get error message
    const errorText = await page
      .locator(
        ".multichain-account-menu-popover p.mm-form-text-field__help-text",
      )
      .textContent({
        timeout: 1_000,
      })

    throw new Error(`Importing private key failed due to error: ${errorText}`)
  }
}
