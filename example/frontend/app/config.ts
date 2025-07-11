import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { baseSepolia, mainnet } from "wagmi/chains"
// import { coinbaseWallet } from 'wagmi/connectors';

// Create and export the Wagmi config
export function getConfig() { return createConfig({
  chains: [mainnet, baseSepolia],
  // connectors: [
  //   coinbaseWallet({
  //     appName: 'OnchainKit',
  //     preference: 'smartWalletOnly',
  //     version: '4',
  //   }),
  // ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [mainnet.id]: http('http://localhost:8545'),
    [baseSepolia.id]: http('http://localhost:8545'),
  },
})}

// Add type registration for better TypeScript support
// declare module "wagmi" {
//   interface Register {
//     config: ReturnType<typeof getConfig>
//   }
// }

