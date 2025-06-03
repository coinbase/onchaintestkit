import { Page } from "@playwright/test"
import { NetworkConfig } from "../../../types"
import { addNetwork } from "./actions/addNetwork"
import { importWalletFromPrivateKey } from "./actions/importWalletFromPrivateKey"
// import { sendTokens } from "./actions/sendTokens"

export class HomePage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async addNetwork(network: NetworkConfig): Promise<void> {
    await addNetwork(this.page, network)
  }

  async importWalletFromPrivateKey(
    privateKey: string,
    password: string,
  ): Promise<void> {
    await importWalletFromPrivateKey(this.page, privateKey, password)
  }

  // async sendTokens(
  //   recipientAddress: string,
  //   amount: string,
  //   tokenSymbol?: string,
  // ): Promise<void> {
  //   await sendTokens(this.page, { recipientAddress, amount, tokenSymbol })
  // }

  async switchNetwork(networkName: string, isTestnet: boolean): Promise<void> {
    // TODO: Implement network switching for Coinbase
    // This should:
    // 1. Open network dropdown
    // 2. Select the network
    console.log(`Switching to network: ${networkName} (testnet: ${isTestnet})`)
  }

  async switchAccount(accountName: string): Promise<void> {
    // TODO: Implement account switching for Coinbase
    // This should:
    // 1. Open account dropdown
    // 2. Select the account
    console.log(`Switching to account: ${accountName}`)
  }

  async addNewAccount(accountName: string): Promise<void> {
    // TODO: Implement account creation for Coinbase
    // This should:
    // 1. Open account menu
    // 2. Click create account
    // 3. Set account name
    // 4. Save account
    console.log(`Creating new account: ${accountName}`)
  }
}
