import { MetaMaskConfig, CoinbaseConfig } from "./wallets/types"
import { NodeConfig }                     from "./node/types"
import { CoinbaseWallet } from "./wallets/Coinbase"
import { MetaMask } from "./wallets/MetaMask"
import { LocalNodeManager } from "./node/LocalNodeManager"
import { SmartContractManager } from "./contracts/SmartContractManager"

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
  smartContractManager?: SmartContractManager
}
