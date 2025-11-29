import { z } from 'zod';

export const scoreRequestSchema = z.object({
  sessionId: z.string().min(6),
  walletAddress: z.string().regex(/^(addr1|test1)/, 'Invalid Cardano address placeholder'),
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
  })
});

export type ScoreRequestInput = z.infer<typeof scoreRequestSchema>;
