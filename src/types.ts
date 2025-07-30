import { SmartContractManager } from "./contracts/SmartContractManager"
import { LocalNodeManager } from "./node/LocalNodeManager"
import { NodeConfig } from "./node/types"
import { CoinbaseWallet } from "./wallets/Coinbase"
// import {
//   CoinbaseSmartWallet,
//   SmartWalletConfig,
// } from "./wallets/Coinbase/SmartWallet"
import { MetaMask } from "./wallets/MetaMask"
import { PhantomWallet } from "./wallets/Phantom"
import { CoinbaseConfig, MetaMaskConfig, PhantomConfig } from "./wallets/types"

export type SupportedWallet = "metamask" | "coinbase" | "phantom"

export type WalletConfig = MetaMaskConfig | CoinbaseConfig | PhantomConfig

export type WalletFixtureOptions = {
  wallets: {
    metamask?: WalletConfig
    coinbase?: WalletConfig
    phantom?: WalletConfig
    // "coinbase-smart"?: SmartWalletConfig
  }
  nodeConfig?: NodeConfig
}

export type OnchainFixtures = {
  metamask?: MetaMask
  coinbase?: CoinbaseWallet
  phantom?: PhantomWallet
  // coinbaseSmart?: CoinbaseSmartWallet
  node?: LocalNodeManager
  smartContractManager?: SmartContractManager
}
