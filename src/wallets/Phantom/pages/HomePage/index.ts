import { Page } from '@playwright/test';
import type { SupportedChain } from '../../types';
import { importPrivateKey } from '../OnboardingPage/actions/importPrivateKey';
import { addNewAccount as addNewAccountAction } from './actions/addNewAccount';
import { enableTestMode } from './actions/enableTestMode';
import { switchAccount as switchAccountAction } from './actions/switchAccount';

export class HomePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async importPrivateKey(
    privateKey: string,
    password: string,
    chain: SupportedChain = 'base',
    name?: string,
  ): Promise<void> {
    await importPrivateKey(this.page, privateKey, password, chain, name);
  }

  async switchAccount(accountName: string): Promise<void> {
    await switchAccountAction(this.page, accountName);
  }

  async addNewAccount(
    accountName: string,
    privateKey: string,
    chain: SupportedChain,
  ): Promise<void> {
    await addNewAccountAction(this.page, accountName, chain, privateKey);
  }

  async enableTestMode(): Promise<void> {
    await enableTestMode(this.page);
  }
}
