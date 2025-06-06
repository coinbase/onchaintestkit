import type { Page } from "@playwright/test"
import { clickLocatorIfCondition } from "../../../../utils/tryClickElement"

export async function closeRecoveryPhraseReminder(page: Page) {
  const closeButtonLocator = page.locator(
    ".recovery-phrase-reminder button.btn-primary",
  )

  await clickLocatorIfCondition(
    closeButtonLocator,
    async () => closeButtonLocator.isVisible(),
    1_000,
  )
}
