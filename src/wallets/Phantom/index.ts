import path from "node:path"
import type { BrowserContext, Page } from "@playwright/test"
import { chromium } from "@playwright/test"
import { getExtensionId } from "../../utils/extensionManager"
import {
  ActionApprovalType,
  ActionOptions,
  BaseActionType,
  BaseWallet,
} from "../BaseWallet"
import { PhantomConfig } from "../types"
import { NetworkConfig } from "../types"
import { HomePage, NotificationPage, OnboardingPage } from "./pages"
import type { SupportedChain } from "./types"

// Extend BaseActionType with Phantom-specific actions
export enum PhantomSpecificActionType {
  LOCK = "lock",
  UNLOCK = "unlock",
  ADD_TOKEN = "addToken",
  ADD_ACCOUNT = "addAccount",
  SWITCH_ACCOUNT = "switchAccount",
  ADD_NETWORK = "addNetwork",
  SEND_TOKENS = "sendTokens",
  SWITCH_BLOCKCHAIN = "switchBlockchain",
  ENABLE_TEST_MODE = "enableTestMode",
}

type PhantomActionType = BaseActionType | PhantomSpecificActionType

const WALLET_CONNECTION_ERROR = new Error(
  "Phantom Wallet extension connection not established",
)
const PHANTOM_VERSION = "25.27.0"

export class PhantomWallet extends BaseWallet {
  private readonly context: BrowserContext

  private readonly extensionId?: string

  public readonly config: PhantomConfig

  private page: Page

  private onboardingPage: OnboardingPage

  private homePage: HomePage

  private notificationPage: NotificationPage

  get browserContext(): BrowserContext {
    return this.context
  }

  constructor(
    walletConfig: PhantomConfig,
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
    _walletConfig: PhantomConfig,
  ): Promise<{ phantomPage: Page; phantomContext: BrowserContext }> {
    // Create browser context with Phantom extension
    const context = await PhantomWallet.createContext(contextPath)

    // Handle cookie and storage transfer if currentContext exists
    if (currentContext) {
      const { cookies } = await currentContext.storageState()
      if (cookies) {
        await context.addCookies(cookies)
      }
    }

    // Wait for extension page to load and get extension ID
    const extensionId = await getExtensionId(context, "Phantom")

    // Wait a bit more for extension to initialize
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if there's already a page with the extension loaded
    let phantomPage = context
      .pages()
      .find(page => page.url().includes(`chrome-extension://${extensionId}`))

    if (!phantomPage) {
      phantomPage = await context.newPage()
      // Wait for page to be ready
      await phantomPage.waitForLoadState("domcontentloaded")
    }

    // Check current URL to determine the state
    const currentUrl = phantomPage.url()

    // If we're on onboarding.html or about:blank, or no extension URL, try different approaches
    if (
      currentUrl.includes("onboarding.html") ||
      currentUrl === "about:blank" ||
      !currentUrl.includes(extensionId)
    ) {
      // First try the onboarding page since that's what Phantom shows initially
      const onboardingUrl = `chrome-extension://${extensionId}/onboarding.html`

      try {
        await phantomPage.goto(onboardingUrl, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        })
        await phantomPage.waitForLoadState("networkidle", { timeout: 10000 })
      } catch (error) {
        console.error("Failed to load onboarding page:", error)

        // Try other URLs as fallback
        const altUrls = [
          `chrome-extension://${extensionId}/popup.html`,
          `chrome-extension://${extensionId}/index.html`,
        ]

        let loaded = false
        for (const altUrl of altUrls) {
          try {
            await phantomPage.goto(altUrl, {
              waitUntil: "domcontentloaded",
              timeout: 10000,
            })
            await phantomPage.waitForLoadState("networkidle", {
              timeout: 10000,
            })
            loaded = true
            break
          } catch (altError) {
            const errorMessage =
              altError instanceof Error ? altError.message : String(altError)
            console.error(`Alternative URL ${altUrl} failed:`, errorMessage)
          }
        }

        if (!loaded) {
          throw new Error(
            "Failed to load Phantom extension. Tried multiple URLs including onboarding.",
          )
        }
      }
    } else {
      // Already on a phantom extension page, just wait for it to be ready
      try {
        await phantomPage.waitForLoadState("networkidle", { timeout: 10000 })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.warn("Warning: Could not wait for network idle:", errorMessage)
        // Continue anyway, the page might still be usable
      }
    }

    // Close any other pages
    const pages = context.pages()
    for (const page of pages) {
      if (page !== phantomPage) {
        await page.close()
      }
    }

    return { phantomPage, phantomContext: context }
  }

  /**
   * Navigate to the main Phantom extension popup after onboarding
   */
  private async navigateToMainPopup(): Promise<void> {
    try {
      const popupUrl = `chrome-extension://${this.extensionId}/popup.html`
      try {
        if (this.page.isClosed()) {
          console.log("Phantom main popup already closed, skipping navigation.")
          return
        }

        await this.page.goto(popupUrl, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        })
        if (this.page.isClosed()) {
          console.log(
            "Phantom main popup closed after goto, skipping waitForLoadState.",
          )
          return
        }

        await this.page.waitForLoadState("networkidle", { timeout: 15000 })
        return
      } catch (_navigationError) {
        console.log("Current page navigation failed.")
      }

      // Only try to create a new page if not in CI
      const isCI =
        process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true"
      if (isCI) {
        console.log(
          "Skipping new tab creation in CI environment; using current page as fallback.",
        )
      } else {
        const newPage = await this.context.newPage()
        await newPage.goto(popupUrl, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        })
        if (newPage.isClosed()) {
          console.log(
            "Phantom main popup closed after newPage.goto, skipping waitForLoadState.",
          )
          return
        }

        await newPage.waitForLoadState("networkidle", { timeout: 15000 })
        this.page = newPage
        this.homePage = new HomePage(newPage)
        this.onboardingPage = new OnboardingPage(newPage)
        this.notificationPage = new NotificationPage(newPage)
        return
      }
    } catch (error) {
      console.error("Failed to navigate to main popup, but continuing:", error)
      // Never throw, just log and continue
      return
    }
  }

  static async createContext(
    contextPath: string,
    slowMo = 0,
  ): Promise<BrowserContext> {
    // Use retry logic to handle potential race conditions when setting up extension
    const MAX_RETRIES = 3
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Get phantom extension path (assumes prepare-phantom.mjs was run first)
        const cacheDir = path.join(
          process.cwd(),
          "e2e",
          ".cache",
          "phantom-extension",
        )
        const phantomPath = path.join(cacheDir, `phantom-${PHANTOM_VERSION}`)

        const browserArgs = [
          `--disable-extensions-except=${phantomPath}`,
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
          "--disable-web-security", // Help with extension loading
          "--disable-features=VizDisplayCompositor", // Reduce resource usage
        ]

        const context = await chromium.launchPersistentContext(contextPath, {
          headless: false,
          args: browserArgs,
          slowMo,
          viewport: { width: 1280, height: 800 },
          ignoreHTTPSErrors: true,
          acceptDownloads: true,
          // Add timeout to help with context creation
          timeout: 30000,
        })

        // Wait for extension to be ready with longer delay
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Verify context is still open
        if (context.pages().length === 0) {
          throw new Error("Browser context closed immediately after creation")
        }

        return context
      } catch (error) {
        // If we failed at the setup stage
        if (attempt === MAX_RETRIES - 1) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          throw new Error(`Failed to setup Phantom: ${errorMessage}`)
        }

        // Save error for potential retry
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`Attempt ${attempt + 1} failed:`, lastError.message)

        // Short delay before retry with increasing backoff
        const delay = (attempt + 1) * 2000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // If we reach here, all attempts failed
    throw lastError ?? new Error("Failed to create context after all retries")
  }

  async handleAction(
    action: PhantomActionType,
    options?: ActionOptions,
  ): Promise<void> {
    const { approvalType, ...additionalOptions } = options ?? {}

    if (!this.extensionId) {
      throw WALLET_CONNECTION_ERROR
    }

    switch (action) {
      // Basic setup actions
      case BaseActionType.IMPORT_WALLET_FROM_SEED:
        await this.onboardingPage.importWallet(
          additionalOptions.seedPhrase as string,
          additionalOptions.password as string,
          additionalOptions.username as string,
        )
        // After import, navigate to main extension popup
        await this.navigateToMainPopup()
        break

      case BaseActionType.IMPORT_WALLET_FROM_PRIVATE_KEY:
        await this.onboardingPage.importPrivateKey(
          additionalOptions.privateKey as string,
          this.config.password as string,
          (additionalOptions.chain as SupportedChain) || "base",
          additionalOptions.name as string,
        )
        await this.navigateToMainPopup()

        break

      // Network actions
      case PhantomSpecificActionType.ADD_NETWORK:
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
      case PhantomSpecificActionType.ADD_ACCOUNT:
        await this.homePage.addNewAccount(
          additionalOptions.accountName as string,
        )
        break

      case PhantomSpecificActionType.SWITCH_ACCOUNT:
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

      case PhantomSpecificActionType.SEND_TOKENS:
        // TODO: Implement token sending for Phantom
        throw new Error("sendTokens not implemented for Phantom Wallet")

      case PhantomSpecificActionType.SWITCH_BLOCKCHAIN:
        // TODO: Implement blockchain switching for Phantom (Solana/Ethereum)
        console.log("Blockchain switching for Phantom not yet implemented")
        break

      case PhantomSpecificActionType.ENABLE_TEST_MODE:
        await this.homePage.enableTestMode()
        break

      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  }

  // Public getters for integration
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
