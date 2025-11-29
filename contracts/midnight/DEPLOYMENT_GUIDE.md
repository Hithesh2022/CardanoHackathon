# AtlasCred Midnight Network Deployment

## 🚀 Real Midnight Testnet Integration

This folder contains everything needed to deploy the AtlasCred credit score ZK proof contract to **Midnight Network Testnet** (live network!).

## Prerequisites

✅ **Node.js** 20+ (you have v22.14.0)  
✅ **Docker** (for proof server)  
✅ **Midnight Testnet Faucet Access**: https://midnight.network/test-faucet

## Quick Start (Real Deployment)

### Step 1: Install Dependencies

```bash
cd contracts/midnight
npm install
```

This installs all Midnight SDK packages including:
- `@midnight-ntwrk/wallet` (v5.0.0)
- `@midnight-ntwrk/midnight-js-contracts` (v2.0.2)
- All proof providers, indexers, and ZK config tools

### Step 2: Compile the Contract

```bash
npm run compile
```

This compiles `score-proof.compact` using the Midnight compiler and generates:
- `managed/score-proof/contract/` - Contract artifacts
- `managed/score-proof/keys/` - ZK proving/verifying keys
- `managed/score-proof/zkir/` - Zero-knowledge intermediate representation

### Step 3: Start Proof Server

**In a NEW terminal window**:

```bash
docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'
```

Keep this running! It generates ZK proofs for contract deployment and transactions.

### Step 4: Build Deployment Script

```bash
npm run build
```

Compiles TypeScript deployment script to JavaScript.

### Step 5: Deploy to Testnet

```bash
npm run deploy
```

The script will:
1. Ask if you have a wallet seed (generate new or use existing)
2. Display your wallet address
3. If balance is 0, tell you to visit faucet: https://midnight.network/test-faucet
4. Wait for funding (paste your address in faucet and request funds)
5. Deploy contract to Midnight Testnet
6. Save `deployment.json` with contract address

**Expected output**:
```
🌙 AtlasCred Midnight Deployment

Deploying credit score ZK proof contract to Midnight Testnet...

Do you have a wallet seed? (y/n): n

⚠️  SAVE THIS SEED: 3a7f9c2e...

Building wallet...
Your wallet address is: midnight1abc...
Visit: https://midnight.network/test-faucet to get some funds.
Waiting to receive tokens...

Wallet funded with balance: 1000000000
Loading contract...
Setting up providers...
Deploying contract (30-60 seconds)...

✅ DEPLOYED!
Contract: 0x123abc...

Saved to deployment.json
```

## What Gets Deployed

The `score-proof.compact` contract includes:

### Private State (ZK-Protected)
- `owner`: Wallet address
- `exactScore`: Actual credit score (300-850) - **NEVER REVEALED**
- `scoreHash`: SHA256 hash
- `nonce`: Privacy nonce
- `expiresAt`: Proof expiry timestamp

### Public State (Visible)
- `scoreBucket`: 0-4 range category
- `isActive`: Proof validity
- `proofCount`: Verification counter

### ZK Circuits
1. **initializeScore** - Create score proof (private transaction)
2. **verifyBucket** - Prove user is in bucket N (ZK proof)
3. **proveMinimumScore** - Prove score >= threshold (ZK proof)
4. **updateScore** - Refresh score with new data
5. **revokeProof** - Deactivate proof

## Generated Files

After deployment:
- `deployment.json` - Contract address and deployment info
- `dist/` - Compiled JavaScript
- `managed/score-proof/` - Contract artifacts and ZK keys

## Integration with Backend

Once deployed, update `backend/src/services/midnightBridge.ts`:

```typescript
import { Contract } from "../../../contracts/midnight/managed/score-proof/contract/index.cjs";
import deploymentInfo from "../../../contracts/midnight/deployment.json";

const contractAddress = deploymentInfo.contractAddress;

// Replace mock with real Midnight SDK calls
async function initializeScoreProof(payload) {
  const contract = new Contract({});
  
  // Call real Midnight ZK circuit
  const result = await contract.initializeScore({
    ownerAddr: payload.request.walletAddress,
    score: payload.exactScore,
    scoreNonce: Buffer.from(nonce, 'hex'),
    bucket: payload.scoreBucket
  }, { private: true });
  
  return {
    proofId: result.transactionId,
    contractAddress: contractAddress,
    // ... rest of response
  };
}
```

## Testnet Info

- **Network**: Midnight Testnet 02
- **Indexer**: https://indexer.testnet-02.midnight.network/api/v1/graphql
- **RPC**: https://rpc.testnet-02.midnight.network
- **Faucet**: https://midnight.network/test-faucet
- **Explorer**: https://explorer.testnet-02.midnight.network

## Troubleshooting

### "Contract not found"
Run `npm run compile` first.

### "Proof server connection failed"
Make sure Docker is running the proof server on port 6300.

### "Balance is 0"
1. Copy your wallet address from console
2. Visit https://midnight.network/test-faucet
3. Paste address and request funds
4. Script will auto-detect funding and continue

### "Wallet seed lost"
⚠️ Cannot recover! Save the 64-character seed securely.

## Next Steps

1. ✅ Deploy contract (this guide)
2. Update backend to call real Midnight SDK
3. Add Midnight wallet connector to frontend
4. Test end-to-end with real ZK proofs
5. Launch on mainnet when available

## Resources

- **Midnight Docs**: https://docs.midnight.network
- **GitHub**: https://github.com/midnightntwrk
- **Discord**: https://discord.com/invite/midnightnetwork
- **Faucet**: https://midnight.network/test-faucet

---

**Status**: ✅ Ready to deploy to real Midnight Testnet!  
**Cost**: Free (testnet tokens from faucet)  
**Time**: ~1-2 minutes after funding
