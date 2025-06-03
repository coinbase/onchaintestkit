import { CoinbaseConfig } from "e2e/onchainTestKit/wallets/types"
import { MetaMaskConfig } from "e2e/onchainTestKit/wallets/types"
import { NodeConfig } from "e2e/onchainTestKit/node/types"
import { CoinbaseWallet } from "./wallets/Coinbase"
import { MetaMask } from "./wallets/MetaMask"
import { LocalNodeManager } from "./node/LocalNodeManager"

export type SupportedWallet = "metamask" | "coinbase"

export type WalletConfig = MetaMaskConfig | CoinbaseConfig

export type WalletFixtureOptions = {
  wallets: {
    metamask?: WalletConfig
    coinbase?: WalletConfig
  }
  nodeConfig?: NodeConfig
}

export type OnchainFixtures = {
  metamask?: MetaMask
  coinbase?: CoinbaseWallet
  node?: LocalNodeManager
}
