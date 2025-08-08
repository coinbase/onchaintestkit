import { baseSepolia } from "wagmi/chains"
import { configure } from "../../../../src/configBuilder"
import { PhantomSpecificActionType } from "../../../../src/wallets/Phantom"

export const DEFAULT_PASSWORD = "COMPLEXPASSWORD1"
export const DEFAULT_SEED_PHRASE = process.env.E2E_TEST_SEED_PHRASE
export const USERNAME = "OTKTESTUSERNAME"

// Configure the test with Phantom setup
const baseConfig = configure()
  .withLocalNode({
    chainId: baseSepolia.id,
    forkUrl: process.env.E2E_TEST_FORK_URL,
    forkBlockNumber: BigInt(process.env.E2E_TEST_FORK_BLOCK_NUMBER ?? "0"),
    hardfork: "cancun",
  })
  .withPhantom()
    .withSeedPhrase({
      seedPhrase: DEFAULT_SEED_PHRASE ?? "",
      password: DEFAULT_PASSWORD,
      username: USERNAME,
    })
//   .withPrivateKey({
//     privateKey: process.env.E2E_TEST_PRIVATE_KEY ?? "",
//     password: DEFAULT_PASSWORD,
//     chain: "base",
//     name: "OTKTESTWALLET",
//   })
  //   .withPrivateKey({
  //     privateKey: process.env.E2E_TEST_PRIVATE_KEY ?? "",
  //     password: DEFAULT_PASSWORD,
  //     chain: "base",
  //     name: "OTKTESTWALLET",
  //   })
  .withCustomSetup(async wallet => {
    // Small delay to ensure the main popup is fully ready after private key import
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Enable test mode to support testnets like Base Sepolia
    await wallet.handleAction(PhantomSpecificActionType.ENABLE_TEST_MODE)
  })
  // Add the network with the actual port in a custom setup
  .withNetwork({
    name: "Base Sepolia",
    chainId: baseSepolia.id,
    symbol: "ETH",
    // placeholder for the actual rpcUrl, which is auto injected by the node fixture
    rpcUrl: "http://localhost:8545",
  })

// Build the config
const config = baseConfig.build()

export const phantomWalletConfig = config
