# @coinbase/onchaintestkit

## 1.3.1

### Patch Changes

- 4795be4: fix: improve CI reliability for MetaMask notification handling

  - Replace fire-and-forget isVisible() checks with polling loop for notification type detection
  - Add page caching to avoid stale page race conditions between notification detection and action handlers
  - Add bounded retry wrapper (withRetry v2) to notification action handlers for CI resilience
  - Apply biome lint and format fixes across all source files
  - Temporarily skip Phantom, Coinbase, and Smart Wallet tests to focus on MetaMask CI stability

## 1.2.0

### Minor Changes

- e669f93: Updating exports for OCTK
- 104c5ba: fixing cbw bugs

## 1.0.0

### Major Changes

- Releasing OCTK to open source
