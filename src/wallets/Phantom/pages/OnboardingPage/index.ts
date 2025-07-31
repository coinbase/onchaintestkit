import { Page } from "@playwright/test"
import { importWallet as importWalletAction } from "./actions/importWallet"

export class OnboardingPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Imports a wallet using a seed phrase, password, and username
   * @param seedPhrase - The seed phrase to import
   * @param password - The password to set for the wallet
   * @param username - The username for the wallet
   */
  async importWallet(
    seedPhrase: string,
    password: string,
    username?: string,
  ): Promise<void> {
    await importWalletAction(this.page, seedPhrase, password, username)
  }
}
