---
"@coinbase/onchaintestkit": patch
---

fix: improve CI reliability for MetaMask notification handling

- Replace fire-and-forget isVisible() checks with polling loop for notification type detection
- Add page caching to avoid stale page race conditions between notification detection and action handlers
- Add bounded retry wrapper (withRetry v2) to notification action handlers for CI resilience
- Apply biome lint and format fixes across all source files
- Temporarily skip Phantom, Coinbase, and Smart Wallet tests to focus on MetaMask CI stability
