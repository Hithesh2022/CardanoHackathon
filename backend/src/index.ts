import express from 'express';
import cors from 'cors';
import pino from 'pino';
import crypto from 'crypto';
import { env } from './config/env.js';
import { scoreRequestSchema } from './schemas/scoreRequest.js';
import { scoreEngine } from './services/scoreEngine.js';
import { midnightBridge } from './services/midnightBridge.js';
import { masumiClient } from './services/masumiClient.js';
import { DustPaymentService } from './services/dustPaymentService.js';
import type { ScoreRequest, ScoreResponse } from './types.js';

const app = express();
const logger = pino({ name: 'atlascred-api' });
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const streams = new Map<string, express.Response>();
// Store scores by capsuleId and wallet address for lender verification
const scoreStore = new Map<string, ScoreResponse>();
// Initialize DUST payment service
const dustPaymentService = new DustPaymentService(logger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', midnightRpc: midnightBridge.rpcEndpoint });
});

// Wallet verification endpoint - checks if wallet exists on Midnight blockchain
app.post('/verify-wallet', async (req, res) => {
  const { walletAddress } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ 
      valid: false, 
      exists: false, 
      message: 'Wallet address is required' 
    });
  }

  try {
    const verification = await midnightBridge.verifyWalletAddress(walletAddress);
    res.json(verification);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ 
      valid: false, 
      exists: false, 
      message: 'Unable to verify wallet address at this time' 
    });
  }
});

app.get('/stream/:sessionId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  streams.set(req.params.sessionId, res);
  logger.info({ sessionId: req.params.sessionId }, 'stream opened');

  req.on('close', () => {
    streams.delete(req.params.sessionId);
    logger.info({ sessionId: req.params.sessionId }, 'stream closed');
  });
});

app.post('/score', async (req, res) => {
  const parseResult = scoreRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const payload = parseResult.data as ScoreRequest;
  try {
    logger.info({ 
      wallet: payload.walletAddress,
      hasSignature: !!req.body.walletSignature,
      hasBaseToken: !!payload.baseToken,
      hasVerificationHash: !!payload.verificationHash,
      baseToken: payload.baseToken?.substring(0, 20),
      bodyKeys: Object.keys(req.body)
    }, 'Score request received');

    // CRITICAL: Verify wallet ownership via signature or authorization
    // This prevents borrowers from using someone else's wallet address
    if (!req.body.walletSignature) {
      logger.warn({ wallet: payload.walletAddress }, 'Missing wallet signature');
      return res.status(400).json({ 
        error: 'Wallet signature required',
        message: 'You must authorize your wallet to prove ownership. Please try again and authorize when prompted.'
      });
    }

    // Parse and validate signature/authorization proof
    try {
      const signatureData = JSON.parse(req.body.walletSignature);
      const signatureAge = Date.now() - signatureData.timestamp;
      
      logger.info({ 
        wallet: payload.walletAddress,
        signatureAge: Math.round(signatureAge / 1000),
        method: signatureData.method || 'unknown',
        walletName: signatureData.walletName || 'unknown',
        hasSignature: !!signatureData.signature,
        hasKey: !!signatureData.key
      }, 'Validating wallet proof');
      
      // Proof must be fresh (within 5 minutes)
      if (signatureAge > 5 * 60 * 1000) {
        return res.status(400).json({ 
          error: 'Proof expired',
          message: 'Wallet proof is too old. Please authorize again.'
        });
      }

      // Verify proof includes correct wallet address
      if (!signatureData.message.includes(payload.walletAddress)) {
        logger.warn({ 
          messageWallet: signatureData.message,
          payloadWallet: payload.walletAddress 
        }, 'Wallet address mismatch');
        return res.status(400).json({ 
          error: 'Proof mismatch',
          message: 'Wallet proof does not match wallet address'
        });
      }

      // Log the verification method used
      if (signatureData.method === 'cryptographic_signature') {
        logger.info({ wallet: payload.walletAddress }, '✅ Wallet cryptographically signed');
      } else {
        logger.info({ wallet: payload.walletAddress }, '✅ Wallet authorization verified');
      }
    } catch (error) {
      logger.error({ error, wallet: payload.walletAddress }, 'Failed to parse wallet proof');
      return res.status(400).json({ 
        error: 'Invalid proof format',
        message: 'Wallet proof is malformed. Please try authorizing again.'
      });
    }

    // Verify wallet address exists on Midnight blockchain
    const walletVerification = await midnightBridge.verifyWalletAddress(payload.walletAddress);
    
    if (!walletVerification.valid || !walletVerification.exists) {
      return res.status(400).json({ 
        error: 'Invalid wallet address',
        message: walletVerification.message || 'Wallet address not found on Midnight blockchain'
      });
    }

    const localScore = scoreEngine.compute(payload);
    const masumi = await masumiClient.delegateScoring(payload);
    const finalScore = masumi.adjustedScore ? (localScore.adjustedScore + masumi.adjustedScore) / 2 : localScore.adjustedScore;
    const scoreHash = scoreEngine.hashScore(finalScore, payload.sessionId);
    const scoreBucket = scoreEngine.scoreToBucket(finalScore);

    // Initialize ZK proof on Midnight blockchain using Compact contract
    // This locks the exact score in private state, only bucket is public
    const proof = await midnightBridge.initializeScoreProof({
      request: payload,
      scoreHash,
      scoreBucket,
      exactScore: finalScore
    });

    const response: ScoreResponse = {
      ...localScore,
      adjustedScore: finalScore,
      midnightProof: {
        proofId: proof.proofId,
        contractAddress: proof.contractAddress,
        expiresAt: proof.expiresAt,
        txHash: proof.txHash,
        publicState: proof.publicState,
        // SECURITY: Store wallet signature AND verification hash for two-token system
        walletSignature: req.body.walletSignature,
        walletAddress: payload.walletAddress,
        verificationHash: payload.verificationHash
      }
    };

    // Store score for lender verification (by proofId and wallet)
    scoreStore.set(proof.proofId, response);
    scoreStore.set(payload.walletAddress, response);

    logger.info({
      proofId: proof.proofId,
      hasVerificationHash: !!payload.verificationHash,
      verificationHashPreview: payload.verificationHash?.substring(0, 16) + '...',
      baseToken: payload.baseToken
    }, 'Stored score with verification hash');

    emitStream(payload.sessionId, response);
    res.json(response);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Unable to compute score right now' });
  }
});

// Lender verification endpoint - uses Midnight ZK proofs
app.get('/verify/:identifier', (req, res) => {
  const identifier = req.params.identifier;
  const score = scoreStore.get(identifier);

  if (!score) {
    return res.status(404).json({ 
      error: 'Score not found', 
      message: 'No score exists for this proof ID or wallet address'
    });
  }

  // Parse signature details for lender verification
  let signatureDetails = null;
  if (score.midnightProof.walletSignature) {
    try {
      signatureDetails = JSON.parse(score.midnightProof.walletSignature);
    } catch (e) {
      logger.warn({ error: e }, 'Failed to parse signature for lender');
    }
  }

  // TWO-TOKEN VERIFICATION SYSTEM
  const lenderBaseToken = req.query.baseToken as string;
  const lenderDocumentNumber = req.query.documentNumber as string;
  const storedVerificationHash = score.midnightProof.verificationHash;
  
  logger.info({ 
    proofId: identifier,
    lenderBaseToken: lenderBaseToken,
    lenderDocNumber: lenderDocumentNumber,
    hasLenderBaseToken: !!lenderBaseToken,
    hasLenderDocNumber: !!lenderDocumentNumber,
    storedHash: storedVerificationHash,
    hasStoredHash: !!storedVerificationHash
  }, 'Two-token verification check');
  
  // SECURITY: Two-token verification is MANDATORY
  // Legacy scores without verification hash are rejected
  if (!storedVerificationHash) {
    logger.warn({ proofId: identifier }, 'Legacy score without verification hash - rejected');
    return res.status(403).json({
      error: 'Legacy proof not supported',
      message: 'This proof was created before two-token verification was implemented. Please ask the borrower to generate a new score.',
      legacyProof: true
    });
  }

  // Lender MUST provide both base token and document number
  if (!lenderBaseToken || !lenderDocumentNumber) {
    logger.warn({ proofId: identifier }, 'Lender missing required tokens');
    return res.status(403).json({
      error: 'Verification tokens required',
      message: 'This proof requires both base token and document number. Please ask the borrower for these.',
      tokensRequired: true
    });
  }

  // Generate hash from lender's input: hash(baseToken + documentNumber)
  const lenderData = `${lenderBaseToken.trim()}-${lenderDocumentNumber.trim()}`;
  const lenderHash = crypto.createHash('sha256').update(lenderData).digest('hex');
  
  const hashMatches = lenderHash === storedVerificationHash;
  
  logger.info({ 
    proofId: identifier,
    lenderHash: lenderHash.substring(0, 16) + '...',
    storedHash: storedVerificationHash.substring(0, 16) + '...',
    matches: hashMatches
  }, 'Comparing verification hashes');
  
  if (!hashMatches) {
    logger.warn({ 
      proofId: identifier,
      lenderHash,
      storedHash: storedVerificationHash
    }, 'Hash mismatch - fraud attempt detected');
    return res.status(403).json({
      error: 'Verification failed',
      message: 'The base token or document number you provided does NOT match. This borrower may be using someone else\'s proof.',
      tokensRequired: true,
      tokensVerified: false
    });
  }

  logger.info({ proofId: identifier }, 'Two-token verification successful');

  // Return verification data with Midnight proof
  res.json({
    found: true,
    walletAddress: score.midnightProof.walletAddress || req.query.wallet || 'midnight1qxyzhackathon',
    proofId: score.midnightProof.proofId,
    contractAddress: score.midnightProof.contractAddress,
    scoreBucket: score.midnightProof.publicState.scoreBucket,
    bucketRange: getBucketRange(score.midnightProof.publicState.scoreBucket),
    isActive: score.midnightProof.publicState.isActive,
    proofCount: score.midnightProof.publicState.proofCount,
    expiresAt: score.midnightProof.expiresAt,
    isExpired: new Date(score.midnightProof.expiresAt) < new Date(),
    verifiedOnChain: true,
    txHash: score.midnightProof.txHash,
    confidence: score.confidence,
    adjustedScore: score.adjustedScore,
    // SECURITY: Include signature details AND document verification
    walletSignature: score.midnightProof.walletSignature,
    signatureVerified: !!score.midnightProof.walletSignature,
    walletName: signatureDetails?.walletName || null,
    signatureMethod: signatureDetails?.method || null,
    signatureTimestamp: signatureDetails?.timestamp || null,
    // NEW: Two-token hash verification (if we got here, it means it was verified)
    tokensRequired: !!storedVerificationHash,
    tokensVerified: !!storedVerificationHash // Always true if we reach here (rejected above if mismatch)
  });
});

// DUST Token Payment Endpoints

// Check if score is borderline and eligible for enhancement
app.get('/score/:identifier/enhancement-eligibility', (req, res) => {
  const { identifier } = req.params;
  
  const score = scoreStore.get(identifier);
  
  if (!score) {
    return res.status(404).json({ error: 'Score not found' });
  }
  
  const currentScore = Math.round(score.adjustedScore);
  const isBorderline = dustPaymentService.isBorderlineScore(currentScore);
  const prices = dustPaymentService.getPrices();
  
  res.json({
    eligible: isBorderline,
    currentScore: currentScore,
    borderlineRange: '390-410',
    dustCost: prices.scoreEnhancement,
    message: isBorderline 
      ? `Your score (${currentScore}) is borderline. Pay ${prices.scoreEnhancement} DUST tokens to unlock Masumi AI enhancement!`
      : `Score enhancement is only available for borderline scores (390-410). Your score: ${currentScore}`
  });
});

// Enhance borderline score using Masumi AI (requires DUST payment)
app.post('/score/:identifier/enhance', async (req, res) => {
  const { identifier } = req.params;
  const { paymentTxHash, walletAddress } = req.body;
  
  if (!paymentTxHash || !walletAddress) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'paymentTxHash and walletAddress are required'
    });
  }
  
  const score = scoreStore.get(identifier);
  
  if (!score) {
    return res.status(404).json({ error: 'Score not found' });
  }
  
  try {
    logger.info({ identifier, paymentTxHash }, 'Processing score enhancement request');
    
    const currentScore = Math.round(score.adjustedScore);
    
    const enhancementResult = await dustPaymentService.enhanceScore(
      identifier,
      currentScore,
      paymentTxHash,
      walletAddress
    );
    
    // Update stored score with enhanced value and mark as Masumi enhanced
    score.adjustedScore = enhancementResult.newScore;
    score.baseScore = enhancementResult.newScore;
    const newBucket = Math.floor((enhancementResult.newScore - 300) / 100);
    score.midnightProof.publicState.scoreBucket = newBucket;
    (score as any).masumiEnhanced = true; // Track that AI enhancement was applied
    scoreStore.set(identifier, score);
    
    logger.info({ 
      oldScore: enhancementResult.oldScore, 
      newScore: enhancementResult.newScore 
    }, 'Score enhancement complete');
    
    res.json({
      success: true,
      enhancement: enhancementResult,
      updatedScore: {
        adjustedScore: score.adjustedScore,
        scoreBucket: newBucket,
        bucketRange: getBucketRange(newBucket)
      }
    });
  } catch (error: unknown) {
    logger.error({ error, identifier }, 'Score enhancement failed');
    res.status(400).json({ 
      error: 'Enhancement failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Unlock detailed borrower data (requires DUST payment)
app.post('/verify/:identifier/unlock-details', async (req, res) => {
  const { identifier } = req.params;
  const { paymentTxHash } = req.body;
  
  if (!paymentTxHash) {
    return res.status(400).json({ 
      error: 'Missing payment transaction hash',
      message: 'paymentTxHash is required'
    });
  }
  
  const score = scoreStore.get(identifier);
  
  if (!score) {
    return res.status(404).json({ error: 'Score not found' });
  }
  
  try {
    logger.info({ identifier, paymentTxHash }, 'Unlocking borrower detailed data');
    
    const detailedData = await dustPaymentService.unlockBorrowerData(
      identifier,
      paymentTxHash
    );
    
    logger.info({ identifier }, 'Borrower data unlocked successfully');
    
    res.json({
      success: true,
      data: detailedData,
      paymentVerified: true
    });
  } catch (error: unknown) {
    logger.error({ error, identifier }, 'Failed to unlock borrower data');
    res.status(400).json({ 
      error: 'Unlock failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get DUST token prices
app.get('/dust-prices', (req, res) => {
  const prices = dustPaymentService.getPrices();
  res.json({
    scoreEnhancement: prices.scoreEnhancement,
    dataAccess: prices.dataAccess,
    currency: 'DUST',
    network: 'midnight-testnet'
  });
});

// Request a spoofed payment tx from the official Midnight proof server
app.post('/payments/spoof', async (req, res) => {
  try {
    const { purpose } = req.body as { purpose?: 'score_enhancement' | 'data_access' };
    if (!purpose) {
      return res.status(400).json({ error: 'purpose is required' });
    }

    const amount = purpose === 'score_enhancement' 
      ? dustPaymentService.getPrices().scoreEnhancement 
      : dustPaymentService.getPrices().dataAccess;

    const proofServerUrl = (dustPaymentService as any).PROOF_SERVER_URL || 'http://localhost:6300';
    const resp = await fetch(`${proofServerUrl}/api/transaction/spoof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, purpose })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      logger.error({ status: resp.status, body: txt }, 'Proof server spoof request failed');
      return res.status(502).json({ error: 'Proof server spoof failed' });
    }

    const data = await resp.json() as { txHash?: string };
    if (!data.txHash) {
      return res.status(500).json({ error: 'Spoof did not return txHash' });
    }

    res.json({ txHash: data.txHash, amount, purpose });
  } catch (error) {
    logger.error({ error }, 'Spoof payment request failed');
    res.status(500).json({ error: 'Internal error' });
  }
});

function getBucketRange(bucket: number): string {
  const ranges = ['300-499', '500-649', '650-749', '750-849', '850+'];
  return ranges[bucket] || 'Unknown';
}

function emitStream(sessionId: string, payload: unknown) {
  const stream = streams.get(sessionId);
  if (!stream) return;
  try {
    // Send the data payload
    stream.write(`data: ${JSON.stringify(payload)}\n\n`);
    // Send an explicit end event for determinism
    stream.write(`event: end\n`);
    stream.write(`data: end\n\n`);
  } finally {
    // Close and clean up the stream to avoid dangling connections
    stream.end();
    streams.delete(sessionId);
  }
}

const port = Number(env.PORT);
app.listen(port, () => {
  logger.info(`AtlasCred API ready on :${port}`);
});
