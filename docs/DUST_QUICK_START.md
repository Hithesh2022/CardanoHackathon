# 🚀 DUST Token Payment System - Quick Start

## What's New?

Two premium features added to AtlasCred using DUST tokens on Midnight blockchain:

### 1. 🎯 Borderline Score Enhancement (10 DUST)
**For Borrowers**: If your score is 390-410 (borderline), pay 10 DUST tokens to unlock Masumi AI enhanced processing and potentially boost your score to the next tier (500-649).

### 2. 🔓 Detailed Borrower Data Access (5 DUST)
**For Lenders**: Pay 5 DUST tokens to unlock complete borrower financial history including loans, payment behavior, transactions, and credit utilization.

---

## Testing Right Now (Mock Mode)

### Prerequisites
- ✅ Backend running: `cd backend && npm run dev` (port 4000)
- ✅ Frontend running: `cd frontend && npm run dev` (port 3000)
- ✅ Docker proof server: `docker ps` (should show midnight-proof-server on port 6300)
- ⚠️ **No wallet required** - Using Docker proof server directly

### Test Feature 1: Score Enhancement

1. **Generate Borderline Score**:
   - Go to http://localhost:3000
   - Click "I'm a Borrower"
   - Connect Midnight Lace wallet
   - Set sliders to get score 390-410:
     - Income Stability: ~45
     - Repayment Consistency: ~45
     - Savings Rate: ~40
     - Community Trust: ~35
   - Click "Calculate Credit Score"

2. **See Enhancement UI**:
   ```
   🚀 Boost Your Score!
   Your score (395) is near the 500 threshold.
   Pay 10 DUST tokens to unlock Masumi AI enhancement!
   
   [💎 Pay 10 DUST to Enhance]
   ```

3. **Click Button**:
   - Mock transaction succeeds immediately
   - Score enhances: 395 → 420
   - Bucket changes: 300-499 → 500-649
   - Page reloads automatically

### Test Feature 2: Data Access

1. **Generate Score as Borrower**:
   - Follow steps above with any score
   - Copy Proof ID and Base Token

2. **Switch to Lender View**:
   - Go to http://localhost:3000/lender
   - Enter Proof ID, Base Token, Document Number
   - Click "Verify Borrower"

3. **See Locked Data**:
   ```
   🔒 Detailed Financial Data Locked
   View full loan history by paying 5 DUST tokens
   
   [💎 Pay 5 DUST to Unlock]
   ```

4. **Click Button**:
   - Mock transaction succeeds
   - Data unlocks with animation
   - Shows: loans, payments, transactions, utilization

---

## API Endpoints (Test with Postman/curl)

### Check Enhancement Eligibility
```bash
GET http://localhost:4000/score/{proofId}/enhancement-eligibility
```

**Response**:
```json
{
  "eligible": true,
  "currentScore": 395,
  "borderlineRange": "390-410",
  "dustCost": 10
}
```

### Enhance Score
```bash
POST http://localhost:4000/score/{proofId}/enhance
Content-Type: application/json

{
  "paymentTxHash": "mock_tx_12345",
  "walletAddress": "midnight_test1qxy..."
}
```

### Unlock Data
```bash
POST http://localhost:4000/verify/{proofId}/unlock-details
Content-Type: application/json

{
  "paymentTxHash": "mock_tx_67890"
}
```

### Get Prices
```bash
GET http://localhost:4000/dust-prices
```

---

## Files Changed

### Backend
- ✅ `backend/src/services/dustPaymentService.ts` (NEW) - Payment verification
- ✅ `backend/src/index.ts` - 4 new API endpoints
- ✅ `backend/src/config/env.ts` - Environment variables

### Frontend
- ✅ `frontend/src/components/ScoreEnhancement.tsx` (NEW) - Enhancement UI
- ✅ `frontend/src/components/LenderDataAccess.tsx` (NEW) - Data unlock UI
- ✅ `frontend/src/components/BorrowerPage.tsx` - Integrated enhancement
- ✅ `frontend/src/components/LenderPage.tsx` - Integrated data access

### Documentation
- ✅ `docs/DUST_TOKEN_INTEGRATION.md` - Technical guide
- ✅ `docs/DUST_TOKEN_TEST_GUIDE.md` - Testing instructions
- ✅ `docs/DUST_IMPLEMENTATION_SUMMARY.md` - Complete summary
- ✅ `README.md` - Updated with DUST features

---

## Current Status

### ✅ Working Now
- Complete UI implementation (beautiful, animated)
- All API endpoints (4 new)
- Mock payment verification
- Error handling
- Loading states
- Success animations

### 🔄 Docker Proof Server Mode
- Transaction hashes: `proof_${timestamp}_${random}`
- Backend validates via Docker Midnight proof server (port 6300)
- No wallet or DUST transfers needed
- Uses real Midnight proof server infrastructure

### ⏳ Next Steps
1. Deploy Midnight Compact contract
2. Wire real `wallet.sendTokens()` calls
3. Get testnet DUST from faucet
4. Test real payments
5. Deploy to production

---

## Quick Troubleshooting

### Enhancement UI not showing
- **Check**: Score must be 390-410
- **Fix**: Adjust sliders to get borderline score

### Payment button does nothing
- **Check**: Midnight Lace wallet installed?
- **Fix**: Install from midnight.network

### Backend error
- **Check**: Backend logs for specific error
- **Fix**: Verify proof ID exists, score in range

### Data not unlocking
- **Check**: Payment verification succeeded?
- **Fix**: Check backend logs, verify API response

---

## Documentation Links

| Document | Purpose |
|----------|---------|
| [DUST_TOKEN_INTEGRATION.md](./DUST_TOKEN_INTEGRATION.md) | Complete technical implementation |
| [DUST_TOKEN_TEST_GUIDE.md](./DUST_TOKEN_TEST_GUIDE.md) | Step-by-step testing |
| [DUST_IMPLEMENTATION_SUMMARY.md](./DUST_IMPLEMENTATION_SUMMARY.md) | What was built |
| [README.md](../README.md) | Main project documentation |

---

## Success Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000
- [ ] Generate borderline score (390-410)
- [ ] See "🚀 Boost Your Score!" UI
- [ ] Click payment button (mock succeeds)
- [ ] Score enhances to higher bucket
- [ ] Switch to lender view
- [ ] Verify borrower proof
- [ ] See "🔒 Detailed Financial Data Locked"
- [ ] Click unlock button (mock succeeds)
- [ ] See full financial history

---

## Get Testnet DUST (For Production)

1. Visit https://faucet.midnight.network
2. Connect Midnight Lace wallet
3. Request DUST tokens (100 DUST)
4. Wait 30 seconds
5. Use for real payments

---

## Contact & Support

- **Documentation**: All guides in `docs/` folder
- **Code**: Backend `src/services/dustPaymentService.ts`
- **UI**: Frontend `src/components/ScoreEnhancement.tsx` and `LenderDataAccess.tsx`
- **Testing**: Follow `DUST_TOKEN_TEST_GUIDE.md`

---

**Status**: ✅ Fully implemented and ready for testing in mock mode

**Next Milestone**: Deploy to Midnight testnet with real DUST payments
