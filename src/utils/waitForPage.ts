import type { BrowserContext, Page } from '@playwright/test';
import { LoadingStateDetector } from './LoadingStateDetector';

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Generic utility to wait for and configure a page by URL.
 *
 * Uses a dual strategy to handle the TOCTOU race condition where a page
 * opens between the context.pages() check and the waitForEvent listener:
 *   1. Check context.pages() for an existing matching page
 *   2. If not found, race waitForEvent('page') against polling
 *
 * @param context - Browser context to search for pages
 * @param pageUrl - Partial URL to match (e.g., 'notification.html')
 * @param viewport - Optional viewport size
 * @returns Promise that resolves to the found and configured page
 */
export async function waitForPage(
  context: BrowserContext,
  pageUrl: string,
  viewport?: ViewportSize,
): Promise<Page> {
  const isLiveTargetPage = (page: Page) => !page.isClosed() && page.url().includes(pageUrl);

  // Check existing pages first, skipping any that are already closed
  let targetPage = context.pages().find(isLiveTargetPage);

  if (!targetPage) {
    // Race two strategies:
    //   1. waitForEvent('page') — catches pages that open after this point
    //   2. Polling context.pages() — catches pages that opened during the
    //      gap between the check above and the event listener setup
    targetPage = await Promise.race([
      context.waitForEvent('page', {
        predicate: (p: Page) => p.url().includes(pageUrl),
      }),
      new Promise<Page>((resolve) => {
        const poll = () => {
          const found = context.pages().find(isLiveTargetPage);
          if (found) resolve(found);
          else setTimeout(poll, 300);
        };
        setTimeout(poll, 300);
      }),
    ]);
  }

  await targetPage.waitForLoadState('domcontentloaded');

  if (viewport) {
    await targetPage.setViewportSize(viewport);
  }

  // Only run loading detection if the page is still open. Extension popup
  // pages (like MetaMask notifications) can close at any time, and running
  // expensive selector checks on a closed page wastes time and causes
  // cascading "Target page closed" errors on CI.
  if (!targetPage.isClosed()) {
    await LoadingStateDetector.waitForPageLoadingComplete(targetPage, 10000);
  }

  return targetPage;
}
