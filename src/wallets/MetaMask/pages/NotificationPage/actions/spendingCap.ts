import type { Page } from '@playwright/test';

// Poll until the page is closed (or timeout). This prevents the next
// waitForPage call from finding this stale page in context.pages().
async function waitForPageClose(page: Page, timeout = 5000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline && !page.isClosed()) {
    await new Promise((r) => setTimeout(r, 200));
  }
}

const confirmRemoval = async (notificationPage: Page) => {
  await notificationPage.getByRole('button', { name: 'Confirm' }).click();
  await waitForPageClose(notificationPage);
};

const rejectRemoval = async (notificationPage: Page) => {
  await notificationPage.getByRole('button', { name: 'Cancel' }).click();
  await waitForPageClose(notificationPage);
};

export const spendingCapRemoval = {
  confirm: confirmRemoval,
  reject: rejectRemoval,
};
