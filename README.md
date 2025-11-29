# AtlasCred – Privacy-Preserving Credit Scoring on Midnight

AtlasCred is a hackathon prototype for a privacy-preserving credit scoring experience on **Midnight blockchain** using **zero-knowledge proofs**. It combines:

- **Midnight Smart Contracts (Minokawa)** with ZK circuits for selective score disclosure
- **Masumi AI Agent** that performs fairness-aware scoring with bias mitigation
- **Next.js Frontend** with professional fintech UX
- **Node/Express API** bridging wallets, AI, and Midnight ZK transactions

## Monorepo layout

| Path | Purpose |
| --- | --- |
| `frontend/` | Next.js + Tailwind UI for the credit experience with Midnight wallet integration |
| `backend/` | Express API, score engine, Midnight ZK bridge, Masumi AI client |
| `agents/masumi-agent/` | FastAPI service with fairness kernel for bias mitigation |
| `contracts/midnight/` | Compact smart contract with ZK circuits for private credit scores |
| `docs/architecture.md` | System overview and deployment targets |

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

## Smart Contract Details

The Midnight Minokawa contract at `contracts/midnight/score-proof.compact` uses **zero-knowledge circuits** to enforce:
- **Private State**: Exact credit score (300-850) stored in private state, never revealed
- **Selective Disclosure**: Users prove they're in a score bucket (0-4) without revealing exact score
- **Threshold Proofs**: Lenders verify "score >= X" without learning exact value
- **Ownership**: Only wallet owner can update or revoke proofs
- **Expiry**: Score proofs expire after 7 days
- **Privacy Guarantee**: ZK proofs prevent any data leakage

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
