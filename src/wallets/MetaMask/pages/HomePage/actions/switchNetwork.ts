import type { Page } from "@playwright/test"
import { closePopup, popupConfigs } from "./handlePopups"

async function openTestnetSection(page: Page) {
  const toggleButtonLocator = page.locator("label.toggle-button")
  const classes = await toggleButtonLocator.getAttribute("class")
  if (classes?.includes("toggle-button--off")) {
    await toggleButtonLocator.click()
    await page.locator('input[type="checkbox"][value="true"]').isVisible()
  }
}

export async function switchNetwork(
  page: Page,
  networkName: string,
  includeTestNetworks: boolean,
) {
  // click network dropdown button
  await page.locator('[data-testid="network-display"]').click()

  if (includeTestNetworks) {
    await openTestnetSection(page)
  }

  const networkLocators = await page
    .locator(
      ".multichain-network-list-menu-content-wrapper .multichain-network-list-item p",
    )
    .all()
  const networkNames = await Promise.all(
    networkLocators.map(async locator => await locator.textContent()),
  )

  const seekedNetworkNameIndex = networkNames.findIndex(
    name =>
      (name ?? "").toLocaleLowerCase() === networkName.toLocaleLowerCase(),
  )

  const seekedNetworkLocator =
    seekedNetworkNameIndex >= 0 && networkLocators[seekedNetworkNameIndex]

  if (!seekedNetworkLocator) {
    throw new Error(`Network with name ${networkName} not found`)
  }

  await seekedNetworkLocator.click()

  await closePopup(page, popupConfigs.recoveryPhrase)
}
