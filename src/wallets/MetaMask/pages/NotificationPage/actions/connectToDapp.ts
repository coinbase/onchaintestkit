import type { Page } from '@playwright/test';

// Poll until the page is closed (or timeout). Avoids waitForEvent('close')
// which can hang indefinitely if MetaMask reuses the popup.
async function waitForPageClose(page: Page, timeout = 5000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline && !page.isClosed()) {
    await new Promise((r) => setTimeout(r, 200));
  }
}

export async function connectToDapp(notificationPage: Page) {
  await notificationPage.getByRole('button', { name: 'Connect' }).click();
  await waitForPageClose(notificationPage);
}
