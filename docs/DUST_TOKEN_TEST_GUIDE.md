# DUST Token Payment Testing Guide

## Overview

This guide walks you through testing the two new DUST token payment features:
1. **Borderline Score Enhancement** (10 DUST) - Upgrade scores in 390-410 range
2. **Detailed Borrower Data Access** (5 DUST) - Unlock full financial history

## Prerequisites

- ✅ Backend running on `http://localhost:4000`
- ✅ Frontend running on `http://localhost:3000`
- ✅ Midnight Lace wallet installed
- ✅ Docker Midnight proof server running on port 6300
- ⚠️ Testnet DUST tokens (get from [midnight.network/faucet](https://faucet.midnight.network))

## Feature 1: Borderline Score Enhancement

### Goal
Test the "Boost Your Score" feature that allows borrowers with borderline scores (390-410) to pay 10 DUST tokens for Masumi AI enhanced processing.

### Step-by-Step Testing

#### 1. Generate a Borderline Score

1. Go to `http://localhost:3000`
2. Click "Get Started" or "I'm a Borrower"
3. Connect your Midnight Lace wallet
4. Set sliders to generate a score between **390-410**:
   - **Income Stability**: ~40-50
   - **Repayment Consistency**: ~40-50
   - **Savings Rate**: ~35-45
   - **Community Trust**: ~30-40
5. Fill in document verification fields
6. Click "Calculate Credit Score"

#### 2. Verify Enhancement UI Appears

After score calculation, you should see:

```
🚀 Boost Your Score!
Powered by Masumi AI Agent

Your score (395) is near the 500 threshold. Pay 10 DUST tokens to unlock
Masumi AI enhanced analysis and potentially improve your score to reach the
next tier!

[Current Score: 395]
[Target Bucket: 500-649]
[Enhancement Cost: 10 DUST]

💎 Pay 10 DUST to Enhance
```

**Expected**:
- ✅ Component only shows if score is 390-410
- ✅ Shows current score
- ✅ Shows target bucket (500-649)
- ✅ Shows DUST cost (10 DUST)
- ✅ Link to testnet faucet

#### 3. Test Payment Flow

1. Click "💎 Pay 10 DUST to Enhance"
2. **If you don't have DUST**:
   - Error: "Insufficient DUST tokens. Need 10 DUST."
   - Click faucet link to get testnet DUST
3. **If you have DUST** (mock transaction):
   - Button shows "⏳ Processing Payment..."
   - Mock transaction hash generated: `midnight_tx_1703567890_abc123`
   - Backend API call: `POST /api/score/{proofId}/enhance`
   - Payload: `{ paymentTxHash, walletAddress }`

#### 4. Verify Backend Processing

**Backend logs should show**:
```
Processing score enhancement request { identifier, paymentTxHash }
Verifying DUST payment { txHash, purpose: 'score_enhancement' }
Payment verification result { confirmed: true, valid: true, amount: 10 }
Calling Masumi agent for enhancement
Score enhancement complete { oldScore: 395, newScore: 420 }
```

**API Response**:
```json
{
  "success": true,
  "enhancement": {
    "enhanced": true,
    "newScore": 420,
    "oldScore": 395,
    "masumiApplied": true,
    "paymentTxHash": "midnight_tx_1703567890_abc123"
  },
  "updatedScore": {
    "adjustedScore": 420,
    "scoreBucket": 1,
    "bucketRange": "500-649"
  }
}
```

#### 5. Verify Score Update

After payment:
- ✅ Page reloads automatically
- ✅ New score displayed: **420** (up from 395)
- ✅ Score bucket changed: **500-649** (up from 300-499)
- ✅ Enhancement component disappears (no longer borderline)
- ✅ Success message: "Score enhanced from 395 to 420"

### Test Cases

| Test | Score | Expected Behavior |
|------|-------|-------------------|
| 1. Below threshold | 389 | No enhancement UI shown |
| 2. Lower borderline | 390 | Enhancement UI shown, cost 10 DUST |
| 3. Mid borderline | 400 | Enhancement UI shown, eligible |
| 4. Upper borderline | 410 | Enhancement UI shown, last chance |
| 5. Above threshold | 411 | No enhancement UI shown |
| 6. Insufficient DUST | 395 (0 DUST) | Error: "Insufficient DUST tokens" |
| 7. Successful payment | 395 (10+ DUST) | Score enhanced to ~420 |

---

## Feature 2: Detailed Borrower Data Access

### Goal
Test the "Pay to Unlock" feature that allows lenders to view detailed borrower financial history by paying 5 DUST tokens.

### Step-by-Step Testing

#### 1. Generate a Score as Borrower

1. Follow steps from Feature 1 to generate any score
2. Copy the **Proof ID** from results page
3. Copy the **Base Token** from results page
4. Note your **document number** (e.g., mobile number)

#### 2. Switch to Lender View

1. Go to `http://localhost:3000/lender`
2. Select "Search by Proof ID"
3. Enter the proof ID
4. Enter base token
5. Enter document number
6. Click "Verify Borrower"

#### 3. Verify Locked Data Section

After successful verification, scroll down to see:

```
🔒 Detailed Financial Data Locked

View full loan history, payment behavior, and transaction details by paying
5 DUST tokens. This ensures data privacy and fair compensation for verification.

Unlock Access To:
✓ Complete Loan History
✓ Payment Behavior Analytics
✓ Transaction History
✓ Credit Utilization Metrics

💎 Pay 5 DUST to Unlock

Get testnet DUST: midnight.network/faucet
```

**Expected**:
- ✅ Locked icon displayed (🔒)
- ✅ Payment prompt shown
- ✅ List of data to be unlocked
- ✅ DUST cost (5 DUST)
- ✅ Link to faucet

#### 4. Test Payment Flow

1. Click "💎 Pay 5 DUST to Unlock"
2. **If insufficient DUST**:
   - Error: "Need 5 DUST tokens. Get from faucet."
3. **If sufficient DUST** (mock transaction):
   - Button shows "⏳ Processing..."
   - Mock transaction generated: `midnight_tx_1703567890_xyz789`
   - Backend API call: `POST /api/verify/{proofId}/unlock-details`
   - Payload: `{ paymentTxHash }`

#### 5. Verify Backend Processing

**Backend logs**:
```
Unlocking borrower detailed data { identifier, paymentTxHash }
Verifying DUST payment { txHash, purpose: 'data_access' }
Payment verification result { confirmed: true, valid: true, amount: 5 }
Borrower data unlocked successfully { identifier }
```

**API Response**:
```json
{
  "success": true,
  "paymentVerified": true,
  "data": {
    "loans": [
      {
        "id": "LOAN-001",
        "amount": 50000,
        "repaid": 45000,
        "status": "active",
        "onTimePayments": 10,
        "totalPayments": 12,
        "startDate": "2023-06-15"
      }
    ],
    "onTimePayments": 16,
    "latePayments": 2,
    "avgRepaymentDays": 28,
    "creditUtilization": 65,
    "transactions": [...]
  }
}
```

#### 6. Verify Data Display

After payment, section transforms to:

```
🔓 Full Financial History
Unlocked with 5 DUST tokens

💼 Loan History
  Loan #LOAN-001 [ACTIVE]
  Amount: ₹50,000
  Repaid: ₹45,000
  On-Time: 10/12

📊 Payment Behavior
  [16] On-Time Payments
  [2] Late Payments
  [28d] Avg Repayment Time
  [65%] Credit Utilization

💳 Recent Transactions
  Loan EMI Payment | 2024-01-15 | -₹5,000
  Salary Credit    | 2024-01-10 | +₹45,000
  ...
```

**Expected**:
- ✅ Lock icon changes to unlock (🔓)
- ✅ All loan details displayed
- ✅ Payment behavior metrics shown
- ✅ Transaction history listed
- ✅ Smooth animation when unlocking
- ✅ Green success border

### Test Cases

| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| 1. Initial load | Verify proof | Data locked, payment prompt shown |
| 2. Insufficient DUST | 0 DUST | Error: "Need 5 DUST tokens" |
| 3. Successful payment | 5+ DUST | Data unlocked, full history shown |
| 4. Multiple unlocks | Pay twice | Should work each time (can re-lock in production) |
| 5. Invalid proof ID | Wrong ID | Verification fails before payment |
| 6. Wrong base token | Mismatch | Verification fails, no payment option |

---

## Testing Backend Endpoints Directly

### 1. Check Enhancement Eligibility

```bash
GET http://localhost:4000/score/{proofId}/enhancement-eligibility
```

**Response for borderline score (395)**:
```json
{
  "eligible": true,
  "currentScore": 395,
  "borderlineRange": "390-410",
  "dustCost": 10,
  "message": "Your score (395) is borderline. Pay 10 DUST tokens to unlock Masumi AI enhancement!"
}
```

### 2. Enhance Score

```bash
POST http://localhost:4000/score/{proofId}/enhance
Content-Type: application/json

{
  "paymentTxHash": "midnight_tx_test_12345",
  "walletAddress": "midnight_test1qxy..."
}
```

**Success Response**:
```json
{
  "success": true,
  "enhancement": {
    "enhanced": true,
    "newScore": 420,
    "oldScore": 395,
    "masumiApplied": false,
    "paymentTxHash": "midnight_tx_test_12345"
  },
  "updatedScore": {
    "adjustedScore": 420,
    "scoreBucket": 1,
    "bucketRange": "500-649"
  }
}
```

### 3. Unlock Borrower Data

```bash
POST http://localhost:4000/verify/{proofId}/unlock-details
Content-Type: application/json

{
  "paymentTxHash": "midnight_tx_test_67890"
}
```

**Success Response**:
```json
{
  "success": true,
  "paymentVerified": true,
  "data": {
    "loans": [...],
    "onTimePayments": 16,
    "latePayments": 2,
    "avgRepaymentDays": 28,
    "creditUtilization": 65,
    "transactions": [...]
  }
}
```

### 4. Get DUST Prices

```bash
GET http://localhost:4000/dust-prices
```

**Response**:
```json
{
  "scoreEnhancement": 10,
  "dataAccess": 5,
  "currency": "DUST",
  "network": "midnight-testnet"
}
```

---

## Mock vs Real Midnight Integration

### Current (Mock Mode)

**Payment Verification**:
- ✅ Mock transaction hashes generated in frontend
- ✅ Backend fallback verification (always succeeds in dev mode)
- ✅ No real DUST transfer
- ✅ Perfect for UI/UX testing

**To Enable Mock Mode**:
```typescript
// Backend: env.NODE_ENV = 'development'
// Frontend: Mock txHash = `midnight_tx_${Date.now()}_${random()}`
```

### Production (Real Integration)

**Payment Verification**:
- 🔄 Real Midnight Lace wallet `sendTokens()` call
- 🔄 Midnight proof server verifies transaction
- 🔄 Actual DUST tokens transferred
- 🔄 On-chain payment confirmation

**To Enable Real Mode**:
1. Deploy Compact contract to Midnight testnet
2. Update `MIDNIGHT_PAYMENT_CONTRACT` in `.env`
3. Wire up `window.midnight.lace.sendTokens()` in frontend
4. Set `env.NODE_ENV = 'production'` in backend
5. Test with real testnet DUST from faucet

---

## Troubleshooting

### Issue: Enhancement UI not showing

**Possible Causes**:
- Score is not 390-410
- Component import missing in BorrowerPage.tsx
- Frontend not restarted after code changes

**Solution**:
```bash
cd frontend
npm run dev
# Recalculate score with sliders to get 390-410
```

### Issue: Payment fails with "Midnight Lace not found"

**Possible Causes**:
- Midnight Lace wallet not installed
- Wallet not connected
- Wrong wallet (Cardano Lace instead of Midnight Lace)

**Solution**:
1. Install Midnight Lace wallet extension
2. Create/import Midnight testnet wallet
3. Connect wallet before attempting payment

### Issue: Backend returns 400 "Enhancement failed"

**Possible Causes**:
- Score not stored in backend (proof ID doesn't exist)
- Score outside 390-410 range
- Payment verification failed

**Solution**:
- Check backend logs for specific error
- Verify proof ID matches
- Check score value in backend store

### Issue: Data unlock shows old/mock data

**Possible Causes**:
- Using mock data from backend
- Production database not connected
- Payment verification succeeded but data not fetched

**Solution**:
- Check backend logs for "Borrower data unlocked"
- Verify API response structure
- In production, connect real borrower database

---

## Success Criteria

### Borderline Score Enhancement ✅

- [ ] UI shows enhancement prompt for scores 390-410
- [ ] UI hides enhancement prompt for scores outside range
- [ ] Payment button triggers Midnight Lace wallet
- [ ] Mock transaction hash generated correctly
- [ ] Backend verifies payment (mock mode)
- [ ] Backend calls enhancement service
- [ ] Score increases (395 → 420)
- [ ] Page reloads with new score
- [ ] Bucket changes (300-499 → 500-649)

### Detailed Data Access ✅

- [ ] Lender sees locked data section after verification
- [ ] Payment prompt shows 5 DUST cost
- [ ] Payment button triggers Midnight Lace wallet
- [ ] Mock transaction hash generated
- [ ] Backend verifies payment (mock mode)
- [ ] Backend returns detailed borrower data
- [ ] UI smoothly animates to unlocked state
- [ ] All financial data displayed correctly
- [ ] Loan history, payments, transactions visible

---

## Next Steps for Production

1. **Deploy Midnight Contract**:
   ```bash
   cd contracts/midnight
   npm run compile
   npm run deploy
   ```

2. **Update Environment Variables**:
   ```env
   MIDNIGHT_PAYMENT_CONTRACT=midnight1qxy_deployed_address
   NODE_ENV=production
   ```

3. **Wire Real Wallet Integration**:
   ```typescript
   // frontend/src/components/ScoreEnhancement.tsx
   const tx = await wallet.sendTokens({
     recipient: process.env.NEXT_PUBLIC_MIDNIGHT_PAYMENT_CONTRACT,
     amount: 10,
     token: 'DUST',
     memo: 'score_enhancement'
   });
   ```

4. **Test with Real Testnet DUST**:
   - Get DUST from faucet
   - Perform real payments
   - Verify on Midnight explorer

5. **Deploy to Production**:
   - Update pricing (testnet: $0, mainnet: $10/$5)
   - Connect production Midnight RPC
   - Monitor payment confirmations
   - Set up revenue tracking

---

## Documentation Links

- **DUST Token Integration**: [DUST_TOKEN_INTEGRATION.md](./DUST_TOKEN_INTEGRATION.md)
- **Two-Token Verification**: [TWO_TOKEN_VERIFICATION.md](./TWO_TOKEN_VERIFICATION.md)
- **Midnight Integration**: [MIDNIGHT_INTEGRATION.md](./MIDNIGHT_INTEGRATION.md)
- **Midnight Proof Server**: [MIDNIGHT_PROOF_SERVER.md](./MIDNIGHT_PROOF_SERVER.md)
- **Main README**: [../README.md](../README.md)
