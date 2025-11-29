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
- **Lace Wallet Integration**: Real on-chain verification using Koios API
- **Masumi AI Agent**: Fairness-aware scoring with bias mitigation
- **Next.js Frontend**: Professional fintech UX with glassmorphism design
- **Alternative Data**: Use rent, utilities, mobile payments to build credit

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
- **Lace Wallet Verification**: Real on-chain verification using Koios API (FREE, no API key)
- **Cardano Address Validation**: Supports `addr1` (mainnet), `addr_test1` (testnet), `stake1`
- **Smart Contracts**: Both Aiken (Cardano) and Compact (Midnight) contracts written
- **Credit Score Engine**: Fairness-aware scoring with bias mitigation
- **UI/UX**: Modern glassmorphic design with real-time updates and toast notifications
- **Document Verification**: Upload and verify identity documents for trust boost
- **Alternative Data Scoring**: Income stability, repayment consistency, savings rate, community trust

### 🔄 Next Steps (Production)
- Deploy Aiken contract to Cardano mainnet/testnet
- Deploy Compact contract to Midnight Network
- Wire up Midnight SDK in `backend/src/services/midnightBridge.ts`
- Integrate ZK proof generation with frontend wallet connection
- Add Blockfrost API key for enhanced Cardano queries (optional - Koios works great!)
- Deploy Masumi AI agent to cloud infrastructure

### 🎯 Ready to Demo
The entire system works end-to-end with:
- Real Lace wallet address verification against Cardano blockchain
- Mock smart contract interactions (ready to swap with deployed contracts)
- Functional credit score calculation with fairness guards
- Beautiful UI with toast notifications and document upload

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

**💳 How to get your Lace wallet address:**
1. Open your **Lace Wallet** browser extension
2. Click on your wallet name at the top
3. Click "Copy address" or "Receive"
4. Your address starts with `addr1` (mainnet) or `addr_test1` (testnet)
5. Paste it into the AtlasCred form
6. System verifies it exists on Cardano blockchain with UTXOs/transactions

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
