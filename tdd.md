# Overview

OnchainTestKit is a comprehensive end-to-end (E2E) testing framework specifically designed for decentralized applications (DApps). Built on top of Playwright, it provides a unified solution for testing complex DApp interactions, wallet behaviors, smart contract deployments, and network interactions.

The framework addresses the unique challenges of blockchain application testing through four key components. The wallet interaction layer handles transaction approvals, signatures, and state management across different wallet types. The smart contract testing system enables deterministic deployments, state initialization, and multi-contract interactions on local nodes. The network management component provides chain state manipulation, transaction handling, and network configuration capabilities. Finally, the test isolation system ensures independent test environments with proper state cleanup and parallel execution support.

By integrating these components, OnchainTestKit enables teams to write reliable, maintainable, and comprehensive E2E tests for their DApps.

# Problem Statement

Testing DApps presents unique challenges not found in traditional web applications:

* Complex wallet interactions requiring multiple approvals and signatures  
* Network state management across different chains  
* Unpredictable transaction timing and confirmation states  
* Need for deterministic contract deployments and initializations  
* Management of multiple wallet types and their specific behaviors

# Goals

**Unified Testing Framework**

* Create a standardized approach for testing onchain applications
* Enable testing across multiple EVM-compatible chains.  
* Provide consistent testing patterns across teams and projects.  
* Reduce duplicate testing code across product groups  
  **Wallet Integration**  
* Primary support for Coinbase Wallet and MetaMask browser extension  
* Create controlled environments for wallet interactions.  
* Support multiple wallet connection scenarios and user flows.  
  **Smart Contract Deployment and Testing Environment**  
* Provide isolated and deterministic testing environments using a local blockchain node  
* Deploy and initialize smart contracts using Foundry scripts:  
  * Consistent contract addresses across test runs  
  * Reproducible initial states  
  * Configurable token balances and permissions

# Terminology

* DApp: Decentralized Application.  
* EVM: Ethereum Virtual Machine.  
* Playwright: A browser automation library supporting Chromium, Firefox, and WebKit.  
* Foundry: A modular toolkit for Ethereum development.  
* Anvil: A local Ethereum node provided by Foundry.

# Architecture

The framework follows a layered architecture designed for modularity, extensibility, and clear separation of concerns. Each layer handles specific aspects of blockchain testing while maintaining loose coupling between components.![][image1]

## Layer Responsibilities

### Test Layer

* **Test Runner**: Orchestrates test execution and manages test lifecycle  
* **Test Fixtures**: Provides pre-configured components for tests  
* **Configuration Management**: Handles test environment setup and teardown

### Wallet Layer

* **WalletManager**: Coordinates wallet operations across different wallet types  
* **Action System**: Standardizes wallet interactions through a unified interface  
* **Wallet Implementations**: Handles wallet-specific behaviors and UI interactions

### Network Layer

* **LocalNodeManager**: Controls the local blockchain environment  
* **State Management**: Manages blockchain state, including:  
  * Block production and mining  
  * Time manipulation  
  * Account balances and permissions  
  * Transaction handling

### Contract Layer

* **SmartContractManager**: Coordinates contract deployments and state setup  
* **State Management**: Handles contract initialization and verification  
* **Integration with Foundry**: Manages deterministic deployments and script execution

# Test Configuration

The framework provides a robust configuration system using the builder pattern to set up test environments in a type-safe and maintainable way.

## Wallet Configuration Builder Pattern

The builder pattern provides several key benefits:

1. **Type Safety**: Compile-time validation of configuration options  
2. **Fluent Interface**: Chainable methods for intuitive setup  
3. **Encapsulation**: Internal configuration complexity hidden from test authors  
4. **Validation**: Runtime checks for required configuration options

### Basic Configuration Examples

```javascript
// Basic MetaMask configuration
const metamaskConfig = configure()
  .withMetaMask()
  .withNetwork({
    name: baseSepolia.name,
    rpcUrl: baseSepolia.rpcUrls.default.http[0],
    chainId: baseSepolia.id,
    symbol: baseSepolia.nativeCurrency.symbol,
  })
  .build();

// Coinbase Wallet with custom setup
const coinbaseConfig = configure()
  .withCoinbase()
  .withSeedPhrase({
    seedPhrase: process.env.E2E_TEST_SEED_PHRASE,
    password: DEFAULT_PASSWORD,
  })
  .withNetwork(baseSepoliaConfig)
  .withCustomSetup(async (wallet) => {
    await wallet.handleAction(BaseActionType.ADD_TOKEN, {
      address: USDC_ADDRESS,
      symbol: 'USDC',
    });
  })
  .build();

```

### Advanced Configuration Patterns

**Multiple Wallet Support**

```javascript

configure()
  .withMetaMask()
  .withCoinbase()
  .withNetwork(baseSepoliaConfig)
  .build();
```

**Test-Specific Configuration**

```javascript
// Configuration factory for swap tests
const createSwapTestConfig = (params: SwapTestParams) => {
  return configure()
    .withMetaMask()
    .withNetwork(params.network)
    .withCustomSetup(async (wallet) => {
      // Add tokens needed for swap tests
      await wallet.handleAction(BaseActionType.ADD_TOKEN, {
        address: params.tokenInAddress,
        symbol: params.tokenInSymbol,
      });
      await wallet.handleAction(BaseActionType.ADD_TOKEN, {
        address: params.tokenOutAddress,
        symbol: params.tokenOutSymbol,
      });
    })
    .build();
};

// Usage in test
const config = createSwapTestConfig({
  network: baseSepoliaConfig,
  tokenInAddress: USDC_ADDRESS,
  tokenInSymbol: 'USDC',
  tokenOutAddress: WETH_ADDRESS,
  tokenOutSymbol: 'WETH',
});
```

# Wallet Architecture

The wallet system uses a layered architecture with abstractions to support multiple wallet types while maintaining a consistent interface for test authors. This design enables easy addition of new wallet implementations and standardized handling of wallet interactions.

## Base Wallet Interface

The framework uses an abstract base class to define common wallet behaviors:

```javascript
export abstract class BaseWallet {
  abstract handleAction(action: BaseActionType, options?: ActionOptions): Promise<void>;
}
```

This abstraction provides several key benefits:

* **Unified Interface**: All wallet implementations share the same action handling interface  
* **Type Safety**: TypeScript ensures proper action handling across implementations  
* **Extensibility**: New wallet types can be added by extending the base class  
* **Consistency**: Common behaviors are standardized across wallet types

### Action System

The action system is designed to handle all wallet interactions through a unified interface:

* **Base Actions**: Common operations across all wallet types  
* **Wallet-Specific Actions**: Extensions for wallet-specific features  
* **Action Options**: Flexible configuration for action execution

This design allows for:

* Consistent handling of wallet interactions  
* Easy addition of new action types  
* Type-safe action handling  
* Simplified test writing

## Wallet-Specific Classes

The Coinbase and MetaMask wallet classes extend BaseWallet to inherit the shared methods. If needed, these classes can override methods or add wallet-specific functionality.

### MetaMask Wallet

```javascript
import { BaseWallet, BaseActionType, ActionOptions } from './BaseWallet';

// Extend BaseActionType with MetaMask-specific actions
export enum MetaMaskSpecificActionType {
  LOCK = 'lock',
  UNLOCK = 'unlock',
  ADD_TOKEN = 'addToken',
  ADD_ACCOUNT = 'addAccount',
  RENAME_ACCOUNT = 'renameAccount',
  REMOVE_ACCOUNT = 'removeAccount',
  SWITCH_ACCOUNT = 'switchAccount',
  ADD_NETWORK = 'addNetwork',
}

export type MetaMaskActionType = BaseActionType | MetaMaskSpecificActionType;

export class MetaMask extends BaseWallet {
  async handleAction(action: MetaMaskActionType, options?: ActionOptions): Promise<void> {
  }
}
```

### Coinbase Wallet

```javascript
import { BaseWallet, BaseActionType, ActionOptions } from './BaseWallet';

// Define Coinbase extension specific action types
export enum CoinbaseSpecificActionType {
  // ...
}

export type CoinbaseActionType = BaseActionType | CoinbaseSpecificActionType;

export class Coinbase extends BaseWallet {
  async handleAction(action: BaseActionType, options?: ActionOptions): Promise<void> {
  }
}
```

#### 

### Example of how MetaMask Implements the handleAction method

#### Transaction Approval Example

```javascript
await metamask.handleAction(BaseActionType.HANDLE_SIGNATURE, {
      approvalType: ActionApprovalType.APPROVE,
});
```

When a transaction is triggered in the DApp, the MetaMask class uses Playwright to:

* Detect and focus on the wallet popup  
* Adjust gas fees if needed  
* Locate the "Approve" button using a CSS selector or XPath  
* Simulate a click on the button to approve the transaction

#### Switching Chains Example

```javascript
await metamask.handleAction(BaseActionType.SWITCH_NETWORK, {
        networkName: network.name,
        isTestnet: isTestNetwork(network),
});
```

When switching networks, the MetaMask class:

* Navigates to the settings page  
* Locates the desired network in the network dropdown menu  
* Simulates a click to confirm the network switch

By organizing the wallet connectivity logic in this way, we ensure that the framework remains flexible and easy to extend while keeping the codebase clean and maintainable. This structure also allows for efficient simulation of wallet interactions, which is crucial for thorough and realistic E2E testing of on-chain applications.

# Local Node Management

The LocalNodeManager provides a robust interface for managing local Anvil nodes, with special considerations for CI environments:

## Interface Design

```javascript

interface NodeConfig {
  // Basic node configuration
  port?: number;
  portRange?: [number, number];
  chainId?: number;
  
  // Fork settings
  forkUrl?: string;
  forkBlockNumber?: bigint;
  forkRetryInterval?: number;
  
  // Account settings
  defaultBalance?: bigint;        // Default balance for test accounts
  totalAccounts?: number;         // Number of test accounts to generate
  
  // Block settings
  blockTime?: number;             // Time between blocks (0 for instant)
  blockGasLimit?: bigint;
  
  // Advanced options
  noMining?: boolean;             // Disable mining new blocks
  hardfork?: "london" | "berlin" | "cancun"; // Specific hardfork to use
}

interface LocalNodeManager {
  // Lifecycle Management
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Chain State Management
  snapshot(): Promise<string>;                          // anvil_snapshot
  revert(snapshotId: string): Promise<void>;           // anvil_revert
  reset(forkBlock?: bigint): Promise<void>;            // anvil_reset
  
  // Block Management
  mine(blocks?: number): Promise<void>;                 // anvil_mine
  mineWithInterval(interval: number): Promise<void>;    // Sets automatic block mining interval
  setAutomine(enabled: boolean): Promise<void>;         // anvil_setAutomine
  
  // Time Management
  setNextBlockTimestamp(timestamp: number): Promise<void>;  // anvil_setNextBlockTimestamp
  increaseTime(seconds: number): Promise<void>;            // anvil_increaseTime
  setTime(timestamp: number): Promise<void>;               // anvil_setTime
  
  // Account Management
  getAccounts(): Promise<string[]>;                     // eth_accounts
  setBalance(address: string, balance: bigint): Promise<void>;  // anvil_setBalance
  setNonce(address: string, nonce: number): Promise<void>;      // anvil_setNonce
  setCode(address: string, code: string): Promise<void>;        // anvil_setCode
  
  // Contract State Management
  setStorageAt(                                        // anvil_setStorageAt
    address: string, 
    slot: string, 
    value: string
  ): Promise<void>;
  
  // Transaction Management
  setBlockGasLimit(gasLimit: bigint): Promise<void>;   // anvil_setBlockGasLimit
  dropTransaction(txHash: string): Promise<void>;      // anvil_dropTransaction
  
  // Fee Management
  setNextBlockBaseFeePerGas(fee: bigint): Promise<void>; // anvil_setNextBlockBaseFeePerGas
  setMinGasPrice(price: bigint): Promise<void>;          // anvil_setMinGasPrice
  
  // Chain Management
  setChainId(chainId: number): Promise<void>;          // anvil_setChainId
  
  // Impersonation
  impersonateAccount(address: string): Promise<void>;   // anvil_impersonateAccount
  stopImpersonatingAccount(address: string): Promise<void>; // anvil_stopImpersonatingAccount
  
  // Diagnostic Methods
  getLogs(): Promise<string[]>;
  getNodeInfo(): Promise<NodeInfo>;
}

```

This interface design provides:

* Complete control over the local blockchain environment  
* Robust state management capabilities  
* Comprehensive testing utilities  
* Clear separation of concerns  
* Type-safe operation

The LocalNodeManager serves as the foundation for reliable and deterministic blockchain testing, enabling complex test scenarios while maintaining isolation and reproducibility.

## Key Capabilities Explanation

**Chain State Manipulation**

* snapshot & revert: Create and restore chain state snapshots  
* reset: Reset to initial state or specific fork block

```javascript
// Test setup with state isolation
const snapshotId = await nodeManager.snapshot();
try {
  // Run test that modifies state
  await runTest();
} finally {
  // Restore original state
  await nodeManager.revert(snapshotId);
}
```

**Time Control Three methods for time manipulation:**

* setNextBlockTimestamp: Set exact timestamp for next block  
* increaseTime: Move time forward by specified seconds  
* setTime: Set absolute time

```javascript
// Testing time-dependent contracts
await nodeManager.increaseTime(7 * 24 * 60 * 60); // Skip 7 days
await nodeManager.mine(); // Mine new block with new timestamp
```

**Account and Contract Manipulation**

Direct state modifications:

* Set account balances  
* Modify contract code  
* Change storage values  
* Adjust nonces

```javascript
// Setup test conditions
await nodeManager.setBalance(userAddress, parseEther('100'));
await nodeManager.setCode(contractAddress, contractBytecode);
```

**Mining Control**

Fine-grained control over block production:

* Manual mining  
* Automatic mining with intervals  
  * Configure faster block times in test environments  
  * Use noMining mode when appropriate  
* Control gas pricing:  
  * Set base fee for EIP-1559  
  * Configure minimum gas price  
  * Adjust block gas limit

```javascript
// Control mining and gas behavior
await nodeManager.setAutomine(false);
await nodeManager.setBlockGasLimit(parseEther('30000000'));
await nodeManager.setNextBlockBaseFeePerGas(parseGwei('1'));
await nodeManager.setMinGasPrice(0n);
```

**Account Impersonation**

* Test specific accounts without private keys  
* Useful for testing privileged operations

```javascript

// Test admin functions
await nodeManager.impersonateAccount(adminAddress);
try {
  // Execute admin-only contract calls
  await executeAdminOperation();
} finally {
  await nodeManager.stopImpersonatingAccount(adminAddress);
}
```

## Integration with Test Framework

### Common Testing Patterns

#### Fork Testing

```javascript
const localNodeManager = new LocalNodeManager({
  forkUrl: process.env.MAINNET_RPC_URL,
  forkBlockNumber: 15_000_000n,
  noMining: true
});
```

#### State Isolation

```javascript
beforeEach(async () => {
  const snapshot = await localNodeManager.snapshot();
  testContext.snapshotId = snapshot;
});

afterEach(async () => {
  await localNodeManager.revert(testContext.snapshotId);
});


```

####  **Complex Contract Testing**

```javascript
test('vesting schedule', async ({ localNodeManager }) => {
  // Setup initial state
  await localNodeManager.setBalance(vestingContract, parseEther('1000'));
  
  // Time travel to vesting cliff
  await localNodeManager.increaseTime(365 * 24 * 60 * 60);
  await localNodeManager.mine();
  
  // Verify vested amount
  const vested = await vestingContract.vestedAmount();
  expect(vested).to.equal(expectedAmount);
});
```

#### Full Example

```javascript
// Example test using LocalNodeManager
test('complex DeFi interaction', async ({ page, metamask, localNodeManager }) => {
  // Start local node with specific configuration
  await localNodeManager.start({
    forkUrl: process.env.MAINNET_RPC_URL,
    forkBlockNumber: 15_000_000n,
    blockTime: 1
  });

  // Take snapshot before test
  const snapshot = await localNodeManager.snapshot();

  try {
    // Set up test conditions
    await localNodeManager.setBalance(
      testWalletAddress,
      parseEther('100')
    );

    // Run test
    await page.goto('/swap');
    await metamask.handleAction(BaseActionType.CONNECT_TO_DAPP);
    
    // Simulate time-dependent conditions
    await localNodeManager.increaseTime(3600); // 1 hour
    
    // Complete test
    await metamask.handleAction(BaseActionType.HANDLE_SIGNATURE, {
      approvalType: ActionApprovalType.APPROVE,
    })
  } finally {
    // Clean up
    await localNodeManager.revert(snapshot);
    await localNodeManager.stop();
  }
});
```

# Smart Contract Management

The smart contract management system provides a bridge between E2E tests and smart contract deployments. It enables test engineers to create reproducible test environments while allowing smart contract engineers to maintain control over contract deployment and initialization logic.

This system addresses several key challenges in DApp testing:

* Creating consistent test environments across different test runs  
* Managing complex contract dependencies and states  
* Enabling parallel test execution without state interference  
* Providing type-safe contract state management  
* Supporting both local and CI environments

## Design Philosophy

The design is built on three fundamental principles:

**Deterministic Environments**

1. Every test run must start from an identical blockchain state  
2. Contract addresses must remain consistent across test runs  
3. State initialization must be explicit and reproducible

This ensures that tests are reliable and debuggable, and that test failures are due to actual issues rather than environment inconsistencies.

**Collaboration-First Approach**

4. Smart contract engineers own deployment and state setup logic  
5. Test engineers specify desired contract states for tests  
6. Clear separation of responsibilities between teams

This division of responsibilities ensures that each team can work efficiently within their domain of expertise.

**Simplicity Over Complexity**

7. Single entry point for contract setup  
8. Minimal framework overhead  
9. Clear integration points between test and contract code

By keeping the interface simple, we reduce the likelihood of errors and make the system easier to maintain.

## Smart Contract State Management

The smart contract state management is built around three core interfaces that establish a clear contract between E2E test code and smart contract deployment and initialization code:

### Setup Configuration Interface

```javascript
   /**
    * Main configuration for setting up test environment
    * Used by test engineers to specify contract deployments and initialization
    */
   interface SetupConfig {
     // Contract deployments with deterministic addresses
     deployments: DeployConfig[];
     // Initialization calls to set up contract states
     initCalls: InitCall[];
   }
```

This interface defines how test engineers specify:

* Which contracts to deploy and where (deterministic addresses)  
* What initialization calls to make after deployment  
* The sequence of operations to set up the test environment

### Deployment Configuration Interface

```javascript
   /**
    * Configuration for deploying a single contract
    * Uses Foundry's deployCodeTo for deterministic addresses
    */
   interface DeployConfig {
     // Contract name (matches artifact name in /out directory)
     name: string;
     // Deterministic deployment address
     address: string;
     // Constructor arguments (ABI-encoded)
     args: string;
     // ETH value to send with call
     value: bigint;
   }
```

This interface enables:

* Deterministic contract deployments using Foundry  
* Consistent contract addresses across test runs  
* Type-safe constructor argument handling

### Initialization Call Interface

```javascript
   /**
    * Configuration for contract initialization calls
    * Executed in sequence after deployments
    */
   interface InitCall {
     // Account making the call (using vm.prank)
     sender: string;
     // Contract being called
     target: string;
     // Function selector (4 bytes)
     selector: string;
     // Encoded function arguments
     args: string;
     // ETH value to send with call
     value: bigint;
   }

```

This interface provides:

* Explicit control over who makes each call  
* Clear function selection and argument encoding  
* Support for payable functions  
* Sequential execution of initialization steps

### Example Usage

```javascript
{
    // Deploy USDC
    deployments: [
        {
            name: 'MockUSDC',
            address: mockUsdcAddress,
            args: encodeConstructorArgs([
                'USD Coin',
                'USDC',
                6
            ])
        }
    ],
    // Initialize states
    initCalls: [
        {
            sender: admin,
            target: mockUsdcAddress,
            selector: getSelector(mockUsdcAbi, 'mint'),
            args: encodeArgs([buyer, parseUnits('1000', 6)]),
            value: 0n
        }
    ]
}
```

## Component Responsibilities

## The system consists of two main components:

Owned by smart contract engineers, this Foundry script handles:

* Contract deployment using `vm.deployCodeTo`  
* State initialization  
* Contract verification

```javascript
contract ContractStateSetup is Script {
    function run(string memory configJson) public {
        // Deploy and initialize contracts based on config
    }
}
```

Example Setup Script (Solidity)

```javascript
// contracts/test/e2e/ContractStateSetup.s.sol
contract ContractStateSetup is Script {
    struct DeployConfig {
        string name;           // Contract name (matches artifact name)
        address deployTo;      // Deterministic address
        bytes args;           // Constructor arguments
    }

    struct InitCall {
        address sender;       // Account making the call
        address target;       // Contract being called
        bytes4 selector;      // Function selector
        bytes args;           // Encoded arguments
        uint256 value;        // ETH value to send
    }

    struct SetupConfig {
        DeployConfig[] deployments;
        InitCall[] initCalls;  // Initialization calls in sequence
    }

    function run(string memory configJson) public {
        SetupConfig memory config = abi.decode(
            vm.parseJson(configJson),
            (SetupConfig)
        );

        vm.startBroadcast();

        // Deploy contracts
        for (uint i = 0; i < config.deployments.length; i++) {
            DeployConfig memory deployment = config.deployments[i];
            
            bytes memory bytecode = vm.getCode(string.concat("out/", deployment.name, ".sol:", deployment.name))
            
            vm.deployCodeTo(
                bytecode,
		   deployment.args
                deployment.deployTo
            );
        }

        // Initialize contracts
        for (uint i = 0; i < config.initCalls.length; i++) {
            InitCall memory call = config.initCalls[i];
            
            // Set msg.sender
            vm.prank(call.sender);
            
            // Set msg.value if needed
            if (call.value > 0) {
                vm.deal(call.sender, call.value);
            }
            
            // Make the call
            (bool success,) = call.target.call{value: call.value}(
                abi.encodePacked(call.selector, call.args)
            );
            require(success, "Init call failed");
        }

        vm.stopBroadcast();
    }
}

```

### Smart Contract Manager (Typescript)

The Smart Contract Manager is a core component of OnchainTestKit that manages smart contract deployments and state initialization. It is provided as a built-in Playwright fixture, making it readily available in test files alongside other fixtures like `page` and wallet instances.

Key responsibilities:

* Orchestrates contract deployments through Foundry scripts  
* Manages contract state initialization  
* Verifies deployment and setup success  
* Handles cleanup between tests

Core functionality:

```javascript

class SmartContractManager {
    async setContractState(config: SetupConfig): Promise<void>;
    // Verify each contract is deployed and initialized correctly
    async verifySetup(config: SetupConfig): Promise<void>
}
```

## Environment Configuration

Required environment variables:

```
# Required
E2E_CONTRACT_PROJECT_ROOT=/path/to/contracts    # Path to smart contract project
E2E_CONTRACT_SETUP_SCRIPT=script/Setup.s.sol    # Path to setup script (relative to project root)

# Optional
E2E_CONTRACT_NETWORK=anvil                      # Network for contract deployment
```

# Step-by-Step Setup Guide

To set up an end-to-end (E2E) testing framework for on-chain applications using Playwright, follow the steps below. This guide covers the installation of necessary tools, configuration of the testing environment, and examples of testing wallet interactions and smart contract deployments.

This guide demonstrates how to set up and test a simple NFT marketplace DApp where users can:

* List NFTs for sale with USDC as the payment token  
* Buy NFTs using USDC  
* View their owned and listed NFTs

The example shows how to:

1. Set up the test environment with deterministic contract deployments  
2. Initialize contracts with specific states (minting tokens, approving contracts)  
3. Test user interactions through the UI  
4. Handle wallet interactions (approvals and transactions)  
5. Verify the final state

The test flow simulates a complete NFT purchase:

1. Admin mints USDC to the buyer  
2. Admin mints an NFT to the seller  
3. Seller approves the marketplace to transfer their NFT  
4. Seller lists the NFT for 100 USDC  
5. Buyer connects their wallet  
6. Buyer approves USDC spending  
7. Buyer purchases the NFT

Key components:

* Setup.s.sol: Foundry script for deterministic contract deployment and initialization  
* marketplace.spec.ts: E2E test file containing the NFT purchase test  
* metamaskWalletConfig.ts: Wallet configuration for test environment

**1\. Prerequisites**

Ensure you have the following installed on your system:

* [Node.js](https://nodejs.org/) (version 14 or higher)  
* [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)  
* Foundry for smart contract development

---

**2\. Install Dependencies**

Install Playwright and the **@coinbase/onchaintestkit** package:

```javascript
yarn add -D playwright/test @coinbase/onchaintestkit
```

* playwright: Automates browser interactions.  
* @coinbase/onchaintestkit: Provides all the tools needed for E2E browser testing of on-chain apps.

---

**4\. Configure Playwright**

Create a playwright.config.js file in the root directory:

```javascript
// playwright.config.js

module.exports = {
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: process.env.E2E_TEST_BASE_URL || 'http://localhost:3000', // Default to your DApp URL
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
};
```

This configuration sets a base URL for all tests, which can be overridden using an environment variable.

---

**6\. Set Up Environment Variables**

Create a .env.e2e file in the root directory to configure settings for **@coinbase/onchaintestkit**:

```javascript
E2E_CONTRACT_PROJECT_ROOT=../nftMarketplaceSmartContracts
E2E_CONTRACT_SETUP_SCRIPT=test/e2e/Setup.s.sol
E2E_CONTRACT_NETWORK=anvil
E2E_TEST_SEED_PHRASE="secret seed phrase"
```

Make sure to add .env.e2e to your .gitignore file to prevent sensitive information from being committed to your version control system.  
When configuring your CI/CD setup (e.g., GitHub Actions), ensure to load these variables using github secrets/env variables

## 2\. Smart Contract Setup Script

```javascript
// contracts/test/e2e/Setup.s.sol
contract Setup is Script {
    struct DeployConfig {
        string name;           // Contract name (matches artifact name)
        address deployTo;      // Deterministic address
        bytes args;           // Constructor arguments
    }

    struct InitCall {
        address sender;       // Account making the call
        address target;       // Contract being called
        bytes4 selector;      // Function selector
        bytes args;           // Encoded arguments
        uint256 value;        // ETH value to send
    }

    struct SetupConfig {
        DeployConfig[] deployments;
        InitCall[] initCalls;  // Initialization calls in sequence
    }

    function run(string memory configJson) public {
        SetupConfig memory config = abi.decode(
            vm.parseJson(configJson),
            (SetupConfig)
        );

        vm.startBroadcast();

        // Deploy contracts
        for (uint i = 0; i < config.deployments.length; i++) {
            DeployConfig memory deployment = config.deployments[i];
            
            bytes memory bytecode = abi.encodePacked(
                // format: vm.getCode(<contractName>.sol:<contractName>)
                vm.getCode(string.concat(deployment.name, ".sol:", deployment.name)),
                deployment.args
            );
            
            vm.deployCodeTo(
                bytecode,
                deployment.args,
                deployment.value,
                deployment.target
            );
        }

        // Initialize contracts
        for (uint i = 0; i < config.initCalls.length; i++) {
            InitCall memory call = config.initCalls[i];
            
            // Set msg.sender
            vm.prank(call.sender);
            
            // Set msg.value if needed
            if (call.value > 0) {
                vm.deal(call.sender, call.value);
            }
            
            // Make the call
            (bool success,) = call.target.call{value: call.value}(
                abi.encodePacked(call.selector, call.args)
            );
            require(success, "Init call failed");
        }

        vm.stopBroadcast();
    }
}

```

#### 

## 3\. Wallet Configuration

```javascript
// e2e/walletConfig/metamaskWalletConfig.ts
import { configure } from '@coinbase/onchaintestkit';
import { baseSepolia } from 'viem/chains';

export const metamaskWalletConfig = configure()
  .withMetaMask()
  .withSeedPhrase({
    seedPhrase: process.env.E2E_TEST_SEED_PHRASE ?? '',
    password: 'test-password',
  })
  .withNetwork({
    name: baseSepolia.name,
    rpcUrl: baseSepolia.rpcUrls.default.http[0],
    chainId: baseSepolia.id,
    symbol: baseSepolia.nativeCurrency.symbol,
  })
  .build();

```

## 4\. E2E Test Example

```javascript
// e2e/tests/marketplace.spec.ts
import {
    mockUsdcAbi,
    mockUsdcAddress,
    mockNftAbi,
    mockNftAddress,
    nftMarketplaceAbi,
    nftMarketplaceAddress
} from '@generated/generated';
import { getSelector, encodeConstructorArgs } from '../utils/abiUtils';
import { metamaskWalletConfig } from 'e2e/walletConfig/metamaskWalletConfig';
import { createOnchainTest } from '@coinbase/onchaintestkit';

const test = createOnchainTest(metamaskWalletConfig);

test('buy NFT with USDC', async ({ page, metamask, smartContractManager }) => {
    const buyer = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const seller = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
    const admin = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    
    // Get function selectors from ABIs
    const SELECTORS = {
        USDC: {
            MINT: getSelector(mockUsdcAbi, 'mint'),
            APPROVE: getSelector(mockUsdcAbi, 'approve')
        },
        NFT: {
            MINT: getSelector(mockNftAbi, 'mint'),
            APPROVE: getSelector(mockNftAbi, 'approve')
        },
        MARKETPLACE: {
            LIST_NFT: getSelector(nftMarketplaceAbi, 'listNFT')
        }
    };

    await smartContractManager.setContractState({
        deployments: [
            {
                name: 'MockUSDC',
                address: mockUsdcAddress,
                args: encodeConstructorArgs(mockUsdcAbi, [
                    'USD Coin',
                    'USDC',
                    6
                ])
            },
            {
                name: 'MockNFT',
                address: mockNftAddress,
                args: encodeConstructorArgs(mockNftAbi, [
                    'Test NFT',
                    'TNFT',
                    'https://api.example.com/nft/'
                ])
            },
            {
                name: 'NFTMarketplace',
                address: nftMarketplaceAddress,
                args: encodeConstructorArgs(nftMarketplaceAbi, [mockUsdcAddress])
            }
        ],
        initCalls: [
            // Mint USDC to buyer
            {
                sender: admin,
                target: mockUsdcAddress,
                selector: SELECTORS.USDC.MINT,
                args: encodeArgs([buyer, parseUnits('1000', 6)]),
                value: 0
            },
            // Mint NFT to seller
            {
                sender: admin,
                target: mockNftAddress,
                selector: SELECTORS.NFT.MINT,
                args: encodeArgs([seller, 1]),  // tokenId 1
                value: 0
            },
            // Seller approves marketplace for NFT
            {
                sender: seller,
                target: mockNftAddress,
                selector: SELECTORS.NFT.APPROVE,
                args: encodeArgs([nftMarketplaceAddress, 1]),
                value: 0
            },
            // Seller lists NFT
            {
                sender: seller,
                target: nftMarketplaceAddress,
                selector: SELECTORS.MARKETPLACE.LIST_NFT,
                args: encodeArgs([
                    mockNftAddress,
                    1,  // tokenId
                    parseUnits('100', 6)  // price in USDC
                ]),
                value: 0
            }
        ]
    });

    // Test buying flow
await page.goto('/marketplace');

// Connect wallet (as buyer)
await page.getByTestId('connect-wallet-button').click();
await metamask.handleAction(BaseActionType.CONNECT_TO_DAPP);

// Find first NFT card and click its buy button
const firstNftCard = page.getByTestId('nft-card').first();
await firstNftCard.getByTestId('buy-button').click();

// Approve USDC spending
let notificationType = await metamask.identifyNotificationType();
if (notificationType === NotificationPageType.SpendingCap) {
    await metamask.handleAction(BaseActionType.CHANGE_SPENDING_CAP, {
        approvalType: ActionApprovalType.APPROVE
    });
}

// Confirm purchase transaction
notificationType = await metamask.identifyNotificationType();
if (notificationType === NotificationPageType.Transaction) {
    await metamask.handleAction(BaseActionType.HANDLE_TRANSACTION, {
        approvalType: ActionApprovalType.APPROVE
    });
}

// Verify purchase using the same card
await expect(firstNftCard.getByTestId('owner')).toHaveText(buyer);
await expect(firstNftCard.getByTestId('status')).toHaveText('Owned');
});


```

---

## 5\. Running Tests

Execute the tests using the following command:

```javascript
yarn playwright test
```

This will execute all tests in the tests directory, leveraging the base URL and wallet configurations specified in your playwright.config.js and .env.e2e file.

By following this structure and referring to the Playwright documentation, you can write comprehensive and reliable E2E tests for your on-chain applications.

---

## 6\. Continuous Integration (CI) Setup

Set up GitHub Actions for CI:

Create a .github/workflows/e2e.yml file:

```javascript
name: E2E Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    environment: CI
    timeout-minutes: 20
    runs-on:
      - default-config
      - amd64
      - large
    steps:
    - uses: actions/checkout@v4
    - name: Get yarn cache directory path
      id: yarn-cache-dir-path
      run: echo "dir=$(yarn cache dir)" >> $GITHUB_OUTPUT
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - uses: actions/cache@v4
      id: yarn-cache # use this to check for `cache-hit` (`steps.yarn-cache.outputs.cache-hit != 'true'`)
      with:
        path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
        key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
        restore-keys: |
          ${{ runner.os }}-yarn-
    # Only install if cache miss
    - name: Install dependencies
      if: steps.yarn-cache.outputs.cache-hit != 'true'
      run: npm install -g yarn && yarn
        
    - name: Install Playwright Browsers
      run: yarn playwright install --with-deps
    - name: Install xvfb
      run: sudo apt-get install -y xvfb
    - name: Build application
      run: yarn build
    - name: Run Playwright tests with xvfb
      run: xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" yarn playwright test
      env:
        E2E_TEST_SEED_PHRASE: ${{ secrets.E2E_TEST_SEED_PHRASE }}
    - uses: actions/upload-artifact@v3
      if: ${{ !cancelled() }}
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 10
```

This workflow installs dependencies and runs Playwright tests on pushes to the main branch and on pull requests.