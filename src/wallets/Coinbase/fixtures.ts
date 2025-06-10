import { Page, test as base } from "@playwright/test"
import { CoinbaseWallet } from "."
import { NodeConfig } from "../../node/types"
import { CoinbaseConfig } from "../types"
type CoinbaseFixturesType = {
  _contextPath: string
  coinbase: CoinbaseWallet
  extensionId: string
  coinbasePage: Page
}

export function CoinbaseFixturesBuilder(
  _config: CoinbaseConfig,
  _nodeConfig: NodeConfig | undefined,
) {
  // Extend base test with Coinbase wallet fixtures
  return base.extend<CoinbaseFixturesType>({
    coinbase: async ({}) => {
      // TODO: Implement Coinbase wallet fixtures
    },
  })
}
