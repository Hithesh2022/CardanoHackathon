"use client";

import Link from "next/link";

export function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="section-padding gradient-primary text-white">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              Credit Scoring for Everyone
            </h1>
            <p className="mb-8 text-xl text-blue-50 md:text-2xl">
              Build creditworthiness using alternative data. No bank account required. Zero-knowledge proofs on Midnight blockchain.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/borrower"
                className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50"
              >
                Calculate My Score Free
              </Link>
              <Link
                href="/lender"
                className="rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
              >
                Verify a Borrower
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
              2.5 Billion People Lack Credit History
            </h2>
            <p className="text-lg text-neutral-700">
              Traditional credit scoring excludes immigrants, gig workers, and those without bank accounts. AtlasCred uses alternative data—income consistency, repayment history, community reputation—to give everyone access to credit.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding gradient-subtle">
        <div className="container-custom">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900 md:text-4xl">
            How AtlasCred Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="card-shadow rounded-2xl bg-white p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                1
              </div>
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">
                Submit Alternative Data
              </h3>
              <p className="text-neutral-700">
                Income stability, repayment consistency, savings rate, and community trust—no traditional credit history needed.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-shadow rounded-2xl bg-white p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
                2
              </div>
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">
                Masumi AI-Powered Fairness
              </h3>
              <p className="mb-3 text-neutral-700">
                Our Masumi AI agent applies bias mitigation algorithms to ensure underrepresented groups aren't penalized by systemic factors.
              </p>
              <div className="rounded-lg bg-purple-50 p-3 text-xs text-purple-800">
                <strong>How it works:</strong> If your average score is low due to systemic disadvantages (lack of banking access, etc.), the AI agent applies a fairness boost to compensate.
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card-shadow rounded-2xl bg-white p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                3
              </div>
              <h3 className="mb-3 text-xl font-semibold text-neutral-900">
                Dual Smart Contracts
              </h3>
              <p className="mb-3 text-neutral-700">
                Aiken (Cardano L1) + Compact (Midnight Network) contracts secure your score with zero-knowledge proofs. Lenders verify your bucket without seeing exact score.
              </p>
              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                <strong>Privacy:</strong> Exact score stays private. Only bucket range (0-4) is public. Verified documents remain encrypted.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Two Flows */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900 md:text-4xl">
            Two User Flows
          </h2>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Borrower Flow */}
            <div className="card-shadow-lg rounded-2xl border border-neutral-200 bg-white p-8">
              <h3 className="mb-6 text-2xl font-semibold text-neutral-900">
                For Borrowers
              </h3>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                    1
                  </span>
                  <span className="text-neutral-700">
                    Connect your Cardano wallet (Lace, Eternl, or Yoroi)
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                    2
                  </span>
                  <span className="text-neutral-700">
                    Submit your credit factors (income, repayment, savings, community trust)
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                    3
                  </span>
                  <span className="text-neutral-700">
                    Receive your score (300-950) and Cardano proof capsule
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                    4
                  </span>
                  <span className="text-neutral-700">
                    Share your capsule ID with lenders to prove creditworthiness
                  </span>
                </li>
              </ol>
              <Link
                href="/borrower"
                className="mt-8 block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                Get Started Free
              </Link>
            </div>

            {/* Lender Flow */}
            <div className="card-shadow-lg rounded-2xl border border-neutral-200 bg-white p-8">
              <h3 className="mb-6 text-2xl font-semibold text-neutral-900">
                For Lenders
              </h3>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                    1
                  </span>
                  <span className="text-neutral-700">
                    Request borrower's wallet address or capsule ID
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                    2
                  </span>
                  <span className="text-neutral-700">
                    Enter details into verification portal
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                    3
                  </span>
                  <span className="text-neutral-700">
                    View borrower's score bucket on-chain (e.g., 650-749 range)
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                    4
                  </span>
                  <span className="text-neutral-700">
                    Make lending decision based on verified proof
                  </span>
                </li>
              </ol>
              <Link
                href="/lender"
                className="mt-8 block w-full rounded-lg border-2 border-blue-600 px-6 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Verify Borrower
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How Proofs Work */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-neutral-900 md:text-4xl">
              How Are Credit Factors Verified?
            </h2>
            <div className="card-shadow-lg rounded-2xl border border-amber-200 bg-amber-50 p-8">
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-amber-900">
                  <span>🔐</span> Proof-Based Verification
                </h3>
                <p className="text-neutral-700">
                  In production, credit factors are <strong>automatically derived from verified proofs</strong>, not manually entered. This prevents fraud and ensures accuracy.
                </p>
              </div>

              <div className="space-y-4 text-sm text-neutral-700">
                <div className="rounded-lg bg-white p-4">
                  <strong className="text-blue-600">Income Stability:</strong>
                  <ul className="ml-4 mt-2 list-disc space-y-1">
                    <li>Verified via on-chain transaction history (stablecoin receipts)</li>
                    <li>Bank statement APIs (Plaid integration)</li>
                    <li>Zero-knowledge proofs of income without revealing amounts</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-white p-4">
                  <strong className="text-green-600">Repayment Consistency:</strong>
                  <ul className="ml-4 mt-2 list-disc space-y-1">
                    <li>DeFi loan repayment history (Aave, Compound)</li>
                    <li>Rent payment attestations from landlords</li>
                    <li>Utility bill payment verification</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-white p-4">
                  <strong className="text-yellow-600">Savings Rate:</strong>
                  <ul className="ml-4 mt-2 list-disc space-y-1">
                    <li>Wallet balance growth over time</li>
                    <li>Staking positions and yield farming history</li>
                    <li>Verified savings account trends (ZK proofs)</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-white p-4">
                  <strong className="text-purple-600">Community Trust:</strong>
                  <ul className="ml-4 mt-2 list-disc space-y-1">
                    <li>DAO governance participation tokens</li>
                    <li>Peer endorsement NFTs</li>
                    <li>Professional attestations (LinkedIn, GitHub)</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-neutral-900 p-4 text-white">
                <strong>⚠️ Demo Mode:</strong> The current UI allows manual slider adjustment for demonstration purposes. In production, lenders verify proofs against on-chain data and off-chain attestations before making lending decisions.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="section-padding gradient-primary text-white">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Your Privacy Is Guaranteed
            </h2>
            <p className="mb-8 text-lg text-blue-50">
              Only your score bucket (e.g., 650-749) is visible on-chain. Your exact score remains private. You control what lenders see through selective disclosure.
            </p>
            <div className="grid gap-6 text-left sm:grid-cols-3">
              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-2 text-2xl font-bold">Hashed</div>
                <div className="text-sm text-blue-100">
                  Your exact score is cryptographically hashed on-chain
                </div>
              </div>
              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-2 text-2xl font-bold">Bucketed</div>
                <div className="text-sm text-blue-100">
                  Lenders see only your range (0-4 buckets), not exact number
                </div>
              </div>
              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-2 text-2xl font-bold">Controlled</div>
                <div className="text-sm text-blue-100">
                  You decide what to reveal via smart contract permissions
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="card-shadow-lg mx-auto max-w-3xl rounded-2xl bg-neutral-900 p-12 text-center text-white">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Build Your Credit Score?
            </h2>
            <p className="mb-8 text-lg text-neutral-300">
              Join thousands using AtlasCred to access credit opportunities previously unavailable to them.
            </p>
            <Link
              href="/borrower"
              className="inline-block rounded-lg bg-blue-600 px-10 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
            >
              Calculate Your Score Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
