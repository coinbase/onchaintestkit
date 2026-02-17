import { expect } from "@playwright/test"
import { createOnchainTest } from "../../../src/createOnchainTest"
import {
  ActionApprovalType,
  BaseActionType,
} from "../../../src/wallets/BaseWallet"
import { connectPhantomWallet } from "./appSession"
import { inputTransactionDetails } from "./testUtils"

import { PhantomSpecificActionType } from "@coinbase/onchaintestkit"
import { phantomWalletConfig } from "./walletConfig/phantomWalletConfig"

const test = createOnchainTest(phantomWalletConfig)

// TODO: Re-enable once MetaMask CI fixes are stable (OTK-47)
test.skip()

test.describe("Phantom Wallet Setup", () => {
  test("should initialize and connect wallet", async ({ page, phantom }) => {
    if (!phantom) {
      throw new Error("Phantom wallet is not defined")
    }

    // Wait for page to load completely (page.goto("/") is handled by the fixture)
    await page.waitForLoadState("networkidle")

    // Verify phantom wallet instance exists
    expect(phantom).toBeDefined()

    // Connect to dapp using the UI flow (same pattern as Coinbase)
    await connectPhantomWallet(page, phantom)
  })
  test("should initialize and connect wallet, complete a transaction", async ({
    page,
    phantom,
  }) => {
    if (!phantom) {
      throw new Error("Phantom wallet is not defined")
    }

    // Wait for page to load completely (page.goto("/") is handled by the fixture)
    await page.waitForLoadState("networkidle")

    // Verify phantom wallet instance exists
    expect(phantom).toBeDefined()
    await connectPhantomWallet(page, phantom)
    // Input transaction details and initiate transaction
    await page.waitForTimeout(3000)
    await inputTransactionDetails(page)
    // TODO: Add transaction confirmation handling for Phantom
    await phantom.handleAction(BaseActionType.HANDLE_TRANSACTION, {
      approvalType: ActionApprovalType.APPROVE,
    })
    await page.getByText("Transaction confirmed!").waitFor()
  })

  test("otk playground", async ({ page, phantom }) => {
    if (!phantom) {
      throw new Error("Phantom wallet is not defined")
    }
    await page.goto("https://onchainkit.xyz/playground")
    await page.waitForLoadState("networkidle")
    await page.click("#wallet-type-eoa")

    await phantom.handleAction(BaseActionType.CONNECT_TO_DAPP)

    await page.click('button[role="combobox"]')

    // Step 2: Select "Signature" option
    await page.selectOption("select", "signature")

    await page.keyboard.press("Escape")

    // Step 3: Click personal_sign button (appears after selection)
    await page.waitForSelector('button:has-text("personal_sign")', {
      state: "visible",
    })
    await page.click('button:has-text("personal_sign")')

    await phantom.handleAction(PhantomSpecificActionType.SIGN_MESSAGE, {
      approvalType: ActionApprovalType.APPROVE,
    })

    await page.waitForSelector(
      '[data-testid="ockSignatureLabel"]:has-text("Success")',
      {
        state: "visible",
        timeout: 30000, // Give it time for the signing process
      },
    )
  })
})
