"use client";

import { useState } from "react";
import { SliderField } from "./SliderField";
import { useScoreSession } from "@/hooks/useScoreSession";
import { ProofBadge } from "./ProofBadge";

const DEFAULT_PROOFS = [
  { id: "income", hash: "0xabc", expiresAt: new Date(Date.now() + 86400000).toISOString() },
  { id: "repayment", hash: "0xdef", expiresAt: new Date(Date.now() + 172800000).toISOString() }
];

export function ScoreForm() {
  const { aggregates, setAggregate, submit, status } = useScoreSession();
  const [wallet, setWallet] = useState("addr1qxyzhackathon");
  const proofs = DEFAULT_PROOFS;

  const disabled = status === "streaming";

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit({ walletAddress: wallet, proofs });
      }}
    >
      {/* User Role & Purpose Explanation */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 backdrop-blur-sm">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-300">
          <span>👤</span> Who Uses AtlasCred?
        </h3>
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            <strong className="text-blue-400">Credit Seekers:</strong> Individuals without traditional credit history (thin-file, unbanked, immigrants) who want to prove creditworthiness using alternative data.
          </p>
          <p>
            <strong className="text-purple-400">Lenders:</strong> Can verify your score bucket on-chain without seeing your exact score (privacy-preserving proof).
          </p>
          <p className="text-slate-400">
            🔒 Your score is locked on Cardano blockchain. You control who sees what level of detail through selective disclosure.
          </p>
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Wallet</label>
        <input
          value={wallet}
          onChange={(event) => setWallet(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-white focus:border-cyan-400/50 focus:outline-none"
          placeholder="addr1qxyz..."
        />
        <div className="mt-2 rounded-lg bg-slate-800/40 p-3 text-xs text-slate-300">
          <p className="mb-2 font-semibold text-amber-400">💡 Why We Need Your Wallet Address:</p>
          <ul className="ml-4 list-disc space-y-1 text-slate-400">
            <li><strong>Ownership:</strong> Links your credit score to your blockchain identity (DID)</li>
            <li><strong>Privacy Protection:</strong> Only YOU can update or reveal your score on-chain</li>
            <li><strong>Proof Storage:</strong> Score capsule locked at Cardano script address</li>
            <li><strong>Selective Disclosure:</strong> Control what lenders see (range vs exact score)</li>
          </ul>
          <p className="mt-2 text-xs italic text-slate-500">
            ℹ️ Your wallet address becomes your Public Key Hash (PKH) in the smart contract. No ADA spent—only data locked.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {proofs.map((proof) => (
          <ProofBadge key={proof.id} label={proof.id} active />
        ))}
        <ProofBadge label="Community" />
      </div>

      {/* Slider Explanation */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 backdrop-blur-sm">
        <p className="mb-2 text-sm font-semibold text-purple-300">📊 What Do These Sliders Represent?</p>
        <p className="mb-3 text-xs text-slate-300">
          These are <strong>alternative credit factors</strong> derived from your verified proofs (income statements, payment history, community reputation tokens).
        </p>
        <div className="space-y-2 text-xs text-slate-400">
          <p><strong className="text-cyan-400">Income Stability (30% weight):</strong> Consistency of income over time from on-chain transactions or verified off-chain sources</p>
          <p><strong className="text-green-400">Repayment Consistency (35% weight):</strong> History of meeting financial obligations (DeFi loans, P2P agreements, traditional bills)</p>
          <p><strong className="text-yellow-400">Savings Rate (20% weight):</strong> Ability to save and build financial reserves relative to income</p>
          <p><strong className="text-purple-400">Community Trust (15% weight):</strong> Reputation from peer endorsements, DAO participation, social attestations</p>
        </div>
        <p className="mt-3 rounded-md bg-slate-900/50 p-2 text-xs italic text-slate-400">
          🤖 The Masumi AI agent applies <strong>fairness adjustments</strong> to reduce bias against underrepresented groups. If your average score is low due to systemic factors, you receive a boost.
        </p>
      </div>

      <div className="space-y-4">
        <SliderField label="Income Stability" value={aggregates.incomeStability} onChange={(value) => setAggregate("incomeStability", value)} />
        <SliderField label="Repayment Consistency" value={aggregates.repaymentConsistency} onChange={(value) => setAggregate("repaymentConsistency", value)} />
        <SliderField label="Savings Rate" value={aggregates.savingsRate} onChange={(value) => setAggregate("savingsRate", value)} />
        <SliderField label="Community Trust" value={aggregates.communityTrust} onChange={(value) => setAggregate("communityTrust", value)} />
      </div>

      {/* Borderline Demo Preset */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            // Target adjusted score ≈485 (borderline range 480-499)
            // Base score calculation: sum(weight * value) * 1000
            // Using values chosen to yield base ≈466.5; fairness boost brings to ≈487
            setAggregate("incomeStability", 0.52);
            setAggregate("repaymentConsistency", 0.52);
            setAggregate("savingsRate", 0.41);
            setAggregate("communityTrust", 0.31);
          }}
          className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-1 text-xs font-semibold text-amber-300 hover:border-amber-300 hover:bg-amber-900/40"
        >
          Set Borderline (~485)
        </button>
        <span className="text-[10px] text-slate-500">
          Use this preset to demo enhancement eligibility (borderline scores 480-499).
        </span>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 py-3 text-lg font-semibold text-slate-900 transition disabled:opacity-50"
      >
        {status === "streaming" ? "🔒 Locking on Cardano..." : "🚀 Compute My Credit Score"}
      </button>

      {/* What Happens Next */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4 backdrop-blur-sm">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <span>🔄</span> What Happens When You Submit:
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-xs text-slate-400">
          <li>Your factors are sent to our backend API (over HTTPS)</li>
          <li><strong className="text-blue-400">Local Score Engine</strong> calculates weighted score (300-950 range)</li>
          <li><strong className="text-purple-400">Masumi AI Agent</strong> applies fairness kernel to reduce bias</li>
          <li>Both scores are averaged for your final score</li>
          <li>Score is <strong>hashed</strong> (SHA-256) and mapped to a <strong>bucket</strong> (0-4)</li>
          <li>A <strong>datum capsule</strong> is locked on Cardano with:
            <ul className="ml-4 mt-1 list-disc space-y-1 text-slate-500">
              <li>Your wallet PKH (owner)</li>
              <li>Score hash (privacy)</li>
              <li>Score bucket (0=300-499, 1=500-649, 2=650-749, 3=750-849, 4=850+)</li>
              <li>Random nonce (prevents tracking)</li>
              <li>Expiry timestamp (7 days)</li>
            </ul>
          </li>
          <li>You receive a <strong>transaction hash</strong> as proof</li>
        </ol>
        <p className="mt-3 rounded-md bg-green-950/30 p-2 text-xs text-green-400">
          ✅ <strong>Privacy Guarantee:</strong> Your exact score remains hidden on-chain. Lenders only see your bucket range unless you explicitly choose to reveal more via the RevealBucket redeemer.
        </p>
      </div>
    </form>
  );
}
