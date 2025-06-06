import type { Locator } from "@playwright/test"

/**
 * Retrieve text content for each locator in the provided array.
 * If a locator's textContent is null, an empty string is returned for that entry.
 */
export async function allTextContents(locators: Locator[]): Promise<string[]> {
  const texts = await Promise.all(
    locators.map(locator => locator.textContent()),
  )
  return texts.map(text => text ?? "")
}
