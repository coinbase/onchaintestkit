import type { Page } from "@playwright/test"
import { toggle } from "../../../utils/toggle"

export async function toggleShowTestNetworks(page: Page) {
  // Click the network dropdown button
  await page.locator('[data-testid="network-display"]').click()

  // Toggle the show test networks switch
  await toggle(
    page.locator(
      ".multichain-network-list-menu-content-wrapper > section > div > label.toggle-button",
    ),
  )

  // Close the network popup
  await page
    .locator(
      ".mm-modal-header button.mm-button-icon.mm-box--color-icon-default.mm-box--background-color-transparent.mm-box--rounded-lg",
    )
    .click()
}
