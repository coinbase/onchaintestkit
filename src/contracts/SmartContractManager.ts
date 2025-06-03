import { spawn } from "child_process"
import path from "path"
import { ethers } from "ethers"
import { SetupConfig } from "./types"

/**
 * SmartContractManager handles deployment and initialization of smart contracts
 * for E2E testing. It uses Foundry for deterministic deployments and provides
 * verification of deployed contracts.
 *
 * Features:
 * - Deterministic contract deployments
 * - State initialization
 * - Deployment verification
 * - Integration with Foundry scripts
 *
 * @example
 * ```typescript
 * const manager = new SmartContractManager();
 * await manager.setContractState({
 *   deployments: [{
 *     name: 'MockUSDC',
 *     address: mockUsdcAddress,
 *     args: encodeConstructorArgs(['USD Coin', 'USDC', 6])
 *   }],
 *   initCalls: [{
 *     sender: admin,
 *     target: mockUsdcAddress,
 *     selector: getSelector(mockUsdcAbi, 'mint'),
 *     args: encodeArgs([buyer, parseUnits('1000', 6)]),
 *     value: 0n
 *   }]
 * });
 * ```
 */
export class SmartContractManager {
  private readonly projectRoot: string

  private readonly setupScript: string

  private readonly provider: ethers.providers.JsonRpcProvider

  /**
   * Creates a new SmartContractManager instance
   * @param projectRoot - Path to smart contract project root
   * @param setupScript - Path to Foundry setup script (relative to project root)
   * @param rpcUrl - RPC URL for contract verification
   */
  constructor(
    projectRoot: string = process.env.E2E_CONTRACT_PROJECT_ROOT ?? "",
    setupScript: string = process.env.E2E_CONTRACT_SETUP_SCRIPT ?? "",
    rpcUrl = "http://localhost:8545",
  ) {
    if (!projectRoot) {
      throw new Error("Contract project root not specified")
    }
    if (!setupScript) {
      throw new Error("Setup script not specified")
    }

    this.projectRoot = projectRoot
    this.setupScript = setupScript
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  }

  /**
   * Sets up contract state by deploying contracts and initializing state
   * @param config - Configuration for deployments and initialization
   */
  async setContractState(config: SetupConfig): Promise<void> {
    // Validate config
    SmartContractManager.validateConfig(config)

    // Run Foundry script
    await this.runFoundryScript(config)

    // Verify setup
    await this.verifySetup(config)
  }

  /**
   * Verifies that contracts were deployed successfully
   * @param config - Setup configuration to verify
   */
  async verifySetup(config: SetupConfig): Promise<void> {
    // Verify deployments
    for (const deployment of config.deployments) {
      const code = await this.provider.getCode(deployment.address)
      if (code === "0x") {
        throw new Error(`Contract not deployed at ${deployment.address}`)
      }
    }

    // Additional verification could be added here
    // For example, checking specific storage slots or contract state
  }

  /**
   * Validates setup configuration
   * @param config - Configuration to validate
   * @throws Error if configuration is invalid
   * @private
   */
  private static validateConfig(config: SetupConfig): void {
    if (!config.deployments?.length) {
      throw new Error("No deployments specified")
    }

    // Validate each deployment
    for (const deployment of config.deployments) {
      if (!deployment.name) {
        throw new Error("Deployment name is required")
      }
      if (!ethers.utils.isAddress(deployment.address)) {
        throw new Error(`Invalid address for deployment ${deployment.name}`)
      }
    }

    // Validate init calls if present
    if (config.initCalls) {
      for (const call of config.initCalls) {
        if (!ethers.utils.isAddress(call.sender)) {
          throw new Error("Invalid sender address")
        }
        if (!ethers.utils.isAddress(call.target)) {
          throw new Error("Invalid target address")
        }
      }
    }
  }

  /**
   * Runs Foundry script to deploy and initialize contracts
   * @param config - Setup configuration
   * @returns Promise that resolves when script completes
   * @private
   */
  private async runFoundryScript(config: SetupConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.projectRoot, this.setupScript)
      const configJson = JSON.stringify(config)

      const process = spawn(
        "forge",
        ["script", scriptPath, "--sig", "run(string)", configJson],
        {
          cwd: this.projectRoot,
          stdio: ["ignore", "pipe", "pipe"],
        },
      )

      let error = ""
      process.stdout.on("data", (data: Buffer) => {
        console.log(data.toString())
      })

      process.stderr.on("data", (data: Buffer) => {
        error += data.toString()
      })

      process.on("close", code => {
        if (code !== 0) {
          reject(new Error(`Foundry script failed: ${error}`))
        } else {
          resolve()
        }
      })
    })
  }
}
