import crypto from 'crypto';
import type { CreditFactor, ScoreComputation, ScoreRequest } from '../types.js';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export class ScoreEngine {
  private fairnessFloor = 0.55;

  compute(request: ScoreRequest): ScoreComputation {
    const factors: CreditFactor[] = [
      { key: 'incomeStability', weight: 0.30, value: request.aggregates.incomeStability },
      { key: 'repaymentConsistency', weight: 0.35, value: request.aggregates.repaymentConsistency },
      { key: 'savingsRate', weight: 0.20, value: request.aggregates.savingsRate },
      { key: 'communityTrust', weight: 0.15, value: request.aggregates.communityTrust }
    ];

    const baseScore = factors.reduce((acc, f) => acc + f.value * f.weight, 0) * 1000;
    
    // Calculate document verification boost
    const documentBoost = this.calculateDocumentBoost(request.verifiedDocuments || []);
    
    const fairnessBoost = this.applyFairnessGuard(baseScore);
    const adjustedScore = clamp(baseScore + fairnessBoost + documentBoost, 300, 950);
    const confidence = clamp(0.55 + request.proofs.length * 0.05 + (request.verifiedDocuments?.length || 0) * 0.03, 0.55, 0.98);

    const rationale = factors.map((f) =>
      `${f.key.replace(/([A-Z])/g, ' $1')}: ${(f.value * 100).toFixed(1)}% influence`
    );

    if (documentBoost > 0) {
      rationale.push(`Document Verification Boost: +${documentBoost.toFixed(0)} points`);
    }

    return {
      baseScore,
      adjustedScore,
      confidence,
      rationale
    };
  }

  private calculateDocumentBoost(documents: any[]): number {
    // Each verified document adds points to final score
    const boostMap: Record<string, number> = {
      'aadhar': 25,        // Government ID - highest trust
      'pan': 25,           // Tax ID - highest trust
      'passport': 20,      // International ID
      'drivingLicense': 15, // Government ID
      'mobile': 10,        // Phone verification
      'bankStatement': 20, // Financial proof
      'utilityBill': 12,   // Address proof
      'employmentLetter': 18 // Employment proof
    };

    return documents
      .filter(doc => doc.verified)
      .reduce((total, doc) => total + (boostMap[doc.type] || 0), 0);
  }

  private applyFairnessGuard(score: number): number {
    if (score < this.fairnessFloor * 1000) {
      return (this.fairnessFloor * 1000 - score) * 0.25;
    }

    return 0;
  }

  hashScore(score: number, sessionId: string): string {
    return crypto.createHash('sha256').update(`${sessionId}:${score}`).digest('hex');
  }

  // Map score to bucket for on-chain datum
  scoreToBucket(score: number): number {
    if (score >= 850) return 4;
    if (score >= 750) return 3;
    if (score >= 650) return 2;
    if (score >= 500) return 1;
    return 0;
  }
}

export const scoreEngine = new ScoreEngine();
