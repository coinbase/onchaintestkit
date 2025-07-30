import { expect } from "@playwright/test"
import { Page } from "@playwright/test"
import { createOnchainTest } from "../../../src/createOnchainTest"
import {
  ActionApprovalType,
  BaseActionType,
} from "../../../src/wallets/BaseWallet"
import { PhantomSpecificActionType } from "../../../src/wallets/Phantom"
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

  test("should import wallet from private key", async ({ phantom }) => {
    if (!phantom) {
      throw new Error("Phantom wallet is not defined")
    }

    // Get the seed phrase from environment variable
    const seedPhrase = process.env.E2E_TEST_SEED_PHRASE
    if (!seedPhrase) {
      throw new Error("E2E_TEST_SEED_PHRASE environment variable is not set")
    }

    // Import wallet using seed phrase
    await phantom.handleAction(BaseActionType.IMPORT_WALLET_FROM_SEED, {
      seedPhrase,
      password: "COMPLEXPASSWORD1",
    })
  })

  test("should add a custom network", async ({ phantom }) => {
    if (!phantom) {
      throw new Error("Phantom wallet is not defined")
    }

    // Add a custom network
    await phantom.handleAction(PhantomSpecificActionType.ADD_NETWORK, {
      network: {
        name: "Base Sepolia Testnet",
        chainId: 84532,
        rpcUrl: "https://sepolia.base.org",
        symbol: "ETH",
        blockExplorerUrl: "https://sepolia.basescan.org",
      },
    })
  })

  test("should switch to a different network", async ({ phantom }) => {
    if (!phantom) {
      throw new Error("Phantom wallet is not defined")
    }

    // Switch to a network
    await phantom.handleAction(BaseActionType.SWITCH_NETWORK, {
      networkName: "Base Sepolia",
      isTestnet: true,
    })
  })

  test("should handle blockchain switching (Solana/Ethereum)", async ({ phantom }) => {
    if (!phantom) {
      throw new Error("Phantom wallet is not defined")
    }

    // Test Phantom's unique blockchain switching capability
    await phantom.handleAction(PhantomSpecificActionType.SWITCH_BLOCKCHAIN, {
      blockchain: "ethereum", // or "solana"
    })
  })
})

