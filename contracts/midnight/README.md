# Midnight Smart Contracts

This folder contains the **Midnight Minokawa contract** for AtlasCred privacy-preserving credit scores using **zero-knowledge proofs**.

**Language**: Minokawa v0.18 (formerly Compact)  
**Compiler**: v0.26.0  
**Foundation**: Linux Foundation Decentralized Trust (LFDT)

## Contract: `score-proof.compact`

### Zero-Knowledge Features

The contract uses Midnight's ZK capabilities to enable:

1. **Private Score Storage**: Exact credit score (300-850) stored in private state, never revealed
2. **Selective Disclosure**: User can prove they're in a score bucket without revealing exact score
3. **Threshold Proofs**: Lender can verify "score >= X" without learning the exact value
4. **Privacy Preservation**: Score hash + nonce prevent any data leakage

### Circuits (ZK Transactions)

#### `initializeScore` (Private)
- Owner locks their credit score in private state
- Public state only shows bucket (0-4), not exact score
- Hash protects score from reverse engineering

#### `verifyBucket` (ZK Proof)
- **What it proves**: "My score is in bucket N"
- **What it hides**: Exact score value
- **Use case**: Lender needs to know user is "good credit" (bucket 3-4) but doesn't need exact score

#### `proveMinimumScore` (ZK Proof)
- **What it proves**: "My score is >= threshold"
- **What it hides**: Exact score value
- **Use case**: Loan requires minimum 650 score, user proves they qualify without revealing they have 782

#### `updateScore` (Private)
- Owner refreshes score with new data
- Updates private state and public bucket
- Extends expiry by 7 days

#### `revokeProof` (Private)
- Owner can deactivate proof at any time
- Sets `isActive` to false

### State Design

**Private State** (ZK-protected, only owner sees):
- `owner`: Address of credit score owner
- `exactScore`: Actual score value (300-850)
- `scoreHash`: SHA256(score + nonce) for integrity
- `nonce`: Random bytes for privacy
- `expiresAt`: Timestamp when proof expires

**Public State** (everyone can see):
- `scoreBucket`: Range category (0-4)
- `isActive`: Is proof still valid
- `proofCount`: How many times verified

### Bucket Mapping

| Bucket | Range | Credit Quality |
|--------|-------|----------------|
| 0 | 300-499 | Poor |
| 1 | 500-649 | Fair |
| 2 | 650-749 | Good |
| 3 | 750-849 | Very Good |
| 4 | 850+ | Excellent |

### Privacy Guarantees

✅ **What Lenders Learn**: User is in bucket 2 (650-749)  
❌ **What Lenders DON'T Learn**: Exact score (e.g., 687)

✅ **What Lenders Learn**: User's score >= 650  
❌ **What Lenders DON'T Learn**: If score is 651 or 820

### Compilation

```bash
# Install Minokawa toolchain (formerly Compact)
npm install -g @midnight-ntwrk/minokawa-cli

# Compile contract (Minokawa v0.18, compiler v0.26.0)
minokawa compile score-proof.compact

# Deploy to Midnight testnet
minokawa deploy score-proof.compact --network testnet
```

### Integration

The backend `services/midnightBridge.ts` will use the Midnight SDK to:
1. Call `initializeScore` when user calculates credit score
2. Return proof ID to user
3. Allow lenders to call `verifyBucket` or `proveMinimumScore` with proof ID

### Zero-Knowledge Flow

```
Borrower                    Midnight Contract              Lender
   |                              |                          |
   |-- initializeScore(782) ----->|                          |
   |     (private circuit)        |                          |
   |                              |                          |
   |<---- proofId: abc123 --------|                          |
   |      bucket: 3 (public)      |                          |
   |                              |                          |
   |                              |<-- verifyBucket(3) ------|
   |                              |    (ZK proof)            |
   |                              |                          |
   |                              |--- true (matches) ------>|
   |                              |    (never reveals 782)   |
```

### Use Case: Privacy-Preserving Credit Check

**Without ZK (traditional)**:
- Borrower: "Here's my full credit report with 782 score"
- Lender: "Thanks, I can see everything including your address, SSN, history..."
- Privacy: ❌ Complete data exposure

**With ZK (Midnight Compact)**:
- Borrower: "Here's a proof I'm in bucket 3 (750-849)"
- Lender: "Proof verified, you qualify for our 7.5% rate"
- Privacy: ✅ Only necessary information revealed

## Why Midnight Instead of Cardano?

- **Cardano**: Public blockchain, all data visible (even with hash tricks)
- **Midnight**: ZK-native, private state built-in, selective disclosure native
- **Minokawa Language**: Designed specifically for private smart contracts (open-sourced under LFDT)

## Hackathon Alignment

✅ **Zero-Knowledge DApp**: Uses ZK proofs for selective disclosure  
✅ **Midnight Integration**: Built with Compact language  
✅ **Privacy-First**: Exact score never revealed, only proofs  
✅ **Real Use Case**: Credit verification without privacy invasion  
✅ **Playful & Human**: Makes privacy delightful, not scary
