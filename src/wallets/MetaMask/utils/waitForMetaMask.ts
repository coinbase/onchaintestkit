import type { Page } from "@playwright/test"

const LOADING_SELECTORS = [
  ".loading-logo",
  ".loading-spinner",
  ".loading-overlay",
  ".loading-indicator",
] as const

export async function waitForMetaMaskUI(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded")
  await page.waitForLoadState("networkidle")

  await Promise.all(
    LOADING_SELECTORS.map(
      async selector =>
        page
          .waitForSelector(selector, {
            state: "hidden",
            timeout: 2000,
          })
          .catch(() => {}), // Ignore if selector not found
    ),
  )
}
