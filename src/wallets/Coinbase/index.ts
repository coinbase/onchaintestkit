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
import {
  PasskeyAuthenticator,
  WebAuthnCredential,
} from "./PasskeyAuthenticator"
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
  HANDLE_PASSKEY_POPUP = "handlePasskeyPopup",
}

type CoinbaseActionType = BaseActionType | CoinbaseSpecificActionType

const NO_EXTENSION_ID_ERROR = new Error(
  "Coinbase Wallet extensionId is not set",
)

export type PasskeyConfig = {
  name: string
  rpId: string
  rpName: string
  userId: string
  isUserVerified?: boolean
}

export class CoinbaseWallet extends BaseWallet {
  private readonly context: BrowserContext

  private readonly extensionId?: string

  public readonly config: CoinbaseConfig

  private readonly page: Page

  readonly onboardingPage: OnboardingPage

  readonly homePage: HomePage

  readonly notificationPage: NotificationPage

  // Passkey authenticator state
  public passkeyAuthenticator: PasskeyAuthenticator | null = null
  public passkeyCredentials: WebAuthnCredential[] = []
  public get authenticator(): PasskeyAuthenticator | null {
    return this.passkeyAuthenticator
  }

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

  /**
   * Handle a passkey popup for registration or authentication.
   * For registration, receives the main page and the first popup, clicks the switch link, waits for the second popup, and registers there.
   * For approve, receives the transaction popup directly.
   * @param mainPage The Playwright Page for the main dapp (only needed for registration)
   * @param popup The Playwright Page for the popup (first popup for registration, transaction popup for approve)
   * @param action 'register' or 'approve'
   * @param config PasskeyConfig (required for 'register')
   */
  async handlePasskeyPopup(
    mainPageOrPopup: Page,
    popup: Page,
    action:
      | "registerWithCBExtension"
      | "registerWithSmartWalletSDK"
      | "signMessage"
      | "approve",
    config?: PasskeyConfig,
  ): Promise<void> {
    if (action === "registerWithCBExtension") {
      // Registration: popup is the first popup, need to click switch and wait for second popup
      const firstPopup = popup
      // Click the switch-to-scw-link and wait for the second popup
      const [secondPopup] = await Promise.all([
        mainPageOrPopup.context().waitForEvent("page"),
        firstPopup.click('[data-testid="switch-to-scw-link"]'),
      ])
      await secondPopup.waitForLoadState("domcontentloaded")
      await secondPopup.waitForSelector(
        'button:has-text("Create an account")',
        {
          timeout: 10000,
        },
      )
      if (this.passkeyAuthenticator) {
        await this.passkeyAuthenticator.setPage(secondPopup)
      } else {
        this.passkeyAuthenticator = new PasskeyAuthenticator(secondPopup)
      }
      if (!config) throw new Error("PasskeyConfig required for registration")
      await this.passkeyAuthenticator.initialize({
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: config.isUserVerified ?? true,
        automaticPresenceSimulation: true,
      })
      await this.passkeyAuthenticator.simulateSuccessfulPasskeyInput(
        async () => {
          await secondPopup
            .locator('button:has-text("Create an account")')
            .click()
          await secondPopup
            .locator('[data-testid="passkey-name-input"]')
            .fill(config.name)
          await secondPopup.locator('[data-testid="continue-button"]').click()
        },
      )
      this.passkeyCredentials =
        await this.passkeyAuthenticator.exportCredentials()
    } else if (action === "registerWithSmartWalletSDK") {
      // Registration with SDK: use the first popup directly, no switch-to-scw-link click
      const sdkPopup = popup
      await sdkPopup.waitForLoadState("domcontentloaded")
      await sdkPopup.waitForSelector('button:has-text("Create an account")', {
        timeout: 10000,
      })
      if (this.passkeyAuthenticator) {
        await this.passkeyAuthenticator.setPage(sdkPopup)
      } else {
        this.passkeyAuthenticator = new PasskeyAuthenticator(sdkPopup)
      }
      if (!config) throw new Error("PasskeyConfig required for registration")
      await this.passkeyAuthenticator.initialize({
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: config.isUserVerified ?? true,
        automaticPresenceSimulation: true,
      })
      await this.passkeyAuthenticator.simulateSuccessfulPasskeyInput(
        async () => {
          await sdkPopup.locator('button:has-text("Create an account")').click()
          await sdkPopup
            .locator('[data-testid="passkey-name-input"]')
            .fill(config.name)
          await sdkPopup.locator('[data-testid="continue-button"]').click()
        },
      )
      this.passkeyCredentials =
        await this.passkeyAuthenticator.exportCredentials()
    } else if (action === "signMessage") {
      const signPopup = popup
      await signPopup.waitForLoadState("domcontentloaded")

      // Wait for the popup to reach the expected URL
      const expectedUrl = "https://keys.coinbase.com/sign/personal-sign"
      let currentUrl = await signPopup.url()
      if (!String(currentUrl).startsWith(expectedUrl)) {
        await signPopup.waitForURL(url => String(url).startsWith(expectedUrl), {
          timeout: 15000,
        })
        currentUrl = await signPopup.url()
      }

      if (this.passkeyAuthenticator) {
        await this.passkeyAuthenticator.setPage(signPopup)
      } else {
        this.passkeyAuthenticator = new PasskeyAuthenticator(signPopup)
      }
      if (!config) throw new Error("PasskeyConfig required for signMessage")
      await this.passkeyAuthenticator.initialize({
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: config.isUserVerified ?? true,
        automaticPresenceSimulation: true,
      })
      for (const cred of this.passkeyCredentials) {
        await this.passkeyAuthenticator.importCredential(cred)
      }
      await popup.waitForLoadState("domcontentloaded")
      await popup.waitForLoadState("networkidle")

      await this.passkeyAuthenticator.simulateSuccessfulPasskeyInput(
        async () => {
          await signPopup.waitForLoadState("domcontentloaded")
          await signPopup.locator('[data-testid="button-1"]').click()
        },
      )
    } else if (action === "approve") {
      // Approve: popup is the transaction popup

      if (this.passkeyAuthenticator) {
        await this.passkeyAuthenticator.setPage(popup)
      } else {
        this.passkeyAuthenticator = new PasskeyAuthenticator(popup)
      }
      // Wait for the popup to reach the expected URL
      const expectedUrls = [
        "https://keys.coinbase.com/sign/wallet-send-calls",
        "https://keys.coinbase.com/sign/eth-send-transaction",
      ]
      let currentUrl = await popup.url()
      if (!expectedUrls.some(prefix => String(currentUrl).startsWith(prefix))) {
        await popup.waitForURL(
          url => expectedUrls.some(prefix => String(url).startsWith(prefix)),
          { timeout: 15000 },
        )

        currentUrl = await popup.url()
      }
      await this.passkeyAuthenticator.initialize({
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      })
      // Import credentials from registration
      for (const cred of this.passkeyCredentials) {
        await this.passkeyAuthenticator.importCredential(cred)
      }
      await popup.waitForLoadState("domcontentloaded")
      await popup.waitForLoadState("networkidle")
      await this.passkeyAuthenticator.simulateSuccessfulPasskeyInput(
        async () => {
          await popup
            .locator('[data-testid="approve-transaction-button"]')
            .click()
        },
      )
    } else {
      throw new Error(`Unknown passkey popup action: ${action}`)
    }
  }

  async handleAction(
    action: CoinbaseActionType,
    options?: ActionOptions,
  ): Promise<void> {
    const { approvalType, ...additionalOptions } = options ?? {}

    if (!this.extensionId) {
      throw NO_EXTENSION_ID_ERROR
    }

    // Passkey popup handling
    if (action === CoinbaseSpecificActionType.HANDLE_PASSKEY_POPUP) {
      // expects: options.mainPage, options.popup, options.passkeyAction, options.passkeyConfig
      const mainPage = additionalOptions.mainPage as Page
      const popup = additionalOptions.popup as Page
      const passkeyAction = additionalOptions.passkeyAction as
        | "registerWithCBExtension"
        | "registerWithSmartWalletSDK"
        | "signMessage"
        | "approve"
      const passkeyConfig = additionalOptions.passkeyConfig as
        | PasskeyConfig
        | undefined
      await this.handlePasskeyPopup(
        mainPage,
        popup,
        passkeyAction,
        passkeyConfig,
      )
      return
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

  async identifyNotificationType(
    page: import("@playwright/test").Page,
  ): Promise<string> {
    return this.notificationPage.identifyNotificationType(page)
  }

  // Public getters for SmartWallet integration
  get walletContext(): BrowserContext {
    return this.context
  }

  get walletPage(): Page {
    return this.page
  }

  get walletExtensionId(): string | undefined {
    return this.extensionId
  }
}

export * from "./fixtures"
