export type Aggregates = {
  incomeStability: number;
  repaymentConsistency: number;
  savingsRate: number;
  communityTrust: number;
};

export type VerifiedDocument = {
  type: string;
  verified: boolean;
  verifiedAt?: string;
  trustBoost: number;
};

export type ScorePayload = {
  sessionId: string;
  walletAddress: string;
  did?: string;
  proofs: Array<{ id: string; hash: string; expiresAt: string }>;
  verifiedDocuments?: VerifiedDocument[];
  aggregates: Aggregates;
  walletSignature?: string; // Cryptographic signature proving wallet ownership
  baseToken?: string; // Base token for two-token verification
  verificationHash?: string; // Hash of baseToken + documentNumber
};

export type MidnightPublicState = {
  scoreBucket: number;
  isActive: boolean;
  proofCount: number;
  hasDocuments: boolean;
  documentCount: number;
};

export type ScoreResponse = {
  adjustedScore: number;
  baseScore: number;
  confidence: number;
  rationale: string[];
  midnightProof: {
    proofId: string;
    contractAddress: string;
    expiresAt: string;
    txHash?: string;
    publicState: MidnightPublicState;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

export async function verifyWalletAddress(walletAddress: string): Promise<{
  valid: boolean;
  exists: boolean;
  message?: string;
}> {
  const res = await fetch(`${API_BASE}/verify-wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });

  if (!res.ok) {
    const error = await res.json();
    return {
      valid: false,
      exists: false,
      message: error.message || 'Unable to verify wallet address'
    };
  }

  return res.json();
}

export async function requestScore(body: ScorePayload): Promise<ScoreResponse> {
  const res = await fetch(`${API_BASE}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Unable to score right now');
  }

  return res.json();
}

export function openSessionStream(sessionId: string, onMessage: (payload: ScoreResponse) => void) {
  const source = new EventSource(`${API_BASE}/stream/${sessionId}`);
  source.onmessage = (event) => {
    onMessage(JSON.parse(event.data));
  };

  return () => source.close();
}
