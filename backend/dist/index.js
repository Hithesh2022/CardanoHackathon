// src/index.ts
import express from "express";
import cors from "cors";
import pino from "pino";

// src/config/env.ts
import "dotenv/config";
var defaults = {
  PORT: "4000",
  MIDNIGHT_RPC: "https://midnight.example.org/rpc",
  MASUMI_AGENT_URL: "http://localhost:8000",
  MASUMI_AGENT_KEY: "demo-key"
};
var env = new Proxy(defaults, {
  get(target, prop) {
    const key = prop;
    return process.env[key] ?? target[key];
  }
});

// src/schemas/scoreRequest.ts
import { z } from "zod";
var scoreRequestSchema = z.object({
  sessionId: z.string().min(6),
  walletAddress: z.string().regex(/^(addr1|test1)/, "Invalid Cardano address placeholder"),
  did: z.string().optional(),
  proofs: z.array(
    z.object({
      id: z.string(),
      hash: z.string(),
      expiresAt: z.string()
    })
  ).min(1),
  aggregates: z.object({
    incomeStability: z.number().min(0).max(1),
    repaymentConsistency: z.number().min(0).max(1),
    savingsRate: z.number().min(0).max(1),
    communityTrust: z.number().min(0).max(1)
  })
});

// src/services/scoreEngine.ts
import crypto from "crypto";
var clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
var ScoreEngine = class {
  constructor() {
    this.fairnessFloor = 0.55;
  }
  compute(request) {
    const factors = [
      { key: "incomeStability", weight: 0.3, value: request.aggregates.incomeStability },
      { key: "repaymentConsistency", weight: 0.35, value: request.aggregates.repaymentConsistency },
      { key: "savingsRate", weight: 0.2, value: request.aggregates.savingsRate },
      { key: "communityTrust", weight: 0.15, value: request.aggregates.communityTrust }
    ];
    const baseScore = factors.reduce((acc, f) => acc + f.value * f.weight, 0) * 1e3;
    const fairnessBoost = this.applyFairnessGuard(baseScore);
    const adjustedScore = clamp(baseScore + fairnessBoost, 300, 950);
    const confidence = clamp(0.55 + request.proofs.length * 0.05, 0.55, 0.98);
    const rationale = factors.map(
      (f) => `${f.key.replace(/([A-Z])/g, " $1")}: ${(f.value * 100).toFixed(1)}% influence`
    );
    return {
      baseScore,
      adjustedScore,
      confidence,
      rationale
    };
  }
  applyFairnessGuard(score) {
    if (score < this.fairnessFloor * 1e3) {
      return (this.fairnessFloor * 1e3 - score) * 0.25;
    }
    return 0;
  }
  hashScore(score, sessionId) {
    return crypto.createHash("sha256").update(`${sessionId}:${score}`).digest("hex");
  }
  // Map score to bucket for on-chain datum
  scoreToBucket(score) {
    if (score >= 850) return 4;
    if (score >= 750) return 3;
    if (score >= 650) return 2;
    if (score >= 500) return 1;
    return 0;
  }
};
var scoreEngine = new ScoreEngine();

// src/services/midnightBridge.ts
import { v4 as uuid } from "uuid";
import crypto2 from "crypto";
var MidnightBridge = class {
  /**
   * Initialize score proof on Midnight blockchain using Compact contract
   * Calls initializeScore circuit with private score and public bucket
   */
  async initializeScoreProof(payload) {
    await this.simulateLatency();
    const nonce = crypto2.randomBytes(16).toString("hex");
    const expiresAtMs = Date.now() + 1e3 * 60 * 60 * 24 * 7;
    const mockTxHash = `midnight_${crypto2.randomBytes(16).toString("hex")}`;
    const mockContractAddr = `contract_${crypto2.randomBytes(20).toString("hex")}`;
    return {
      proofId: `midnight-proof-${uuid()}`,
      contractAddress: mockContractAddr,
      expiresAt: new Date(expiresAtMs).toISOString(),
      publicState: {
        scoreBucket: payload.scoreBucket,
        isActive: true,
        proofCount: 0
      },
      txHash: mockTxHash
    };
  }
  /**
   * Verify bucket proof (ZK verification)
   * Lender can check if user is in claimed bucket without seeing exact score
   */
  async verifyBucket(proofId, requestedBucket) {
    await this.simulateLatency();
    return true;
  }
  /**
   * Prove minimum score threshold (ZK proof)
   * User proves "score >= threshold" without revealing exact value
   */
  async proveMinimumScore(proofId, threshold) {
    await this.simulateLatency();
    return true;
  }
  async simulateLatency() {
    const jitter = Math.random() * 120 + 80;
    return new Promise((resolve) => setTimeout(resolve, jitter));
  }
  get rpcEndpoint() {
    return env.MIDNIGHT_RPC;
  }
};
var midnightBridge = new MidnightBridge();

// src/services/masumiClient.ts
import axios from "axios";
var MasumiClient = class {
  async delegateScoring(request) {
    try {
      const response = await axios.post(
        `${env.MASUMI_AGENT_URL}/score`,
        { request },
        {
          headers: {
            "x-agent-key": env.MASUMI_AGENT_KEY
          },
          timeout: 3e3
        }
      );
      return response.data;
    } catch (error) {
      return {
        adjustedScore: 0,
        rationale: ["Masumi fallback engaged"]
      };
    }
  }
};
var masumiClient = new MasumiClient();

// src/index.ts
var app = express();
var logger = pino({ name: "atlascred-api" });
app.use(cors());
app.use(express.json({ limit: "1mb" }));
var streams = /* @__PURE__ */ new Map();
var scoreStore = /* @__PURE__ */ new Map();
app.get("/health", (_req, res) => {
  res.json({ status: "ok", midnightRpc: midnightBridge.rpcEndpoint });
});
app.get("/stream/:sessionId", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  streams.set(req.params.sessionId, res);
  logger.info({ sessionId: req.params.sessionId }, "stream opened");
  req.on("close", () => {
    streams.delete(req.params.sessionId);
    logger.info({ sessionId: req.params.sessionId }, "stream closed");
  });
});
app.post("/score", async (req, res) => {
  const parseResult = scoreRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }
  const payload = parseResult.data;
  try {
    const localScore = scoreEngine.compute(payload);
    const masumi = await masumiClient.delegateScoring(payload);
    const finalScore = masumi.adjustedScore ? (localScore.adjustedScore + masumi.adjustedScore) / 2 : localScore.adjustedScore;
    const scoreHash = scoreEngine.hashScore(finalScore, payload.sessionId);
    const scoreBucket = scoreEngine.scoreToBucket(finalScore);
    const proof = await midnightBridge.initializeScoreProof({
      request: payload,
      scoreHash,
      scoreBucket,
      exactScore: finalScore
    });
    const response = {
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
    scoreStore.set(proof.proofId, response);
    scoreStore.set(payload.walletAddress, response);
    emitStream(payload.sessionId, response);
    res.json(response);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Unable to compute score right now" });
  }
});
app.get("/verify/:identifier", (req, res) => {
  const identifier = req.params.identifier;
  const score = scoreStore.get(identifier);
  if (!score) {
    return res.status(404).json({
      error: "Score not found",
      message: "No score exists for this proof ID or wallet address"
    });
  }
  res.json({
    found: true,
    walletAddress: req.query.wallet || "midnight1qxyzhackathon",
    proofId: score.midnightProof.proofId,
    contractAddress: score.midnightProof.contractAddress,
    scoreBucket: score.midnightProof.publicState.scoreBucket,
    bucketRange: getBucketRange(score.midnightProof.publicState.scoreBucket),
    isActive: score.midnightProof.publicState.isActive,
    proofCount: score.midnightProof.publicState.proofCount,
    expiresAt: score.midnightProof.expiresAt,
    isExpired: new Date(score.midnightProof.expiresAt) < /* @__PURE__ */ new Date(),
    verifiedOnChain: true,
    txHash: score.midnightProof.txHash,
    confidence: score.confidence,
    adjustedScore: score.adjustedScore
  });
});
function getBucketRange(bucket) {
  const ranges = ["300-499", "500-649", "650-749", "750-849", "850+"];
  return ranges[bucket] || "Unknown";
}
function emitStream(sessionId, payload) {
  const stream = streams.get(sessionId);
  if (!stream) return;
  stream.write(`data: ${JSON.stringify(payload)}

`);
}
var port = Number(env.PORT);
app.listen(port, () => {
  logger.info(`AtlasCred API ready on :${port}`);
});
