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
  SIGN_MESSAGE = "signMessage",
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

    const isCI =
      process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true"

    // Wait longer for extension to initialize in CI
    const initDelay = isCI ? 3000 : 1000
    await new Promise(resolve => setTimeout(resolve, initDelay))

    // Check if there's already a page with the extension loaded
    let phantomPage = context
      .pages()
      .find(page => page.url().includes(`chrome-extension://${extensionId}`))

    if (!phantomPage) {
      phantomPage = await context.newPage()
      // Wait for page to be ready
      await phantomPage.waitForLoadState("domcontentloaded", { timeout: 15000 })
    }

    // Validate page is still open before proceeding
    if (phantomPage.isClosed()) {
      throw new Error("Phantom extension page was closed during initialization")
    }

    // Check current URL to determine the state
    const currentUrl = phantomPage.url()
    console.log(`[Phantom Init] Current URL: ${currentUrl}`)

    // If we're on onboarding.html or about:blank, or no extension URL, try different approaches
    if (
      currentUrl.includes("onboarding.html") ||
      currentUrl === "about:blank" ||
      !currentUrl.includes(extensionId)
    ) {
      // First try the onboarding page since that's what Phantom shows initially
      const onboardingUrl = `chrome-extension://${extensionId}/onboarding.html`

      try {
        if (!phantomPage.isClosed()) {
          await phantomPage.goto(onboardingUrl, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          })

          if (!phantomPage.isClosed()) {
            await phantomPage.waitForLoadState("networkidle", {
              timeout: 15000,
            })
          }
        }
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
            if (phantomPage.isClosed()) {
              phantomPage = await context.newPage()
            }

            await phantomPage.goto(altUrl, {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            })

            if (!phantomPage.isClosed()) {
              await phantomPage.waitForLoadState("networkidle", {
                timeout: 15000,
              })
              loaded = true
              break
            }
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
        if (!phantomPage.isClosed()) {
          await phantomPage.waitForLoadState("networkidle", { timeout: 15000 })
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.warn("Warning: Could not wait for network idle:", errorMessage)
        // Continue anyway, the page might still be usable
      }
    }

    // Final validation that page is still open
    if (phantomPage.isClosed()) {
      throw new Error("Phantom extension page was closed after initialization")
    }

    // In CI, keep a "keeper" page open so the context never has zero pages
    // which can lead to context/browser shutdowns when the last page closes.
    if (isCI) {
      try {
        const hasNonExtensionPage = context
          .pages()
          .some(p => !p.url().startsWith("chrome-extension://"))
        if (!hasNonExtensionPage) {
          await context.newPage() // about:blank
        }
      } catch (e) {
        console.warn("[Phantom CI] Failed to create keeper page:", e)
      }
    }

    // Close any other pages (skip this cleanup in CI to keep keeper page alive)
    if (!isCI) {
      const pages = context.pages()
      for (const page of pages) {
        if (page !== phantomPage && !page.isClosed()) {
          try {
            await page.close()
          } catch (_error) {
            // Ignore errors when closing pages
          }
        }
      }
    }

    console.log(`[Phantom Init] Final URL: ${phantomPage.url()}`)
    return { phantomPage, phantomContext: context }
  }

  /**
   * Navigate to the main Phantom extension popup after onboarding
   */
  private async navigateToMainPopup(): Promise<void> {
    try {
      const popupUrl = `chrome-extension://${this.extensionId}/popup.html`

      // First, try to navigate the current page if it's still open
      try {
        if (!this.page.isClosed()) {
          await this.page.goto(popupUrl, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          })
          if (!this.page.isClosed()) {
            await this.page.waitForLoadState("networkidle", { timeout: 15000 })
            return
          }
        }
      } catch (_navigationError) {
        console.log("Current page navigation failed.")
      }

      // If current page is closed or navigation failed, find or create a new page
      const isCI =
        process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true"

      if (isCI) {
        // In CI, find the remaining extension page after onboarding closes the old one
        const pages = this.context.pages()
        const extensionPage = pages.find(p =>
          p.url().includes(`chrome-extension://${this.extensionId}/popup.html`),
        )

        if (extensionPage && !extensionPage.isClosed()) {
          this.page = extensionPage
          this.homePage = new HomePage(extensionPage)
          this.onboardingPage = new OnboardingPage(extensionPage)
          this.notificationPage = new NotificationPage(extensionPage)
          return
        }

        // If no popup.html page exists, look for any extension page
        const anyExtensionPage = pages.find(
          p =>
            p.url().includes(`chrome-extension://${this.extensionId}`) &&
            !p.isClosed(),
        )

        if (anyExtensionPage) {
          // Navigate this page to popup.html
          await anyExtensionPage.goto(popupUrl, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          })
          await anyExtensionPage.waitForLoadState("networkidle", {
            timeout: 15000,
          })

          this.page = anyExtensionPage
          this.homePage = new HomePage(anyExtensionPage)
          this.onboardingPage = new OnboardingPage(anyExtensionPage)
          this.notificationPage = new NotificationPage(anyExtensionPage)
          return
        }

        // FINAL CI FALLBACK: open a fresh page to the popup with retries
        const maxAttempts = 3
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const newPage = await this.context.newPage()
            await newPage.goto(popupUrl, {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            })
            if (!newPage.isClosed()) {
              await newPage.waitForLoadState("networkidle", { timeout: 15000 })
            }
            this.page = newPage
            this.homePage = new HomePage(newPage)
            this.onboardingPage = new OnboardingPage(newPage)
            this.notificationPage = new NotificationPage(newPage)
            return
          } catch (err) {
            console.warn(
              `[Phantom CI] Popup open attempt ${attempt} failed:`,
              err,
            )
            await new Promise(r => setTimeout(r, 1000 * attempt))
          }
        }
      }

      // Only in local/dev: create a new page
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
    } catch (error) {
      console.error(
        "Failed to navigate to main popup, but continuing in CI:",
        error,
      )
      // Do not throw in CI, just log and continue
      if (
        !(process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true")
      ) {
        throw new Error(`Could not navigate to Phantom main popup: ${error}`)
      }
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
        // Check if running in CI environment
        const isCI =
          process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true"

        // Get phantom extension path (assumes prepare-phantom.mjs was run first)
        const cacheDir = path.join(
          process.cwd(),
          "e2e",
          ".cache",
          "phantom-extension",
        )
        const phantomPath = path.join(cacheDir, `phantom-${PHANTOM_VERSION}`)

        // Verify extension files exist
        const fs = await import("fs")
        if (!fs.existsSync(phantomPath)) {
          throw new Error(
            `Phantom extension not found at ${phantomPath}. Run 'node src/cli/prepare-phantom.mjs' first.`,
          )
        }

        // Log extension path for debugging
        if (isCI) {
          console.log(`[Phantom CI] Extension path: ${phantomPath}`)
          console.log(
            `[Phantom CI] Extension exists: ${fs.existsSync(phantomPath)}`,
          )
        }

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

        // Add CI-specific arguments
        if (isCI) {
          browserArgs.push(
            "--disable-backgrounding-occluded-windows",
            "--disable-ipc-flooding-protection",
            "--disable-hang-monitor",
            "--disable-prompt-on-repost",
            "--disable-domain-reliability",
            "--disable-background-networking",
            "--metrics-recording-only",
            "--no-default-browser-check",
            "--disable-sync",
            "--disable-translate",
            "--disable-features=TranslateUI,BlinkGenPropertyTrees",
            "--remote-debugging-port=0", // Let Chrome assign a port
          )
        }

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

      // Account actions
      case PhantomSpecificActionType.ADD_ACCOUNT:
        await this.homePage.addNewAccount(
          additionalOptions.accountName as string,
          additionalOptions.privateKey as string,
          additionalOptions.chain as SupportedChain,
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

      case PhantomSpecificActionType.ENABLE_TEST_MODE:
        await this.homePage.enableTestMode()
        break

      case PhantomSpecificActionType.SIGN_MESSAGE:
        await this.notificationPage.signMessage(this.extensionId)
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
