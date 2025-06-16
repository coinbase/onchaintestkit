import { expect } from "@playwright/test"
import { createOnchainTest } from "../../../src/createOnchainTest"
import type { WebAuthnCredential } from "../../../src/wallets/Coinbase/PasskeyAuthenticator"
import { PasskeyAuthenticator } from "../../../src/wallets/Coinbase/PasskeyAuthenticator"
import { coinbaseWalletConfig } from "./walletConfig/coinbaseWalletConfig"
import { CoinbaseSpecificActionType } from "../../../src/wallets/Coinbase"

const test = createOnchainTest(coinbaseWalletConfig)

test.describe("Coinbase Smart Wallet - Passkey Registration", () => {
  test("should initialize virtual authenticator and have no credentials", async ({
    coinbase,
  }) => {
    if (!coinbase) throw new Error("Coinbase is not defined")
    // Manually initialize the authenticator for this test using the extension page
    coinbase.passkeyAuthenticator = new PasskeyAuthenticator(coinbase.walletPage)
    const authenticator = coinbase.passkeyAuthenticator
    await authenticator.initialize()
    const credentials = await authenticator.getCredentials()
    expect(Array.isArray(credentials)).toBe(true)
    expect(credentials.length).toBe(0)
  })

  test("should register a passkey via SmartWallet and find it in the authenticator", async ({
    page,
    coinbase,
  }) => {
    if (!coinbase) throw new Error("Coinbase is not defined")
    await page.goto("https://onchainkit.xyz/playground")
    await page.waitForLoadState("networkidle")
    const passkeyConfig = {
      name: "Minimal Test Passkey",
      rpId: "keys.coinbase.com",
      rpName: "Coinbase Smart Wallet",
      userId: "test-user-123",
      isUserVerified: true,
    }
    // 1. Click to open the first popup
    const [firstPopup] = await Promise.all([
      page.context().waitForEvent("page"),
      page.click("#wallet-type-smart"),
    ])
    await firstPopup.waitForLoadState("domcontentloaded")
    await firstPopup.waitForSelector('[data-testid="switch-to-scw-link"]', {
      timeout: 10000,
    })

    // 2. Use handleAction to perform registration (handles switch-to-scw-link and popup internally)
    await coinbase.handleAction(CoinbaseSpecificActionType.HANDLE_PASSKEY_POPUP, {
      mainPage: page,
      popup: firstPopup,
      passkeyAction: "register",
      passkeyConfig,
    })
    const authenticator = coinbase.passkeyAuthenticator
      ? coinbase.passkeyAuthenticator
      : coinbase.authenticator
    if (!authenticator) throw new Error("Authenticator is null after registration")
    const credentials = await authenticator.getCredentials()
    expect(
      credentials.some(
        (c: WebAuthnCredential) => c.rpId === "keys.coinbase.com",
      ),
    ).toBe(true)
  })

  test("should register a passkey and complete a transaction (layout only)", async ({
    page,
    coinbase,
  }) => {
    if (!coinbase) throw new Error("Coinbase is not defined")
    await page.goto("https://onchainkit.xyz/playground")
    await page.waitForLoadState("networkidle")
    const passkeyConfig = {
      name: "Minimal Test Passkey",
      rpId: "keys.coinbase.com",
      rpName: "Coinbase Smart Wallet",
      userId: "test-user-123",
      isUserVerified: true,
    }
    // 1. Click to open the first popup
    const [firstPopup] = await Promise.all([
      page.context().waitForEvent("page"),
      page.click("#wallet-type-smart"),
    ])
    await firstPopup.waitForLoadState("domcontentloaded")
    await firstPopup.waitForSelector('[data-testid="switch-to-scw-link"]', {
      timeout: 10000,
    })

    // 2. Use handleAction to perform registration (handles switch-to-scw-link and popup internally)
    await coinbase.handleAction(CoinbaseSpecificActionType.HANDLE_PASSKEY_POPUP, {
      mainPage: page,
      popup: firstPopup,
      passkeyAction: "register",
      passkeyConfig,
    })
    const authenticator = coinbase.passkeyAuthenticator
      ? coinbase.passkeyAuthenticator
      : coinbase.authenticator
    if (!authenticator) throw new Error("Authenticator is null after registration")
    const credentials = await authenticator.getCredentials()
    expect(
      credentials.some(
        (c: WebAuthnCredential) => c.rpId === "keys.coinbase.com",
      ),
    ).toBe(true)

    // Add a 3 second pause before clicking the combobox
    await page.waitForTimeout(3000)
    await page.locator('button[role="combobox"]:has-text("Base")').click()
    await page.getByRole("option", { name: "Base Sepolia" }).click()

    const [popup] = await Promise.all([
      page.context().waitForEvent("page"),
      page.locator('[data-testid="ockTransactionButton_Button"]').click(),
    ])

    // Wait for the popup to load
    await popup.waitForLoadState("domcontentloaded")

    // Use handleAction to approve the transaction with passkey
    await coinbase.handleAction(CoinbaseSpecificActionType.HANDLE_PASSKEY_POPUP, {
      popup,
      passkeyAction: "approve",
    })

    // Check for 'Successful' text on the main page after transaction
    await expect(
      page.getByTestId("ockToast").getByText("Successful"),
    ).toBeVisible({ timeout: 30000 })
  })

  //   test.only("sandbox onchainkit playground", async ({ page }) => {
  //     await page.goto("https://onchainkit.xyz/playground")
  //     await page.waitForLoadState("networkidle")
  //     // Pause for manual exploration
  //     await page.pause()
  //   })
})
