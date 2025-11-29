# AtlasCred Zero-Knowledge Flow

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          ATLASCRED PRIVACY ARCHITECTURE                       │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐                  ┌─────────────┐                 ┌─────────────┐
│             │                  │             │                 │             │
│  BORROWER   │                  │   BACKEND   │                 │   LENDER    │
│             │                  │     API     │                 │             │
└──────┬──────┘                  └──────┬──────┘                 └──────┬──────┘
       │                                │                                │
       │ 1. Submit Credit Factors       │                                │
       │    (income, repayment, etc)    │                                │
       │───────────────────────────────>│                                │
       │                                │                                │
       │                                │ 2. Calculate Score             │
       │                                │    ┌─────────────────┐         │
       │                                │───>│ Score Engine    │         │
       │                                │    │ (weights+bias)  │         │
       │                                │<───│ Returns: 782    │         │
       │                                │    └─────────────────┘         │
       │                                │                                │
       │                                │ 3. Apply AI Fairness           │
       │                                │    ┌─────────────────┐         │
       │                                │───>│ Masumi Agent    │         │
       │                                │    │ (fairness       │         │
       │                                │<───│  kernel)        │         │
       │                                │    └─────────────────┘         │
       │                                │                                │
       │                                │ 4. Create ZK Proof             │
       │                                │    ┌─────────────────────────┐ │
       │                                │───>│  MIDNIGHT BLOCKCHAIN    │ │
       │                                │    │                         │ │
       │                                │    │ ┌───────────────────┐   │ │
       │                                │    │ │ PRIVATE STATE     │   │ │
       │                                │    │ │  (ZK-Protected)   │   │ │
       │                                │    │ │                   │   │ │
       │                                │    │ │ exactScore: 782   │◄──┼─┼──┐
       │                                │    │ │ scoreHash: 0xabc  │   │ │  │
       │                                │    │ │ nonce: random     │   │ │  │ ENCRYPTED
       │                                │    │ │ owner: midnight1  │   │ │  │ NEVER REVEALED
       │                                │    │ └───────────────────┘   │ │  │
       │                                │    │                         │ │  │
       │                                │    │ ┌───────────────────┐   │ │  │
       │                                │    │ │ PUBLIC STATE      │   │ │  │
       │                                │    │ │  (Visible)        │   │ │  │
       │                                │    │ │                   │   │ │  │
       │                                │    │ │ scoreBucket: 3    │◄──┼─┼──┘
       │                                │    │ │   (750-849 range) │   │ │ VISIBLE
       │                                │    │ │ isActive: true    │   │ │
       │                                │    │ └───────────────────┘   │ │
       │                                │    │                         │ │
       │                                │    │ Returns:                │ │
       │                                │<───│ proofId: "mn-abc123"    │ │
       │                                │    └─────────────────────────┘ │
       │                                │                                │
       │ 5. Proof ID + Bucket           │                                │
       │    proofId: "mn-abc123"        │                                │
       │    bucket: 3 (750-849)         │                                │
       │<───────────────────────────────│                                │
       │                                │                                │
       │                                │                                │
       │ 6. Share Proof ID with Lender  │                                │
       │────────────────────────────────────────────────────────────────>│
       │    "Here's my proof: mn-abc123"│                                │
       │                                │                                │
       │                                │                                │
       │                                │    7. Verify Proof (ZK)        │
       │                                │    proofId: "mn-abc123"        │
       │                                │    requestedBucket: 2          │
       │                                │<───────────────────────────────│
       │                                │                                │
       │                                │ 8. Call ZK Circuit             │
       │                                │    ┌─────────────────────────┐ │
       │                                │───>│  MIDNIGHT BLOCKCHAIN    │ │
       │                                │    │                         │ │
       │                                │    │ verifyBucket(2) {       │ │
       │                                │    │   actualBucket =        │ │
       │                                │    │     scoreToBucket(782)  │ │
       │                                │    │     → 3                 │ │
       │                                │    │                         │ │
       │                                │    │   return 3 >= 2 → TRUE  │ │
       │                                │    │   // Never reveals 782  │ │
       │                                │    │ }                       │ │
       │                                │    │                         │ │
       │                                │<───│ Returns: true           │ │
       │                                │    └─────────────────────────┘ │
       │                                │                                │
       │                                │ 9. Verification Result         │
       │                                │    ✅ User qualifies (bucket 3)│
       │                                │───────────────────────────────>│
       │                                │    ❌ Exact score NOT revealed │
       │                                │                                │
```

## Data Flow Summary

### What Borrower Provides
- Midnight wallet address
- Credit factors (income stability, repayment, savings, community trust)

### What Gets Stored on Midnight (Private State)
```compact
private state {
  owner: "midnight1abc..."     // Wallet address
  exactScore: 782              // ENCRYPTED, ZK-PROTECTED
  scoreHash: "0xdef123..."     // SHA256 hash
  nonce: "random_bytes"        // Privacy nonce
  expiresAt: 1735430400000     // 7 days from now
}
```

### What Gets Stored on Midnight (Public State)
```compact
public state {
  scoreBucket: 3               // 750-849 range (VISIBLE)
  isActive: true               // Proof is valid
  proofCount: 0                // Times verified
}
```

### What Lender Learns
- ✅ User is in bucket 3 (750-849)
- ✅ Proof is active and not expired
- ✅ Proof has been verified N times

### What Lender NEVER Learns
- ❌ Exact score (782)
- ❌ Income amount
- ❌ Payment history details
- ❌ Savings balance
- ❌ Community reputation score

## Zero-Knowledge Proof Flow

```
┌────────────────────────────────────────────────────────────┐
│             ZK CIRCUIT: verifyBucket(requestedBucket)      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  INPUT (Public):                                           │
│    requestedBucket = 2                                     │
│                                                            │
│  WITNESS (Private):                                        │
│    exactScore = 782 ◄── NEVER REVEALED                     │
│                                                            │
│  COMPUTATION (Inside ZK):                                  │
│    actualBucket = scoreToBucket(782)                       │
│                 = 3  (because 782 is in 750-849 range)     │
│                                                            │
│    requestMatches = (actualBucket >= requestedBucket)      │
│                   = (3 >= 2)                               │
│                   = true                                   │
│                                                            │
│  OUTPUT (Public):                                          │
│    return true  ◄── ONLY THIS IS REVEALED                  │
│                                                            │
│  PRIVACY GUARANTEE:                                        │
│    The proof confirms bucket 3 >= bucket 2                 │
│    WITHOUT revealing exactScore = 782                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Compact Smart Contract Functions

### 1. initializeScore (Private Circuit)
```compact
circuit initializeScore(
  private ownerAddr: Address,
  private score: Uint<16>,      // 782 (PRIVATE)
  private scoreNonce: ByteString<16>,
  public bucket: Uint<8>        // 3 (PUBLIC)
) {
  // Validates score matches bucket
  // Stores score in PRIVATE state
  // Stores bucket in PUBLIC state
}
```

### 2. verifyBucket (ZK Proof)
```compact
circuit verifyBucket(
  private requesterAddr: Address,
  public requestedBucket: Uint<8>  // 2
) -> Bool {
  // Loads exactScore from PRIVATE state
  // Calculates actual bucket
  // Returns: actualBucket >= requestedBucket
  // NEVER reveals exactScore
}
```

### 3. proveMinimumScore (ZK Proof)
```compact
circuit proveMinimumScore(
  private requesterAddr: Address,
  public threshold: Uint<16>    // 650
) -> Bool {
  // Loads exactScore from PRIVATE state
  // Returns: exactScore >= threshold
  // NEVER reveals exactScore
}
```

## Bucket Mappings

| Bucket | Range | Credit Quality | Use Case |
|--------|-------|----------------|----------|
| 0 | 300-499 | Poor | High-risk lending, secured loans |
| 1 | 500-649 | Fair | Subprime lending, higher interest rates |
| 2 | 650-749 | Good | Prime lending, standard rates |
| 3 | 750-849 | Very Good | Premium rates, better terms |
| 4 | 850+ | Excellent | Best rates, exclusive products |

## Privacy Scenarios

### Scenario 1: Threshold Verification
```
Lender: "We require minimum score 650"

Traditional:
  User: "Here's my full report: 782 + income + history"
  Privacy: ❌ Over-sharing

With AtlasCred ZK:
  User: "Here's my proof: mn-abc123"
  Lender calls: proveMinimumScore(650)
  Result: ✅ true (qualifies)
  Privacy: ✅ Only threshold confirmation, no exact score
```

### Scenario 2: Bucket Verification
```
Lender: "We need bucket 2+ (good credit)"

Traditional:
  User: "My score is 782"
  Privacy: ❌ Exact score revealed

With AtlasCred ZK:
  User: "Here's my proof: mn-abc123"
  Lender calls: verifyBucket(2)
  Result: ✅ true (bucket 3 >= bucket 2)
  Privacy: ✅ Only bucket range, no exact score
```

### Scenario 3: Multiple Lender Verification
```
Lender A: verifyBucket(2) → ✅ true
Lender B: proveMinimumScore(700) → ✅ true
Lender C: verifyBucket(3) → ✅ true

User's exact score (782): NEVER REVEALED to anyone
Only proof ID (mn-abc123) was shared
```

## Security Properties

1. **Completeness**: If user has score >= threshold, proof will verify
2. **Soundness**: User cannot fake a proof for score they don't have
3. **Zero-Knowledge**: Verifier learns nothing beyond true/false result
4. **Non-Transferability**: Proof is bound to owner's wallet address
5. **Expiry**: Proofs expire after 7 days, forcing fresh verification
6. **Revocability**: Owner can deactivate proof at any time

---

**Key Insight**: Midnight's ZK circuits enable credit verification without privacy trade-offs. Users prove what lenders need to know without revealing sensitive financial details.
