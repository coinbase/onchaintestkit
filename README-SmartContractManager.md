# SmartContractManager with CREATE2 Deployment

The `SmartContractManager` has been completely rewritten to use `viem` instead of `ethers` and now supports deterministic contract deployment using CREATE2.

## Key Features

- **CREATE2 Deployment**: Deploy contracts at deterministic addresses using CREATE2 opcodes
- **Viem Integration**: Uses viem library for better performance and type safety
- **Automatic Proxy Management**: Automatically deploys and manages the deterministic deployment proxy
- **Contract Interaction**: Execute contract function calls after deployment
- **Foundry Integration**: Loads contract artifacts from Foundry's compilation output

## Setup

### 1. Compile Contracts

Make sure your smart contracts are compiled with Foundry:

```bash
cd example/smart-contracts
forge build
```

### 2. Deploy Deterministic Deployment Proxy

The proxy is automatically deployed when you initialize the SmartContractManager, but you can also deploy it manually:

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222"],"id":1}'
```

## Usage

### Basic Example

```typescript
import { SmartContractManager } from "./src/contracts/SmartContractManager"
import { LocalNodeManager } from "./src/node/LocalNodeManager"

async function deployAndInteract() {
  // 1. Start local node
  const node = new LocalNodeManager({ chainId: 31337, port: 8545 })
  await node.start()

  // 2. Initialize contract manager
  const contractManager = new SmartContractManager("./smart-contracts")
  await contractManager.initialize(node)

  // 3. Deploy a contract using CREATE2
  const tokenAddress = await contractManager.deployContract({
    name: "SimpleToken",
    args: [], // Constructor arguments
    salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
    deployer: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", // Anvil's first account
  })

  // 4. Interact with the deployed contract
  const txHash = await contractManager.executeCall({
    target: tokenAddress,
    functionName: "mint",
    args: [
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", // recipient
      1000000000000000000n, // amount (1 token with 18 decimals)
    ],
    account: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", // caller
  })

  console.log(`Token deployed at: ${tokenAddress}`)
  console.log(`Mint transaction: ${txHash}`)

  await node.stop()
}
```

### Batch Operations

```typescript
// Deploy multiple contracts and execute multiple calls
await contractManager.setContractState({
  deployments: [
    {
      name: "SimpleToken",
      args: [],
      salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
      deployer: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    },
    {
      name: "AnotherContract", 
      args: ["constructor", "arguments"],
      salt: "0x0000000000000000000000000000000000000000000000000000000000000002",
      deployer: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    },
  ],
  calls: [
    {
      target: "0x...", // deployed contract address
      functionName: "initialize",
      args: ["init", "params"],
      account: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    },
  ],
}, node)
```

## Type Definitions

### ContractDeployment

```typescript
interface ContractDeployment {
  name: string          // Contract name (must match .sol filename)
  args: any[]          // Constructor arguments
  salt: Hex            // 32-byte salt for CREATE2
  deployer: Address    // Account that deploys the contract
}
```

### ContractCall

```typescript
interface ContractCall {
  target: Address       // Contract address to call
  functionName: string  // Function name to call
  args: any[]          // Function arguments
  account: Address     // Account making the call
  value?: bigint       // ETH value to send (optional)
}
```

### SetupConfig

```typescript
interface SetupConfig {
  deployments?: ContractDeployment[]
  calls?: ContractCall[]
}
```

## Benefits of CREATE2

1. **Deterministic Addresses**: Contracts are deployed at the same address across different networks
2. **Predictable Testing**: You can predict contract addresses before deployment
3. **Factory Patterns**: Enables advanced factory contract patterns
4. **Cross-chain Compatibility**: Same addresses on different chains (if using same salt and bytecode)

## Troubleshooting

### Common Issues

1. **Artifact Not Found**: Make sure contracts are compiled with `forge build`
2. **Proxy Not Deployed**: The manager automatically deploys the proxy, but check if it fails
3. **ABI Errors**: Ensure you deploy contracts through the manager before calling them

### Address Prediction

You can predict where a contract will be deployed:

```typescript
// The address is deterministic based on:
// - Proxy address (0x4e59b44847b379578588920ca78fbf26c0b4956c)
// - Salt (your choice)
// - Contract bytecode + constructor args
```

## Migration from Ethers

The new implementation replaces the ethers-based approach with:

- ✅ Faster viem client
- ✅ Better TypeScript support  
- ✅ CREATE2 deterministic deployment
- ✅ Automatic proxy management
- ✅ Simplified contract interaction

## Files Changed

- `src/contracts/SmartContractManager.ts` - Main implementation
- `src/contracts/types.ts` - Updated type definitions
- `src/contracts/ProxyDeployer.ts` - Proxy deployment utility
- `example/example-usage.ts` - Usage example 