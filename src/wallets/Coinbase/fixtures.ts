import { Page, test as base } from "@playwright/test"
import { CoinbaseConfig } from "../types"
import { NodeConfig } from "../../node/types"
import { CoinbaseWallet } from "."
type CoinbaseFixturesType = {
  _contextPath: string
  coinbase: CoinbaseWallet
  extensionId: string
  coinbasePage: Page
}

export function CoinbaseFixturesBuilder(
  config: CoinbaseConfig,
  nodeConfig: NodeConfig | undefined,
) {
  // Extend base test with Coinbase wallet fixtures
  return base.extend<CoinbaseFixturesType>({
    coinbase: async ({}) => {
      // TODO: Implement Coinbase wallet fixtures
    },
  })
}
