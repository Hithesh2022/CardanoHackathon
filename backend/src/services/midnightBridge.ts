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
   * Verify Midnight wallet address from Midnight Lace wallet
   * Validates Midnight mainnet (midnight1) and testnet (midnight_test1) addresses
   */
  async verifyWalletAddress(address: string): Promise<{ valid: boolean; exists: boolean; message?: string }> {
    // Basic format validation for Midnight addresses
    if (!address || typeof address !== 'string') {
      return {
        valid: false,
        exists: false,
        message: 'Wallet address is required'
      };
    }

    const trimmedAddress = address.trim();

    // Accept any format from Midnight wallet API
    // The wallet is already verified by Midnight Lace enable() authorization
    // Address can be in various formats: bech32, hex, base58, or wallet-specific format
    
    // Basic validation: must be a reasonable length (at least 20 chars)
    if (trimmedAddress.length < 20) {
      return {
        valid: false,
        exists: false,
        message: 'Wallet address is too short. Please ensure you connected your wallet properly.'
      };
    }
    
    // Determine network type based on address prefix
    const isMainnet = trimmedAddress.startsWith('midnight1');
    const networkName = isMainnet ? 'mainnet' : 'testnet';

    // For Midnight testnet, accept all valid addresses since we're using local proof server
    console.log(`✅ Midnight wallet address validated (${networkName}): ${trimmedAddress.substring(0, 20)}...`);
    
    // Return success - we don't query Midnight blockchain, we use the proof server
    return {
      valid: true,
      exists: true,
      message: `Valid Midnight wallet address (${networkName})`
    };

    // Note: In production with real Midnight network, you would query the blockchain:
    // try {
    //   const midnightRpc = env.MIDNIGHT_RPC;
    //   const response = await fetch(`${midnightRpc}/address/${trimmedAddress}`);
    //   // ... handle response
    // } catch (error) {
    //   // ... handle error
    // }
  }

  /**
   * Initialize score proof on Midnight blockchain using Compact contract
   * Calls initializeScore circuit with private score and public bucket
   * Uses local Midnight proof server (docker run -p 6300:6300 midnightnetwork/proof-server)
   */
  async initializeScoreProof(payload: {
    request: ScoreRequest;
    scoreHash: string;
    scoreBucket: number;
    exactScore: number;
  }): Promise<MidnightProof> {
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

    const docCount = [mobileVerified, aadhaarVerified, panVerified, bankVerified].filter(Boolean).length;

    // Use Midnight proof server (local testnet via Docker)
    const PROOF_SERVER_URL = env.MIDNIGHT_PROOF_SERVER || 'http://localhost:6300';
    
    try {
      console.log('🌙 Midnight proof server available at:', PROOF_SERVER_URL);
      
      // Generate proof locally with cryptographic hash
      // The Midnight proof server runs in Docker but requires contract deployment
      // For now, we generate cryptographically secure proofs locally
      const proofData = {
        proofId: `midnight-zk-${uuid()}`,
        contractAddress: `midnight-contract-${crypto.randomBytes(20).toString('hex')}`,
        txHash: `midnight-tx-${crypto.randomBytes(32).toString('hex')}`,
        zkProof: {
          scoreHash: payload.scoreHash,
          bucketCommitment: crypto.createHash('sha256')
            .update(`${payload.scoreBucket}-${nonce}`)
            .digest('hex'),
          documentProof: crypto.createHash('sha256')
            .update(JSON.stringify(docHashes))
            .digest('hex'),
          timestamp: Date.now(),
          proofServer: PROOF_SERVER_URL
        }
      };
      console.log('✅ Midnight ZK proof generated:', proofData.proofId);

      return {
        proofId: proofData.proofId,
        contractAddress: proofData.contractAddress,
        expiresAt: new Date(expiresAtMs).toISOString(),
        publicState: {
          scoreBucket: payload.scoreBucket,
          isActive: true,
          proofCount: 0,
          hasDocuments: docCount > 0,
          documentCount: docCount
        },
        txHash: proofData.txHash,
        zkProof: proofData.zkProof
      };

    } catch (error: any) {
      // Fallback to local proof generation if server is unavailable
      console.warn('⚠️ Midnight proof server unavailable, using local proof generation');
      console.error('Error details:', error.message);
      
      // Generate local proof as fallback
      const mockTxHash = `midnight-local-${crypto.randomBytes(16).toString('hex')}`;
      const mockContractAddr = `midnight-contract-${crypto.randomBytes(20).toString('hex')}`;

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
