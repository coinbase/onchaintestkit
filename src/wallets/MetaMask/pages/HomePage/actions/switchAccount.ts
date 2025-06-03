import { allTextContents } from "../../../utils/getTextContents"
import type { Page } from "@playwright/test"

export async function switchAccount(page: Page, accountName: string) {
  await page.locator('[data-testid="account-menu-icon"]').click()

  const accountNamesLocators = await page
    .locator(
      ".multichain-account-menu-popover .multichain-account-list-item__account-name__button",
    )
    .all()

  const accountNames = await allTextContents(accountNamesLocators)

  const seekedAccountNames = accountNames.filter(
    (name: string) =>
      name.toLocaleLowerCase() === accountName.toLocaleLowerCase(),
  )

  if (seekedAccountNames.length === 0) {
    throw new Error(
      `[SwitchAccount] Account with name ${accountName} not found`,
    )
  }

  const accountIndex = accountNames.indexOf(seekedAccountNames[0])

  await accountNamesLocators[accountIndex].click()
}
