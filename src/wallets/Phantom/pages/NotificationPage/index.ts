import { type ViewportSize, waitForPage } from "../../../../utils"
import { BasePage } from "../BasePage"
import { connectToDapp } from "./actions"
import { confirmTransaction, rejectTransaction } from "./actions/transaction"

/**
 * Types of notifications that can appear in the Phantom Wallet
 */
export enum NotificationPageType {
  CONNECT = "connect",
  SIGNATURE = "signature",
  TOKEN_PERMISSION = "token_permission",
  SPENDING_CAP = "spending_cap",
}

// Constants for Phantom notification page
const NOTIFICATION_PAGE_PATH = "notification.html"
const DEFAULT_VIEWPORT: ViewportSize = { width: 360, height: 580 }

/**
 * Represents the notification popup page in Phantom Wallet
 * This page handles various notifications like:
 * - Connect to dapp requests
 * - Transaction approvals
 * - Token permissions
 * - Message signing
 */
export class NotificationPage extends BasePage {
  /**
   * Helper method to get notification page URL
   */
  private getNotificationUrl(extensionId: string): string {
    return `chrome-extension://${extensionId}/${NOTIFICATION_PAGE_PATH}`
  }

  /**
   * Helper method to wait for notification page
   */
  private async getNotificationPage(
    extensionId: string,
  ): Promise<import("@playwright/test").Page> {
    return waitForPage(
      this.page.context(),
      this.getNotificationUrl(extensionId),
      DEFAULT_VIEWPORT,
    )
  }

  /**
   * Handles the connect to dapp notification
   */
  async connectToDapp(extensionId: string): Promise<void> {
    const notificationPage = await this.getNotificationPage(extensionId)
    await connectToDapp(notificationPage)
  }

  /**
   * Confirms a transaction
   */
  async confirmTransaction(extensionId: string): Promise<void> {
    const notificationPage = await this.getNotificationPage(extensionId)
    await confirmTransaction(notificationPage)
  }

  /**
   * Rejects a transaction
   */
  async rejectTransaction(extensionId: string): Promise<void> {
    const notificationPage = await this.getNotificationPage(extensionId)
    await rejectTransaction(notificationPage)
  }

//   /**
//    * Identifies the type of notification based on page content
//    */
//   async identifyNotificationType(
//     notificationPage: import("@playwright/test").Page,
//     _checkTimeout = 10000,
//   ): Promise<NotificationPageType> {
//     let pageContent = ""
//     let mainText = ""
//     try {
//       // Poll for up to 3 seconds for non-empty body content
//       for (let i = 0; i < 10; i++) {
//         pageContent = (await notificationPage.textContent("body")) || ""
//         if (pageContent.trim()) break
//         await notificationPage.waitForTimeout(300)
//       }
//       // If still empty, try [data-testid="app-main"]
//       if (!pageContent.trim()) {
//         mainText =
//           (await notificationPage.textContent('[data-testid="app-main"]')) || ""
//       }
//     } catch {
//       console.warn(
//         "Notification page was closed before type could be identified.",
//       )
//       throw new Error(
//         "Notification popup closed before type could be identified.",
//       )
//     }

//     const checks = [
//       { type: NotificationPageType.SIGNATURE, text: "sign" },
//       { type: NotificationPageType.SIGNATURE, text: "approve" },
//       { type: NotificationPageType.CONNECT, text: "connect" },
//       { type: NotificationPageType.TOKEN_PERMISSION, text: "permission" },
//       { type: NotificationPageType.SPENDING_CAP, text: "spending" },
//     ]

//     // Case-insensitive search for each check
//     for (const { type, text } of checks) {
//       if (
//         pageContent.toLowerCase().includes(text.toLowerCase()) ||
//         mainText.toLowerCase().includes(text.toLowerCase())
//       ) {
//         return type
//       }
//     }

//     throw new Error(
//       `Unknown notification type: no known text found. Body text: ${pageContent.substring(
//         0,
//         200,
//       )} Main text: ${mainText.substring(0, 200)}`,
//     )
//   }

  // TODO: Implement other notification methods for Phantom
  async approveTokenPermission(_extensionId: string): Promise<void> {
    console.log("Token permission approval for Phantom not yet implemented")
  }

  async rejectTokenPermission(_extensionId: string): Promise<void> {
    console.log("Token permission rejection for Phantom not yet implemented")
  }

  async confirmSpendingCapRemoval(_extensionId: string): Promise<void> {
    console.log("Spending cap removal for Phantom not yet implemented")
  }

  async rejectSpendingCapRemoval(_extensionId: string): Promise<void> {
    console.log("Spending cap rejection for Phantom not yet implemented")
  }
} 