import { createOnchainTest } from "@coinbase/onchain-test-kit"
import { metamaskWalletConfig } from "./walletConfig/metamaskWalletConfig"
import { connectWallet } from "./appSession"

const test = createOnchainTest(metamaskWalletConfig)

test.describe("Connect Wallet", () => {
  test("should connect to wallet", async ({ page, metamask }) => {
    if (!metamask) {
      throw new Error("Metamask is not defined")
    }

    await connectWallet(page, metamask)
  })
})
