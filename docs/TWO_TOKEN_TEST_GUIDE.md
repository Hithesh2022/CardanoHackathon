# Testing the Two-Token Verification System

## Prerequisites

✅ Backend running on http://localhost:4000  
✅ Frontend running on http://localhost:3001 (or 3000)  
✅ Lace wallet extension installed in browser  

## Test Scenarios

### ✅ Test 1: Complete Valid Flow (Happy Path)

**Purpose**: Verify the entire two-token system works correctly

**Steps**:

1. **Borrower Portal** (`http://localhost:3001/borrower`)
   - Click "Connect Wallet" button
   - Select Lace wallet from browser extension
   - Sign the authentication message
   - ✅ Wallet address should auto-fill
   - ✅ Wallet connection badge should show green

2. **Enter Financial Data**
   - Age: 30
   - Annual Income: 50000
   - Total Debt: 10000
   - Credit Utilization: 30%
   - Payment History: 100%
   - Account Age: 5 years

3. **Enter Document Number**
   - Type: `DL12345678` (or any test ID)
   - Note this number down!

4. **Generate Verification Tokens**
   - Click "Generate Verification Tokens" button
   - ✅ Base token should appear (e.g., `addr1qxy-k4j8n9m-1703567890`)
   - Copy this base token!

5. **Submit Score**
   - Click "Calculate My Credit Score" button
   - Wait for score calculation
   - ✅ Success message with proof ID should appear
   - Copy the proof ID (e.g., `midnight-proof-abc-123`)

6. **Lender Portal** (`http://localhost:3001/lender`)
   - Select "Proof ID" search type
   - Paste the proof ID from step 5
   - Paste the base token from step 4
   - Type the SAME document number: `DL12345678`
   - Click "Verify Borrower Now"
   - ✅ Should see credit score bucket (e.g., 650-749)
   - ✅ Should see "Tokens Verified: true"
   - ✅ Should see "Wallet Ownership Verified" badge

**Expected Result**: ✅ Score displayed successfully

---

### ❌ Test 2: Wrong Document Number (Fraud Detection)

**Purpose**: Verify hash mismatch detection prevents unauthorized access

**Steps**:

1. Use the same proof ID and base token from Test 1
2. **Lender Portal** (`http://localhost:3001/lender`)
   - Paste the proof ID
   - Paste the correct base token
   - Type a DIFFERENT document number: `DL99999999` (WRONG!)
   - Click "Verify Borrower Now"

**Expected Result**:
- ❌ Red error banner appears
- ❌ Message: "The base token or document number you provided does NOT match"
- ❌ Warning: "This borrower may be using someone else's proof"
- ❌ NO score displayed

**Why This Works**: Backend generates hash from lender's input (`baseToken + DL99999999`) and compares with stored hash (which was generated from `baseToken + DL12345678`). Hashes don't match → 403 Forbidden.

---

### ❌ Test 3: Missing Base Token (Incomplete Verification)

**Purpose**: Verify system requires both tokens

**Steps**:

1. Use the same proof ID from Test 1
2. **Lender Portal** (`http://localhost:3001/lender`)
   - Paste the proof ID
   - Leave base token field EMPTY
   - Type the correct document number: `DL12345678`
   - Click "Verify Borrower Now"

**Expected Result**:
- ❌ Error: "This proof requires both base token and document number"
- ❌ NO score displayed

---

### ❌ Test 4: Proof Sharing Attack Simulation

**Purpose**: Demonstrate that sharing proof ID + base token (without document number) doesn't work

**Scenario**: Alice (borrower) tries to share her good credit score with Bob (friend)

**Alice's Actions** (Test 1 above):
- Generates proof with document number: `DL12345678`
- Shares with Bob:
  - ✅ Proof ID: `midnight-proof-abc-123`
  - ✅ Base Token: `addr1qxy-k4j8n9m-1703567890`
  - ❌ Document Number: NOT SHARED (Alice wants to keep it private)

**Bob's Actions**:
1. **Lender Portal**
   - Paste Alice's proof ID
   - Paste Alice's base token
   - Tries random document numbers:
     - `DL00000000` → ❌ Verification failed
     - `DL11111111` → ❌ Verification failed
     - `PASSPORT123` → ❌ Verification failed
     - `SSN456789` → ❌ Verification failed

**Expected Result**: 
- ❌ Bob CANNOT access Alice's score
- ❌ Every attempt returns "Verification failed"
- ✅ System successfully prevents proof sharing fraud

**Why This Works**: Bob needs the EXACT document number to recreate the hash. SHA-256 has ~2^256 possible combinations. Guessing is mathematically impossible.

---

### ✅ Test 5: Wallet Address Search (Alternative Method)

**Purpose**: Verify two-token system also works when searching by wallet address

**Steps**:

1. From Test 1, note the wallet address used
2. **Lender Portal**
   - Select "Wallet Address" search type
   - Paste the wallet address (e.g., `addr1qxy...`)
   - Paste the base token from Test 1
   - Type the correct document number: `DL12345678`
   - Click "Verify Borrower Now"

**Expected Result**: 
- ✅ Score displayed successfully
- ✅ "Tokens Verified: true"

---

## Backend Verification (Developer Testing)

### Check Backend Logs

When verification succeeds, you should see:
```
Two-token verification check: {
  proofId: "midnight-proof-abc-123",
  hasLenderBaseToken: true,
  hasLenderDocNumber: true,
  hasStoredHash: true
}
Comparing verification hashes: {
  lenderHash: "a3f5e9d2c1b8...",
  storedHash: "a3f5e9d2c1b8...",
  matches: true
}
Two-token verification successful
```

When verification fails (wrong doc number):
```
Hash mismatch - fraud attempt detected: {
  proofId: "midnight-proof-abc-123",
  lenderHash: "b7c4d8e3f9a1...",
  storedHash: "a3f5e9d2c1b8..."
}
```

### Manual API Testing

**Valid Request**:
```bash
curl "http://localhost:4000/verify/midnight-proof-abc-123?baseToken=addr1qxy-k4j8n9m-1703567890&documentNumber=DL12345678"
```

**Expected Response** (200 OK):
```json
{
  "found": true,
  "proofId": "midnight-proof-abc-123",
  "scoreBucket": 2,
  "bucketRange": "650-749",
  "tokensRequired": true,
  "tokensVerified": true,
  "walletSignature": "...",
  "signatureVerified": true
}
```

**Invalid Request** (wrong document number):
```bash
curl "http://localhost:4000/verify/midnight-proof-abc-123?baseToken=addr1qxy-k4j8n9m-1703567890&documentNumber=WRONG_DOC"
```

**Expected Response** (403 Forbidden):
```json
{
  "error": "Verification failed",
  "message": "The base token or document number you provided does NOT match. This borrower may be using someone else's proof.",
  "tokensRequired": true,
  "tokensVerified": false
}
```

---

## Debugging Tips

### Frontend Issues

**Problem**: Base token not generating
- Check browser console for errors
- Verify Web Crypto API is available: `crypto.subtle !== undefined`
- Ensure HTTPS or localhost (Web Crypto requires secure context)

**Problem**: "Network error" on submit
- Check backend is running: http://localhost:4000/health
- Check CORS settings in backend
- Verify API_BASE environment variable

### Backend Issues

**Problem**: "Cannot find name 'crypto'"
- Verify import at top: `import crypto from 'crypto'`
- Check Node.js version (should be 20+)

**Problem**: Hash always mismatch
- Check separator used: Should be `-` (hyphen)
- Verify trimming: Both frontend and backend trim whitespace
- Check hash algorithm: Should be SHA-256 on both ends
- Compare hash format: Should be hex string (lowercase)

### Hash Verification Debug

**Frontend** (BorrowerPage):
```typescript
console.log('Base Token:', baseToken);
console.log('Document Number:', documentNumber);
console.log('Verification Hash:', verificationHash);
```

**Backend** (Verification endpoint):
```typescript
logger.info({
  lenderData: `${lenderBaseToken.trim()}-${lenderDocumentNumber.trim()}`,
  lenderHash,
  storedHash: storedVerificationHash
}, 'Hash comparison debug');
```

**Manual Hash Generation Test**:
```javascript
// Run in Node.js REPL
const crypto = require('crypto');
const baseToken = 'addr1qxy-k4j8n9m-1703567890';
const docNumber = 'DL12345678';
const data = `${baseToken}-${docNumber}`;
const hash = crypto.createHash('sha256').update(data).digest('hex');
console.log('Hash:', hash);
```

---

## Success Criteria

✅ **Test 1**: Borrower can generate tokens and lender can verify with correct inputs  
✅ **Test 2**: Wrong document number returns 403 error  
✅ **Test 3**: Missing base token returns 403 error  
✅ **Test 4**: Proof sharing attack fails (Bob cannot access Alice's score)  
✅ **Test 5**: Wallet address search also requires token verification  

---

## Known Limitations

⚠️ **Base Token Not Stored**: If borrower closes browser before sharing base token, they cannot recover it. Solution: Display base token prominently and ask user to copy it.

⚠️ **Document Number Not Validated**: System doesn't check if document number is a real government ID. It just checks if hashes match. This is by design for privacy.

⚠️ **No Expiration**: Base tokens don't expire. Future enhancement could add expiration timestamps.

---

## Next Steps

1. ✅ Test all scenarios above
2. ✅ Verify backend logs show correct hash comparisons
3. ✅ Confirm fraud detection works (Test 4)
4. 📸 Take screenshots of success/failure states
5. 📝 Document any issues found
6. 🚀 Deploy to production with same security guarantees

---

**Questions?** See [TWO_TOKEN_VERIFICATION.md](TWO_TOKEN_VERIFICATION.md) for technical details.
