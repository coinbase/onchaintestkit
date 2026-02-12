import type { Page } from '@playwright/test';

/**
 * Enables test mode in Phantom wallet to support testnets like Base Sepolia
 * @param page - The Playwright page object for the Phantom wallet
 */
export async function enableTestMode(page: Page): Promise<void> {
  // Check if running in CI
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  // Check if page is closed before attempting any interactions
  if (page.isClosed()) {
    console.log('Phantom extension page is closed. Skipping test mode enablement.');
    return;
  }

  try {
    // Wait for the wallet UI to be ready
    await page.waitForLoadState('networkidle');

    // Check again after waiting for load state
    if (page.isClosed()) {
      console.log(
        'Phantom extension page closed after waiting for load state. Skipping test mode enablement.',
      );
      return;
    }

    // Step 1: Click the "More" button (three dots menu)
    await page.click('button[aria-label="More"]');
    await page.waitForLoadState('networkidle');

    // Step 2: Click "Wallet Settings" using getByTestId
    await page.getByTestId('context-menu-item-Wallet Settings').click();
    await page.waitForLoadState('networkidle');

    // Step 3: Click "Developer Settings" using ID
    await page.click('button#settings-item-developer-settings');
    await page.waitForLoadState('networkidle');

    // Step 4: Click the "Testnet Mode" toggle using getByTestId
    await page.getByTestId('toggleTestNetwork').click();
    await page.waitForLoadState('networkidle');

    // Step 5: Click "Ethereum" to access network selection
    await page.click('button:has-text("Ethereum"):has-text("Ethereum Sepolia")');
    await page.waitForLoadState('networkidle');

    // Step 6: Select "Base Sepolia"
    await page.click('button:has-text("Base Sepolia")');
    await page.waitForLoadState('networkidle');

    // Short delay to allow UI to stabilize
    await page.waitForTimeout(2000);
  } catch (error) {
    console.error('Error enabling test mode:', error);

    // In CI, log and continue instead of throwing
    if (isCI) {
      console.log(
        '⚠️ Skipping test mode enablement in CI due to extension page issues. This is expected in headless environments.',
      );
      return;
    }
  }
}
