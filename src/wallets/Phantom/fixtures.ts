import { BrowserContext, test as base } from "@playwright/test"
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
  setupWallet: null
  node: LocalNodeManager
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
      await removeTempDir(contextPath)
    },
    phantom: async ({ _contextPath }, use) => {
      let phantomContext: BrowserContext | undefined
      try {
        const { phantomPage, phantomContext: newContext } =
          await PhantomWallet.initialize(
            // @ts-ignore
            null,
            _contextPath,
            walletConfig,
          )
        phantomContext = newContext

        const extensionId = await getExtensionId(phantomContext, "Phantom")
        console.log(`Phantom extension ID: ${extensionId}`)

        const phantom = new PhantomWallet(
          walletConfig,
          phantomContext,
          phantomPage,
          extensionId,
        )

        await use(phantom)
      } finally {
        // Cleanup
        if (phantomContext) {
          try {
            await phantomContext.close()
          } catch (error) {
            console.warn("Error closing phantom context:", error)
          }
        }
      }
    },
    setupWallet: [
      async ({ phantom, node }, use) => {
        if (!phantom) throw new Error("Phantom is not initialized")

        console.log("Setting up Phantom wallet...")

        try {
          if (walletConfig.walletSetup) {
            await walletConfig.walletSetup(phantom, {
              localNodePort: node?.port || 8545,
            })
          }
        } catch (error) {
          console.error("Error during wallet setup:", error)
          throw error
        }

        console.log("Phantom wallet setup complete")

        await use(null)
      },
      { scope: "test", auto: true },
    ],
  })
}
