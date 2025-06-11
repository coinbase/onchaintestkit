import { expect } from "@playwright/test"
import { createOnchainTest } from "../../../src/createOnchainTest"
// import { BaseActionType } from "../../../src/wallets/BaseWallet"
import { CoinbaseSpecificActionType } from "../../../src/wallets/Coinbase"
import { connectCoinbaseWallet } from "./appSession"
import { coinbaseWalletConfig } from "./walletConfig/coinbaseWalletConfig"

// async function inputTransactionDetails(page: Page) {
//   // Try to send a transaction
//   await page.getByTestId("switch-to-base-sepolia").click()
//   //input transaction address
//   await page
//     .getByTestId("send-address-input")
//     .fill("0x83C2bbef5a09C4B46E049917a41E05fAf74b6275")

//   //input transaction amount
//   await page.getByTestId("send-amount-input").fill("0.0001")

//   //send transaction button
//   await page.getByTestId("send-transaction-button").click()
// }

const test = createOnchainTest(coinbaseWalletConfig)

test.describe("Coinbase Wallet Setup", () => {
  test("should initialize and connect wallet", async ({ page, coinbase }) => {
    if (!coinbase) {
      throw new Error("Coinbase wallet is not defined")
    }

    // Verify coinbase wallet instance exists
    expect(coinbase).toBeDefined()

    // Connect to dapp using the UI flow
    await connectCoinbaseWallet(page, coinbase)

    // Add more assertions here as needed
    // For example, verify the wallet address is displayed on the page
    // await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
  })

  // test("should import wallet from private key", async ({ coinbase }) => {
  //   if (!coinbase) {
  //     throw new Error("Coinbase wallet is not defined")
  //   }

  //   const privateKey = process.env.E2E_TEST_PRIVATE_KEY
  //   if (!privateKey) {
  //     throw new Error("E2E_TEST_PRIVATE_KEY environment variable is not set")
  //   }

  //   // Import wallet from private key
  //   await coinbase.handleAction(BaseActionType.IMPORT_WALLET_FROM_PRIVATE_KEY, {
  //     privateKey,
  //   })

  //   // Note: The password is already configured in the wallet config
  //   // and will be used automatically during the import process

  //   // Wait a bit to ensure the import process is complete
  //   await new Promise(resolve => setTimeout(resolve, 2000))

  //   // Additional assertions can be added here
  //   // For example, verify the imported account appears in the account list
  // })

  test("should add Linea Testnet network", async ({ coinbase }) => {
    if (!coinbase) {
      throw new Error("Coinbase wallet is not defined")
    }

    // Define the Linea Testnet network configuration
    const lineaTestnet = {
      name: "Linea Sepolia",
      chainId: 59141,
      symbol: "ETH",
      rpcUrl: "https://rpc.sepolia.linea.build",
      //   blockExplorerUrl: "https://goerli.lineascan.build",
      isTestnet: true,
    }

    // Add the Linea Testnet network
    await coinbase.handleAction(CoinbaseSpecificActionType.ADD_NETWORK, {
      network: lineaTestnet,
      isTestnet: true,
    })

    // Wait a bit to ensure the network is added
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Additional assertions can be added here
    // For example, verify the network appears in the network list
  })
})

// test.describe('Coinbase Wallet Transaction Handling', () => {
//   test('should be able to confirm a transaction', async ({ page, coinbase }) => {
//     if (!coinbase) throw new Error('Coinbase wallet not initialized')

//     await page.getByTestId('ockConnectButton').click()

//     await page.getByRole('button', { name: 'Coinbase Wallet' }).click()

//     // First connect to the dapp
//     await coinbase.handleAction(BaseActionType.CONNECT_TO_DAPP)

//     await inputTransactionDetails(page)

//     // Confirm the transaction in Coinbase Wallet
//     await coinbase.handleAction(BaseActionType.HANDLE_TRANSACTION, {
//       approvalType: ActionApprovalType.APPROVE,
//     })

//     // Verify the transaction was sent (check for success message)
//     await page.getByText('Transaction confirmed!').waitFor()
//   })

//   test('should be able to reject a transaction', async ({ page, coinbase }) => {
//     if (!coinbase) throw new Error('Coinbase wallet not initialized')

//     //click connect button
//     await page.getByTestId('ockConnectButton').click()

//     await page.getByRole('button', { name: 'Coinbase Wallet' }).click()

//     // First connect to the dapp
//     await coinbase.handleAction(BaseActionType.CONNECT_TO_DAPP)

//     await inputTransactionDetails(page)

//     // Reject the transaction in Coinbase Wallet
//     await coinbase.handleAction(BaseActionType.HANDLE_TRANSACTION, {
//       approvalType: ActionApprovalType.REJECT,
//     })

//     // Verify the transaction was rejected (check for error message)
//     await page.getByText('User rejected the request').waitFor()
//   })
// })
