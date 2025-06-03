import { Page } from "@playwright/test"
import { addNetwork } from "./actions/addNetwork"
import { addNewAccount } from "./actions/addNewAccount"
import { importWalletFromPrivateKey } from "./actions/importWalletFromPrivateKey"
import { Network } from "../../type/Network"

export class HomePage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async addNetwork(network: Network): Promise<void> {
    await addNetwork(this.page, network)
  }

  async addNewAccount(accountName: string): Promise<void> {
    await addNewAccount(this.page, accountName)
  }

  async importWalletFromPrivateKey(privateKey: string): Promise<void> {
    await importWalletFromPrivateKey(this.page, privateKey)
  }

  async switchNetwork(networkName: string, isTestnet: boolean): Promise<void> {
    // Implementation would switch to the specified network
    console.log(`Switching to network: ${networkName}, isTestnet: ${isTestnet}`)
  }

  async switchAccount(accountName: string): Promise<void> {
    // Implementation would switch to the specified account
    console.log(`Switching to account: ${accountName}`)
  }
}
