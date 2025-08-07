import { expect } from "@playwright/test"
import { createOnchainTest } from "../../../src/createOnchainTest"
import {
  ActionApprovalType,
  BaseActionType,
} from "../../../src/wallets/BaseWallet"
import { connectPhantomWallet } from "./appSession"
import { inputTransactionDetails } from "./testUtils"

import { phantomWalletConfig } from "./walletConfig/phantomWalletConfig"

const test = createOnchainTest(phantomWalletConfig)

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
})
