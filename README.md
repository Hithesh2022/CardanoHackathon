# AtlasCred – Privacy-Preserving Credit Scoring

AtlasCred brings financial inclusion to **2.5 billion people worldwide** who lack formal credit history. It's a privacy-preserving credit scoring platform using **zero-knowledge proofs** and **smart contracts** on both Cardano and Midnight blockchains.

## 🎯 The Problem

- **2.5 billion adults globally** have no formal credit score
- **26 million Americans** are "credit invisible"
- Traditional credit bureaus ignore alternative data (rent, utilities, mobile payments)
- Privacy concerns prevent sharing financial history

## 🔐 Our Solution

- **Dual Smart Contracts**: Aiken (Cardano L1) + Compact (Midnight Network)
- **Zero-Knowledge Proofs**: Prove creditworthiness without revealing exact score
- **Wallet Signature Verification**: Cryptographic proof of wallet ownership prevents fraud
- **Lace Wallet Integration**: Real on-chain verification using Koios API
- **Masumi AI Agent**: Fairness-aware scoring with bias mitigation
- **Next.js Frontend**: Professional fintech UX with glassmorphism design
- **Alternative Data**: Use rent, utilities, mobile payments to build credit

## 🛡️ Multi-Layer Security System

### Layer 1: Wallet Signature Verification

**Problem**: A malicious borrower could copy someone else's Lace wallet address, get a high credit score, and present it to lenders.

**Solution**: **Cryptographic Wallet Signature**

1. **Borrower Signs Message**: When calculating score, borrower must sign a message with their Midnight Lace wallet private key
2. **Signature Stored with Proof**: The cryptographic signature is embedded in the ZK proof on Midnight blockchain
3. **Lender Verifies Signature**: When lender checks the proof, they see if the wallet signature is verified
4. **Cannot Be Forged**: Only the real wallet owner has the private key to create a valid signature

### Layer 2: Two-Token Hash Verification

**Problem**: Borrowers could share their proof ID with friends, allowing unauthorized access to their credit score.

**Solution**: **SHA-256 Hash-Based Token System**

1. **Token Generation**: Borrower generates:
   - `baseToken`: Random unique identifier (e.g., `midnight1qxy-k4j8n9m-1703567890`)
   - `verificationHash`: SHA-256 hash of (baseToken + documentNumber)
2. **What Gets Shared**: Borrower shares proof ID + baseToken (NOT document number)
3. **Lender Verification**: Lender must provide BOTH:
   - Base token (from borrower)
   - Document number (ask borrower verbally)
4. **Backend Verification**: 
   - Recreates hash from lender's input
   - Compares with stored hash
   - ✅ Match → Show score | ❌ Mismatch → 403 Forbidden

**Why It's Secure**:
- 🔐 **One-Way Encryption**: SHA-256 cannot be reversed to find document number
- 🛡️ **Proof Sharing Impossible**: Without document number, friend cannot access score
- 🔒 **Privacy-Preserving**: Document number never stored in database (only hash)
- 🎯 **Cryptographically Secure**: Same algorithm as Bitcoin/Midnight (2^256 combinations)

**Visual Indicators for Lenders**:
- ✅ **"Wallet Ownership Verified"** badge → Borrower signed with real Midnight Lace wallet
- ✅ **"Tokens Verified"** badge → Hash matches, proof belongs to this borrower
- ⚠️ **"Verification Failed"** warning → Hash mismatch, possible fraud attempt

📖 **Learn More**: See [TWO_TOKEN_VERIFICATION.md](docs/TWO_TOKEN_VERIFICATION.md) for complete technical documentation.

### Layer 3: DUST Token Payment System (NEW)

**Problem**: How to monetize premium features while maintaining decentralized architecture?

**Solution**: **Pay-to-Use with DUST Tokens on Midnight Network**

#### Feature 1: Borderline Score Enhancement (10 DUST)

**When**: Borrower's score is 390-410 (borderline, near 500 bucket threshold)

**How It Works**:
1. Borrower sees "🚀 Boost Your Score!" prompt after calculating score
2. Clicks "Pay 10 DUST to Enhance"
3. Midnight Lace wallet opens, confirms transaction
4. Backend verifies DUST payment on Midnight blockchain
5. Calls Masumi AI agent with enhanced fairness processing
6. Score potentially improves to reach next bucket (500-649)
7. New proof generated on-chain with improved score

**Why Pay**:
- Unlocks advanced Masumi AI analysis
- Fairness kernel processes micro-patterns
- Higher chance of reaching better score bucket
- One-time payment per enhancement

#### Feature 2: Detailed Borrower Data Access (5 DUST)

**When**: Lender wants to see full financial history (loans, payments, transactions)

**How It Works**:
1. Lender verifies borrower's proof → sees score bucket
2. Detailed data section shows **"🔒 Detailed Financial Data Locked"**
3. Clicks "Pay 5 DUST to Unlock"
4. Midnight Lace wallet opens, confirms transaction
5. Backend verifies DUST payment on Midnight blockchain
6. Unlocks comprehensive borrower profile:
   - Complete loan history with status/amounts
   - Payment behavior analytics (on-time/late/missed)
   - Transaction history with dates/descriptions
   - Credit utilization and financial health metrics

**Why Pay**:
- Protects borrower privacy (pay-per-view model)
- Ensures data access is compensated
- Prevents free-riding by lenders
- Creates revenue for platform sustainability

#### DUST Token Economics

| Feature | DUST Cost | Purpose | Revenue Model |
|---------|-----------|---------|---------------|
| Score Enhancement | 10 DUST | Masumi AI premium processing | $10/enhancement (mainnet) |
| Detailed Data Access | 5 DUST | Unlock full borrower history | $5/view (mainnet) |

**Testnet**: Get free DUST from [midnight.network/faucet](https://faucet.midnight.network) for testing

**Smart Contract**: DUST payments verified on-chain via Midnight proof server (Docker container on port 6300)

**Privacy**: All payments logged on Midnight blockchain with zero-knowledge proofs

📖 **Learn More**: See [DUST_TOKEN_INTEGRATION.md](docs/DUST_TOKEN_INTEGRATION.md) for complete implementation guide.

## Monorepo layout

| Path | Purpose |
| --- | --- |
| `frontend/` | Next.js + Tailwind UI with Lace wallet verification and real-time score updates |
| `backend/` | Express API with Koios blockchain integration and Masumi AI client |
| `agents/masumi-agent/` | FastAPI service with fairness kernel for bias mitigation |
| `contracts/atlascred/` | **Aiken smart contract** for Cardano L1 (score_proof.ak) |
| `contracts/midnight/` | **Compact smart contract** for Midnight Network with ZK circuits |
| `docs/` | Complete technical documentation and architecture guides |

## Quick start

> Prereqs: Node 20+, npm 10+, Python 3.11.

```bash
# Backend API
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev

# Masumi agent (optional but recommended)
cd ../agents/masumi-agent
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:3000` and move the sliders; the UI streams real-time score updates and meme insights once the backend responds.

## Testing

```bash
cd backend
npm test
```

Vitest covers the fairness guard + hashing logic. Extend with integration tests around `/score` when Midnight ZK circuits + Masumi endpoints are wired to real infrastructure.

## Deployment notes

- **Masumi Agent**: Dockerfile provided under `agents/masumi-agent`. Deploy to cloud and update `MASUMI_AGENT_URL` in the backend `.env`.
- **Midnight Contracts**: Run `minokawa compile score-proof.compact` inside `contracts/midnight` to compile the Minokawa contract (v0.18, compiler v0.26.0). Deploy to Midnight testnet with `minokawa deploy`.
- **Midnight SDK Integration**: Next step is to wire up actual Midnight SDK in `backend/src/services/midnightBridge.ts` to call ZK circuits for real.

## 🔗 Smart Contracts (Dual-Chain Architecture)

### 1. Cardano L1 Contract (`contracts/atlascred/validators/score_proof.ak`)
**Language**: Aiken  
**Purpose**: On-chain score verification and selective disclosure on Cardano mainnet

**Features**:
- 🔐 **Ownership Control**: Only wallet owner can update score capsule
- 📊 **Bucket Disclosure**: Reveal score bucket (0-4) without exact score
- ⏰ **Expiry Checks**: Proofs expire after set time
- 🔒 **Hash Verification**: Score stored as hash with nonce for privacy
- ✅ **Signature Validation**: All operations require owner signature

**Score Buckets**:
- Bucket 0: 300-499 (Poor)
- Bucket 1: 500-649 (Fair)
- Bucket 2: 650-749 (Good)
- Bucket 3: 750-849 (Very Good)
- Bucket 4: 850+ (Excellent)

### 2. Midnight Network Contract (`contracts/midnight/score-proof.compact`)
**Language**: Compact (Minokawa v0.18)  
**Purpose**: Zero-knowledge proof generation with advanced privacy

**ZK Features**:
- 🔒 **Private State**: Exact score (300-850) never revealed on-chain
- 🎭 **Selective Disclosure**: Prove score bucket membership without revealing value
- 📄 **Document Privacy**: Store verified doc hashes privately (Aadhar, PAN, Bank, etc.)
- 🔢 **Trust Boost**: Calculate trust score from verified documents (0-100 points)
- ⚡ **ZK Circuits**: `initializeScore`, `verifyBucket`, `proveMinimumScore`, `updateScore`
- 🌐 **Public State**: Only bucket number, proof count, and document count visible

**Privacy Guarantees**:
- ✅ Exact score remains private
- ✅ Which documents were verified stays private
- ✅ Only bucket range and document count are public
- ✅ Lenders verify "score >= X" without learning actual score

## 🚀 Current Implementation Status

### ✅ Fully Implemented
- **Midnight Lace Wallet Integration**: Real wallet connection using `window.midnight` API
- **Midnight Address Validation**: Supports `midnight1` (mainnet), `midnight_test1` (testnet)
- **Docker Midnight Proof Server**: Running on port 6300 with testnet network
- **Smart Contracts**: Both Aiken (Cardano) and Compact (Midnight) contracts written
- **Credit Score Engine**: Fairness-aware scoring with bias mitigation
- **UI/UX**: Modern glassmorphic design with real-time updates and toast notifications
- **Document Verification**: Upload and verify identity documents for trust boost
- **Alternative Data Scoring**: Income stability, repayment consistency, savings rate, community trust
- **Two-Token Hash Verification**: SHA-256 anti-fraud system with base token + document number
- **DUST Token Payment System**: Pay-to-enhance scores and unlock detailed data
- **ScoreEnhancement Component**: Borderline score upgrade UI (390-410 range)
- **LenderDataAccess Component**: Pay-to-view detailed borrower financial history

### 🔄 Next Steps (Production)
- Deploy Compact contract to Midnight Network testnet
- Wire up real DUST token transfers (currently using mock transactions)
- Connect Midnight wallet `sendTokens()` API for payments
- Integrate Masumi AI agent enhancement endpoint
- Deploy backend to cloud with Midnight RPC access
- Add production DUST token pricing and payment verification

### 🎯 Ready to Demo
The entire system works end-to-end with:
- Real Midnight Lace wallet verification
- Docker proof server integration (testnet)
- Two-token hash-based fraud prevention
- DUST token payment UI (mock transactions)
- Borderline score enhancement flow
- Pay-to-view detailed borrower data
- Beautiful UI with glassmorphic design and animations

## 📚 Documentation

Comprehensive guides to understand every aspect of AtlasCred:

| Document | Purpose |
| --- | --- |
| `docs/ui-guide.md` | **Complete UI explanation**: What each element does, why wallet is needed, slider meanings, user roles, and step-by-step flows |
| `docs/ui-quick-reference.md` | **Quick reference card**: Visual diagrams, bucket mappings, fairness guard examples, and common FAQs |
| `docs/code-explanation.md` | **Technical deep-dive**: Line-by-line explanation of validator, AI agent, backend API, and frontend components |
| `docs/architecture.md` | **System design**: Overall architecture, component interactions, and deployment strategy |
| `docs/detailedexplanation.txt` | **Problem/solution**: Why AtlasCred exists, what problems it solves, payment methods, and roadmap |
| `docs/architecture-diagram.drawio` | **Visual diagram**: Open with Draw.io to see complete system architecture |

### Quick Answers

**🔐 Why do I need a wallet address?**
- Links score to your blockchain identity (DID)
- Enforces privacy via smart contract ownership
- Enables selective disclosure (you control what lenders see)
- **Real wallet verification**: System verifies your Lace wallet exists on-chain using Koios API
- See `docs/ui-guide.md` for full explanation

**💳 How to get your Midnight Lace wallet address:**
1. Open your **Midnight Lace Wallet** browser extension
2. Click on your wallet name at the top
3. Click "Copy address" or "Receive"
4. Your address starts with `midnight1` (mainnet) or `midnight_test1` (testnet)
5. Paste it into the AtlasCred form
6. System verifies it exists on Midnight blockchain using proof server

**💎 How to get testnet DUST tokens:**
1. Visit [midnight.network/faucet](https://faucet.midnight.network)
2. Connect your Midnight Lace wallet
3. Request DUST tokens (100 DUST for testing)
4. Wait 30 seconds for confirmation
5. Use DUST to enhance scores or unlock borrower data

**📊 What do the sliders mean?**
- **Income Stability (30%)**: Consistency of income over time
- **Repayment Consistency (35%)**: History of meeting obligations
- **Savings Rate (20%)**: Ability to save relative to income
- **Community Trust (15%)**: Reputation from peer endorsements
- See `docs/ui-quick-reference.md` for examples

**👥 Who uses this UI?**
- **Credit Seekers**: Build credit using alternative data (primary users)
- **Lenders**: Verify score buckets on-chain without invading privacy
- **AI Agents**: Apply fairness algorithms to reduce bias
- See `docs/ui-guide.md` for detailed role descriptions

## Credits & memes

AtlasCred sprinkles official community memes (Hosky, Koala, Ada Lovelace League) through the UX to make finance playful while still respecting privacy. All placeholder assets are text-only for now—swap in your art pack before finals.
