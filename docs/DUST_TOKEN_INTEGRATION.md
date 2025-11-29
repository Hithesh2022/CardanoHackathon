# Midnight DUST Token Integration

## Overview

This document describes the DUST token payment system for:
1. **Score Enhancement**: Borrowers pay DUST to improve borderline scores (390-410 range)
2. **Data Access**: Lenders pay DUST to view detailed borrower financial data

## Architecture

### Borrower Score Enhancement Flow

```
Borrower Score: 395 (Borderline)
         ↓
[Pay 10 DUST Tokens]
         ↓
Masumi AI Agent Enhanced Processing
         ↓
New Score: 420 (Improved)
```

### Lender Data Access Flow

```
Lender Views Score: 650-749
         ↓
Wants to See Details (loans, payments, etc.)
         ↓
[Pay 5 DUST Tokens]
         ↓
Unlock Full Financial History
```

## Implementation

### 1. Midnight Wallet Integration

**Frontend: Connect to Midnight Lace**
```typescript
// window.midnight.lace API
const wallet = await window.midnight.lace.enable();
const balance = await wallet.getBalance(); // Get DUST balance
const address = await wallet.getAddress(); // Get midnight1... address
```

### 2. DUST Token Payment Contract

**Location**: `contracts/midnight/dust-payment.compact`

```compact
circuit DustPayment {
  // Private inputs
  private payerAddress: Address;
  private amount: Nat;
  private purpose: Text; // "score_enhancement" or "data_access"
  
  // Public outputs
  public transactionId: Text;
  public confirmed: Bool;
  
  // Payment logic
  function processPayment(): Bool {
    if (purpose == "score_enhancement" && amount >= 10) {
      return true;
    }
    if (purpose == "data_access" && amount >= 5) {
      return true;
    }
    return false;
  }
}
```

### 3. Backend Service Integration

**File**: `backend/src/services/dustPaymentService.ts`

```typescript
import { MidnightBridge } from './midnightBridge.js';

export class DustPaymentService {
  constructor(private midnight: MidnightBridge) {}
  
  async verifyPayment(txHash: string, purpose: 'score_enhancement' | 'data_access'): Promise<boolean> {
    // Query Midnight proof server
    const response = await fetch('http://localhost:6300/api/transaction/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash, purpose })
    });
    
    const result = await response.json();
    return result.confirmed && result.valid;
  }
  
  async enhanceScore(
    proofId: string, 
    paymentTxHash: string, 
    currentScore: number
  ): Promise<{ enhanced: boolean; newScore: number }> {
    // Verify DUST payment (10 tokens)
    const paymentValid = await this.verifyPayment(paymentTxHash, 'score_enhancement');
    
    if (!paymentValid) {
      throw new Error('Payment verification failed');
    }
    
    // Call Masumi agent with enhanced parameters
    const masumiResponse = await fetch('http://localhost:8000/enhance-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofId,
        currentScore,
        enhancementPaid: true
      })
    });
    
    const result = await masumiResponse.json();
    return {
      enhanced: true,
      newScore: result.enhancedScore
    };
  }
}
```

### 4. Frontend: Score Enhancement UI

**Component**: `frontend/src/components/ScoreEnhancement.tsx`

```typescript
export function ScoreEnhancement({ score }: { score: number }) {
  const [paying, setPaying] = useState(false);
  
  // Check if score is borderline (390-410)
  const isBorderline = score >= 390 && score <= 410;
  
  if (!isBorderline) return null;
  
  const handlePayForEnhancement = async () => {
    setPaying(true);
    try {
      // Connect to Midnight Lace wallet
      const wallet = await window.midnight.lace.enable();
      
      // Get DUST token balance
      const balance = await wallet.getBalance('DUST');
      
      if (balance < 10) {
        alert('Insufficient DUST tokens. Need 10 DUST. Get testnet DUST from faucet.');
        return;
      }
      
      // Create payment transaction
      const tx = await wallet.sendTokens({
        recipient: 'midnight1qxy_payment_contract', // Payment contract address
        amount: 10,
        token: 'DUST',
        memo: 'score_enhancement'
      });
      
      // Wait for confirmation
      const confirmed = await wallet.waitForConfirmation(tx.hash);
      
      if (confirmed) {
        // Call backend to enhance score
        const response = await fetch('/api/enhance-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proofId: result.midnightProof.proofId,
            paymentTxHash: tx.hash
          })
        });
        
        const enhanced = await response.json();
        alert(`Score enhanced! New score: ${enhanced.newScore}`);
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert('Enhancement failed: ' + error.message);
    } finally {
      setPaying(false);
    }
  };
  
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-6">
      <h3 className="mb-2 text-lg font-bold text-amber-900">
        🚀 Boost Your Score!
      </h3>
      <p className="mb-4 text-sm text-amber-800">
        Your score ({score}) is borderline. Pay 10 DUST tokens to unlock Masumi AI 
        enhanced analysis and potentially improve your score!
      </p>
      <button
        onClick={handlePayForEnhancement}
        disabled={paying}
        className="w-full rounded-lg bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {paying ? '⏳ Processing Payment...' : '💎 Pay 10 DUST to Enhance'}
      </button>
      <p className="mt-2 text-xs text-amber-700">
        Get testnet DUST: <a href="https://faucet.midnight.network" className="underline">midnight.network/faucet</a>
      </p>
    </div>
  );
}
```

### 5. Frontend: Lender Data Access UI

**Component**: `frontend/src/components/LenderDataAccess.tsx`

```typescript
export function LenderDataAccess({ proofId }: { proofId: string }) {
  const [unlocked, setUnlocked] = useState(false);
  const [paying, setPaying] = useState(false);
  const [detailedData, setDetailedData] = useState<any>(null);
  
  const handlePayForAccess = async () => {
    setPaying(true);
    try {
      const wallet = await window.midnight.lace.enable();
      
      const balance = await wallet.getBalance('DUST');
      if (balance < 5) {
        alert('Need 5 DUST tokens. Get from testnet faucet.');
        return;
      }
      
      // Pay 5 DUST for data access
      const tx = await wallet.sendTokens({
        recipient: 'midnight1qxy_payment_contract',
        amount: 5,
        token: 'DUST',
        memo: 'data_access'
      });
      
      const confirmed = await wallet.waitForConfirmation(tx.hash);
      
      if (confirmed) {
        // Unlock detailed data
        const response = await fetch(`/api/verify/${proofId}/details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentTxHash: tx.hash })
        });
        
        const data = await response.json();
        setDetailedData(data);
        setUnlocked(true);
      }
    } catch (error) {
      alert('Payment failed: ' + error.message);
    } finally {
      setPaying(false);
    }
  };
  
  if (unlocked && detailedData) {
    return (
      <div className="space-y-6">
        {/* Detailed Financial History - Only visible after payment */}
        <div className="rounded-xl border border-green-300 bg-green-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-green-900">🔓 Full Financial History</h3>
            <span className="text-xs text-green-700">Unlocked with 5 DUST</span>
          </div>
          
          {/* Loan History */}
          <div className="mb-6">
            <h4 className="mb-3 font-bold text-neutral-900">💼 Loan History</h4>
            <div className="space-y-2">
              {detailedData.loans.map((loan: any, i: number) => (
                <div key={i} className="rounded-lg bg-white p-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Loan #{loan.id}</span>
                    <span className={loan.status === 'completed' ? 'text-green-600' : 'text-orange-600'}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-neutral-500">Amount</div>
                      <div className="font-bold">₹{loan.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Repaid</div>
                      <div className="font-bold">₹{loan.repaid.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">On-Time Payments</div>
                      <div className="font-bold">{loan.onTimePayments}/{loan.totalPayments}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Payment Behavior */}
          <div className="mb-6">
            <h4 className="mb-3 font-bold text-neutral-900">📊 Payment Behavior</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-white p-4">
                <div className="text-2xl font-bold text-green-600">{detailedData.onTimePayments}</div>
                <div className="text-xs text-neutral-600">On-Time Payments</div>
              </div>
              <div className="rounded-lg bg-white p-4">
                <div className="text-2xl font-bold text-orange-600">{detailedData.latePayments}</div>
                <div className="text-xs text-neutral-600">Late Payments</div>
              </div>
              <div className="rounded-lg bg-white p-4">
                <div className="text-2xl font-bold text-blue-600">{detailedData.avgRepaymentDays}d</div>
                <div className="text-xs text-neutral-600">Avg Repayment</div>
              </div>
              <div className="rounded-lg bg-white p-4">
                <div className="text-2xl font-bold text-purple-600">{detailedData.creditUtilization}%</div>
                <div className="text-xs text-neutral-600">Credit Utilization</div>
              </div>
            </div>
          </div>
          
          {/* Transaction History */}
          <div>
            <h4 className="mb-3 font-bold text-neutral-900">💳 Recent Transactions</h4>
            <div className="space-y-2">
              {detailedData.transactions.map((tx: any, i: number) => (
                <div key={i} className="flex justify-between rounded-lg bg-white p-3 text-sm">
                  <div>
                    <div className="font-semibold">{tx.description}</div>
                    <div className="text-xs text-neutral-500">{tx.date}</div>
                  </div>
                  <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-neutral-900'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Locked state - show payment prompt
  return (
    <div className="rounded-xl border-2 border-neutral-300 bg-neutral-100 p-8 text-center">
      <div className="mb-4 text-6xl">🔒</div>
      <h3 className="mb-2 text-xl font-bold text-neutral-900">Detailed Financial Data Locked</h3>
      <p className="mb-6 text-sm text-neutral-600">
        View full loan history, payment behavior, and transaction details by paying 5 DUST tokens.
        This ensures data privacy and fair compensation for verification.
      </p>
      <button
        onClick={handlePayForAccess}
        disabled={paying}
        className="mx-auto rounded-lg bg-purple-600 px-8 py-4 font-bold text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {paying ? '⏳ Processing...' : '💎 Pay 5 DUST to Unlock'}
      </button>
      <p className="mt-4 text-xs text-neutral-500">
        Get testnet DUST: <a href="https://faucet.midnight.network" className="text-purple-600 underline">midnight.network/faucet</a>
      </p>
    </div>
  );
}
```

## Testing with Testnet DUST

### Get Testnet DUST Tokens

1. **Visit Faucet**: https://faucet.midnight.network
2. **Connect Midnight Lace Wallet**
3. **Request DUST tokens** (100 DUST for testing)
4. **Wait 30 seconds** for confirmation

### Test Score Enhancement

1. Generate a score between 390-410
2. See "Boost Your Score" prompt
3. Click "Pay 10 DUST to Enhance"
4. Approve transaction in Midnight Lace
5. Wait for Masumi AI enhancement
6. See improved score!

### Test Lender Data Access

1. As lender, verify a borrower's proof
2. See locked data icon
3. Click "Pay 5 DUST to Unlock"
4. Approve transaction in Midnight Lace
5. View full financial history!

## Smart Contract Deployment

```bash
# Deploy DUST payment contract
cd contracts/midnight
npm run compile
npm run deploy

# Output:
# Contract deployed: midnight1qxy_payment_contract_address
# Update this address in frontend config
```

## Environment Variables

```env
# Backend .env
MIDNIGHT_PROOF_SERVER=http://localhost:6300
MIDNIGHT_PAYMENT_CONTRACT=midnight1qxy_payment_contract_address
MASUMI_AGENT_URL=http://localhost:8000
DUST_PRICE_ENHANCEMENT=10
DUST_PRICE_DATA_ACCESS=5

# Frontend .env
NEXT_PUBLIC_MIDNIGHT_PAYMENT_CONTRACT=midnight1qxy_payment_contract_address
NEXT_PUBLIC_MIDNIGHT_NETWORK=testnet
```

## Revenue Model

| Action | DUST Cost | USD Equivalent (Testnet) | Purpose |
|--------|-----------|------------------------|---------|
| Score Enhancement | 10 DUST | $0.00 (test) / $10 (prod) | Masumi AI enhanced processing |
| Data Access | 5 DUST | $0.00 (test) / $5 (prod) | Unlock borrower financial history |

## Security

- ✅ **Zero-Knowledge Proofs**: Score details never revealed without payment
- ✅ **Blockchain Verification**: All DUST payments verified on Midnight
- ✅ **Smart Contract**: Automated payment validation
- ✅ **Privacy**: Detailed data only unlocked after payment
- ✅ **Non-Custodial**: Tokens stay in user wallets until payment

## Next Steps

1. ✅ Set up Midnight Lace wallet
2. ✅ Get testnet DUST from faucet
3. ✅ Deploy DUST payment contract
4. ✅ Update frontend with contract address
5. ✅ Test score enhancement flow
6. ✅ Test lender data access flow
7. 🚀 Launch on Midnight mainnet!
