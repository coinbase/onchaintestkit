import { Page } from "@playwright/test"
import { importPrivateKey as importPrivateKeyAction } from "./actions/importPrivateKey"
import { importWallet as importWalletAction } from "./actions/importWallet"

export class OnboardingPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Imports a wallet using a seed phrase and password
   * @param seedPhrase - The seed phrase to import
   * @param password - The password to set for the wallet
   */
  async importWallet(seedPhrase: string, password: string): Promise<void> {
    await importWalletAction(this.page, seedPhrase, password)
  }

  /**
   * Imports a wallet using a private key and password during onboarding
   * @param privateKey - The private key to import
   * @param password - The password to set for the wallet
   */
  async importPrivateKey(privateKey: string, password: string): Promise<void> {
    await importPrivateKeyAction(this.page, privateKey, password)
  }
}
