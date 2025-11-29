# Cardano Contracts

This folder contains the Aiken validator for AtlasCred privacy-preserving credit scores on Cardano.

## Validator: `score_proof.ak`

Enforces:
- **Selective disclosure**: Users can prove they're in a score bucket without revealing exact score
- **Ownership**: Only the wallet owner can update or reveal their score
- **Expiry**: Score proofs expire after a set time
- **Privacy**: Score hash + nonce prevent raw data leakage

## Building

```bash
cd atlascred
aiken build
```

## Usage

1. Backend locks ADA + datum at script address via `cardanoScriptBridge`
2. Datum contains: owner PKH, score hash, bucket (0-4), nonce, expiry
3. User redeems with `RevealBucket` to selectively disclose bucket level
4. User updates with `UpdateScore` when new proofs arrive

## Integration

The backend `services/midnightBridge.ts` (now renamed to reflect Cardano usage) constructs the datum and will eventually use Lucid to build real transactions.
