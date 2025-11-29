# AtlasCred: Midnight Blockchain Integration Summary

## Hackathon Requirements ✅

**Track**: Privacy Mini DApps on Midnight  
**Requirement**: Use Midnight at least once to integrate zero-knowledge proofs or private smart contracts

## What We Built

### 1. **Midnight Minokawa Smart Contract** (`contracts/midnight/score-proof.compact`)

**Language**: Minokawa v0.18 (formerly Compact)  
**Compiler**: v0.26.0  
**Open Source**: Linux Foundation Decentralized Trust (LFDT)

A privacy-preserving credit score proof system using **zero-knowledge circuits**:

#### **Private State** (ZK-protected, never revealed)
```compact
private state {
  owner: Address,
  exactScore: Uint<16>,        // 300-850 (NEVER PUBLIC)
  scoreHash: ByteString<32>,   // SHA256 hash
  nonce: ByteString<16>,       // Privacy nonce
  expiresAt: Timestamp
}
```

#### **Public State** (visible to everyone)
```compact
public state {
  scoreBucket: Uint<8>,        // 0-4 bucket range
  isActive: Bool,
  proofCount: Uint<32>
}
```

#### **Zero-Knowledge Circuits**

1. **`initializeScore` (Private Circuit)**
   - User locks credit score in private state
   - Only bucket (0-4) becomes public
   - Exact score remains hidden forever
   
2. **`verifyBucket` (ZK Proof)**
   - **What it proves**: "My score is in bucket N"
   - **What it hides**: Exact score value
   - **Use case**: Lender needs "good credit" (bucket 3-4) but doesn't need exact 782
   
3. **`proveMinimumScore` (ZK Proof)**
   - **What it proves**: "My score >= 650"
   - **What it hides**: Exact score value (could be 651 or 820)
   - **Use case**: Loan requires minimum 650, user proves qualification without over-sharing

### 2. **Backend Midnight Integration** (`backend/src/services/midnightBridge.ts`)

```typescript
export class MidnightBridge {
  // Calls Midnight Minokawa contract to initialize ZK proof
  async initializeScoreProof(payload: {
    request: ScoreRequest;
    scoreHash: string;
    scoreBucket: number;
    exactScore: number;  // Sent to private circuit
  }): Promise<MidnightProof>

  // Verifies bucket via ZK circuit (no exact score revealed)
  async verifyBucket(proofId: string, requestedBucket: number): Promise<boolean>

  // Proves minimum threshold via ZK (exact score hidden)
  async proveMinimumScore(proofId: string, threshold: number): Promise<boolean>
}
```

### 3. **Frontend Midnight Wallet Integration**

- Changed from "Cardano Wallet" to "Midnight Wallet" inputs
- Updated all UI text to reflect ZK proofs instead of public blockchain proofs
- Shows "Zero-Knowledge Proof" section instead of "Blockchain Proof"
- Displays Proof ID (not Capsule ID) and Contract Address

## Privacy Features

### Traditional Credit Check (No Privacy)
```
Borrower → "Here's my full credit report: 782 score + SSN + address + history"
Lender   → "Thanks, I can see everything"
Privacy  → ❌ Complete data exposure
```

### AtlasCred with Midnight ZK (Privacy-First)
```
Borrower → Locks 782 in Midnight private state
           Public state only shows: bucket 3 (750-849)

Lender   → Calls verifyBucket(3) ZK circuit
           Gets: true (user is in bucket 3)
           NEVER learns: exact score is 782

Privacy  → ✅ Only necessary information revealed
```

## Zero-Knowledge Guarantees

| What Lenders Learn | What Lenders DON'T Learn |
|-------------------|-------------------------|
| ✅ User is in bucket 2 (650-749) | ❌ Exact score (e.g., 687) |
| ✅ User's score >= 650 | ❌ If score is 651 or 820 |
| ✅ Proof is still active | ❌ Income, payment history, or other personal data |
| ✅ Proof was verified N times | ❌ Which lenders verified the proof |

## How It Works (End-to-End)

### Step 1: Borrower Calculates Score
```
User inputs:
- Midnight wallet address
- Credit factors (income stability, repayment, savings, community)

Backend:
1. Local score engine calculates weighted score
2. Masumi AI agent applies fairness kernel (bias mitigation)
3. Averages both scores → final score: 782
```

### Step 2: Zero-Knowledge Proof Creation
```
Backend calls Midnight Compact contract:
→ initializeScore(
    ownerAddr: "midnight123...",
    score: 782,              // Goes to PRIVATE state
    scoreNonce: random bytes,
    bucket: 3                // Goes to PUBLIC state
  )

Midnight stores:
- Private: 782 (encrypted, ZK-protected)
- Public: bucket 3 (750-849)

Returns: proofId "midnight-proof-abc123"
```

### Step 3: User Shares Proof ID
```
Borrower copies Proof ID: "midnight-proof-abc123"
Borrower sends to lender via email/app/message
```

### Step 4: Lender Verifies (ZK)
```
Lender: "I need minimum bucket 2 (650+)"

Lender calls:
→ verifyBucket(proofId, bucket: 2)

Midnight ZK circuit executes:
1. Loads private score: 782
2. Calculates bucket: scoreToBucket(782) → 3
3. Checks: 3 >= 2? → true
4. Returns: true (NEVER reveals 782)

Lender gets: ✅ Qualified
Lender NEVER learns: 782 or any other details
```

## Why Midnight Instead of Cardano?

| Feature | Cardano | Midnight |
|---------|---------|----------|
| **Data Visibility** | All data public (even hashed) | Private state + public state separation |
| **Privacy** | Tricks with hashes | Native zero-knowledge proofs |
| **Selective Disclosure** | Requires complex workarounds | Built-in with ZK circuits |
| **Smart Contract Language** | Plutus/Aiken (public UTxO model) | Compact (ZK-native) |
| **Use Case Fit** | ❌ Not ideal for private data | ✅ Perfect for credit scores |

## Hackathon Alignment

✅ **Zero-Knowledge DApp**: Uses ZK circuits for selective disclosure (`verifyBucket`, `proveMinimumScore`)  
✅ **Midnight Integration**: Built with Compact language smart contract  
✅ **Privacy-First**: Exact score never revealed, only proofs  
✅ **Real Use Case**: Credit verification without privacy invasion  
✅ **Playful & Human**: Makes privacy delightful through clear UX  
✅ **One Feature, Clear Use Case**: Credit score verification with ZK proofs

## Deployment Roadmap

### Current Status (Demo)
- ✅ Minokawa contract written (`score-proof.compact`) - v0.18, compiler v0.26.0
- ✅ Backend API integrated with Midnight bridge
- ✅ Frontend updated with Midnight terminology
- ✅ Masumi AI agent running live (fairness scoring)
- 🔄 Midnight SDK calls mocked (waiting for testnet access)

### Next Steps (Production)
1. **Install Midnight CLI**: `npm install -g @midnight-ntwrk/compact-cli`
2. **Compile Contract**: `compact compile score-proof.compact`
3. **Deploy to Testnet**: `compact deploy score-proof.compact --network testnet`
4. **Integrate Midnight SDK** in `midnightBridge.ts`:
   ```typescript
   import { MidnightSDK } from '@midnight-ntwrk/sdk';
   
   const contract = await midnightSdk.contract('score-proof.compact');
   const tx = await contract.initializeScore({...}, { private: true });
   ```
5. **Add Midnight Wallet Connector** to frontend (MidnightWallet provider)
6. **Test End-to-End** on Midnight testnet

## Technical Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contract** | Midnight Minokawa Language v0.18 (compiler v0.26.0) |
| **ZK Circuits** | Private circuits for score operations |
| **Backend** | Node.js + Express + Midnight SDK |
| **AI Agent** | Python FastAPI (Masumi fairness kernel) |
| **Frontend** | Next.js 14 + Tailwind CSS |
| **Blockchain** | Midnight (ZK-native) |

## Privacy Use Case

**Problem**: Traditional credit systems expose sensitive financial data to lenders, credit bureaus, and intermediaries. Users have no control over who sees what.

**Solution**: AtlasCred with Midnight ZK proofs lets users:
- 🔒 Lock exact credit score in private state (never revealed)
- ✅ Prove they're "good credit" without showing exact score
- 🎯 Verify specific thresholds (score >= 650) without over-sharing
- 🚫 Revoke proofs at any time
- ⏰ Set expiry dates for time-bound verification

**Impact**: Financial inclusion for unbanked/underbanked populations who can build credit using alternative data while maintaining privacy.

## Conclusion

AtlasCred demonstrates that **privacy can be both powerful and delightful**. By using Midnight's zero-knowledge capabilities, we enable credit verification without sacrificing user privacy—a real-world use case that could help billions of people globally access financial services.

---

**Built for**: Midnight Privacy Mini DApps Hackathon  
**Core Feature**: Zero-knowledge credit score verification  
**Privacy Guarantee**: Exact scores never revealed, only ZK proofs
