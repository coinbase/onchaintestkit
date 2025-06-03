import type { Page } from "@playwright/test"

export async function addNewAccount(page: Page, accountName: string) {
  // Click account menu icon
  await page.locator('[data-testid="account-menu-icon"]').click()

  // Click add account button in menu
  await page
    .locator('[data-testid="multichain-account-menu-popover-action-button"]')
    .click()

  // Click add new account option
  await page
    .locator('[data-testid="multichain-account-menu-popover-add-account"]')
    .click()

  // Fill in account name in the popup
  await page.locator(".multichain-account-menu-popover input").fill(accountName)

  // Click create button
  await page
    .locator(".multichain-account-menu-popover button.mm-button-primary")
    .click()
}
