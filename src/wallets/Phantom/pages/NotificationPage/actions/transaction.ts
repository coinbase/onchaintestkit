import type { Page } from "@playwright/test"

/**
 * Confirms a transaction in the Phantom Wallet notification popup
 * @param page - The notification page
 */
export const confirmTransaction = async (page: Page): Promise<void> => {
  // Wait for the transaction confirmation page to load
  await page.waitForLoadState("domcontentloaded")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(2000)
  await page.reload()

  // Wait for the primary confirm button and click it
  const confirmButton = page.getByTestId("primary-button")
  await confirmButton.waitFor({ state: "visible", timeout: 10000 })
  await confirmButton.click()


}

/**
 * Rejects a transaction in the Phantom Wallet notification popup
 * @param page - The notification page
 */
export const rejectTransaction = async (page: Page): Promise<void> => {
  // Wait for the transaction confirmation page to load
  await page.waitForLoadState("domcontentloaded")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
  await page.reload()

  // Wait for the secondary reject button and click it
  const rejectButton = page.getByTestId("secondary-button")
  await rejectButton.waitFor({ state: "visible", timeout: 10000 })
  await page.waitForTimeout(1000)
  await rejectButton.click()

}
