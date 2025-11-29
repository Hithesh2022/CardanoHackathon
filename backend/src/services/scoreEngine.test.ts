import { describe, expect, it } from 'vitest';
import { scoreEngine } from './scoreEngine.js';
import type { ScoreRequest } from '../types.js';

const baseRequest: ScoreRequest = {
  sessionId: 'demo-session',
  walletAddress: 'addr1qxyzdemo',
  proofs: [{ id: 'income', hash: 'abc', expiresAt: new Date().toISOString() }],
  aggregates: {
    incomeStability: 0.7,
    repaymentConsistency: 0.8,
    savingsRate: 0.5,
    communityTrust: 0.6
  }
};

describe('scoreEngine', () => {
  it('boosts low scores with fairness guard', () => {
    const lowRequest: ScoreRequest = {
      ...baseRequest,
      aggregates: {
        incomeStability: 0.3,
        repaymentConsistency: 0.3,
        savingsRate: 0.2,
        communityTrust: 0.4
      }
    };

    const result = scoreEngine.compute(lowRequest);
    expect(result.adjustedScore).toBeGreaterThan(result.baseScore);
  });

  it('generates deterministic hashes', () => {
    const score = scoreEngine.compute(baseRequest);
    const hashA = scoreEngine.hashScore(score.adjustedScore, baseRequest.sessionId);
    const hashB = scoreEngine.hashScore(score.adjustedScore, baseRequest.sessionId);
    expect(hashA).toBe(hashB);
  });
});
