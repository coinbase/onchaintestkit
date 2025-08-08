import { BrowserContext, Page, test as base } from "@playwright/test"

import { PhantomWallet } from "."
import { LocalNodeManager } from "../../node/LocalNodeManager"
import { NodeConfig } from "../../node/types"
import { createTempDir } from "../../utils/createTempDir"
import { getExtensionId } from "../../utils/extensionManager"
import { removeTempDir } from "../../utils/removeTempDir"
import { PhantomConfig } from "../../wallets/types"

type PhantomFixturesType = {
  _contextPath: string
  phantom: PhantomWallet
  extensionId: string
  phantomPage: Page

  setupWallet: null
  node: LocalNodeManager
}

let sharedPhantomPage: Page

// Constants
const PHANTOM_API_URL = "https://api.phantom.app/portal/v1/public-apps**"
const PHANTOM_NODE_PROXY = "node-proxy.phantom.app"

// EXPERIMENTAL: Service Worker network interception (requires PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1)
// See: https://playwright.dev/docs/network#service-worker-network-events
// To enable: set environment variable PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1

async function setupPhantomNetworkInterception(
  context: BrowserContext,
  localNodePort: number,
): Promise<void> {
  // Intercept ALL requests, including those from service workers (if experimental flag is enabled)
  await context.route("**", async route => {
    const request = route.request()
    // Check if this request originated from a service worker
    if (request.serviceWorker()) {
      const postData = request.postData()
      // Optionally, reroute to local node if it's a node-proxy call
      if (request.url().includes(PHANTOM_NODE_PROXY)) {
        try {
          const localUrl = `http://localhost:${localNodePort}`
          const response = await context.request.post(localUrl, {
            data: postData,
            headers: { "Content-Type": "application/json" },
          })
          const responseBody = await response.text()
          await route.fulfill({
            status: response.status(),
            headers: response.headers(),
            body: responseBody,
          })
          return
        } catch (error) {
          console.error("[SW] Error rerouting service worker request:", error)
        }
      }
      // Otherwise, continue as normal
      await route.continue()
    } else {
      // Not a service worker request, handle as before
      await route.continue()
    }
  })

  // Mock Phantom's domain validation API to allow localhost
  await context.route(PHANTOM_API_URL, async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          apps: [{ domain: "localhost", verified: true }],
          domains: ["localhost"],
        },
      }),
    })
  })

  console.log(
    "[Phantom Network] Service worker interception enabled (experimental)",
  )
}

export function PhantomFixturesBuilder(
  walletConfig: PhantomConfig,
  nodeConfig: NodeConfig | undefined,
) {
  return base.extend<PhantomFixturesType>({
    // Add node fixture that will start before any wallet setup
    node: nodeConfig
      ? [
          async ({}, use) => {
            try {
              const node = new LocalNodeManager(nodeConfig)
              await node.start()

              console.log(`Node is ready on port ${node.port}`)

              await use(node)

              console.log("Node stopping...")
              await node.stop()
            } catch (error) {
              console.error("Error in node fixture:", error)
              throw error
            }
          },
          { scope: "test", auto: true },
        ]
      : undefined,
    _contextPath: async ({}, use, testInfo) => {
      const contextPath = await createTempDir(testInfo.testId)
      await use(contextPath)
      const error = await removeTempDir(contextPath)
      if (error) {
        console.error(error)
      }
    },
    context: async ({ context: currentContext, _contextPath, node }, use) => {
      try {
        const { phantomPage, phantomContext } = await PhantomWallet.initialize(
          currentContext,
          _contextPath,
          walletConfig,
        )
        sharedPhantomPage = phantomPage

        // CRITICAL: Set up Phantom-specific network interception
        if (node?.port) {
          await setupPhantomNetworkInterception(phantomContext, node.port)
        }

        await use(phantomContext)
        await phantomContext.close()
      } catch (error) {
        console.error("Error in context fixture:", error)
        throw error
      }
    },
    phantomPage: async ({ context: _ }, use) => {
      await use(sharedPhantomPage)
    },
    extensionId: async ({ context }, use) => {
      try {
        const extensionId = await getExtensionId(context, "Phantom")
        await use(extensionId)
      } catch (error) {
        console.error("Error in extensionId fixture:", error)
        throw error
      }
    },
    phantom: [
      async ({ context, extensionId }, use) => {
        try {
          const phantom = new PhantomWallet(
            walletConfig,
            context,
            sharedPhantomPage,
            extensionId,
          )
          await use(phantom)
        } catch (error) {
          console.error("Error in phantom fixture:", error)
          throw error
        }
      },
      { scope: "test", auto: true },
    ],
    setupWallet: [
      async ({ phantom, node }, use) => {
        try {
          console.log("Setting up Phantom wallet...")

          if (walletConfig.walletSetup) {
            await walletConfig.walletSetup(phantom, {
              localNodePort: node?.port || 8545,
            })
          }

          console.log("Phantom wallet setup complete")

          await use(null)
        } catch (error) {
          console.error("Error during wallet setup:", error)
          throw error
        }
      },
      { scope: "test", auto: true },
    ],
    page: async ({ page }, use) => {
      try {
        await page.goto("/")
        await use(page)
      } catch (error) {
        console.error("Error in page fixture:", error)
        throw error
      }
    },
  })
}
