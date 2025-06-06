import { BrowserContext, Page } from "@playwright/test"

/**
 * Interface for JSON-RPC request structure
 */
type JsonRpcRequest = {
  jsonrpc: string
  id: number
  method: string
  params: [
    {
      to: string
      data: string
      [key: string]: unknown
    },
    string,
  ]
}

/**
 * Sets up request interception to replace the default localhost port in RPC URLs
 * with the dynamic port provided by localNodeManager
 *
 * @param pageOrContext - Playwright Page or BrowserContext to apply the route to
 * @param localNodePort - The actual port number from localNodeManager
 */
export async function setupRpcPortInterceptor(
  pageOrContext: Page | BrowserContext,
  localNodePort: number,
): Promise<void> {
  // Intercept all requests to the default localhost RPC URL
  await pageOrContext.route("http://localhost:8545", async route => {
    // for all other requests going to http://localhots:8545
    // redirect the request to http://localhost:${localNodePort}
    // Create a new URL with the correct port
    const newUrl = `http://localhost:${localNodePort}`
    await route.continue({ url: newUrl })
  })

  console.log(
    `RPC URL interception set up: http://localhost:8545 → http://localhost:${localNodePort}`,
  )
}
