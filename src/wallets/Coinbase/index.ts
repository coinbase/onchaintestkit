import type { BrowserContext, Page } from "@playwright/test"
import { ActionOptions, BaseActionType, BaseWallet } from "../BaseWallet"
import type { WalletConfig } from "./types"

// Extend BaseActionType with Coinbase-specific actions
export enum CoinbaseSpecificActionType {
  LOCK = "lock",
  UNLOCK = "unlock",
  ADD_TOKEN = "addToken",
  ADD_ACCOUNT = "addAccount",
  SWITCH_ACCOUNT = "switchAccount",
  ADD_NETWORK = "addNetwork",
}

type CoinbaseActionType = BaseActionType | CoinbaseSpecificActionType

const _NO_EXTENSION_ID_ERROR = new Error(
  "Coinbase Wallet extensionId is not set",
)

export class CoinbaseWallet extends BaseWallet {
  private readonly context: BrowserContext

  private readonly extensionId?: string

  private readonly walletConfig: WalletConfig

  private readonly page: Page

  constructor(
    walletConfig: WalletConfig,
    context: BrowserContext,
    page: Page,
    extensionId?: string,
  ) {
    super()
    this.context = context
    this.extensionId = extensionId
    this.walletConfig = walletConfig
    this.page = page
  }

  static async initialize(
    _currentContext: BrowserContext,
    _contextPath: string,
    _walletConfig: WalletConfig,
  ): Promise<CoinbaseWallet> {
    // TODO: Implement initialization logic similar to MetaMask
    // This should handle:
    // 1. Setting up the extension
    // 2. Getting the extension ID
    // 3. Creating necessary pages
    // 4. Returning a new instance
    throw new Error("Not implemented")
  }

  async handleAction(
    _actionType: CoinbaseActionType,
    _options?: ActionOptions,
  ): Promise<void> {
    // TODO: Implement action handling logic
    throw new Error("Not implemented")
  }
}

export * from "./fixtures"
