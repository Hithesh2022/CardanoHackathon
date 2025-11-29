# Two-Token Hash-Based Verification System

## Overview

This document explains the cryptographic two-token verification system implemented to prevent borrowers from sharing credit score proofs with unauthorized users.

## Problem Statement

**Original Security Flaw:**
Borrowers could share their proof ID with friends, allowing anyone to access their credit score. This defeated the purpose of identity verification.

**Previous Attempt (Document Number Matching):**
Simple string comparison of document numbers was attempted but didn't work correctly due to implementation issues.

## Solution: Two-Token Hash System

### How It Works

The system uses SHA-256 cryptographic hashing to create an unforgeable link between the proof and the borrower's identity document.

#### 1. Token Generation (Borrower Side)

**Location:** `frontend/src/components/BorrowerPage.tsx`

When the borrower generates a credit score proof:

```typescript
// Step 1: Generate random base token
const timestamp = Date.now();
const random = Math.random().toString(36).substring(2, 15);
const baseToken = `${wallet.substring(0, 8)}-${random}-${timestamp}`;

// Step 2: Create verification hash
const verificationHash = SHA256(baseToken + documentNumber);

// Step 3: Send both to backend
POST /score {
  walletAddress,
  walletSignature,
  baseToken,
  verificationHash  // NOT documentNumber
}
```

**What gets stored in backend:**
- `baseToken`: NOT stored (only used for hash generation)
- `verificationHash`: Stored (hash of baseToken + documentNumber)
- `documentNumber`: NOT stored (privacy protection)

**What borrower shares with lender:**
- Proof ID (from backend response)
- Base Token (displayed in UI)
- Document Number (verbally or securely)

#### 2. Verification (Lender Side)

**Location:** `frontend/src/components/LenderPage.tsx`

When the lender wants to verify the score:

```typescript
// Lender provides THREE pieces of information:
1. Proof ID (or wallet address)
2. Base Token (from borrower)
3. Document Number (from borrower)

// Frontend sends both tokens to backend
GET /verify/:proofId?baseToken=...&documentNumber=...
```

**Backend Verification Logic:**
**Location:** `backend/src/index.ts` (line ~236)

```typescript
// Step 1: Check if verification is required
if (storedVerificationHash) {
  // Step 2: Require both tokens
  if (!lenderBaseToken || !lenderDocumentNumber) {
    return 403 "Verification tokens required";
  }
  
  // Step 3: Recreate hash from lender's input
  const lenderHash = SHA256(lenderBaseToken + lenderDocumentNumber);
  
  // Step 4: Compare hashes
  if (lenderHash !== storedVerificationHash) {
    return 403 "Verification failed - fraud attempt detected";
  }
  
  // Step 5: Hashes match → return score
}
```

## Security Benefits

### ✅ Prevents Proof Sharing

**Scenario:** Alice (Borrower) shares her proof with Bob (Friend)

- Alice has proof ID: `midnight-proof-abc-123`
- Alice generates base token: `addr1qxy-k4j8n9m-1703567890`
- Alice's document number: `DL12345678`
- Backend stores: `hash(addr1qxy-k4j8n9m-1703567890 + DL12345678)`

**What Bob can't do:**
- ❌ Bob only knows: proof ID + base token
- ❌ Bob does NOT know Alice's document number
- ❌ Bob tries random document numbers → hashes won't match
- ❌ Backend rejects Bob's verification attempts

**Why it works:**
- SHA-256 is one-way (can't reverse the hash to find document number)
- Without the exact document number, Bob cannot recreate the hash
- Backend never returns the score unless hash matches perfectly

### ✅ Cryptographically Secure

- Uses SHA-256 (same algorithm as Bitcoin/Cardano)
- Collision resistance: ~2^256 combinations
- One-way function: Cannot derive inputs from hash output
- Deterministic: Same input always produces same hash

### ✅ Privacy Preserving

- Document number never stored in backend
- Only hash is stored (irreversible)
- Lender must know both base token AND document number
- Backend never exposes what the document number should be

## Implementation Details

### Frontend Hash Generation

**File:** `frontend/src/components/BorrowerPage.tsx`

```typescript
const generateHash = async (baseToken: string, documentNumber: string): Promise<string> => {
  // Concatenate with separator
  const data = `${baseToken}-${documentNumber}`;
  
  // Use Web Crypto API (browser-native, secure)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
```

### Backend Hash Generation

**File:** `backend/src/index.ts`

```typescript
import crypto from 'crypto';

// In verification endpoint
const lenderData = `${lenderBaseToken.trim()}-${lenderDocumentNumber.trim()}`;
const lenderHash = crypto.createHash('sha256').update(lenderData).digest('hex');
```

### Type Definitions

**File:** `backend/src/types.ts`

```typescript
interface ScoreRequest {
  walletAddress: string;
  walletSignature?: string;
  baseToken?: string;           // NEW: Random token
  verificationHash?: string;    // NEW: Hash of base + doc
  // documentNumber removed (never stored)
}

interface ScoreResponse {
  midnightProof: {
    proofId: string;
    verificationHash?: string;  // NEW: Hash stored here
    // documentNumber removed
  }
}
```

## User Flow

### Borrower Flow

1. **Connect Wallet** → OAuth-style authentication with Lace/Eternl/Nami
2. **Enter Financial Data** → Age, income, debt, etc.
3. **Enter Document Number** → Government ID, passport, etc. (e.g., `DL12345678`)
4. **Generate Verification Tokens** → Click button to create:
   - Base Token: `addr1qxy-k4j8n9m-1703567890` (displayed)
   - Verification Hash: `a3f5e9d2c1b8...` (hidden, sent to backend)
5. **Submit Score** → Backend stores hash, returns proof ID
6. **Share with Lender:**
   - Proof ID: `midnight-proof-abc-123` ✅
   - Base Token: `addr1qxy-k4j8n9m-1703567890` ✅
   - Document Number: `DL12345678` ✅

### Lender Flow

1. **Enter Proof ID** → From borrower
2. **Enter Base Token** → From borrower (e.g., `addr1qxy-k4j8n9m-1703567890`)
3. **Enter Document Number** → Ask borrower verbally (e.g., `DL12345678`)
4. **Verify** → Backend:
   - Generates hash from lender's base token + document number
   - Compares with stored hash
   - ✅ Match → Show credit score bucket
   - ❌ Mismatch → 403 Forbidden (fraud detected)

## Error Messages

### Missing Tokens (403)
```json
{
  "error": "Verification tokens required",
  "message": "This proof requires both base token and document number. Please ask the borrower for these.",
  "tokensRequired": true
}
```

### Hash Mismatch (403)
```json
{
  "error": "Verification failed",
  "message": "The base token or document number you provided does NOT match. This borrower may be using someone else's proof.",
  "tokensRequired": true,
  "tokensVerified": false
}
```

### Success (200)
```json
{
  "found": true,
  "proofId": "midnight-proof-abc-123",
  "scoreBucket": 2,
  "bucketRange": "650-749",
  "tokensRequired": true,
  "tokensVerified": true,
  // ... other score data
}
```

## Testing

### Test Case 1: Valid Verification
1. Borrower generates proof with document number `DL12345678`
2. Lender enters correct base token + document number
3. ✅ Expected: Backend returns score

### Test Case 2: Wrong Document Number
1. Borrower generates proof with document number `DL12345678`
2. Lender enters correct base token + WRONG document number `DL99999999`
3. ❌ Expected: Backend returns 403 "Verification failed"

### Test Case 3: Proof Sharing Attack
1. Alice generates proof with her document number
2. Alice shares proof ID + base token with Bob
3. Bob does NOT know Alice's document number
4. Bob tries to verify with random document numbers
5. ❌ Expected: All attempts return 403 "Verification failed"

## Files Modified

### Frontend
- ✅ `frontend/src/components/BorrowerPage.tsx`
  - Added `generateHash()` function
  - Added `baseToken` and `verificationHash` state
  - Added `generateTokens()` function
  - Updated UI to show base token
  - Updated `handleSubmit()` to send tokens

- ✅ `frontend/src/components/LenderPage.tsx`
  - Added `baseToken` state
  - Added base token input field
  - Updated fetch to send both tokens as query params

### Backend
- ✅ `backend/src/index.ts`
  - Added `import crypto from 'crypto'`
  - POST `/score`: Stores `verificationHash` instead of `documentNumber`
  - GET `/verify/:identifier`: Two-token hash verification logic
  - Returns 403 if tokens missing or hash mismatch

- ✅ `backend/src/types.ts`
  - Updated `ScoreRequest` interface with `baseToken` and `verificationHash`
  - Updated `ScoreResponse.midnightProof` to store `verificationHash`

## Advantages Over Previous Approach

| Feature | Simple Document Matching | Two-Token Hash System |
|---------|-------------------------|----------------------|
| **Security** | String comparison (can be bypassed) | SHA-256 cryptographic hash |
| **Privacy** | Document number stored in DB | Only hash stored (irreversible) |
| **Fraud Prevention** | Weak (social engineering possible) | Strong (need both tokens) |
| **Proof Sharing** | Easy (just need proof ID) | Impossible (need doc number) |
| **Implementation** | Simple but buggy | More complex but robust |

## Future Enhancements

1. **Token Expiration**: Base tokens could expire after 24 hours
2. **Rate Limiting**: Prevent brute-force hash guessing attempts
3. **Audit Log**: Track verification attempts for suspicious patterns
4. **Multi-Factor**: Add biometric verification layer
5. **Zero-Knowledge Proof**: Use ZK-SNARKs for document verification

## Conclusion

The two-token hash-based verification system provides cryptographically secure fraud prevention while maintaining user privacy. It's mathematically impossible for borrowers to share proofs with unauthorized users without also sharing their personal document number.

**Key Takeaway:** Only someone who knows BOTH the base token AND the exact document number can access the credit score.
