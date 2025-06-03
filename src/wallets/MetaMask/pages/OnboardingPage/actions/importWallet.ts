import { popupConfigs, closePopup } from "../../HomePage/actions/handlePopups"
import type { Page } from "@playwright/test"

async function confirmSecretRecoveryPhrase(page: Page, seedPhrase: string) {
  const seedPhraseWords = seedPhrase.split(" ")

  for (let index = 0; index < seedPhraseWords.length; index++) {
    const word = seedPhraseWords[index]
    await page
      .locator(`[data-testid="import-srp__srp-word-${index}"]`)
      .fill(word)
  }

  const confirmBtn = page.locator('[data-testid="import-srp-confirm"]')
  console.log("Waiting for confirm button...")
  await confirmBtn.waitFor({ state: "attached" })

  if (await confirmBtn.isDisabled()) {
    console.log("Confirm button is disabled, checking for error message...")

    // Debug: Log all text content on the page for debugging
    const pageContent = await page.textContent("body")
    console.log("Current page content:", pageContent)
  }

  await confirmBtn.click()
}

async function createPassword(page: Page, password: string) {
  await page.locator('[data-testid="create-password-new"]').fill(password)
  await page.locator('[data-testid="create-password-confirm"]').fill(password)

  await page.locator('[data-testid="create-password-terms"]').click()

  const importBtn = page.locator('[data-testid="create-password-import"]')

  if (await importBtn.isDisabled()) {
    const errorText = await page
      .locator('[data-testid="create-password-new"] + h6 > span > span')
      .textContent({
        timeout: 1000,
      })

    throw new Error(`Invalid password. Error: ${errorText}`)
  }

  await importBtn.click()
}

export async function importWallet(
  page: Page,
  seedPhrase: string,
  password: string,
) {
  console.log("Importing wallet with seed phrase:", seedPhrase)
  // click TOS checkbox
  await page.locator('[data-testid="onboarding-terms-checkbox"]').click()

  // click "Import an existing wallet" button
  await page.getByRole("button", { name: "Import an existing wallet" }).click()

  // click "Import wallet" button
  await page.getByRole("button", { name: "I agree" }).click()

  // Secret Recovery Phrase Page
  await confirmSecretRecoveryPhrase(page, seedPhrase)
  await createPassword(page, password)

  // click "done" button
  await page.getByRole("button", { name: "Done" }).click()

  // Tutorial Page
  // click "Next" button
  await page.getByRole("button", { name: "Next" }).click()
  // click "Done" button
  await page.getByRole("button", { name: "Done" }).click()

  await closePopup(page, popupConfigs.generic)
}
