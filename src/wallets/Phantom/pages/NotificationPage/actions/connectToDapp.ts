import { Page } from "@playwright/test"

/**
 * Handles the connect to dapp notification in Phantom Wallet
 *
 * @param page - The Playwright page object representing the notification page
 */
export async function connectToDapp(page: Page): Promise<void> {
  // Wait for the notification to appear
  await page.waitForLoadState("domcontentloaded")
  await page.waitForLoadState("networkidle")
  await page.reload()
  await page.waitForTimeout(1500)
  await page.getByTestId("primary-button").click()

  // For now, just wait a bit to simulate the action
  //   await page.waitForEvent("close")
}
