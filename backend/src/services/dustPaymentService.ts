import type { Logger } from 'pino';
import { env } from '../config/env.js';

export interface PaymentVerification {
  confirmed: boolean;
  valid: boolean;
  amount: number;
  purpose: 'score_enhancement' | 'data_access';
  txHash: string;
}

export interface ScoreEnhancementResult {
  enhanced: boolean;
  newScore: number;
  oldScore: number;
  masumiApplied: boolean;
  paymentTxHash: string;
}

export interface BorrowerDetailedData {
  loans: Array<{
    id: string;
    amount: number;
    repaid: number;
    status: 'active' | 'completed' | 'defaulted';
    onTimePayments: number;
    totalPayments: number;
    startDate: string;
    endDate?: string;
  }>;
  onTimePayments: number;
  latePayments: number;
  avgRepaymentDays: number;
  creditUtilization: number;
  transactions: Array<{
    id: string;
    description: string;
    date: string;
    amount: number;
    type: 'credit' | 'debit';
  }>;
}

export class DustPaymentService {
  private readonly PROOF_SERVER_URL: string;
  private readonly MASUMI_AGENT_URL: string;
  private readonly DUST_PRICE_ENHANCEMENT: number = 10;
  private readonly DUST_PRICE_DATA_ACCESS: number = 5;

  constructor(private logger: Logger) {
    this.PROOF_SERVER_URL = env.MIDNIGHT_PROOF_SERVER || 'http://localhost:6300';
    this.MASUMI_AGENT_URL = env.MASUMI_AGENT_URL || 'http://localhost:8000';
  }

  /**
   * Verify a DUST token payment transaction on Midnight blockchain
   */
  async verifyPayment(
    txHash: string,
    purpose: 'score_enhancement' | 'data_access'
  ): Promise<PaymentVerification> {
    try {
      this.logger.info({ txHash, purpose }, 'Verifying DUST payment');

      const response = await fetch(`${this.PROOF_SERVER_URL}/api/transaction/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash,
          purpose,
          expectedAmount: purpose === 'score_enhancement' 
            ? this.DUST_PRICE_ENHANCEMENT 
            : this.DUST_PRICE_DATA_ACCESS
        }),
      });

      if (!response.ok) {
        this.logger.error({ status: response.status, txHash }, 'Payment verification failed');
        return {
          confirmed: false,
          valid: false,
          amount: 0,
          purpose,
          txHash,
        };
      }

      const result = await response.json() as { confirmed?: boolean; valid?: boolean; amount?: number };
      
      this.logger.info({ txHash, result }, 'Payment verification result');
      
      return {
        confirmed: result.confirmed || false,
        valid: result.valid || false,
        amount: result.amount || 0,
        purpose,
        txHash,
      };
    } catch (error) {
      this.logger.error({ error, txHash }, 'Payment verification error');
      return {
        confirmed: false,
        valid: false,
        amount: 0,
        purpose,
        txHash,
      };
    }
  }

  /**
   * Enhance a borderline score using Masumi AI agent (requires DUST payment)
   */
  async enhanceScore(
    proofId: string,
    currentScore: number,
    paymentTxHash: string,
    walletAddress: string
  ): Promise<ScoreEnhancementResult> {
    try {
      this.logger.info({ proofId, currentScore, paymentTxHash }, 'Starting score enhancement');

      // 1. Verify DUST payment (10 tokens for score enhancement)
      const paymentVerification = await this.verifyPayment(
        paymentTxHash,
        'score_enhancement'
      );

      if (!paymentVerification.confirmed || !paymentVerification.valid) {
        throw new Error('Payment verification failed. Please ensure transaction is confirmed on Midnight blockchain.');
      }

      if (paymentVerification.amount < this.DUST_PRICE_ENHANCEMENT) {
        throw new Error(`Insufficient payment. Required: ${this.DUST_PRICE_ENHANCEMENT} DUST, received: ${paymentVerification.amount} DUST`);
      }

      // 2. Check if score is borderline for any bucket
      // Buckets: 300-499, 500-649, 650-749, 750-849, 850-900
      const isBorderline = 
        (currentScore >= 480 && currentScore < 500) ||  // Near 500 bucket
        (currentScore >= 630 && currentScore < 650) ||  // Near 650 bucket
        (currentScore >= 730 && currentScore < 750) ||  // Near 750 bucket
        (currentScore >= 830 && currentScore < 850);    // Near 850 bucket
      
      if (!isBorderline) {
        throw new Error(`Score ${currentScore} is not eligible for enhancement. Only borderline scores qualify (within 20 points of next bucket).`);
      }

      // 3. Call Masumi AI agent for intelligent score enhancement
      this.logger.info({ proofId, masumiUrl: this.MASUMI_AGENT_URL }, 'Calling Masumi AI agent for enhancement');
      
      try {
        const masumiResponse = await fetch(`${this.MASUMI_AGENT_URL}/enhance-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proofId,
            currentScore,
            walletAddress,
            enhancementPaid: true,
            paymentTxHash,
          }),
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!masumiResponse.ok) {
          throw new Error(`Masumi agent returned status ${masumiResponse.status}`);
        }

        const masumiResult = await masumiResponse.json() as { enhancedScore: number; analysisApplied: boolean };
        
        this.logger.info({ 
          oldScore: currentScore, 
          newScore: masumiResult.enhancedScore,
          boost: masumiResult.enhancedScore - currentScore,
          aiAnalysis: masumiResult.analysisApplied
        }, 'Masumi AI enhancement complete');

        return {
          enhanced: true,
          newScore: masumiResult.enhancedScore,
          oldScore: currentScore,
          masumiApplied: true,
          paymentTxHash,
        };
      } catch (masumiError) {
        this.logger.error({ error: masumiError }, 'Masumi AI agent failed, rejecting enhancement');
        throw new Error('AI enhancement service unavailable. Please try again later.');
      }
    } catch (error) {
      this.logger.error({ error, proofId }, 'Score enhancement failed');
      throw error;
    }
  }

  /**
   * Unlock detailed borrower data (requires DUST payment)
   */
  async unlockBorrowerData(
    proofId: string,
    paymentTxHash: string
  ): Promise<BorrowerDetailedData> {
    try {
      this.logger.info({ proofId, paymentTxHash }, 'Unlocking borrower data');

      // 1. Verify DUST payment (5 tokens for data access)
      const paymentVerification = await this.verifyPayment(
        paymentTxHash,
        'data_access'
      );

      if (!paymentVerification.confirmed || !paymentVerification.valid) {
        throw new Error('Payment verification failed');
      }

      if (paymentVerification.amount < this.DUST_PRICE_DATA_ACCESS) {
        throw new Error(`Insufficient payment. Required: ${this.DUST_PRICE_DATA_ACCESS} DUST`);
      }

      // 2. Fetch detailed data from backend storage
      // NOTE: Currently returns mock data. Replace with real DB fetch.
      const detailedData: BorrowerDetailedData = {
        loans: [
          {
            id: 'LOAN-001',
            amount: 50000,
            repaid: 45000,
            status: 'active',
            onTimePayments: 10,
            totalPayments: 12,
            startDate: '2023-06-15',
          },
          {
            id: 'LOAN-002',
            amount: 25000,
            repaid: 25000,
            status: 'completed',
            onTimePayments: 6,
            totalPayments: 6,
            startDate: '2023-01-10',
            endDate: '2023-07-10',
          },
        ],
        onTimePayments: 16,
        latePayments: 2,
        avgRepaymentDays: 28,
        creditUtilization: 65,
        transactions: [
          {
            id: 'TX-101',
            description: 'Loan EMI Payment',
            date: '2024-01-15',
            amount: 5000,
            type: 'debit',
          },
          {
            id: 'TX-102',
            description: 'Salary Credit',
            date: '2024-01-10',
            amount: 45000,
            type: 'credit',
          },
          {
            id: 'TX-103',
            description: 'Loan EMI Payment',
            date: '2023-12-15',
            amount: 5000,
            type: 'debit',
          },
          {
            id: 'TX-104',
            description: 'Bonus Credit',
            date: '2023-12-20',
            amount: 15000,
            type: 'credit',
          },
        ],
      };

      this.logger.info({ proofId }, 'Borrower data unlocked successfully');

      return detailedData;
    } catch (error) {
      this.logger.error({ error, proofId }, 'Failed to unlock borrower data');
      throw error;
    }
  }

  /**
   * Calculate score enhancement based on borderline position
   */
  private calculateEnhancement(currentScore: number): number {
    // Determine target bucket and apply appropriate enhancement
    let targetScore: number;
    let enhancementFactor: number;
    
    if (currentScore >= 480 && currentScore < 500) {
      // Push to 500-649 bucket
      const distanceFrom500 = 500 - currentScore;
      enhancementFactor = Math.min(30, Math.max(15, distanceFrom500 * 0.8));
      targetScore = Math.min(520, Math.round(currentScore + enhancementFactor));
    } else if (currentScore >= 630 && currentScore < 650) {
      // Push to 650-749 bucket
      const distanceFrom650 = 650 - currentScore;
      enhancementFactor = Math.min(30, Math.max(15, distanceFrom650 * 0.8));
      targetScore = Math.min(670, Math.round(currentScore + enhancementFactor));
    } else if (currentScore >= 730 && currentScore < 750) {
      // Push to 750-849 bucket
      const distanceFrom750 = 750 - currentScore;
      enhancementFactor = Math.min(30, Math.max(15, distanceFrom750 * 0.8));
      targetScore = Math.min(770, Math.round(currentScore + enhancementFactor));
    } else if (currentScore >= 830 && currentScore < 850) {
      // Push to 850-900 bucket
      const distanceFrom850 = 850 - currentScore;
      enhancementFactor = Math.min(30, Math.max(15, distanceFrom850 * 0.8));
      targetScore = Math.min(870, Math.round(currentScore + enhancementFactor));
    } else {
      // Fallback (shouldn't reach here due to validation)
      enhancementFactor = 20;
      targetScore = currentScore + 20;
    }
    
    this.logger.info({ currentScore, targetScore, enhancementFactor }, 'Applied basic enhancement');
    
    return targetScore;
  }

  /**
   * Mock payment verification for development/testing
   */
  private mockPaymentVerification(
    txHash: string,
    purpose: 'score_enhancement' | 'data_access'
  ): PaymentVerification {
    this.logger.warn({ txHash, purpose }, 'Using MOCK payment verification');
    
    return {
      confirmed: true,
      valid: true,
      amount: purpose === 'score_enhancement' ? this.DUST_PRICE_ENHANCEMENT : this.DUST_PRICE_DATA_ACCESS,
      purpose,
      txHash,
    };
  }

  /**
   * Check if a score is eligible for enhancement (borderline 390-410)
   */
  isBorderlineScore(score: number): boolean {
    return score >= 390 && score <= 410;
  }

  /**
   * Get DUST token prices
   */
  getPrices() {
    return {
      scoreEnhancement: this.DUST_PRICE_ENHANCEMENT,
      dataAccess: this.DUST_PRICE_DATA_ACCESS,
    };
  }
}
