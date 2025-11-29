# AtlasCred UI Guide: Understanding the Interface

## 🎯 Who Is This UI For?

### Primary Users: **Credit Seekers**
Individuals who want to build creditworthiness using alternative data:
- **Thin-file individuals**: People with little to no traditional credit history
- **Credit invisible**: 2.5 billion people globally who lack formal credit history
- **Immigrants**: New residents without local credit history
- **Gig economy workers**: Freelancers with inconsistent traditional documentation
- **Young adults**: Starting their financial journey

### Secondary Users: **Lenders** (Future Integration)
Financial institutions that will:
- Request bucket-level proofs from users
- Verify scores on-chain without seeing exact numbers
- Make lending decisions based on privacy-preserving proofs

### System Actors: **AI Agents**
- **Masumi Agent**: Applies fairness kernel to reduce scoring bias
- Runs off-chain to keep costs low
- Provides explainable AI rationale

---

## 🔐 Why Do You Need to Provide Your Wallet Address?

### The Wallet Address Serves 4 Critical Functions:

#### 1. **Ownership & Identity**
```
Your wallet address → Public Key Hash (PKH) → Stored in ScoreDatum.owner field
```
- Links the credit score capsule to YOUR blockchain identity (DID)
- Ensures only you can update or reveal your score
- Acts as your cryptographic signature for on-chain actions

**Example:**
```typescript
walletAddress: "addr1qxyzhackathon..."
↓
PKH: "a5f3e2d1c4b3a2f1..."  (derived hash)
↓
Used in validator to check: list.has(tx.extra_signatories, datum.owner)
```

#### 2. **Privacy Protection via Smart Contract**
The Aiken validator checks:
```aiken
let signed_by_owner = list.has(tx.extra_signatories, datum.owner)
```
- Only transactions **signed by your wallet** can update your score
- No one else can modify or reveal your score without your permission
- Prevents unauthorized access even if they know your score hash

#### 3. **Proof Storage Location**
- Your score datum is locked at a **Cardano script address** (smart contract)
- The datum contains:
  ```typescript
  {
    owner: "your_pkh",           // Your wallet PKH
    scoreHash: "sha256(...)",    // Hashed score (privacy)
    scoreBucket: 2,              // Public range (0-4)
    nonce: "random_hex",         // Prevents tracking
    expiresAt: 1735430400000     // Timestamp
  }
  ```
- Lenders query the blockchain for your PKH to find your score capsule

#### 4. **Selective Disclosure Control**
When a lender requests proof, YOU decide:
- **Bucket-only reveal**: "I'm in range 650-749" (RevealBucket redeemer)
- **Full reveal**: Share exact score off-chain
- **No reveal**: Decline the request

**The wallet address enables this because:**
- Only you can sign transactions to execute redeemers
- The validator enforces `signed_by_owner` check
- Your private key = your control

### 💡 Important Notes

✅ **No ADA is spent**: We only lock data (datum), not funds
✅ **Privacy-first**: Only the score bucket is publicly visible on-chain
✅ **You remain in control**: Smart contract enforces your ownership
✅ **Portable identity**: Same wallet works across all Cardano dApps

---

## 📊 What Do the Sliders Mean?

### Overview: Alternative Credit Factors

Traditional credit scoring uses:
- Credit card payment history
- Loan repayment records
- Length of credit history

**AtlasCred uses alternative data** for those without traditional credit:
- On-chain transaction patterns
- DeFi loan history
- Community reputation
- Verified income statements
- Savings behavior

### The 4 Sliders Explained

#### 1. **Income Stability (30% weight)**
**What it measures:**
- Consistency of income over time
- Regularity of deposits/earnings
- Variance in monthly income

**Data sources:**
- On-chain: Regular stablecoin receipts, DAO salary payments, DeFi yield
- Off-chain: Verified W-2 forms, 1099s, bank statements (via zero-knowledge proofs)

**Example:**
```
Freelancer receives payments:
Month 1: $3,000
Month 2: $2,800
Month 3: $3,200
Month 4: $3,100

Low variance = High stability (slider at 0.75)
```

**Why 30%?** Income consistency is the strongest predictor of repayment ability.

---

#### 2. **Repayment Consistency (35% weight)**
**What it measures:**
- History of meeting financial obligations
- On-time payments
- Absence of defaults

**Data sources:**
- On-chain: DeFi loan repayments (Aave, Compound), P2P lending history
- Off-chain: Rent payments, utility bills (verified via attestations)
- Community: Peer-to-peer loan history with reputation tokens

**Example:**
```
User has:
- 12 DeFi loans, all repaid on time → 1.0
- 1 late payment out of 12 → 0.92
- 2 defaults → 0.5 or lower
```

**Why 35%?** Past payment behavior is the BEST predictor of future behavior.

---

#### 3. **Savings Rate (20% weight)**
**What it measures:**
- Ability to save money relative to income
- Financial cushion for emergencies
- Long-term planning ability

**Data sources:**
- On-chain: Wallet balance growth over time, staking/yield positions
- Off-chain: Verified bank account statements (ZK proof of balance trends)

**Calculation:**
```
Savings Rate = (Deposits - Withdrawals) / Total Income
```

**Example:**
```
Monthly income: $4,000
Monthly expenses: $3,200
Savings: $800

Savings rate = $800 / $4,000 = 0.20 (20%)
Slider value: 0.20
```

**Why 20%?** Savings indicate financial discipline and buffer against defaults.

---

#### 4. **Community Trust (15% weight)**
**What it measures:**
- Social reputation in decentralized communities
- Peer endorsements
- Participation in DAOs, governance
- Social attestations

**Data sources:**
- On-chain: DAO contribution history, community tokens, peer endorsements
- Off-chain: LinkedIn recommendations, GitHub contributions, professional attestations
- Blockchain: NFT badges from reputable organizations

**Example:**
```
User has:
- 3 DAO governance votes → +0.10
- 5 peer endorsements → +0.25
- Community builder NFT → +0.15
= Total: 0.50 trust score
```

**Why 15%?** Community trust is valuable but harder to verify, so lower weight.

---

## 🎛️ How to Use the Sliders

### Step-by-Step Guide

1. **Assess Your Situation**
   - Review your financial data (income, payments, savings)
   - Check your on-chain history (DeFi activity, DAO participation)
   - Gather any attestations or reputation tokens

2. **Set Slider Values Honestly**
   - **Income Stability**: 0.0 (very irregular) to 1.0 (perfectly consistent)
   - **Repayment**: 0.0 (many defaults) to 1.0 (perfect record)
   - **Savings**: 0.0 (no savings) to 1.0 (saving >50% of income)
   - **Community**: 0.0 (no reputation) to 1.0 (highly trusted)

3. **Don't Worry About Being "Perfect"**
   - The Masumi AI agent applies **fairness adjustments**
   - If your average is below 0.65, you get a boost
   - This compensates for systemic disadvantages

4. **Submit and Wait**
   - Backend calculates local score (weighted average × 1000)
   - Masumi AI calculates fairness-adjusted score
   - Both scores are averaged
   - Result: 300-950 credit score

---

## 🤖 What Is the Fairness Guard?

### The Problem It Solves

Traditional credit scoring discriminates against:
- Low-income individuals
- Minorities without generational wealth
- People in credit deserts (no nearby banks)
- Those with medical debt or student loans

### How It Works

**Local Score Engine:**
```typescript
if (score < 550) {
  fairnessBoost = (550 - score) * 0.25;
  adjustedScore = score + fairnessBoost;
}
```

**Masumi AI Agent:**
```python
bias_guard = np.maximum(0, 0.65 - values.mean())
score = (values @ weights + bias_guard * 0.4) * 1000
```

**Example:**
```
User A (privileged):
- Income: 0.9, Repayment: 0.9, Savings: 0.8, Community: 0.7
- Mean: 0.825
- bias_guard = 0 (no boost needed)
- Score: 850

User B (underbanked):
- Income: 0.4, Repayment: 0.5, Savings: 0.3, Community: 0.4
- Mean: 0.4
- bias_guard = 0.65 - 0.4 = 0.25
- Boost: 0.25 * 0.4 = 0.1 (100 points)
- Score: 522 (instead of 422)
```

### Why This Matters

Without the fairness guard:
- User B would score 422 (below most lending thresholds)
- Denied credit → Can't build credit history → Trapped in cycle

With the fairness guard:
- User B scores 522 (above many micro-lending thresholds)
- Access to credit → Builds history → Improves over time

---

## 🔄 What Happens After You Click Submit?

### The Complete Journey

#### **Step 1: Frontend Submission**
```typescript
submit({ 
  walletAddress: "addr1qxyz...", 
  aggregates: { incomeStability: 0.7, ... },
  proofs: [...]
})
```

#### **Step 2: Backend Processing**
1. **Validation**: Zod schema checks all fields
2. **Local Scoring**: Score engine applies weights
   ```
   baseScore = (0.7×0.3 + 0.8×0.35 + 0.5×0.2 + 0.6×0.15) × 1000
             = 680
   ```
3. **Fairness Guard**: Boost if score < 550 (in this case, no boost)
4. **AI Delegation**: Call Masumi agent
   ```json
   POST /score
   {"incomeStability": 0.7, ...}
   → Response: {"adjustedScore": 712}
   ```
5. **Averaging**: `(680 + 712) / 2 = 696`

#### **Step 3: Privacy Layer**
1. **Hashing**: `sha256("session123:696")` → `"a3f2e1d4..."`
2. **Bucketing**: 696 → Bucket 2 (650-749 range)
3. **Nonce**: Generate random 16-byte hex → `"x9y8z7..."`

#### **Step 4: Cardano Lock**
```typescript
datum = {
  owner: "a5f3e2d1..." (your PKH),
  scoreHash: "a3f2e1d4...",
  scoreBucket: 2,
  nonce: "x9y8z7...",
  expiresAt: 1735430400000  // Dec 4, 2025
}
```
*Note: Currently mocked, Lucid integration will create real tx*

#### **Step 5: Real-Time Update**
- Backend pushes via SSE: `data: {adjustedScore: 696, ...}\n\n`
- Frontend receives update
- ScoreOrb animates to 696 with yellow color
- ScoreInsights shows rationale

#### **Step 6: Proof Delivered**
You receive:
- **Capsule ID**: `cardano-abc-123-def`
- **Transaction Hash**: `tx_456789abcdef...`
- **Bucket**: 2 (visible on-chain)
- **Expiry**: December 4, 2025

---

## 👥 Role-Based User Flows

### Flow 1: Credit Seeker Builds Score

**Alice (Gig Worker, No Traditional Credit)**

1. **Opens AtlasCred UI**
   - Sees system overview with 3 user types
   - Understands she's a "Credit Seeker"

2. **Enters Wallet Address**
   - Connects Lace wallet: `addr1qxyz...`
   - Reads explanation: "This links score to your DID"

3. **Adjusts Sliders**
   - Income Stability: 0.6 (freelance varies)
   - Repayment: 0.9 (always pays rent on time)
   - Savings: 0.4 (modest savings)
   - Community: 0.7 (active in DAO)

4. **Submits Form**
   - Clicks "Compute My Credit Score"
   - Reads process: "Local engine + AI + Cardano lock"

5. **Waits for Score**
   - Status: "Locking on Cardano..."
   - ScoreOrb pulses (streaming state)

6. **Receives Score: 692**
   - Bucket: 2 (650-749)
   - Rationale: "Repayment Consistency: 90% influence"
   - Proof: tx_abc123...

7. **Next Steps**
   - Applies for DeFi loan
   - Shares bucket proof with lender
   - Lender verifies on-chain without seeing 692

---

### Flow 2: Lender Verifies Score (Future Feature)

**Bank XYZ Reviews Loan Application**

1. **Alice Applies for $5,000 Loan**
   - Provides: Wallet address `addr1qxyz...`
   - Provides: Capsule ID `cardano-abc-123`

2. **Bank Queries Cardano**
   ```typescript
   const datum = await lucid.utxosByAddress(scriptAddress);
   // Finds Alice's datum with owner PKH matching her wallet
   ```

3. **Bank Sees Public Data**
   - Score Bucket: 2 (650-749 range)
   - Expiry: Not expired ✅
   - Hash: `a3f2e1d4...` (can't reverse to get exact score)

4. **Bank Requests Bucket Proof**
   - "Please prove you're in bucket 2 or higher"
   - Alice signs transaction with RevealBucket redeemer
   - Validator checks: ✅ Bucket matches, ✅ Alice signed, ✅ Not expired

5. **Bank Makes Decision**
   - Bucket 2 = Acceptable risk for $5,000 loan
   - Approves loan at 12% APR

6. **Privacy Maintained**
   - Bank never saw Alice's exact score (692)
   - Alice controlled what was revealed
   - All verification done on-chain (transparent)

---

### Flow 3: AI Agent Fairness Adjustment

**Bob (Underbanked, Systemic Disadvantages)**

1. **Bob Submits Low Scores**
   - Income: 0.4 (part-time, low wage)
   - Repayment: 0.5 (few loans, 1 missed payment)
   - Savings: 0.3 (hard to save)
   - Community: 0.4 (limited engagement)

2. **Local Score Engine**
   ```
   baseScore = (0.4×0.3 + 0.5×0.35 + 0.3×0.2 + 0.4×0.15) × 1000
             = 0.355 × 1000 = 355
   fairnessBoost = (550 - 355) × 0.25 = 48.75
   adjustedScore = 355 + 48.75 = 403.75
   ```

3. **Masumi AI Agent**
   ```python
   mean = (0.4 + 0.5 + 0.3 + 0.4) / 4 = 0.4
   bias_guard = 0.65 - 0.4 = 0.25
   boost = 0.25 × 0.4 = 0.1
   score = (0.355 + 0.1) × 1000 = 455
   ```

4. **Final Score**
   - Average: (403.75 + 455) / 2 = **429**
   - **Without fairness**: Would be ~355 (denied everywhere)
   - **With fairness**: 429 (qualifies for micro-loans)

5. **Bob Gets Access**
   - Micro-lender accepts bucket 0 (300-499)
   - Bob gets $500 loan at 18% APR
   - Repays on time → Builds history → Score improves to 520 next time

---

## 🎨 UI Design Choices

### Color Coding

- **Blue**: System information, ownership concepts
- **Purple**: AI/agent functionality, fairness features
- **Cyan**: Primary actions, Cardano-specific elements
- **Green**: Success states, privacy guarantees
- **Amber**: Important warnings, "why" explanations

### Visual Hierarchy

1. **System Overview** (Top): Who uses this, what it does
2. **Wallet Input** (Required): Identity + explanation
3. **Proof Badges** (Visual trust): Shows verified data sources
4. **Sliders** (Interactive): Core input with detailed explanations
5. **Submit Button** (Call-to-action): Prominent gradient
6. **Process Flow** (Transparency): What happens under the hood

### Information Progressive Disclosure

- **Level 1**: Brief labels (e.g., "Wallet Address")
- **Level 2**: Tooltips and inline help (e.g., "Why We Need Your Wallet")
- **Level 3**: Detailed documentation (this guide)

---

## ❓ FAQ

### Q: Can I use this without a Cardano wallet?
**A:** No. The wallet address is essential for:
- Linking the score to your identity
- Enforcing privacy via smart contract
- Enabling selective disclosure

**Solution:** Get a free Cardano wallet:
- Lace Wallet (Chrome extension)
- Eternl Wallet (Mobile + desktop)
- Yoroi Wallet (Mobile + extension)

---

### Q: What if I lie on the sliders?
**A:** The sliders are based on **verified proofs**:
- Income: Linked to actual on-chain transactions or verified W-2s
- Repayment: Verified from DeFi history, rent attestations
- Savings: Calculated from wallet balance history
- Community: Based on real reputation tokens/endorsements

If you submit values that don't match your proofs, lenders will:
1. See the mismatch when they verify your proofs
2. Reject your application
3. Flag your wallet for suspicious activity

**Honest input = Accurate score = Better lending decisions**

---

### Q: How long does my score stay valid?
**A:** 7 days (configurable)
- After 7 days, the datum expires
- Validator rejects any RevealBucket requests
- You must recompute your score with fresh data

**Why expiration?**
- Credit scores should reflect current financial situation
- Prevents stale data from being used
- Encourages regular updates as your situation improves

---

### Q: Can I delete my score?
**A:** Yes! You control the datum:
1. Sign a transaction to spend the UTXO at the script address
2. The datum is removed from the blockchain
3. No one can access your score anymore

**Note:** Cardano is immutable, so the historical transaction remains, but the current state (datum) is deleted.

---

### Q: What if I disagree with my score?
**A:**
1. Review the rationale in ScoreInsights
2. Check which factors pulled your score down
3. Submit additional proofs (e.g., more income statements)
4. Adjust sliders based on new verified data
5. Recompute score

**If you believe there's a system error:**
- Contact support with your session ID
- We can audit the scoring process
- Masumi AI provides explainable rationale for transparency

---

## 🚀 Next Steps

### For Credit Seekers
1. ✅ Get a Cardano wallet (Lace, Eternl, Yoroi)
2. ✅ Gather your proofs (income docs, payment history, reputation tokens)
3. ✅ Complete the form honestly
4. ✅ Save your capsule ID and transaction hash
5. ✅ Use your score to apply for loans

### For Lenders (Integration Coming Soon)
1. ⏳ Request bucket proofs from applicants
2. ⏳ Verify proofs on-chain via Cardano explorer
3. ⏳ Integrate RevealBucket redeemer into your application flow
4. ⏳ Make lending decisions based on verified buckets

### For Developers
1. 🔧 Deploy Aiken validator to testnet
2. 🔧 Integrate Lucid for real Cardano transactions
3. 🔧 Add wallet connector (MeshSDK hooks)
4. 🔧 Build lender dashboard for proof verification

---

## 📚 Additional Resources

- **Code Explanation**: `docs/code-explanation.md` (technical deep-dive)
- **Architecture**: `docs/architecture.md` (system design)
- **Detailed Problem/Solution**: `docs/detailedexplanation.txt` (hackathon context)
- **Smart Contract**: `contracts/atlascred/validators/score_proof.ak` (Aiken code)
- **Backend API**: `backend/src/index.ts` (Express server)
- **Frontend Components**: `frontend/src/components/` (React UI)

---

**Built for Cardano Hackathon 2025** 🎉  
**Privacy-Preserving Credit Scoring for Everyone** 🌍
