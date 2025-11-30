"use client";

import { useState } from "react";
import Link from "next/link";
import { Toast } from "./Toast";
import { LenderDataAccess } from "./LenderDataAccess";

const LENDER_MEME_MESSAGES = [
  "🕵️ CSI: Blockchain Edition - Investigating...",
  "🔍 Sherlock Holmes mode activated!",
  "🎯 Trust but verify... We're on the verify part!",
  "🚀 Checking if this borrower is legit or sus...",
  "💎 Finding diamonds in the blockchain rough...",
  "🦸 Zero-Knowledge Detective at your service!",
  "⚡ Faster than a credit check, safer than a bank!",
];

export function LenderPage() {
  const [searchType, setSearchType] = useState<"wallet" | "capsule">("capsule");
  const [searchValue, setSearchValue] = useState("");
  const [baseToken, setBaseToken] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("error");
  const [showToast, setShowToast] = useState(false);
  const [memeMessage] = useState(LENDER_MEME_MESSAGES[Math.floor(Math.random() * LENDER_MEME_MESSAGES.length)]);

  const showToastMessage = (message: string, type: "success" | "error" | "warning" | "info" = "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const validateInput = (value: string, type: "wallet" | "capsule"): boolean => {
    if (!value || value.trim().length === 0) {
      showToastMessage(`⚠️ ${type === "wallet" ? "Wallet address" : "Proof ID"} is required`, "error");
      return false;
    }

    if (type === "capsule") {
      if (value.length < 10) {
        showToastMessage("⚠️ Proof ID is too short. Enter a valid proof ID", "error");
        return false;
      }
    }

    return true;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input format
    if (!validateInput(searchValue, searchType)) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      // Wallet verification removed: lender does not need to connect or validate wallet.

      // Proceed with proof verification with two-token system
      showToastMessage("🔍 Verifying zero-knowledge proof...", "info");
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';
      const url = new URL(`${API_BASE}/verify/${encodeURIComponent(searchValue)}`);
      if (baseToken && baseToken.trim().length > 0) {
        url.searchParams.append('baseToken', baseToken.trim());
      }
      if (documentNumber && documentNumber.trim().length > 0) {
        url.searchParams.append('documentNumber', documentNumber.trim());
      }
      
      console.log("📤 Verification request URL:", url.toString());
      console.log("📄 Document number sent:", documentNumber.trim());
      
      const response = await fetch(url.toString());
      
      console.log("📥 Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log("❌ Error response:", errorData);
        const errorMsg = errorData.message || 'Score not found';
        setError(errorMsg);
        showToastMessage(`❌ ${errorMsg}`, "error");
        setIsSearching(false);
        return;
      }

      const data = await response.json();
      console.log("✅ Success response:", data);
      setResult(data);
      showToastMessage("✅ Borrower verified successfully!", "success");
    } catch (err) {
      const errorMsg = (err as Error).message || 'Failed to verify borrower. Please check the ID and try again.';
      setError(errorMsg);
      showToastMessage(`❌ ${errorMsg}`, "error");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-white/20">
        <div className="container-custom flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:scale-105 smooth-transition">
            AtlasCred
          </Link>
          <Link
            href="/borrower"
            className="rounded-xl border border-blue-200 bg-white/50 px-5 py-2.5 text-sm font-semibold text-blue-700 backdrop-blur-sm hover:bg-blue-50 hover:shadow-lg smooth-transition"
          >
            Borrower Portal →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="section-padding">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl">
            {/* Page Header - Compact */}
            <div className="mb-6 text-center">
              <div className="mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                🔍 Lender Verification Portal
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                Verify Borrower <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Credit</span>
              </h1>
              <p className="text-sm text-neutral-600">
                Privacy-preserving verification with zero-knowledge proofs
              </p>
            </div>

            {/* Search Card - Compact */}
            <form onSubmit={handleSearch} className="glass-card mb-6 rounded-2xl border border-neutral-200 p-6 shadow-xl md:p-8">
              {/* Search Type Toggle - Compact */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-neutral-900">
                  🔎 Search By
                </label>
                <div className="inline-flex rounded-xl border-2 border-neutral-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setSearchType("capsule")}
                    className={`rounded-lg px-6 py-2 text-sm font-bold smooth-transition ${
                      searchType === "capsule"
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    📝 Proof ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType("wallet")}
                    className={`rounded-lg px-6 py-2 text-sm font-bold smooth-transition ${
                      searchType === "wallet"
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    👛 Wallet Address
                  </button>
                </div>
              </div>

              {/* Search Input - Compact */}
              <div className="mb-6">
                <label htmlFor="search" className="mb-2 block text-sm font-semibold text-neutral-900">
                  {searchType === "capsule" ? "🔐 Proof ID" : "👛 Midnight Wallet Address"}
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  disabled={isSearching}
                  placeholder={searchType === "capsule" ? "midnight-proof-abc-123..." : "midnight1... (wallet address, optional)"}
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm smooth-transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-neutral-50 disabled:opacity-60"
                  required
                />
              </div>

              {/* Base Token Input - NEW */}
              <div className="mb-6">
                <label htmlFor="baseToken" className="mb-2 block text-sm font-semibold text-neutral-900">
                  🔑 Base Token
                </label>
                <input
                  id="baseToken"
                  type="text"
                  value={baseToken}
                  onChange={(e) => setBaseToken(e.target.value)}
                  disabled={isSearching}
                  placeholder="Ask borrower for their base token"
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm smooth-transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-neutral-50 disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-neutral-600">Example: addr1qxy-k4j8n9m-1703567890</p>
              </div>

              {/* Document Number Input - NEW */}
              <div className="mb-6">
                <label htmlFor="documentNumber" className="mb-2 block text-sm font-semibold text-neutral-900">
                  📄 Borrower's Document Number
                </label>
                <input
                  id="documentNumber"
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  disabled={isSearching}
                  placeholder="Ask borrower for their document number"
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm smooth-transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-neutral-50 disabled:opacity-60"
                />
                <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                  <div className="flex items-start gap-2">
                    <span>🔒</span>
                    <div>
                      <p className="font-semibold">Two-Token Anti-Fraud Verification</p>
                      <p className="mt-1">Ask the borrower for BOTH their <strong>base token</strong> AND <strong>document number</strong>. Both must match to access the score. This cryptographic hash system prevents borrowers from sharing proofs with friends.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button with Meme Loader */}
              <button
                type="submit"
                disabled={isSearching || !searchValue}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-base font-bold text-white shadow-lg smooth-transition hover:shadow-xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-90 disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSearching ? (
                    <>
                      <span className="text-2xl animate-bounce">🕵️</span>
                      <span className="text-sm">Investigating... Trust but verify!</span>
                    </>
                  ) : (
                    <>
                      🔍 Verify Borrower Now
                      <span className="inline-block smooth-transition group-hover:translate-x-1">→</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 opacity-0 smooth-transition group-hover:opacity-100"></div>
              </button>
              
              {/* Toast Notification */}
              <Toast
                message={toastMessage}
                type={toastType}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
              />

              {/* Meme Loading Animation */}
              {isSearching && (
                <div className="mt-6 overflow-hidden rounded-xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6 shadow-lg">
                  <div className="text-center space-y-3">
                    <div className="text-5xl animate-bounce">{['🕵️', '🔍', '💎', '⚡', '🎯'][Math.floor(Math.random() * 5)]}</div>
                    <p className="text-xl font-bold text-neutral-900 animate-pulse">
                      {memeMessage}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
                      <span className="inline-block h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                      <span className="animate-pulse">Verifying zero-knowledge proof...</span>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Error State */}
            {error && !isSearching && (
              <div className="glass-card hover-lift mb-8 overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-red-900">
                      {error.includes('Document number') ? '🚫 NOT A VALID USER' : 'Verification Failed'}
                    </h3>
                    <p className="text-sm leading-relaxed text-red-800 font-semibold">{error}</p>
                    {error.includes('Document number') ? (
                      <div className="mt-4 rounded-lg bg-red-200 p-3 text-xs text-red-900">
                        <p className="font-bold mb-1">⚠️ SECURITY WARNING:</p>
                        <p>This borrower is trying to use someone else's credit score proof. The document number provided does not match the proof. <strong>DO NOT LEND TO THIS PERSON.</strong></p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-red-700">Please check the {searchType === "wallet" ? "wallet address" : "proof ID"} and document number, then try again.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <>
                <VerificationResult result={result} />
                {/* Locked Borrower Data - Requires 5 DUST Payment */}
                <LenderDataAccess proofId={result.proofId || result.contractAddress || 'proof-id'} />
              </>
            )}

            {/* How It Works */}
            <div className="card-shadow rounded-xl border border-neutral-200 bg-white p-8">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900">
                How Zero-Knowledge Verification Works
              </h3>
              <ol className="space-y-3 text-sm text-neutral-700">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                    1
                  </span>
                  <span>
                    Request the borrower's <strong>Proof ID</strong> or <strong>Wallet Address</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                    2
                  </span>
                  <span>
                    Our system queries Midnight blockchain's ZK circuit to verify the proof
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                    3
                  </span>
                  <span>
                    You see the borrower's <strong>score bucket</strong> (e.g., 650-749), not their exact score
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                    4
                  </span>
                  <span>
                    Make lending decisions based on zero-knowledge proof (exact score never revealed)
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function VerificationResult({ result }: { result: any }) {
  const getBucketColor = (bucket: number) => {
    if (bucket >= 4) return "from-green-50 to-green-100/50";
    if (bucket >= 3) return "from-green-50 to-green-100/50";
    if (bucket >= 2) return "from-yellow-50 to-yellow-100/50";
    if (bucket >= 1) return "from-orange-50 to-orange-100/50";
    return "from-red-50 to-red-100/50";
  };

  const getScoreGradient = (bucket: number) => {
    if (bucket >= 4) return "from-green-600 to-green-700";
    if (bucket >= 3) return "from-green-500 to-green-600";
    if (bucket >= 2) return "from-yellow-500 to-yellow-600";
    if (bucket >= 1) return "from-orange-500 to-orange-600";
    return "from-red-500 to-red-600";
  };

  const getRiskLevel = (bucket: number) => {
    if (bucket >= 4) return { label: "Excellent Credit", color: "text-green-600", icon: "🌟" };
    if (bucket >= 3) return { label: "Very Good Credit", color: "text-green-500", icon: "✅" };
    if (bucket >= 2) return { label: "Fair Credit", color: "text-yellow-600", icon: "⚠️" };
    if (bucket >= 1) return { label: "Moderate Risk", color: "text-orange-600", icon: "⚡" };
    return { label: "High Risk", color: "text-red-600", icon: "🚫" };
  };

  const risk = getRiskLevel(result.scoreBucket);

  // Mock financial data for lender view (in production, comes from backend)
  const borrowerData = {
    totalLoans: 3,
    activeLoans: 1,
    completedLoans: 2,
    totalBorrowed: 125000,
    totalRepaid: 98000,
    onTimePayments: 28,
    latePayments: 2,
    missedPayments: 0,
    avgRepaymentDays: 28,
    creditUtilization: 42,
    accountAge: 24,
    documentCount: result.documentCount || 0,
    hasDocuments: result.hasDocuments || false
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Success Banner with Wallet Verification */}
      <div className="space-y-3">
        <div className="glass-card hover-lift overflow-hidden rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-bold text-green-900">Zero-Knowledge Proof Verified ✓</h3>
              <p className="text-sm text-green-800 leading-relaxed">
                Borrower's credit score verified via Midnight blockchain with complete privacy protection
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
                <span className="font-mono bg-green-100 px-2 py-1 rounded">
                  {result.walletAddress ? `${result.walletAddress.slice(0, 12)}...${result.walletAddress.slice(-8)}` : 'Wallet Address'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Number Verification Badge - NEW */}
        {result.documentNumberRequired && (
          result.documentNumberVerified ? (
            <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                  <span className="text-xl">✅</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Document Number Verified</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    The document number you provided matches. This borrower legitimately owns this credit score proof.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
                  <span className="text-xl">❌</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-900">Document Number Mismatch</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    The document number you provided does NOT match. This borrower may be using someone else's proof. Proceed with caution!
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* Wallet Ownership Verification Badge */}
        {result.signatureVerified ? (
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <span className="text-xl">🔐</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900">Wallet Ownership Verified</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Borrower cryptographically signed with their {result.walletName || 'Cardano'} wallet. This proof cannot be forged.
                </p>
                {result.walletSignature && (
                  <div className="mt-3 space-y-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer font-semibold text-blue-800 hover:text-blue-600">
                        🔍 Verify Signature Details
                      </summary>
                      <div className="mt-2 rounded-lg bg-white/70 p-3 space-y-1.5">
                        <div>
                          <span className="font-semibold text-neutral-700">Signed Wallet:</span>
                          <span className="ml-2 font-mono text-neutral-600 text-[10px] break-all">{result.walletAddress}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-700">Method:</span>
                          <span className="ml-2 text-neutral-600">{result.signatureMethod || 'cryptographic_signature'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-700">Wallet App:</span>
                          <span className="ml-2 text-neutral-600">{result.walletName || 'Cardano Wallet'}</span>
                        </div>
                        {result.signatureTimestamp && (
                          <div>
                            <span className="font-semibold text-neutral-700">Signed At:</span>
                            <span className="ml-2 text-neutral-600">{new Date(result.signatureTimestamp).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </details>
                    <div className="rounded-lg bg-blue-100 p-2.5 text-xs text-blue-900">
                      <p className="font-semibold mb-1">💡 Verify This is NOT a Stolen Proof:</p>
                      <p>Ask the borrower to <strong>show their connected wallet</strong> in Lace/Eternl/Nami extension. The address should match: <span className="font-mono font-bold">{result.walletAddress?.slice(0,12)}...{result.walletAddress?.slice(-8)}</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 shadow-md">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">No Wallet Signature</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Legacy proof without cryptographic signature. Verify wallet ownership through other means.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score Bucket Card - Large */}
      <div className={`glass-card hover-lift overflow-hidden rounded-3xl border-2 bg-gradient-to-br ${getBucketColor(result.scoreBucket)} shadow-2xl`}>
        <div className="p-12 text-center">
          <div className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-600">
            Credit Score Range (Public)
          </div>
          <div className={`mb-4 bg-gradient-to-r ${getScoreGradient(result.scoreBucket)} bg-clip-text text-8xl font-black text-transparent`}>
            {result.bucketRange}
          </div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">{risk.icon}</span>
            <div className={`text-2xl font-bold ${risk.color}`}>
              {risk.label}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-neutral-600">Verified on Midnight</span>
            </div>
            {borrowerData.hasDocuments && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-neutral-600">{borrowerData.documentCount} Docs Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Borrower Profile is now in LenderDataAccess component (requires 5 DUST payment) - see below */}

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Borrower Info */}
        <div className="card-shadow rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">
            Borrower Information
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="mb-1 text-xs font-medium text-neutral-600">Wallet Address</div>
              <div className="truncate font-mono text-xs text-neutral-900">
                {result.walletAddress}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-neutral-600">Proof ID</div>
              <div className="font-mono text-xs text-neutral-900">
                {result.proofId}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-neutral-600">Score Bucket (Public)</div>
              <div className="font-semibold text-blue-600">
                Bucket {result.scoreBucket} ({result.bucketRange})
              </div>
            </div>
          </div>
        </div>

        {/* On-Chain Verification */}
        <div className="card-shadow rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">
            Zero-Knowledge Proof Details
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="mb-1 text-xs font-medium text-neutral-600">Contract Address</div>
              <div className="truncate font-mono text-xs text-neutral-900">
                {result.contractAddress}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-neutral-600">Proof Status</div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="font-semibold text-green-600">Verified on Midnight</span>
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-neutral-600">Expires</div>
              <div className={result.isExpired ? "text-red-600 font-semibold" : "text-neutral-900"}>
                {new Date(result.expiresAt).toLocaleDateString()}
                {result.isExpired && " (Expired)"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="card-shadow rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 text-sm font-semibold text-blue-900">
          Zero-Knowledge Privacy Guarantee
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            ✓ You are seeing the borrower's <strong>score bucket</strong> ({result.bucketRange}), not their exact score
          </p>
          <p>
            ✓ The exact score is stored in <strong>Midnight private state</strong> and cannot be revealed
          </p>
          <p>
            ✓ This verification uses <strong>zero-knowledge circuits</strong> that prove facts without exposing data
          </p>
          <p>
            ✓ The borrower controls all permissions and can revoke the proof at any time
          </p>
        </div>
      </div>

      {/* Lending Recommendations */}
      <div className="card-shadow-lg rounded-xl border border-neutral-200 bg-white p-8">
        <h3 className="mb-4 text-xl font-semibold text-neutral-900">
          Lending Recommendations
        </h3>
        {result.scoreBucket >= 3 ? (
          <div className="space-y-3 text-sm text-neutral-700">
            <p className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Low Risk:</strong> Borrower has demonstrated strong creditworthiness
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                Recommended for standard loan products with competitive interest rates
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                Consider higher loan amounts based on your internal risk assessment
              </span>
            </p>
          </div>
        ) : result.scoreBucket >= 2 ? (
          <div className="space-y-3 text-sm text-neutral-700">
            <p className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>Moderate Risk:</strong> Borrower shows fair creditworthiness
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                Consider for smaller loan amounts or secured lending products
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                May require additional verification or collateral
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-neutral-700">
            <p className="flex items-start gap-2">
              <span className="text-orange-600">⚠</span>
              <span>
                <strong>Higher Risk:</strong> Exercise caution with this borrower
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-orange-600">⚠</span>
              <span>
                Consider micro-loans, shorter terms, or secured products only
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-orange-600">⚠</span>
              <span>
                Additional due diligence strongly recommended
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
