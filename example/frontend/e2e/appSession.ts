import { Page } from "@playwright/test"
import { BaseActionType } from "@coinbase/onchain-test-kit"
import { MetaMask } from "@coinbase/onchain-test-kit/src/wallets/MetaMask"

/**
 * Connects MetaMask wallet to the app and accepts Terms of Service
 * This represents the standard onboarding flow for first-time users
 *
 * @param page - The Playwright page object
 * @param metamask - The MetaMask wallet instance
 */
export async function connectWallet(
  page: Page,
  metamask: MetaMask,
): Promise<void> {
  // Open wallet connect modal
  await page.getByTestId("ockConnectButton").first().click()

  // Select MetaMask from wallet options
  await page
    .getByTestId("ockModalOverlay")
    .first()
    .getByRole("button", { name: "MetaMask" })
    .click()

  // Handle MetaMask connection request
  await metamask.handleAction(BaseActionType.CONNECT_TO_DAPP)
}
