import type { BrowserContext, Page } from "@playwright/test"
import {
  PasskeyAuthenticator,
  WebAuthnCredential,
} from "./PasskeyAuthenticator"

export type PasskeyConfig = {
  name: string
  rpId: string
  rpName: string
  userId: string
  isUserVerified?: boolean
}

export class CoinbaseSmartWallet {
  private readonly context: BrowserContext
  private readonly page: Page
  public authenticator: PasskeyAuthenticator
  private credentials: WebAuthnCredential[] = []

  constructor(context: BrowserContext, page: Page) {
    this.context = context
    this.page = page
    this.authenticator = new PasskeyAuthenticator(page)
  }

  async registerPasskey(config: PasskeyConfig, popup: Page): Promise<void> {
    await this.authenticator.setPage(popup)
    await this.authenticator.initialize({
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: config.isUserVerified ?? true,
      automaticPresenceSimulation: true,
    })
    await this.authenticator.simulateSuccessfulPasskeyInput(async () => {
      await popup.locator('button:has-text("Create an account")').click()
      await popup
        .locator('[data-testid="passkey-name-input"]')
        .fill(config.name)
      await popup.locator('[data-testid="continue-button"]').click()
    })
    this.credentials = await this.authenticator.exportCredentials()
  }

  async approveTransactionWithPasskey(popup: Page): Promise<void> {
    const expectedUrl = "https://keys.coinbase.com/sign/wallet-send-calls"
    let currentUrl = await popup.url()
    if (currentUrl !== expectedUrl) {
      await popup.waitForURL(expectedUrl, { timeout: 15000 })
      currentUrl = await popup.url()
    }
    await this.authenticator.setPage(popup)
    await this.authenticator.initialize({
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    })
    for (const cred of this.credentials) {
      await this.authenticator.importCredential(cred)
    }
    await popup.waitForLoadState("domcontentloaded")
    await popup.waitForLoadState("networkidle")
    await this.authenticator.simulateSuccessfulPasskeyInput(async () => {
      await popup.locator('[data-testid="approve-transaction-button"]').click()
    })
  }
}
