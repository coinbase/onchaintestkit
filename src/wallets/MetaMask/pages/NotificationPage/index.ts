import type { Page } from "@playwright/test"
import { type ViewportSize, waitForPage } from "../../../../utils"
import {
  approvePermission,
  connectToDapp,
  network,
  token,
  transaction,
} from "./actions"
import { spendingCapRemoval } from "./actions/spendingCap"

export enum NotificationPageType {
  SpendingCap = "spending-cap",
  Signature = "signature",
  Transaction = "transaction",
  RemoveSpendCap = "remove-spend-cap",
}

// Constants for MetaMask notification page
const NOTIFICATION_PAGE_PATH = "notification.html"
const DEFAULT_VIEWPORT: ViewportSize = { width: 360, height: 580 }

// Max time to wait for a notification popup before giving up.
// waitForPage can hang forever due to a race condition: the popup opens
// between the context.pages() check and the waitForEvent('page') listener,
// so the event is never fired. This timeout prevents burning the entire
// 300s test timeout on a single waitForPage call.
const WAIT_FOR_PAGE_TIMEOUT_MS = 15_000

export class NotificationPage {
  readonly page: Page

  // Cached notification page from identifyNotificationType so the
  // immediately-following action handler can reuse it instead of doing
  // a second waitForPage lookup (which risks grabbing a stale page on CI).
  private cachedNotificationPage: Page | null = null

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Helper method to get notification page URL
   */
  private getNotificationUrl(extensionId: string): string {
    return `chrome-extension://${extensionId}/${NOTIFICATION_PAGE_PATH}`
  }

  /**
   * Helper method to wait for notification page.
   * Reuses the cached page from identifyNotificationType if still alive.
   *
   * Wraps waitForPage with a timeout so a hung lookup doesn't burn the
   * entire 300s test timeout. waitForPage itself handles the TOCTOU race
   * (event listener + polling), and action handlers now wait for page
   * close so stale pages are no longer in context.pages().
   */
  private async getNotificationPage(extensionId: string): Promise<Page> {
    if (
      this.cachedNotificationPage &&
      !this.cachedNotificationPage.isClosed()
    ) {
      try {
        await this.cachedNotificationPage.evaluate(() => document.readyState)
        const cached = this.cachedNotificationPage
        this.cachedNotificationPage = null
        return cached
      } catch {
        this.cachedNotificationPage = null
      }
    }

    const targetUrl = this.getNotificationUrl(extensionId)
    const context = this.page.context()

    // waitForPage with a safety timeout. If waitForPage errors (e.g.
    // "Target page closed"), swallow it and let the timeout reject instead.
    const page = await Promise.race([
      waitForPage(context, targetUrl, DEFAULT_VIEWPORT).catch(
        () => new Promise<Page>(() => {}),
      ),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Notification page not found after ${WAIT_FOR_PAGE_TIMEOUT_MS}ms. ` +
                  `The MetaMask popup may not have appeared. URL: ${targetUrl}`,
              ),
            ),
          WAIT_FOR_PAGE_TIMEOUT_MS,
        ),
      ),
    ])

    await page.waitForLoadState("domcontentloaded").catch(() => {})
    await page.setViewportSize(DEFAULT_VIEWPORT).catch(() => {})
    return page
  }

  async connectToDapp(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await connectToDapp(notificationPage)
  }

  async approveNewNetwork(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await network.approveNewNetwork(notificationPage)
  }

  async rejectNewNetwork(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await network.rejectNewNetwork(notificationPage)
  }

  async approveSwitchNetwork(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await network.approveSwitchNetwork(notificationPage)
  }

  async rejectSwitchNetwork(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await network.rejectSwitchNetwork(notificationPage)
  }

  async approveAddNetwork(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await network.approveNewNetwork(notificationPage)
  }

  async rejectAddNetwork(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await network.rejectNewNetwork(notificationPage)
  }

  /**
   * Run an action on the notification page with a single retry.
   * If the first attempt fails with "Target page, context or browser has been
   * closed", waits 1 second for the stale page to detach, then looks for a
   * fresh notification page directly in context.pages().
   *
   * The retry does NOT use waitForPage because its waitForEvent('page')
   * fallback hangs forever — MetaMask reuses popups rather than opening
   * new page events.
   */
  private async withRetry(
    extensionId: string,
    action: (page: Page) => Promise<void>,
  ): Promise<void> {
    const notificationPage = await this.getNotificationPage(extensionId)
    try {
      await action(notificationPage)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (!msg.includes("Target page, context or browser has been closed")) {
        throw error
      }

      console.log("Notification page was stale, retrying with fresh page...")
      await new Promise(r => setTimeout(r, 1000))

      const targetUrl = this.getNotificationUrl(extensionId)
      const freshPage = this.page
        .context()
        .pages()
        .filter(p => !p.isClosed() && p.url().includes(targetUrl))
        .pop()

      if (!freshPage) {
        throw new Error(
          `Notification page was stale and no fresh page found after retry. Original error: ${msg}`,
        )
      }

      await freshPage.waitForLoadState("domcontentloaded").catch(() => {})
      await freshPage.setViewportSize(DEFAULT_VIEWPORT).catch(() => {})
      await action(freshPage)
    }
  }

  async confirmTransaction(extensionId: string) {
    await this.withRetry(extensionId, p => transaction.confirm(p))
  }

  async rejectTransaction(extensionId: string) {
    await this.withRetry(extensionId, p => transaction.reject(p))
  }

  async approveTokenPermission(extensionId: string) {
    await this.withRetry(extensionId, p => approvePermission.approve(p))
  }

  async rejectTokenPermission(extensionId: string) {
    await this.withRetry(extensionId, p => approvePermission.reject(p))
  }

  async confirmSpendingCapRemoval(extensionId: string) {
    await this.withRetry(extensionId, p => spendingCapRemoval.confirm(p))
  }

  async rejectSpendingCapRemoval(extensionId: string) {
    await this.withRetry(extensionId, p => spendingCapRemoval.reject(p))
  }

  async addNewToken(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await token.addNew(notificationPage)
  }

  async identifyNotificationType(
    extensionId: string,
    globalTimeout = 15000,
    pollInterval = 500,
  ): Promise<NotificationPageType> {
    // Get the notification page via a fresh lookup (bypass cache)
    // so we always get the latest notification popup, then cache it for the
    // action handler that runs immediately after this returns.
    // Uses getNotificationPage which has a built-in timeout to avoid
    // hanging on the waitForPage race condition.
    this.cachedNotificationPage = null // clear cache to force fresh lookup
    const notificationPage = await this.getNotificationPage(extensionId)
    this.cachedNotificationPage = notificationPage

    // Give the page an extra moment to fully render and stabilize.
    // Use a page-independent timeout — notificationPage.waitForTimeout()
    // throws if the page has already closed.
    await new Promise(r => setTimeout(r, 500))

    const checks = [
      { type: NotificationPageType.SpendingCap, text: "Spending cap request" },
      { type: NotificationPageType.Signature, text: "Signature request" },
      { type: NotificationPageType.Transaction, text: "Network fee" },
      { type: NotificationPageType.RemoveSpendCap, text: "Remove Permission" },
    ]

    // Poll synchronously until a notification type is found or we time out.
    // The previous approach launched 4 concurrent fire-and-forget isVisible()
    // checks, but isVisible() is an instant check (not a poller) — if the page
    // hadn't rendered yet, all 4 returned false immediately and the 15s timeout
    // was the only thing left. This polling loop retries every pollInterval ms.
    const deadline = Date.now() + globalTimeout

    while (Date.now() < deadline) {
      if (notificationPage.isClosed()) {
        throw new Error(
          "Notification page closed before type could be identified",
        )
      }

      for (const { type, text } of checks) {
        try {
          const selector = notificationPage.getByText(text, { exact: false })
          const isVisible = await selector.isVisible()
          if (isVisible) {
            return type
          }
        } catch {
          // Page might have closed mid-check — we'll catch it at the top of the loop
        }
      }

      // Short pause before the next poll to avoid busy-waiting
      await new Promise(r => setTimeout(r, pollInterval))
    }

    throw new Error("Timeout waiting for notification type")
  }
}
