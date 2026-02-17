import type { Page } from '@playwright/test';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Confirms a transaction in the Phantom Wallet notification popup
 * @param page - The notification page
 * @param accountName - The name of the account to switch to
 */
export async function switchAccount(page: Page, accountName: string): Promise<void> {
  console.log('Implemented but not tested, code is commented');
  //   await page.waitForLoadState("domcontentloaded")
  //   await page.waitForLoadState("networkidle")

  //   // Open settings / account menu
  //   await page.getByTestId("settings-menu-open-button").click()

  //   const namePattern = new RegExp(`^${escapeRegex(accountName)}$`, "i")
  //   const target = page.getByRole("button", { name: namePattern })
  //   await target.waitFor({ state: "visible", timeout: 15000 })
  //   await target.click()

  //   await page.waitForLoadState("networkidle")
}
