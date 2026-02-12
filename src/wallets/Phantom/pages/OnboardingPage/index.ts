import { Page } from '@playwright/test';
import type { SupportedChain } from '../../types';
import { importPrivateKey as importPrivateKeyAction } from './actions/importPrivateKey';
import { importWallet as importWalletAction } from './actions/importWallet';

export class OnboardingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Imports a wallet using a seed phrase, password, and username
   * @param seedPhrase - The seed phrase to import
   * @param password - The password to set for the wallet
   * @param username - The username for the wallet
   */
  async importWallet(seedPhrase: string, password: string, username?: string): Promise<void> {
    await importWalletAction(this.page, seedPhrase, password, username);
  }

  /**
   * Imports a wallet using a private key
   * @param privateKey - The private key to import
   * @param password - The password to set for the wallet
   * @param chain - The blockchain to use (defaults to "base")
   * @param name - The name for the private key
   */
  async importPrivateKey(
    privateKey: string,
    password: string,
    chain: SupportedChain = 'base',
    name?: string,
  ): Promise<void> {
    await importPrivateKeyAction(this.page, privateKey, password, chain, name);
  }
}
