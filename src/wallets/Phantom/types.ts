export type WalletConfig = {
  password?: string
  seedPhrase?: string
  privateKey?: string
  name?: string
}

// Define supported chains for Phantom private key import
export type SupportedChain =
  | "solana"
  | "ethereum"
  | "base"
  | "sui"
  | "polygon"
  | "bitcoin"
