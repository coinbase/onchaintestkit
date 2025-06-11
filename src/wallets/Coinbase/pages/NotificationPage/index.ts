import { getNotificationPageAndWaitForLoad } from "../../utils/getNotificationPageAndWaitForLoad"
import { BasePage } from "../BasePage"
import { connectToDapp } from "./actions"
import { confirmTransaction, rejectTransaction } from "./actions/transaction"

/**
 * Types of notifications that can appear in the Coinbase Wallet
 */
export enum NotificationPageType {
  CONNECT = "connect",
  TRANSACTION = "transaction",
  TOKEN_PERMISSION = "token_permission",
  SPENDING_CAP_REMOVAL = "spending_cap_removal",
}

/**
 * Represents the notification popup page in Coinbase Wallet
 * This page handles various notifications like:
 * - Connect to dapp requests
 * - Transaction approvals
 * - Token permissions
 * - Spending cap removals
 */
export class NotificationPage extends BasePage {
  /**
   * Handles the connect to dapp notification
   */
  async connectToDapp(extensionId: string): Promise<void> {
    const notificationPage = await getNotificationPageAndWaitForLoad(
      this.page.context(),
      extensionId,
    )
    await connectToDapp(notificationPage)
  }

  async confirmTransaction(extensionId: string): Promise<void> {
    const notificationPage = await getNotificationPageAndWaitForLoad(
      this.page.context(),
      extensionId,
    )
    // TODO: Implement transaction confirmation
    await confirmTransaction(notificationPage)
  }

  async rejectTransaction(extensionId: string): Promise<void> {
    const notificationPage = await getNotificationPageAndWaitForLoad(
      this.page.context(),
      extensionId,
    )
    // TODO: Implement transaction rejection
    await rejectTransaction(notificationPage)
  }

  async approveTokenPermission(_extensionId: string): Promise<void> {
    // TODO: Implement token permission approval for Coinbase
    // This should:
    // 1. Handle the token permission popup
    console.log("Approving token permission")
  }

  async rejectTokenPermission(_extensionId: string): Promise<void> {
    // TODO: Implement token permission rejection for Coinbase
    // This should:
    // 1. Handle the token permission popup
    console.log("Rejecting token permission")
  }

  async confirmSpendingCapRemoval(_extensionId: string): Promise<void> {
    // TODO: Implement spending cap removal confirmation for Coinbase
    // This should:
    // 1. Handle the spending cap removal popup
    console.log("Confirming spending cap removal")
  }

  async rejectSpendingCapRemoval(_extensionId: string): Promise<void> {
    // TODO: Implement spending cap removal rejection for Coinbase
    // This should:
    // 1. Handle the spending cap removal popup
    console.log("Rejecting spending cap removal")
  }

  async identifyNotificationType(_extensionId: string): Promise<string> {
    // TODO: Implement notification type identification for Coinbase
    // This should:
    // 1. Check the notification page content
    // 2. Return the appropriate NotificationPageType
    return NotificationPageType.CONNECT
  }
}
