import { expect } from "@playwright/test"
import { createOnchainTest } from "../../../src/createOnchainTest"
import type { WebAuthnCredential } from "../../../src/wallets/Coinbase/PasskeyAuthenticator"
import { CoinbaseSmartWallet } from "../../../src/wallets/Coinbase/SmartWallet"
import { coinbaseWalletConfig } from "./walletConfig/coinbaseWalletConfig"

const test = createOnchainTest(coinbaseWalletConfig)

test.describe("Coinbase Smart Wallet - Passkey Registration", () => {
  test("should initialize virtual authenticator and have no credentials", async ({
    coinbase,
  }) => {
    if (!coinbase) throw new Error("Coinbase is not defined")
    // Instantiate the SmartWallet using the coinbase context and extension page
    const smartWallet = new CoinbaseSmartWallet(
      coinbase.walletContext,
      coinbase.walletPage,
    )
    const authenticator = smartWallet.authenticator
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
    // Instantiate the SmartWallet using the coinbase context and extension page
    const smartWallet = new CoinbaseSmartWallet(
      coinbase.walletContext,
      coinbase.walletPage,
    )
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

    // 2. Click the switch-to-scw-link in the first popup, and capture the second popup
    const [secondPopup] = await Promise.all([
      page.context().waitForEvent("page"),
      firstPopup.click('[data-testid="switch-to-scw-link"]'),
    ])
    await secondPopup.waitForLoadState("domcontentloaded")
    await secondPopup.waitForSelector('button:has-text("Create an account")', {
      timeout: 10000,
    })

    // 3. Pass the second popup to SmartWallet logic
    await smartWallet.registerPasskey(passkeyConfig, secondPopup)
    const authenticator = smartWallet.authenticator
    const credentials = await authenticator.getCredentials()
    expect(
      credentials.some(
        (c: WebAuthnCredential) => c.rpId === "keys.coinbase.com",
      ),
    ).toBe(true)

    // await page.pause()
  })

  test("should register a passkey and complete a transaction (layout only)", async ({
    page,
    coinbase,
  }) => {
    if (!coinbase) throw new Error("Coinbase is not defined")
    // Instantiate the SmartWallet using the coinbase context and extension page
    const smartWallet = new CoinbaseSmartWallet(
      coinbase.walletContext,
      coinbase.walletPage,
    )
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

    // 2. Click the switch-to-scw-link in the first popup, and capture the second popup
    const [secondPopup] = await Promise.all([
      page.context().waitForEvent("page"),
      firstPopup.click('[data-testid="switch-to-scw-link"]'),
    ])
    await secondPopup.waitForLoadState("domcontentloaded")
    await secondPopup.waitForSelector('button:has-text("Create an account")', {
      timeout: 10000,
    })

    // 3. Register passkey in the second popup
    await smartWallet.registerPasskey(passkeyConfig, secondPopup)
    const authenticator = smartWallet.authenticator
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

    // Use the smartWallet's method to approve the transaction with passkey
    await smartWallet.approveTransactionWithPasskey(popup)

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
