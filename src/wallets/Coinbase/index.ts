import type { BrowserContext, Page } from "@playwright/test"
import { chromium } from "@playwright/test"
import { getExtensionId } from "../../utils/extensionManager"
import {
  ActionApprovalType,
  ActionOptions,
  BaseActionType,
  BaseWallet,
} from "../BaseWallet"
import { syncStorage } from "../MetaMask/utils/syncStorage"
import { CoinbaseConfig } from "../types"
import { NetworkConfig } from "../types"
import { HomePage, NotificationPage, OnboardingPage } from "./pages"
import { setupCoinbase } from "./utils/prepareExtension"

// Extend BaseActionType with Coinbase-specific actions
export enum CoinbaseSpecificActionType {
  LOCK = "lock",
  UNLOCK = "unlock",
  ADD_TOKEN = "addToken",
  ADD_ACCOUNT = "addAccount",
  SWITCH_ACCOUNT = "switchAccount",
  ADD_NETWORK = "addNetwork",
  SEND_TOKENS = "sendTokens",
}

type CoinbaseActionType = BaseActionType | CoinbaseSpecificActionType

const NO_EXTENSION_ID_ERROR = new Error(
  "Coinbase Wallet extensionId is not set",
)

export class CoinbaseWallet extends BaseWallet {
  private readonly context: BrowserContext

  private readonly extensionId?: string

  public readonly config: CoinbaseConfig

  private readonly page: Page

  readonly onboardingPage: OnboardingPage

  readonly homePage: HomePage

  readonly notificationPage: NotificationPage

  constructor(
    walletConfig: CoinbaseConfig,
    context: BrowserContext,
    page: Page,
    extensionId?: string,
  ) {
    super()
    this.context = context
    this.extensionId = extensionId
    this.config = walletConfig
    this.page = page
    this.onboardingPage = new OnboardingPage(page)
    this.homePage = new HomePage(page)
    this.notificationPage = new NotificationPage(page)
  }

  static async initialize(
    currentContext: BrowserContext,
    contextPath: string,
    _walletConfig: CoinbaseConfig,
  ): Promise<{ coinbasePage: Page; coinbaseContext: BrowserContext }> {
    console.log("Initializing Coinbase Wallet extension...")

    // Create browser context with Coinbase extension
    const context = await CoinbaseWallet.createContext(contextPath)

    // Handle cookie and storage transfer if currentContext exists
    if (currentContext) {
      const { cookies, origins } = await currentContext.storageState()
      if (cookies) {
        await context.addCookies(cookies)
      }
      if (origins && origins.length > 0) {
        // @ts-expect-error - Type mismatch, but the syncStorage function can handle this
        await syncStorage(origins, context)
      }
    }

    // Wait for extension page to load and get extension ID
    const extensionId = await getExtensionId(
      context,
      "Coinbase Wallet extension",
    )
    console.log("Found Coinbase extension ID:", extensionId)

    // Get the extension page using the correct path from manifest.json
    const extensionUrl = `chrome-extension://${extensionId}/index.html?inPageRequest=false`
    console.log("Opening extension URL:", extensionUrl)

    const coinbasePage = await context.newPage()
    await coinbasePage.goto(extensionUrl, { waitUntil: "domcontentloaded" })

    // Wait for extension to be ready
    await coinbasePage.waitForLoadState("networkidle")
    console.log("Extension page loaded successfully")

    // Close any other pages
    const pages = context.pages()
    for (const page of pages) {
      if (page !== coinbasePage) {
        await page.close()
      }
    }

    return { coinbasePage, coinbaseContext: context }
  }

  static async createContext(
    contextPath: string,
    slowMo = 0,
  ): Promise<BrowserContext> {
    console.log("Starting context creation...")

    // Use retry logic to handle potential race conditions when setting up extension
    const MAX_RETRIES = 3
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `Retrying Coinbase setup (attempt ${
              attempt + 1
            }/${MAX_RETRIES})...`,
          )
        }

        const coinbasePath = await setupCoinbase()
        console.log("Coinbase extension prepared at:", coinbasePath)

        const browserArgs = [
          `--disable-extensions-except=${coinbasePath}`,
          "--enable-extensions",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--force-gpu-mem-available-mb=1024",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-features=IsolateOrigins,site-per-process", // Allow cross-origin iframes
        ]

        const context = await chromium.launchPersistentContext(contextPath, {
          headless: false,
          args: browserArgs,
          slowMo,
          viewport: { width: 1280, height: 800 },
          ignoreHTTPSErrors: true,
          acceptDownloads: true,
        })

        // Wait for extension to be ready
        await new Promise(resolve => setTimeout(resolve, 2000))
        return context
      } catch (error) {
        // If we failed at the setup stage
        if (attempt === MAX_RETRIES - 1) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          throw new Error(`Failed to setup Coinbase: ${errorMessage}`)
        }

        // Save error for potential retry
        lastError = error instanceof Error ? error : new Error(String(error))

        // Short delay before retry
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // If we reach here, all attempts failed
    throw lastError ?? new Error("Failed to create context after all retries")
  }

  async handleAction(
    action: CoinbaseActionType,
    options?: ActionOptions,
  ): Promise<void> {
    const { approvalType, ...additionalOptions } = options ?? {}

    if (!this.extensionId) {
      throw NO_EXTENSION_ID_ERROR
    }

    // Ensure we're on the extension page
    const extensionUrl = `chrome-extension://${this.extensionId}/index.html?inPageRequest=false`
    if (
      !this.page.url().startsWith(`chrome-extension://${this.extensionId}/`)
    ) {
      await this.page.goto(extensionUrl, { waitUntil: "domcontentloaded" })
      await this.page.waitForLoadState("networkidle")
    }

    switch (action) {
      // Basic setup actions
      case BaseActionType.IMPORT_WALLET_FROM_SEED:
        await this.onboardingPage.importWallet(
          additionalOptions.seedPhrase as string,
          additionalOptions.password as string,
        )
        break

      case BaseActionType.IMPORT_WALLET_FROM_PRIVATE_KEY:
        await this.homePage.importWalletFromPrivateKey(
          additionalOptions.privateKey as string,
          this.config.password as string,
        )
        break

      // Network actions
      case CoinbaseSpecificActionType.ADD_NETWORK:
        if (!additionalOptions.network) {
          throw new Error("Network options not provided for ADD_NETWORK action")
        }
        await this.homePage.addNetwork(
          additionalOptions.network as NetworkConfig,
        )
        break

      case BaseActionType.SWITCH_NETWORK:
        await this.homePage.switchNetwork(
          additionalOptions.networkName as string,
          additionalOptions.isTestnet as boolean,
        )
        break

      // Account actions
      case CoinbaseSpecificActionType.ADD_ACCOUNT:
        await this.homePage.addNewAccount(
          additionalOptions.accountName as string,
        )
        break

      case CoinbaseSpecificActionType.SWITCH_ACCOUNT:
        await this.homePage.switchAccount(
          additionalOptions.accountName as string,
        )
        break

      // Dapp actions
      case BaseActionType.CONNECT_TO_DAPP:
        await this.notificationPage.connectToDapp(this.extensionId)
        break

      // Transaction actions
      case BaseActionType.HANDLE_TRANSACTION:
        if (approvalType === ActionApprovalType.APPROVE) {
          await this.notificationPage.confirmTransaction(this.extensionId)
        } else {
          await this.notificationPage.rejectTransaction(this.extensionId)
        }
        break

      // Token permission actions
      case BaseActionType.CHANGE_SPENDING_CAP:
        if (approvalType === ActionApprovalType.APPROVE) {
          await this.notificationPage.approveTokenPermission(this.extensionId)
        } else {
          await this.notificationPage.rejectTokenPermission(this.extensionId)
        }
        break

      case BaseActionType.REMOVE_SPENDING_CAP:
        if (approvalType === ActionApprovalType.APPROVE) {
          await this.notificationPage.confirmSpendingCapRemoval(
            this.extensionId,
          )
        } else {
          await this.notificationPage.rejectSpendingCapRemoval(this.extensionId)
        }
        break

      case CoinbaseSpecificActionType.SEND_TOKENS:
        // TODO: Implement token sending
        // if (!additionalOptions.recipientAddress || !additionalOptions.amount) {
        //   throw new Error(
        //     "Recipient address and amount are required for sending tokens",
        //   )
        // }
        // await this.homePage.sendTokens(
        //   additionalOptions.recipientAddress as string,
        //   additionalOptions.amount as string,
        //   additionalOptions.tokenSymbol as string | undefined,
        // )
        throw new Error("sendTokens not implemented for Coinbase Wallet")

      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  }

  async identifyNotificationType(): Promise<string> {
    if (!this.extensionId) {
      throw NO_EXTENSION_ID_ERROR
    }
    return this.notificationPage.identifyNotificationType(this.extensionId)
  }
}

export * from "./fixtures"
