import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { env } from '../config/env.js';
import type { ScoreRequest } from '../types.js';

// Midnight blockchain types for zero-knowledge credit proofs
export type MidnightPrivateState = {
  owner: string;           // Wallet address
  exactScore: number;      // Actual score (private, ZK-protected)
  scoreHash: string;       // SHA256 for integrity
  nonce: string;           // Privacy nonce
  expiresAt: number;       // Timestamp
  
  // Document verification (private - never revealed)
  documentsVerified: string[];  // Hashes of verified docs
  mobileVerified: boolean;
  aadhaarVerified: boolean;
  panVerified: boolean;
  bankVerified: boolean;
  trustBoost: number;      // 0-100 trust boost
};

export type MidnightPublicState = {
  scoreBucket: number;     // 0-4 bucket (public)
  isActive: boolean;       // Proof validity
  proofCount: number;      // Verification counter
  hasDocuments: boolean;   // Has any docs (yes/no only)
  documentCount: number;   // Number of docs (not which ones)
};

export type MidnightProof = {
  proofId: string;         // Unique proof identifier
  contractAddress: string; // Midnight contract address
  expiresAt: string;       // ISO timestamp
  publicState: MidnightPublicState;
  txHash?: string;         // Transaction hash
};

export class MidnightBridge {
  /**
   * Verify Cardano wallet address from Lace wallet
   * Validates Cardano mainnet (addr1) and testnet (addr_test1) addresses
   */
  async verifyWalletAddress(address: string): Promise<{ valid: boolean; exists: boolean; message?: string }> {
    // Basic format validation for Cardano addresses
    if (!address || typeof address !== 'string') {
      return {
        valid: false,
        exists: false,
        message: 'Wallet address is required'
      };
    }

    const trimmedAddress = address.trim();

    // Check if it's a valid Cardano address format
    // Accept both Bech32 format (addr1...) and hex format (from wallet extensions)
    const isBech32 = trimmedAddress.startsWith('addr1') || 
                     trimmedAddress.startsWith('addr_test1') || 
                     trimmedAddress.startsWith('stake1') || 
                     trimmedAddress.startsWith('stake_test1');
    
    // Hex addresses from wallet extensions are 56-114 characters of hex
    const isHex = /^[0-9a-fA-F]{56,114}$/.test(trimmedAddress);

    if (!isBech32 && !isHex) {
      return {
        valid: false,
        exists: false,
        message: 'Invalid Cardano wallet address format. Must be Bech32 (addr1...) or hex from wallet extension'
      };
    }

    // Validate length based on format
    if (isBech32 && trimmedAddress.length < 58) {
      return {
        valid: false,
        exists: false,
        message: 'Bech32 wallet address is too short. Must be at least 58 characters'
      };
    }

    if (isHex && trimmedAddress.length < 56) {
      return {
        valid: false,
        exists: false,
        message: 'Hex wallet address is too short. Must be at least 56 characters'
      };
    }

    // Validate Bech32 pattern for Cardano addresses (only if Bech32 format)
    const validBech32Pattern = /^(addr1|addr_test1|stake1|stake_test1)[ac-hj-np-z02-9]{50,100}$/;
    if (isBech32 && !validBech32Pattern.test(trimmedAddress)) {
      return {
        valid: false,
        exists: false,
        message: 'Invalid Cardano address format. Please copy address directly from your Lace wallet'
      };
    }

    // Determine network type
    const isMainnet = trimmedAddress.startsWith('addr1') || (isHex && trimmedAddress.startsWith('01'));
    const networkName = isMainnet ? 'mainnet' : 'testnet';

    // Real blockchain verification using Koios API (FREE, no API key needed)
    // Note: Hex addresses from wallet extensions need to be used directly
    try {
      const network = isMainnet ? 'api' : 'preprod';
      const koiosUrl = `https://${network}.koios.rest/api/v1/address_info`;
      
      console.log(`Verifying wallet on Cardano blockchain (${networkName}): ${trimmedAddress.substring(0, 20)}...`);
      
      const response = await fetch(koiosUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          _addresses: [trimmedAddress]
        })
      });

      if (!response.ok) {
        console.error(`Koios API error: ${response.status} ${response.statusText}`);
        // If hex address, accept it as valid since it came from wallet extension
        if (isHex) {
          console.log(`✅ Hex address from wallet extension accepted`);
          return {
            valid: true,
            exists: true,
            message: `Valid Cardano wallet address from wallet extension (${networkName})`
          };
        }
        return {
          valid: true,
          exists: false,
          message: 'Unable to verify wallet on blockchain. Please try again.'
        };
      }

      const data = await response.json();
      
      // Check if address is recognized by the blockchain
      // Koios returns empty array if address format is invalid or not recognized
      // If Koios knows about the address (even with 0 balance/transactions), it's valid
      if (data && Array.isArray(data) && data.length > 0) {
        const addressInfo = data[0];
        console.log(`✅ Wallet verified: Balance=${addressInfo.balance || '0'}, TxCount=${addressInfo.tx_count || 0}`);
        return {
          valid: true,
          exists: true,
          message: `Cardano wallet verified on ${networkName}`
        };
      }

      // If Koios doesn't recognize the address, still accept hex addresses from wallet extensions
      if (isHex) {
        console.log(`✅ Hex address from wallet extension accepted (not yet on-chain)`);
        return {
          valid: true,
          exists: true,
          message: `Valid Cardano wallet address from wallet extension (${networkName})`
        };
      }

      // For Bech32, accept valid format even if not on-chain yet
      console.log(`⚠️ Address valid but not yet on blockchain: ${trimmedAddress}`);
      return {
        valid: true,
        exists: true,
        message: `Valid Cardano wallet address (${networkName})`
      };

    } catch (error) {
      console.error('Blockchain verification error:', error);
      // If hex address from wallet extension, accept it despite API error
      if (isHex) {
        console.log(`✅ Hex address from wallet extension accepted (API unavailable)`);
        return {
          valid: true,
          exists: true,
          message: `Valid Cardano wallet address from wallet extension (${networkName})`
        };
      }
      return {
        valid: true,
        exists: false,
        message: 'Unable to verify wallet on blockchain. Please check your internet connection.'
      };
    }
  }

  /**
   * Initialize score proof on Midnight blockchain using Compact contract
   * Calls initializeScore circuit with private score and public bucket
   */
  async initializeScoreProof(payload: {
    request: ScoreRequest;
    scoreHash: string;
    scoreBucket: number;
    exactScore: number;
  }): Promise<MidnightProof> {
    await this.simulateLatency();

    // Generate privacy nonce (used in ZK circuit)
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAtMs = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

    // Calculate document hashes and verification flags
    const docHashes = payload.request.proofs.map(p => p.hash);
    const mobileVerified = payload.request.proofs.some(p => p.id.includes('mobile'));
    const aadhaarVerified = payload.request.proofs.some(p => p.id.includes('aadhaar'));
    const panVerified = payload.request.proofs.some(p => p.id.includes('pan'));
    const bankVerified = payload.request.proofs.some(p => p.id.includes('bank'));
    
    // Calculate trust boost (5% per document, max 20%)
    const trustBoost = [mobileVerified, aadhaarVerified, panVerified, bankVerified]
      .filter(Boolean).length * 5;

    // In production: Call Midnight Compact contract
    // const contract = await midnightSdk.contract('score-proof.compact');
    // const tx = await contract.initializeScore({
    //   ownerAddr: payload.request.walletAddress,
    //   score: payload.exactScore,
    //   scoreNonce: Buffer.from(nonce, 'hex'),
    //   docHashes: docHashes.map(h => Buffer.from(h, 'hex')),
    //   mobile: mobileVerified,
    //   aadhaar: aadhaarVerified,
    //   pan: panVerified,
    //   bank: bankVerified,
    //   boost: trustBoost,
    //   bucket: payload.scoreBucket
    // }, { private: true }); // ZK-protected transaction
    // const receipt = await tx.wait();

    // Mock for now - in production this would be real Midnight tx
    const mockTxHash = `midnight_${crypto.randomBytes(16).toString('hex')}`;
    const mockContractAddr = `contract_${crypto.randomBytes(20).toString('hex')}`;
    const docCount = [mobileVerified, aadhaarVerified, panVerified, bankVerified].filter(Boolean).length;

    return {
      proofId: `midnight-proof-${uuid()}`,
      contractAddress: mockContractAddr,
      expiresAt: new Date(expiresAtMs).toISOString(),
      publicState: {
        scoreBucket: payload.scoreBucket,
        isActive: true,
        proofCount: 0,
        hasDocuments: docCount > 0,
        documentCount: docCount
      },
      txHash: mockTxHash
    };
  }

  /**
   * Verify bucket proof (ZK verification)
   * Lender can check if user is in claimed bucket without seeing exact score
   */
  async verifyBucket(proofId: string, requestedBucket: number): Promise<boolean> {
    // In production: Call Midnight contract's verifyBucket circuit
    // const contract = await midnightSdk.contract(proofId);
    // const result = await contract.verifyBucket({
    //   requesterAddr: lenderAddress,
    //   requestedBucket: requestedBucket
    // });
    // return result; // ZK proof validated, no exact score revealed

    await this.simulateLatency();
    
    // Mock: In reality, this would execute ZK circuit
    return true;
  }

  /**
   * Prove minimum score threshold (ZK proof)
   * User proves "score >= threshold" without revealing exact value
   */
  async proveMinimumScore(proofId: string, threshold: number): Promise<boolean> {
    // In production: Call Midnight contract's proveMinimumScore circuit
    // const contract = await midnightSdk.contract(proofId);
    // const result = await contract.proveMinimumScore({
    //   requesterAddr: lenderAddress,
    //   threshold: threshold
    // });
    // return result; // ZK proof: score >= threshold (exact value hidden)

    await this.simulateLatency();
    
    // Mock: Real implementation would run ZK circuit
    return true;
  }

  private async simulateLatency() {
    const jitter = Math.random() * 120 + 80;
    return new Promise((resolve) => setTimeout(resolve, jitter));
  }

  get rpcEndpoint() {
    return env.MIDNIGHT_RPC;
  }
}

export const midnightBridge = new MidnightBridge();
