import { z } from 'zod';

export const scoreRequestSchema = z.object({
  sessionId: z.string().min(6),
  // Accept both bech32 (addr1...) and hex format addresses from wallet extensions
  walletAddress: z.string().min(56, 'Wallet address too short'),
  did: z.string().optional(),
  proofs: z
    .array(
      z.object({
        id: z.string(),
        hash: z.string(),
        expiresAt: z.string()
      })
    )
    .min(1),
  aggregates: z.object({
    incomeStability: z.number().min(0).max(1),
    repaymentConsistency: z.number().min(0).max(1),
    savingsRate: z.number().min(0).max(1),
    communityTrust: z.number().min(0).max(1)
  }),
  // Two-token verification system
  baseToken: z.string().optional(),
  verificationHash: z.string().optional()
});

export type ScoreRequestInput = z.infer<typeof scoreRequestSchema>;
