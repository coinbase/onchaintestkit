import { type ViewportSize, waitForPage } from '../../../../utils';
import { BasePage } from '../BasePage';
import { connectToDapp } from './actions';
import { confirmEvent, rejectEvent } from './actions/confirmEvent';

/**
 * Types of notifications that can appear in the Phantom Wallet
 */
export enum NotificationPageType {
  CONNECT = 'connect',
  SIGNATURE = 'signature',
  TOKEN_PERMISSION = 'token_permission',
  SPENDING_CAP = 'spending_cap',
}

// Constants for Phantom notification page
const NOTIFICATION_PAGE_PATH = 'notification.html';
const DEFAULT_VIEWPORT: ViewportSize = { width: 360, height: 580 };

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
    return `chrome-extension://${extensionId}/${NOTIFICATION_PAGE_PATH}`;
  }

  /**
   * Helper method to wait for notification page
   */
  private async getNotificationPage(extensionId: string): Promise<import('@playwright/test').Page> {
    return waitForPage(this.page.context(), this.getNotificationUrl(extensionId), DEFAULT_VIEWPORT);
  }

  /**
   * Handles the connect to dapp notification
   */
  async connectToDapp(extensionId: string): Promise<void> {
    const notificationPage = await this.getNotificationPage(extensionId);
    await connectToDapp(notificationPage);
  }

  /**
   * Confirms a transaction
   */
  async confirmTransaction(extensionId: string): Promise<void> {
    const notificationPage = await this.getNotificationPage(extensionId);
    await confirmEvent(notificationPage);
  }

  /**
   * Rejects a transaction
   */
  async rejectTransaction(extensionId: string): Promise<void> {
    const notificationPage = await this.getNotificationPage(extensionId);
    await rejectEvent(notificationPage);
  }

  /**
   * Signs a message
   */
  async signMessage(extensionId: string): Promise<void> {
    const notificationPage = await this.getNotificationPage(extensionId);
    await confirmEvent(notificationPage);
  }

  // TODO: Implement other notification methods for Phantom
  async approveTokenPermission(_extensionId: string): Promise<void> {
    console.log('Token permission approval for Phantom not yet implemented');
  }

  async rejectTokenPermission(_extensionId: string): Promise<void> {
    console.log('Token permission rejection for Phantom not yet implemented');
  }

  async confirmSpendingCapRemoval(_extensionId: string): Promise<void> {
    console.log('Spending cap removal for Phantom not yet implemented');
  }

  async rejectSpendingCapRemoval(_extensionId: string): Promise<void> {
    console.log('Spending cap rejection for Phantom not yet implemented');
  }
}
