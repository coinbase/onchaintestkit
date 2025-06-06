import { errors } from "@playwright/test"
import type { Page } from "@playwright/test"

const DEFAULT_TIMEOUT = 2000

export const waitUntilStable = async (page: Page) => {
  await page.waitForLoadState("domcontentloaded")
  // await page.waitForLoadState('networkidle');
}

export const waitForSelector = async (
  selector: string,
  page: Page,
  timeout: number,
) => {
  await waitUntilStable(page)

  try {
    await page.waitForSelector(selector, { state: "hidden", timeout })
  } catch (error) {
    if (error instanceof errors.TimeoutError) {
      console.log(`Loading indicator '${selector}' not found - continuing.`)
    } else {
      console.log(
        `Error while waiting for loading indicator '${selector}' to disappear`,
      )
      throw error
    }
  }
}

export const waitForMetaMaskLoad = async (page: Page): Promise<Page> => {
  const loadingIndicators = [
    ".loading-logo",
    ".loading-spinner",
    ".loading-overlay",
    ".loading-overlay__spinner",
    ".loading-span",
    ".loading-indicator",
    "#loading__logo",
    "#loading__spinner",
    ".mm-button-base__icon-loading",
    ".loading-swaps-quotes",
    ".loading-heartbeat",
  ] as const

  try {
    // First, make sure the page is stable
    await waitUntilStable(page)

    // Log what we're doing
    console.log("Waiting for MetaMask loading indicators to disappear...")

    // Wait for each loading indicator to be hidden or not present
    for (const selector of loadingIndicators) {
      // First check if the element exists
      const exists = (await page.locator(selector).count()) > 0

      if (exists) {
        // If it exists, wait for it to be hidden
        await page
          .waitForSelector(selector, {
            state: "hidden",
            timeout: DEFAULT_TIMEOUT,
          })
          .catch(error => {
            if (!(error instanceof errors.TimeoutError)) {
              console.log(
                `Error while waiting for '${selector}': ${error.message}`,
              )
            }
          })
      } else {
        // Element doesn't exist at all, which is fine
        console.log(`Loading indicator '${selector}' not found - continuing.`)
      }
    }

    // Give the UI a moment to settle after loading indicators are gone
    await page.waitForTimeout(100)

    console.log("MetaMask loading completed")
    return page
  } catch (error) {
    console.error("Failed to wait for MetaMask loading indicators:", error)
    throw error
  }
}

export const waitForMetaMaskWindowToBeStable = async (page: Page) => {
  await waitForMetaMaskLoad(page)

  // Check for error overlay buttons using direct selector
  if ((await page.locator(".loading-overlay__error-buttons").count()) > 0) {
    // Find and click the retry button
    const retryButton = page.locator(
      ".loading-overlay__error-buttons .btn-primary",
    )
    await retryButton.click()

    // Wait for loading overlay to disappear
    await waitForSelector(".loading-overlay", page, DEFAULT_TIMEOUT)
  }
}

const sleep = async (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

const _RETRY_INTERVALS = [0, 20, 50, 100, 100, 500] as const

export async function waitForCondition(
  action: () => Promise<boolean>,
  timeout: number,
  shouldThrow = true,
) {
  const startTime = Date.now()
  const timeouts = [0, 20, 50, 100, 100, 500] as const
  let attempt = 0

  while (Date.now() - startTime < timeout) {
    const result = await action()
    if (result) return result

    const nextDelay = timeouts[Math.min(attempt++, timeouts.length - 1)]
    await sleep(Math.min(nextDelay, timeout - (Date.now() - startTime)))
  }

  if (shouldThrow) {
    throw new Error(`Timeout ${timeout}ms exceeded.`)
  }
  return false
}
