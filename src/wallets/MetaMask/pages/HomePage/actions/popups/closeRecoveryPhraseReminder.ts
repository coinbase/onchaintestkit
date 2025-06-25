import { tryClickElement } from "../../../../../../utils/tryClickElement"
import type { Page } from "@playwright/test"

export async function closeRecoveryPhraseReminder(page: Page) {
  const closeButtonLocator = page.locator(
    ".recovery-phrase-reminder button.btn-primary",
  )

  await tryClickElement(
    closeButtonLocator,
    async () => closeButtonLocator.isVisible(),
    1_000,
  )
}
