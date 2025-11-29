# AtlasCred UI - Quick Reference Card

## 🎯 Three User Types

```
┌─────────────────────────────────────────────────────────────┐
│                     ATLASCRED ECOSYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 CREDIT SEEKERS          🏦 LENDERS          🤖 AI AGENTS│
│  (Primary Users)            (Verifiers)         (Fairness)  │
│                                                             │
│  • Build credit score       • Request proofs    • Masumi   │
│  • Own their data          • Verify on-chain    • Reduce   │
│  • Control disclosure      • Make decisions      bias      │
│  • No bank account needed  • Privacy-preserving • Explain  │
│                                                   scores    │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Wallet Address Purpose

```
YOUR WALLET ADDRESS
        ↓
┌───────────────────────────────────────┐
│ 1. OWNERSHIP & IDENTITY               │
│    Links score to your DID            │
│    Only YOU can update/reveal         │
│                                       │
│ 2. PRIVACY PROTECTION                 │
│    Smart contract enforces ownership  │
│    Requires your signature            │
│                                       │
│ 3. PROOF STORAGE                      │
│    Datum locked at script address     │
│    Contains hashed score + bucket     │
│                                       │
│ 4. SELECTIVE DISCLOSURE               │
│    You choose: bucket only or full    │
│    Control what lenders see           │
└───────────────────────────────────────┘
```

## 📊 The 4 Credit Sliders

```
┌──────────────────────────────────────────────────────────────┐
│  SLIDER                    WEIGHT    MEASURES                │
├──────────────────────────────────────────────────────────────┤
│  💰 Income Stability         30%     • Payment regularity   │
│                                       • Income variance      │
│                                       • On-chain consistency │
├──────────────────────────────────────────────────────────────┤
│  ✅ Repayment Consistency    35%     • On-time payments     │
│                                       • DeFi loan history    │
│                                       • Zero defaults        │
├──────────────────────────────────────────────────────────────┤
│  🏦 Savings Rate             20%     • Savings vs income    │
│                                       • Financial cushion    │
│                                       • Wallet balance growth│
├──────────────────────────────────────────────────────────────┤
│  🤝 Community Trust          15%     • DAO participation    │
│                                       • Peer endorsements    │
│                                       • Reputation tokens    │
└──────────────────────────────────────────────────────────────┘

Total: 100% weighted average → Score (300-950)
```

## 🎯 Score Buckets (Privacy Layer)

```
EXACT SCORE (Private)           BUCKET (Public on-chain)
─────────────────────────────────────────────────────────
   300-499                              0
   500-649                              1
   650-749                              2  ← You score 696
   750-849                              3
   850-950                              4

Lenders see: "User is in bucket 2"
They DON'T see: "User scored 696"
```

## 🔄 What Happens When You Submit

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND (Your Browser)                                 │
│    ↓ Submit { wallet, aggregates, proofs }               │
├──────────────────────────────────────────────────────────┤
│  BACKEND API (Express Server)                            │
│    1. Validate request (Zod schema)                      │
│    2. Local Score Engine → Calculate weighted score      │
│    3. Call Masumi AI Agent → Get fairness-adjusted score│
│    4. Average both scores                                │
│    5. Hash score (SHA-256 + nonce)                       │
│    6. Map to bucket (0-4)                                │
│    7. Create datum: {owner, hash, bucket, nonce, expiry} │
│    8. Lock on Cardano (via Lucid)                        │
├──────────────────────────────────────────────────────────┤
│  CARDANO BLOCKCHAIN                                       │
│    ✅ Datum stored at script address                     │
│    ✅ Only bucket visible publicly                       │
│    ✅ Exact score hashed                                 │
│    ✅ Expires in 7 days                                  │
├──────────────────────────────────────────────────────────┤
│  YOU RECEIVE                                              │
│    📋 Capsule ID: cardano-abc-123                        │
│    🔗 Transaction Hash: tx_456789...                     │
│    🪣 Bucket: 2                                          │
│    ⏰ Expires: Dec 4, 2025                               │
└──────────────────────────────────────────────────────────┘
```

## 🤖 Fairness Guard in Action

```
WITHOUT FAIRNESS GUARD:
User: Income 0.4, Repayment 0.5, Savings 0.3, Community 0.4
Score: 0.4×0.3 + 0.5×0.35 + 0.3×0.2 + 0.4×0.15 = 0.355 × 1000
     = 355 (REJECTED by most lenders)

WITH FAIRNESS GUARD:
Mean: 0.4
Bias Guard: 0.65 - 0.4 = 0.25
Boost: 0.25 × 0.4 = 0.1 (100 points)
Score: (0.355 + 0.1) × 1000 = 455 (QUALIFIES for micro-loans)

IMPACT: Access to credit → Build history → Improve score
```

## 🔒 Privacy Guarantees

```
┌─────────────────────────────────────────────────────┐
│  WHAT'S VISIBLE ON-CHAIN                           │
├─────────────────────────────────────────────────────┤
│  ✅ Your wallet address (PKH)                       │
│  ✅ Score bucket (0-4 range)                        │
│  ✅ Score hash (can't reverse to get exact score)   │
│  ✅ Nonce (random, prevents tracking)               │
│  ✅ Expiry timestamp                                │
├─────────────────────────────────────────────────────┤
│  WHAT'S HIDDEN                                      │
├─────────────────────────────────────────────────────┤
│  ❌ Exact credit score (e.g., 696)                 │
│  ❌ Individual slider values                        │
│  ❌ Proof details (income amount, etc.)             │
│  ❌ AI rationale                                    │
└─────────────────────────────────────────────────────┘

YOU DECIDE: Reveal exact score to specific lenders
            via off-chain channels or RevealBucket redeemer
```

## 📱 User Journey Flow

```
1. OPEN APP
   ↓
2. SEE SYSTEM OVERVIEW
   "I'm a Credit Seeker without traditional credit history"
   ↓
3. ENTER WALLET ADDRESS
   Read: "Why wallet is needed" → Understand ownership & privacy
   ↓
4. REVIEW PROOF BADGES
   See: income ✅, repayment ✅, community ❌ (can add later)
   ↓
5. ADJUST SLIDERS
   Read explanations for each factor
   Set honest values based on verified data
   ↓
6. READ "WHAT HAPPENS NEXT"
   Understand: Local + AI + Averaging + Hashing + Locking
   ↓
7. CLICK "COMPUTE MY CREDIT SCORE"
   See: "🔒 Locking on Cardano..."
   ↓
8. WATCH ORB ANIMATE
   Pulsing → Shows streaming state
   ↓
9. RECEIVE SCORE
   See: 696 with yellow color (bucket 2)
   Read rationale: "Repayment Consistency: 90% influence"
   ↓
10. USE PROOF
    Share capsule ID with lenders
    They verify on-chain
    You control what's revealed
```

## 🎨 UI Color Meanings

```
🔵 BLUE    → System info, ownership concepts
🟣 PURPLE  → AI features, fairness mechanisms
🟢 CYAN    → Primary actions, Cardano elements
🟢 GREEN   → Success states, privacy guarantees
🟡 AMBER   → Important warnings, explanations
```

## ❓ Common Questions

**Q: Why can't I skip the wallet address?**
A: The wallet is your identity. Without it, there's no way to prove ownership or enable privacy controls.

**Q: What if I exaggerate my slider values?**
A: Sliders should match your verified proofs. Lenders will check proofs and reject mismatches.

**Q: How long is my score valid?**
A: 7 days. After expiry, recompute with fresh data to reflect current situation.

**Q: Can lenders see my exact score?**
A: Only if you explicitly reveal it. By default, they only see your bucket (range).

**Q: What happens to my data?**
A: Exact score stored encrypted off-chain. Only hash + bucket on-chain. You control access.

---

## 🚀 Quick Start

1. **Get Wallet**: Download Lace/Eternl/Yoroi
2. **Gather Proofs**: Income docs, payment history, reputation tokens
3. **Open AtlasCred**: Navigate to app
4. **Fill Form**: Wallet + sliders
5. **Submit**: Wait ~5 seconds
6. **Save Proof**: Copy capsule ID + tx hash
7. **Apply for Loans**: Share proof with lenders

---

**🎯 Mission**: Give everyone access to credit, regardless of traditional history  
**🔐 Method**: Privacy-preserving, AI-fair, blockchain-verifiable scoring  
**🌍 Impact**: Financial inclusion for 2.5 billion people worldwide who lack formal credit history
