import { Page } from "@playwright/test"
import { BaseActionType } from "../../../src/wallets/BaseWallet"
import { CoinbaseWallet } from "../../../src/wallets/Coinbase"
import { MetaMask } from "../../../src/wallets/MetaMask"
import { PhantomWallet } from "../../../src/wallets/Phantom"

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

/**
 * Connects Coinbase wallet to the app
 * This represents the standard onboarding flow for first-time users
 *
 * @param page - The Playwright page object
 * @param coinbase - The Coinbase wallet instance
 */
export async function connectCoinbaseWallet(
  page: Page,
  coinbase: CoinbaseWallet,
): Promise<void> {
  // Open wallet connect modal
  await page.getByTestId("ockConnectButton").first().click()

  // Select Coinbase Wallet from wallet options
  await page
    .getByTestId("ockModalOverlay")
    .first()
    .getByRole("button", { name: "Coinbase Wallet" })
    .click()

  // Handle Coinbase wallet connection request
  await coinbase.handleAction(BaseActionType.CONNECT_TO_DAPP)
}

/**
 * Connects Phantom wallet to the app
 * This represents the standard onboarding flow for first-time users
 *
 * @param page - The Playwright page object
 * @param phantom - The Phantom wallet instance
 */
export async function connectPhantomWallet(
  page: Page,
  phantom: PhantomWallet,
): Promise<void> {
  // Open wallet connect modal
  await page.getByTestId("ockConnectButton").first().click()

  // Select Phantom Wallet from wallet options
  await page
    .getByTestId("ockModalOverlay")
    .first()
    .getByRole("button", { name: "Phantom" })
    .click()

  // Handle Phantom wallet connection request
  await phantom.handleAction(BaseActionType.CONNECT_TO_DAPP)
}
