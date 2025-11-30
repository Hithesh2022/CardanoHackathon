'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import "@midnight-ntwrk/dapp-connector-api";

interface ScoreEnhancementProps {
  score: number;
  proofId: string;
  walletAddress: string;
  onEnhancementComplete?: (newScore: number) => void;
}

export function ScoreEnhancement({ score, proofId, walletAddress, onEnhancementComplete }: ScoreEnhancementProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if score is borderline for ANY bucket (within 20 points of bucket boundary)
  // Buckets: 300-499, 500-649, 650-749, 750-849, 850-900
  const getBorderlineInfo = (score: number) => {
    if (score >= 480 && score < 500) return { isBorderline: true, nextBucket: '500-649', pointsNeeded: 500 - score };
    if (score >= 630 && score < 650) return { isBorderline: true, nextBucket: '650-749', pointsNeeded: 650 - score };
    if (score >= 730 && score < 750) return { isBorderline: true, nextBucket: '750-849', pointsNeeded: 750 - score };
    if (score >= 830 && score < 850) return { isBorderline: true, nextBucket: '850-900', pointsNeeded: 850 - score };
    return { isBorderline: false, nextBucket: '', pointsNeeded: 0 };
  };

  const borderlineInfo = getBorderlineInfo(score);

  // Hide entire panel if not borderline or already enhanced
  if (!borderlineInfo.isBorderline || success) return null;

  const handlePayForEnhancement = async () => {
    setPaying(true);
    setError(null);

    try {
      // Connect to Midnight Lace wallet
      if (typeof window === 'undefined' || !window.midnight?.mnLace) {
        throw new Error('Midnight Lace wallet not found. Please install from midnight.network');
      }

      const api = await window.midnight.mnLace.enable();
      const state = await api.state();
      
      if (!state || !state.address) {
        throw new Error('Could not get wallet address. Please unlock your wallet.');
      }

      // Request a spoofed payment tx from backend (uses Docker proof server or local fallback)
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
      const spoofResp = await fetch(`${backendUrl}/payments/spoof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'score_enhancement' })
      });
      if (!spoofResp.ok) {
        const errTxt = await spoofResp.text();
        throw new Error(`Unable to get spoofed payment: ${errTxt}`);
      }
      const spoofData = await spoofResp.json();
      const paymentTxHash = spoofData.txHash as string;

      // Call backend to enhance score
      const response = await fetch(`${backendUrl}/score/${proofId}/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentTxHash,
          walletAddress: walletAddress
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Enhancement failed');
      }

      const enhanced = await response.json();

      setSuccess(true);
      
      // Notify parent component
      if (onEnhancementComplete) {
        onEnhancementComplete(enhanced.updatedScore.adjustedScore);
      }

      // Show success message
      setTimeout(() => {
        window.location.reload(); // Reload to show new score
      }, 2000);

    } catch (err) {
      console.error('Enhancement error:', err);
      setError(err instanceof Error ? err.message : 'Enhancement failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-amber-400 p-3 bg-white/40 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <span>🚀 Borderline Score</span>
          <span className="text-xs font-normal text-amber-600">{score} → needs +{borderlineInfo.pointsNeeded} for {borderlineInfo.nextBucket}</span>
        </div>
        <button
          onClick={handlePayForEnhancement}
          disabled={paying}
          className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? 'Processing…' : '💎 Boost (+10 DUST)'}
        </button>
      </div>
      {error && (
        <div className="mt-2 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] text-red-700">{error}</div>
      )}
    </motion.div>
  );
}
