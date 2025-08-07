import type { Page } from "@playwright/test"

/**
 * Imports a wallet using a seed phrase, password, and username
 * @param page - The Playwright page object
 * @param seedPhrase - The seed phrase to import
 * @param password - The password to set for the wallet
 * @param username - The username for the wallet
 */
export async function importWallet(
  page: Page,
  seedPhrase: string,
  password: string,
  _username?: string,
): Promise<void> {

  try {
    // Wait for the extension UI to be ready
    await page.waitForLoadState("networkidle")

    // Step 1: Wait for and click "I already have a wallet" button
    await page.waitForSelector('button:has-text("I already have a wallet")', {
      state: "visible",
    })
    await page.click('button:has-text("I already have a wallet")')
    await page.waitForLoadState("networkidle")

    // Step 2: Wait for and click "Import Recovery Phrase" button
    await page.waitForSelector('button:has-text("Import Recovery Phrase")', {
      state: "visible",
    })
    await page.click('button:has-text("Import Recovery Phrase")')
    await page.waitForLoadState("networkidle")

    // Step 3: Enter seed phrase (split into individual words for each input)
    const words = seedPhrase.trim().split(/\s+/)


    // Fill each word into its respective input box
    for (let i = 0; i < words.length; i++) {
      const input = page.getByTestId(`secret-recovery-phrase-word-input-${i}`)
      // Wait for each input to be available before filling
      await input.waitFor({ state: "visible" })
      await input.fill(words[i])

    }

    // Wait for all inputs to be properly filled and Continue button to be enabled
    await page.waitForTimeout(1000) // Short wait for validation to complete

    // Step 4: Wait for and click Continue button (after seed phrase)
    const firstContinueBtn = page.getByTestId("onboarding-form-submit-button")
    await firstContinueBtn.waitFor({ state: "visible" })
    await firstContinueBtn.click()
    await page.waitForLoadState("networkidle")

    await page.waitForTimeout(3000)

    // Step 5: Wait for and click Continue button again (second Continue button)
    const secondContinueBtn = page.getByTestId("onboarding-form-submit-button")
    await secondContinueBtn.waitFor({ state: "visible" })
    await secondContinueBtn.click()
    await page.waitForLoadState("networkidle")

    // Step 6: Wait for and enter password
    const passwordInput = page.getByTestId("onboarding-form-password-input")
    await passwordInput.waitFor({ state: "visible" })
    await passwordInput.fill(password)

    // Step 7: Wait for and confirm password
    const confirmPasswordInput = page.getByTestId(
      "onboarding-form-confirm-password-input",
    )
    await confirmPasswordInput.waitFor({ state: "visible" })
    await confirmPasswordInput.fill(password)

    // Step 8: Wait for and check terms of service checkbox
    const checkbox = page.getByTestId(
      "onboarding-form-terms-of-service-checkbox",
    )
    await checkbox.waitFor({ state: "visible" })
    await checkbox.click()

    // Wait for the checkbox state to update
    await page.waitForTimeout(500)

    // Step 9: Wait for and click final Continue button to complete setup
    const finalContinueBtn = page.getByTestId("onboarding-form-submit-button")
    await finalContinueBtn.waitFor({ state: "visible" })
    await finalContinueBtn.click()
    await page.waitForLoadState("networkidle")

    // Step 10: Enter username (if provided)
    // if (username) {
    //   const usernameInput = page.locator('input[placeholder="username"]')
    //   await usernameInput.waitFor({ state: 'visible' })
    //   await usernameInput.fill(username)

    //   const usernameContinueBtn = page.locator('button:has-text("Continue")')
    //   await usernameContinueBtn.waitFor({ state: 'visible' })
    //   await usernameContinueBtn.click()
    //   await page.waitForLoadState("networkidle")
    //   console.log(`Username "${username}" entered successfully`)
    // }

    // Step 11: Wait for and click "Get Started" to finish setup
    const getStartedBtn = page.locator('button:has-text("Get Started")')
    await getStartedBtn.waitFor({ state: "visible" })
    await getStartedBtn.click()

    // After "Get Started", Phantom transitions to main UI and closes the onboarding page
    // This may cause Playwright to throw "page closed" errors, which are expected
    try {
      await page.waitForLoadState("networkidle", { timeout: 3000 })
    } catch (_error) {
      // Expected: Page closes after transitioning to main extension UI
      console.log("Onboarding page closed (expected behavior)")
    }

  } catch (error) {
    console.error("Error during Phantom wallet import:", error)
    throw new Error(`Failed to import Phantom wallet: ${error}`)
  }
}
