import type { Page } from "@playwright/test"
import { type ViewportSize, waitForPage } from "../../../../utils"
import { spendingCapRemoval } from "../../pages/NotificationPage/actions/spendingCap"
import {
  approvePermission,
  connectToDapp,
  network,
  token,
  transaction,
} from "./actions"

export enum NotificationPageType {
  SpendingCap = "spending-cap",
  Signature = "signature",
  Transaction = "transaction",
  RemoveSpendCap = "remove-spend-cap",
}

// Constants for MetaMask notification page
const NOTIFICATION_PAGE_PATH = "notification.html"
const DEFAULT_VIEWPORT: ViewportSize = { width: 360, height: 580 }

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
   */
  private async getNotificationPage(extensionId: string): Promise<Page> {
    if (this.cachedNotificationPage && !this.cachedNotificationPage.isClosed()) {
      try {
        await this.cachedNotificationPage.evaluate(() => document.readyState)
        const cached = this.cachedNotificationPage
        this.cachedNotificationPage = null
        return cached
      } catch {
        this.cachedNotificationPage = null
      }
    }

    return waitForPage(
      this.page.context(),
      this.getNotificationUrl(extensionId),
      DEFAULT_VIEWPORT,
    )
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

  async confirmTransaction(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await transaction.confirm(notificationPage)
  }

  async rejectTransaction(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await transaction.reject(notificationPage)
  }

  async approveTokenPermission(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await approvePermission.approve(notificationPage)
  }

  async rejectTokenPermission(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await approvePermission.reject(notificationPage)
  }

  async confirmSpendingCapRemoval(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await spendingCapRemoval.confirm(notificationPage)
  }

  async rejectSpendingCapRemoval(extensionId: string) {
    const notificationPage = await this.getNotificationPage(extensionId)
    await spendingCapRemoval.reject(notificationPage)
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
    // Get the notification page via a fresh waitForPage lookup (bypass cache)
    // so we always get the latest notification popup, then cache it for the
    // action handler that runs immediately after this returns.
    const notificationPage = await waitForPage(
      this.page.context(),
      this.getNotificationUrl(extensionId),
      DEFAULT_VIEWPORT,
    )
    this.cachedNotificationPage = notificationPage

    // Give the page an extra moment to fully render and stabilize
    await notificationPage.waitForTimeout(500)

    const checks = [
      { type: NotificationPageType.SpendingCap, text: "Spending cap request" },
      { type: NotificationPageType.Signature, text: "Signature request" },
      { type: NotificationPageType.Transaction, text: "Network fee" },
      { type: NotificationPageType.RemoveSpendCap, text: "Remove Permission" },
    ]

    // Log the initial page content for debugging
    try {
      const pageContent =
        (await notificationPage.textContent("body"))?.substring(0, 200) ?? ""
      console.log(
        "Page content at start of detection:",
        pageContent.substring(0, 100),
      )
    } catch (error) {
      console.error("Error capturing initial page content:", error)
    }

    // Poll synchronously until a notification type is found or we time out.
    // isVisible() is an instant check in Playwright (not a poller). The old
    // fire-and-forget approach ran all 4 checks once — if the page hadn't
    // rendered yet, all returned false and the 15s timeout was the only
    // fallback. This polling loop retries every pollInterval ms.
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
            console.log(
              `Found notification type: ${type} with text: "${text}"`,
            )
            return type
          }
        } catch {
          // Page might have closed mid-check — catch at top of loop
        }
      }

      // Short pause before the next poll to avoid busy-waiting
      await notificationPage.waitForTimeout(pollInterval)
    }

    // Timeout — capture debug info before throwing
    try {
      if (!notificationPage.isClosed()) {
        const pageContent =
          (await notificationPage.textContent("body"))?.substring(0, 200) ?? ""
        console.log("Global timeout reached. Page content:", pageContent)
        await notificationPage
          .screenshot({ path: "notification-timeout.png" })
          .catch(() => {})
      }
    } catch {
      // Best-effort debug capture
    }

    throw new Error("Timeout waiting for notification type")
  }
}
