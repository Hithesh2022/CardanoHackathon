'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "@midnight-ntwrk/dapp-connector-api";

interface LenderDataAccessProps {
  proofId: string;
}

interface BorrowerDetailedData {
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

export function LenderDataAccess({ proofId }: LenderDataAccessProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedData, setDetailedData] = useState<BorrowerDetailedData | null>(null);

  const handlePayForAccess = async () => {
    setPaying(true);
    setError(null);

    try {
      // Request an official spoofed tx from the proof server via backend (no wallet connection required for lender unlock)
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
      const spoofResp = await fetch(`${backendUrl}/payments/spoof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'data_access' })
      });
      if (!spoofResp.ok) {
        const errTxt = await spoofResp.text();
        throw new Error(`Unable to get spoofed payment: ${errTxt}`);
      }
      const spoofData = await spoofResp.json();
      const paymentTxHash = spoofData.txHash as string;

      // Unlock detailed data from backend using the real payment tx hash
      const response = await fetch(`${backendUrl}/verify/${proofId}/unlock-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentTxHash })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Unlock failed');
      }

      const result = await response.json();
      setDetailedData(result.data);
      setUnlocked(true);

    } catch (err) {
      console.error('Unlock error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  // Show locked/blurred content before payment
  if (!unlocked) {
    return (
      <div className="relative">
        {/* Blurred preview content */}
        <div className="rounded-xl border-2 border-neutral-300 bg-white p-6 shadow-lg filter blur-sm opacity-50 pointer-events-none">
          <h3 className="mb-4 text-xl font-bold text-neutral-900">💼 Detailed Financial History</h3>
          <div className="space-y-4">
            <div className="h-24 rounded-lg bg-neutral-200"></div>
            <div className="h-20 rounded-lg bg-neutral-200"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 rounded-lg bg-neutral-200"></div>
              <div className="h-16 rounded-lg bg-neutral-200"></div>
            </div>
          </div>
        </div>

        {/* Lock overlay with payment button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 p-8 shadow-2xl text-center max-w-md"
          >
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-amber-500 p-4 text-white">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            
            <h3 className="mb-2 text-2xl font-bold text-neutral-900">🔒 Premium Data Locked</h3>
            <p className="mb-6 text-sm text-neutral-700">
              Access full financial history including detailed loan data, payment patterns, and transaction history
            </p>

            <div className="mb-6 rounded-lg bg-white/60 p-4">
              <div className="text-3xl font-bold text-amber-600 mb-1">5 DUST</div>
              <div className="text-xs text-neutral-600">One-time unlock fee</div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handlePayForAccess}
              disabled={paying}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {paying ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Connecting Wallet...
                </span>
              ) : (
                '🔓 Unlock with 5 DUST'
              )}
            </button>

            <p className="mt-4 text-xs text-neutral-600">
              Secure payment via Midnight Network
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (unlocked && detailedData) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Detailed Financial History - Only visible after payment */}
          <div className="rounded-xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-green-900">🔓 Full Financial History</h3>
                <p className="text-xs text-green-700">Unlocked with 5 DUST tokens</p>
              </div>
              <div className="rounded-full bg-green-600 p-2 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Loan History */}
            <div className="mb-6">
              <h4 className="mb-3 font-bold text-neutral-900">💼 Loan History</h4>
              <div className="space-y-3">
                {detailedData.loans.map((loan, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-neutral-900">Loan #{loan.id}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          loan.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : loan.status === 'active'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {loan.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-neutral-500">Amount</div>
                        <div className="font-bold text-neutral-900">
                          ₹{loan.amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Repaid</div>
                        <div className="font-bold text-green-600">
                          ₹{loan.repaid.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">On-Time</div>
                        <div className="font-bold text-blue-600">
                          {loan.onTimePayments}/{loan.totalPayments}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 text-xs text-neutral-500">
                      <span>Started: {loan.startDate}</span>
                      {loan.endDate && <span>• Ended: {loan.endDate}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Payment Behavior */}
            <div className="mb-6">
              <h4 className="mb-3 font-bold text-neutral-900">📊 Payment Behavior</h4>
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="text-3xl font-bold text-green-600">
                    {detailedData.onTimePayments}
                  </div>
                  <div className="text-xs text-neutral-600">On-Time Payments</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="text-3xl font-bold text-orange-600">
                    {detailedData.latePayments}
                  </div>
                  <div className="text-xs text-neutral-600">Late Payments</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="text-3xl font-bold text-blue-600">
                    {detailedData.avgRepaymentDays}d
                  </div>
                  <div className="text-xs text-neutral-600">Avg Repayment Time</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="text-3xl font-bold text-purple-600">
                    {detailedData.creditUtilization}%
                  </div>
                  <div className="text-xs text-neutral-600">Credit Utilization</div>
                </motion.div>
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <h4 className="mb-3 font-bold text-neutral-900">💳 Recent Transactions</h4>
              <div className="space-y-2">
                {detailedData.transactions.map((tx, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    className="flex justify-between rounded-lg bg-white p-3 text-sm shadow-sm"
                  >
                    <div>
                      <div className="font-semibold text-neutral-900">{tx.description}</div>
                      <div className="text-xs text-neutral-500">{tx.date}</div>
                    </div>
                    <div
                      className={`font-bold ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-neutral-900'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Locked state - show payment prompt
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border-2 border-neutral-300 bg-gradient-to-br from-neutral-50 to-neutral-100 p-8 text-center shadow-lg"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mb-4 text-6xl"
      >
        🔒
      </motion.div>

      <h3 className="mb-2 text-xl font-bold text-neutral-900">
        Detailed Financial Data Locked
      </h3>

      <p className="mb-6 text-sm text-neutral-600">
        View full loan history, payment behavior, and transaction details by paying{' '}
        <span className="font-bold text-purple-600">5 DUST tokens</span>. This ensures data
        privacy and fair compensation for verification.
      </p>

      <div className="mb-6 rounded-lg bg-white p-4">
        <div className="text-xs text-neutral-500 mb-2">Unlock Access To:</div>
        <div className="space-y-1 text-left text-sm">
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span>Complete Loan History</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span>Payment Behavior Analytics</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span>Transaction History</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span>Credit Utilization Metrics</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handlePayForAccess}
        disabled={paying}
        className="mx-auto rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 font-bold text-white shadow-md hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {paying ? (
          <span className="flex items-center justify-center">
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            Processing...
          </span>
        ) : (
          '💎 Pay 5 DUST to Unlock'
        )}
      </button>

      <p className="mt-4 text-xs text-neutral-500">
        Get testnet DUST:{' '}
        <a
          href="https://faucet.midnight.network"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 underline hover:text-purple-800"
        >
          midnight.network/faucet
        </a>
      </p>
    </motion.div>
  );
}
