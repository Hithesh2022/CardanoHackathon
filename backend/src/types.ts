export type CreditFactor = {
  key: string;
  weight: number;
  value: number;
};

export type ScoreComputation = {
  baseScore: number;
  adjustedScore: number;
  confidence: number;
  rationale: string[];
};

export type DocumentType = 'aadhar' | 'pan' | 'mobile' | 'passport' | 'drivingLicense' | 'bankStatement' | 'utilityBill' | 'employmentLetter';

export type VerifiedDocument = {
  type: DocumentType;
  verified: boolean;
  verifiedAt?: string;
  trustBoost: number; // 0.01 to 0.05 per document
};

export type ScoreRequest = {
  sessionId: string;
  walletAddress: string;
  did?: string;
  proofs: Array<{ id: string; hash: string; expiresAt: string }>;
  verifiedDocuments?: VerifiedDocument[];
  aggregates: {
    incomeStability: number;
    repaymentConsistency: number;
    savingsRate: number;
    communityTrust: number;
  };
};

export type MidnightPublicState = {
  scoreBucket: number;
  isActive: boolean;
  proofCount: number;
  hasDocuments: boolean;
  documentCount: number;
};

export type ScoreResponse = ScoreComputation & {
  documentBoost?: number;
  verifiedDocuments?: VerifiedDocument[];
  midnightProof: {
    proofId: string;
    contractAddress: string;
    expiresAt: string;
    txHash?: string;
    publicState: MidnightPublicState;
  };
};
