"use client"

import { OnchainKitProvider } from "@coinbase/onchainkit"
import type { ReactNode } from "react"
import { useState } from "react"
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { getConfig } from "./config"

export function Providers(props: { children: ReactNode }) {
  const [config] = useState(() => getConfig())

  // const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      {/* <QueryClientProvider client={queryClient}> */}
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={baseSepolia}
        config={{
          appearance: {
            mode: "auto",
          },
          wallet: {
            display: "modal",
          },
        }}
      >
        {props.children}
      </OnchainKitProvider>
      {/* </QueryClientProvider> */}
    </WagmiProvider>
  )
}
