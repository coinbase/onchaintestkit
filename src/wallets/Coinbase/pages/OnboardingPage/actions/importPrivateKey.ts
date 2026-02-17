import type { Page } from '@playwright/test';

/**
 * Imports a wallet using a private key and password during onboarding
 * @param page - The Playwright page object
 * @param privateKey - The private key to import
 * @param password - The password to set for the wallet
 */
export async function importPrivateKey(
  page: Page,
  privateKey: string,
  password: string,
): Promise<void> {
  console.log('Starting wallet import process with private key in extension...');

  try {
    // Wait for the extension UI to be ready
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="btn-import-existing-wallet"]', {
      timeout: 10000,
    });

    // Click "I already have a wallet"
    await page.locator('[data-testid="btn-import-existing-wallet"]').click();
    await page.waitForLoadState('networkidle');

    // Click "Private key" option instead of "Recovery phrase"
    await page.locator('[data-testid="btn-import-recovery-phrase"]').click();
    await page.waitForLoadState('networkidle');

    // Click "Acknowledge" button if present
    try {
      await page.locator('button:has-text("Acknowledge")').click();
      await page.waitForLoadState('networkidle');
    } catch (_error) {
      console.log('No acknowledge button found, continuing...');
    }

    // Enter private key in the input field
    await page.locator('[data-testid="secret-input"]').fill(privateKey);
    await page.waitForTimeout(500); // Small delay to ensure input is registered

    // Import wallet button
    await page.locator('[data-testid="btn-import-wallet"]').click();
    await page.waitForLoadState('networkidle');

    // Enter and confirm password
    await page.locator('[data-testid="setPassword"]').fill(password);
    await page.waitForTimeout(500);
    await page.locator('[data-testid="setPasswordVerify"]').fill(password);
    await page.waitForTimeout(500);

    // Accept terms
    await page.locator('[data-testid="terms-and-privacy-policy"]').click();
    await page.waitForTimeout(500);

    // Click Submit/Import button
    await page.locator('[data-testid="btn-password-continue"]').click();

    // Wait for import to complete and wallet to be ready
    await page.waitForSelector('[data-testid="app-main"]', {
      timeout: 30000,
      state: 'visible',
    });

    console.log('Wallet import with private key completed successfully');
  } catch (error) {
    console.error('Error during wallet import with private key:', error);
    throw error;
  }
}
