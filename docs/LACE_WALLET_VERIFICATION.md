# Lace Wallet Verification Guide

## ✅ Real Blockchain Verification

AtlasCred now verifies your **Lace wallet address** against the actual **Cardano blockchain** using the free **Koios API**.

## 🔍 How Verification Works

When you enter your Lace wallet address, the system:

1. **Format Validation**: Checks if address starts with `addr1` (mainnet), `addr_test1` (testnet), or `stake1`
2. **Length Check**: Ensures address is at least 58 characters (Bech32 format)
3. **Pattern Validation**: Verifies valid Bech32 encoding characters
4. **Blockchain Query**: Calls Koios API to check if wallet exists on-chain
5. **Activity Check**: Verifies wallet has UTXOs, transactions, or balance

## 📋 Getting Your Lace Wallet Address

### Step 1: Open Lace Wallet
Open your **Lace Wallet** browser extension or desktop app

### Step 2: Copy Address
- Click on your wallet name at the top
- Click **"Copy address"** or go to **"Receive"** tab
- Your address will look like:
  - **Mainnet**: `addr1qxy2lpan99fcnyjz4xfwdqd82xuwkd0gvj8e6w8xqmg2pwjz3xwdg...`
  - **Testnet**: `addr_test1qz2lpan99fcnyjz4xfwdqd82xuwkd0gvj8e6w8xqmg2pwjz...`

### Step 3: Paste into AtlasCred
Paste the complete address into the "Wallet Address" field in AtlasCred

## ⚠️ Important Notes

### Wallet Must Have Activity
Your wallet needs to have at least one of the following:
- ✅ Previous transactions
- ✅ Current balance (ADA)
- ✅ UTXOs (unspent transaction outputs)

### New/Empty Wallets
If your wallet is brand new with no transactions:
- You'll see: ⚠️ "Wallet address not found on Cardano blockchain"
- **Solution**: Send a small test transaction (even 1 ADA) to activate your wallet on-chain

## 🔧 Technical Details

### Koios API Integration
- **Free & No API Key Required**: AtlasCred uses Koios public API
- **Mainnet**: `https://api.koios.rest/api/v1/address_info`
- **Preprod/Testnet**: `https://preprod.koios.rest/api/v1/address_info`

### What Gets Verified
```json
{
  "balance": "1234567890",      // Wallet balance in lovelace
  "tx_count": 42,                // Number of transactions
  "utxo_set": [...]              // List of UTXOs
}
```

### Privacy Guarantee
- Only **public blockchain data** is checked (balance, transaction count)
- **No private keys** are ever transmitted
- **No personal information** is queried
- Query happens **server-side** for security

## 🧪 Testing

### Valid Addresses (Example Format)
```
addr1qxy2lpan99fcnyjz4xfwdqd82xuwkd0gvj8e6w8xqmg2pwjz3xwdg73hvf39xqwyjfm0c3hukk4xhtvz8sw4vwphpqsqqqqq
```

### Invalid Addresses
```
❌ midnight1test               (Wrong network - this is Midnight, not Cardano)
❌ 123456789                    (Not a valid format)
❌ addr1                        (Too short)
❌ test_wallet                  (Not Bech32 format)
```

## 🎯 Toast Notifications

You'll see real-time feedback:

- 🔍 **"Verifying Lace wallet on Cardano blockchain..."** (Info)
- ✅ **"Lace wallet verified on Cardano mainnet"** (Success)
- ❌ **"Wallet address not found on Cardano blockchain"** (Error)
- ⚠️ **"Invalid Cardano wallet address"** (Warning)

## 🚀 Production Ready

For production deployment, you can optionally use:
- **Blockfrost API** (requires API key, more rate limits)
- **Your own Cardano node** (full control, no rate limits)
- **Other APIs**: Adalite, CardanoScan, etc.

Current implementation uses **Koios** because:
- ✅ Free forever
- ✅ No API key needed
- ✅ Good rate limits for hackathons
- ✅ Well-maintained by Cardano Foundation

## 📞 Support

If verification fails:
1. Check your internet connection
2. Ensure wallet address is copied correctly (all characters)
3. Verify wallet has at least one transaction
4. Try again in a few seconds (API may be rate-limited)

## 🔗 Resources

- [Lace Wallet Documentation](https://www.lace.io/)
- [Koios API Docs](https://api.koios.rest/)
- [Cardano Address Format](https://cips.cardano.org/cips/cip19/)
