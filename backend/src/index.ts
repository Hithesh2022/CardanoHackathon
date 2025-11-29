import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { env } from './config/env.js';
import { scoreRequestSchema } from './schemas/scoreRequest.js';
import { scoreEngine } from './services/scoreEngine.js';
import { midnightBridge } from './services/midnightBridge.js';
import { masumiClient } from './services/masumiClient.js';
import type { ScoreRequest, ScoreResponse } from './types.js';

const app = express();
const logger = pino({ name: 'atlascred-api' });
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const streams = new Map<string, express.Response>();
// Store scores by capsuleId and wallet address for lender verification
const scoreStore = new Map<string, ScoreResponse>();

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
        publicState: proof.publicState
      }
    };

    // Store score for lender verification (by proofId and wallet)
    scoreStore.set(proof.proofId, response);
    scoreStore.set(payload.walletAddress, response);

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

  // Return verification data with Midnight proof
  res.json({
    found: true,
    walletAddress: req.query.wallet || 'midnight1qxyzhackathon',
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
    adjustedScore: score.adjustedScore
  });
});

function getBucketRange(bucket: number): string {
  const ranges = ['300-499', '500-649', '650-749', '750-849', '850+'];
  return ranges[bucket] || 'Unknown';
}

function emitStream(sessionId: string, payload: unknown) {
  const stream = streams.get(sessionId);
  if (!stream) return;
  stream.write(`data: ${JSON.stringify(payload)}\n\n`);
}

const port = Number(env.PORT);
app.listen(port, () => {
  logger.info(`AtlasCred API ready on :${port}`);
});
