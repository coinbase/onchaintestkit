import { type Page } from "@playwright/test"
import { test as base } from "@playwright/test"
import { createTempDir } from "../../utils/createTempDir"
import { removeTempDir } from "../../utils/removeTempDir"
import { MetaMaskConfig } from "../types"
import { LocalNodeManager } from "../../node/LocalNodeManager"
import { NodeConfig } from "../../node/types"
import { getExtensionId } from "../../utils/extensionManager"
import { MetaMask } from "."

type MetaMaskFixturesType = {
  _contextPath: string
  metamask: MetaMask
  extensionId: string
  metamaskPage: Page
  setupWallet: null
  node: LocalNodeManager
}

let sharedMetamaskPage: Page

export const MetaMaskFixturesBuilder = (
  walletConfig: MetaMaskConfig,
  nodeConfig: NodeConfig | undefined,
) => {
  return base.extend<MetaMaskFixturesType>({
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
    context: async ({ context: currentContext, _contextPath }, use) => {
      try {
        const { metamaskContext, metamaskPage } = await MetaMask.initialize(
          currentContext,
          _contextPath,
          walletConfig,
        )
        sharedMetamaskPage = metamaskPage
        await use(metamaskContext)
        await metamaskContext.close()
      } catch (error) {
        console.error("Error in context fixture:", error)
        throw error
      }
    },
    metamaskPage: async ({ context: _ }, use) => {
      await use(sharedMetamaskPage)
    },
    extensionId: async ({ context }, use) => {
      try {
        const extensionId = await getExtensionId(context, "MetaMask")
        await use(extensionId)
      } catch (error) {
        console.error("Error in extensionId fixture:", error)
        throw error
      }
    },
    metamask: [
      async ({ context, extensionId }, use) => {
        try {
          const metamask = new MetaMask(
            walletConfig,
            context,
            sharedMetamaskPage,
            extensionId,
          )
          await use(metamask)
        } catch (error) {
          console.error("Error in metamask fixture:", error)
          throw error
        }
      },
      { scope: "test", auto: true },
    ],
    setupWallet: [
      async ({ metamask, node }, use) => {
        try {
          console.log("Running wallet setup...")

          await walletConfig.walletSetup(metamask, {
            localNodePort: node.port,
          })

          await use(null)
        } catch (error) {
          console.error("Error in setupWallet fixture:", error)
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
