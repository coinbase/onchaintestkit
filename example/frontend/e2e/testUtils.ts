import { Page } from "@playwright/test"

/**
 * Helper function to input transaction details in the send transaction form
 * @param page - The Playwright page object
 */
export async function inputTransactionDetails(page: Page) {
  // Only switch to Base Sepolia if the button is clickable (not already selected)
  const baseSpoliaButton = page.getByTestId("switch-to-base-sepolia")

  try {
    // Check if button is clickable by waiting for it to be enabled
    await baseSpoliaButton.waitFor({ state: "visible", timeout: 2000 })

    // Check if the button is not disabled
    const isDisabled = await baseSpoliaButton.isDisabled()
    if (isDisabled) {
      console.log("Base Sepolia already selected (button disabled)")
    } else {
      await baseSpoliaButton.click()
      console.log("Switched to Base Sepolia network")
    }
  } catch (_error) {
    console.log("Base Sepolia button not found or not clickable, continuing...")
  }

  // Input transaction address
  await page
    .getByTestId("send-address-input")
    .fill("0x83C2bbef5a09C4B46E049917a41E05fAf74b6275")

  // Input transaction amount
  await page.getByTestId("send-amount-input").fill("0.0001")

  // Send transaction button
  await page.getByTestId("send-transaction-button").click()
}
