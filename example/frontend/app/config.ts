import { http, createConfig } from "wagmi"
import { baseSepolia, mainnet } from "wagmi/chains"

// Create and export the Wagmi config
export const config = createConfig({
  chains: [mainnet, baseSepolia],
  transports: {
    [mainnet.id]: http(),
    [baseSepolia.id]: http(),
  },
})

// Add type registration for better TypeScript support
declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
