import { expect } from "@playwright/test"
import { createOnchainTest } from "../../../src/createOnchainTest"
import { connectPhantomWallet } from "./appSession"
import { phantomWalletConfig } from "./walletConfig/phantomWalletConfig"

const test = createOnchainTest(phantomWalletConfig)

test.describe("Phantom Wallet Setup", () => {
  test("should initialize and connect wallet", async ({ page, phantom }) => {
    if (!phantom) {
      throw new Error("Phantom wallet is not defined")
    }

    // Verify phantom wallet instance exists
    expect(phantom).toBeDefined()

    // Connect to dapp using the UI flow
    await connectPhantomWallet(page, phantom)
  })
})
