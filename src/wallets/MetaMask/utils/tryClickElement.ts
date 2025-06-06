import { Locator } from "@playwright/test"

/**
 * Tries to click an element if it exists and is visible
 * @param locator The Playwright locator for the element
 * @param isVisibleFn Function to check if element is visible
 * @param timeout Timeout in milliseconds
 */
export async function tryClickElement(
  locator: Locator,
  isVisibleFn: () => Promise<boolean>,
  timeout = 5000,
): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      const isVisible = await isVisibleFn()
      if (isVisible) {
        await locator.click()
        return true
      }
    } catch {
      // Ignore errors, just retry
    }

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return false
}

export const clickLocatorIfCondition = tryClickElement
