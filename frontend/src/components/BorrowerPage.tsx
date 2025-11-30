"use client";

import { useState,useEffect } from "react";
import { useScoreSession } from "@/hooks/useScoreSession";
import Link from "next/link";
import { DocumentVerification, type VerifiedDocument } from "./DocumentVerification";
import { Toast } from "./Toast";
import { ScoreEnhancement } from "./ScoreEnhancement";
import "@midnight-ntwrk/dapp-connector-api"; // Official Midnight wallet connector (provides Window types)

// Helper to convert string to hex
const Buffer = {
  from: (str: string) => ({
    toString: (encoding: string) => {
      if (encoding === 'hex') {
        return Array.from(str)
          .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('');
      }
      return str;
    }
  })
};

// Helper to decode Midnight address from wallet API response
const decodeAddress = (addressData: any): string => {
  try {
    let hexAddress: string;
    
    // Handle different wallet API response formats
    if (typeof addressData === 'string') {
      hexAddress = addressData;
    } else if (addressData && typeof addressData.to_hex === 'function') {
      // Wallet API returns object with to_hex() method
      hexAddress = addressData.to_hex();
    } else if (addressData && typeof addressData.to_bech32 === 'function') {
      // Some wallets return bech32 directly
      return addressData.to_bech32();
    } else if (addressData && addressData.address) {
      // Nested address property
      hexAddress = addressData.address;
    } else {
      console.warn("⚠️ Unknown address format:", addressData);
      return String(addressData);
    }
    
    // If already in bech32 format (starts with midnight1 or midnight_test1), return as-is
    if (hexAddress.startsWith('midnight1') || hexAddress.startsWith('midnight_test1')) {
      return hexAddress;
    }
    
    // If it's hex, return as-is - Midnight backend handles hex addresses
    // In production, you'd use Midnight SDK for address encoding
    console.log("ℹ️ Midnight address in hex format:", hexAddress);
    return hexAddress;
  } catch (error) {
    console.error("Failed to decode Midnight address:", error);
    return String(addressData);
  }
};

const DEFAULT_PROOFS = [
  { id: "income", hash: "0xabc", expiresAt: new Date(Date.now() + 86400000).toISOString() },
  { id: "repayment", hash: "0xdef", expiresAt: new Date(Date.now() + 172800000).toISOString() }
];

const MEME_MESSAGES = [
  "😅 Tired of getting rejected? Not anymore!",
  "🎲 Rolling dice... Banks hate this ONE trick!",
  "🚀 Your credit score is about to go BRRRR...",
  "💸 Making traditional banks nervous...",
  "🔥 Plot twist: You don't need a bank anymore!",
  "⚡ Calculating faster than a bank can say 'denied'",
  "🎯 Zero-knowledge magic in progress...",
  "🦄 Unicorn-level credit scoring happening...",
];

// Hash function for document verification
const generateHash = async (baseToken: string, documentNumber: string): Promise<string> => {
  const data = `${baseToken}-${documentNumber}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function BorrowerPage() {
  const { aggregates, setAggregate, submit, status, result, reset } = useScoreSession();
  const [wallet, setWallet] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletSignature, setWalletSignature] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [baseToken, setBaseToken] = useState("");
  const [verificationHash, setVerificationHash] = useState("");
  const [step, setStep] = useState<"form" | "result">("form");
  const [verifiedDocuments, setVerifiedDocuments] = useState<VerifiedDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("error");
  const [showToast, setShowToast] = useState(false);
  const [memeMessage] = useState(MEME_MESSAGES[Math.floor(Math.random() * MEME_MESSAGES.length)]);

  const showToastMessage = (message: string, type: "success" | "error" | "warning" | "info" = "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

useEffect(() => {
    console.log("🔄 Score state changed:", { step, status, hasResult: !!result });
    
    if (step === "form" && status === "scored" && result) {
      console.log("✅ Score ready! Transitioning to result screen...");
      setIsSubmitting(false);
      
      const timer = setTimeout(() => {
        console.log("🎯 Setting step to result");
        setStep("result");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [status, result, step]);

  useEffect(() => {
    if (step === "form" && status === "error") {
      console.error("❌ Score calculation error detected");
      setIsSubmitting(false);
    }
  }, [status, step]);

  const generateTokens = async () => {
    if (!documentNumber || documentNumber.trim().length === 0) {
      showToastMessage("⚠️ Please enter a document number first", "warning");
      return;
    }
    if (!walletConnected) {
      showToastMessage("⚠️ Please connect your wallet first", "warning");
      return;
    }

    // Generate base token (random + timestamp)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const base = `${wallet.substring(0, 8)}-${random}-${timestamp}`;
    setBaseToken(base);

    // Generate verification hash: hash(baseToken + documentNumber)
    const hash = await generateHash(base, documentNumber.trim());
    setVerificationHash(hash);

    showToastMessage(`✅ Tokens generated! Base token: ${base.substring(0, 20)}...`, "success");
  };

  const validateWallet = (address: string): boolean => {
    // Wallet is already verified via Midnight Lace enable() authorization
    // Just check it's not empty
    if (!address || address.trim().length === 0) {
      showToastMessage("⚠️ Wallet address is required", "error");
      return false;
    }
    
    // Accept any format from wallet API - it's already validated by Midnight
    return true;
  };

  const connectWallet = async () => {
    try {
      console.log("🔍 Checking for Midnight wallet...");
      console.log("window.midnight exists?", typeof window !== 'undefined' && !!window.midnight);
      
      // CRITICAL: Check if Midnight wallet extension exists
      if (typeof window === 'undefined' || !window.midnight) {
        showToastMessage("❌ Midnight Lace wallet not found. Please install it from midnight.network", "error");
        console.error("💡 Download Midnight Lace: https://midnight.network/lace");
        console.error("🔍 Debug: window object keys:", typeof window !== 'undefined' ? Object.keys(window).filter(k => k.toLowerCase().includes('midnight') || k.toLowerCase().includes('lace')) : 'window undefined');
        return;
      }

      console.log("✅ window.midnight found");
      console.log("🔍 window.midnight properties:", Object.keys(window.midnight));
      console.log("🔍 window.midnight.mnLace exists?", !!window.midnight.mnLace);

      let walletApi = null;
      let detectedWalletName = "";
      
      // Try Midnight Lace wallet (official API: window.midnight.mnLace)
      if (!window.midnight.mnLace) {
        showToastMessage("❌ Midnight Lace wallet not found. Please ensure the extension is installed and enabled.", "error");
        console.error("❌ window.midnight.mnLace is not available");
        return;
      }

      detectedWalletName = "Midnight Lace";
      showToastMessage("🌙 Connecting to Midnight Lace wallet...", "info");
      console.log("📞 Calling window.midnight.mnLace.enable()...");
      
      walletApi = await window.midnight.mnLace.enable();
      
      if (!walletApi) {
        showToastMessage("❌ Failed to connect to Midnight wallet. Please unlock your wallet and try again.", "error");
        console.error("❌ walletApi is null after calling enable()");
        return;
      }
      
      console.log("✅ enable() returned:", !!walletApi, "Type:", typeof walletApi);

      console.log("✅ Wallet connected:", detectedWalletName);
      console.log("📦 Wallet API methods:", Object.keys(walletApi));
      console.log("📦 Full wallet API:", walletApi);
      setWalletName(detectedWalletName);
      showToastMessage(`✅ ${detectedWalletName} wallet authorized!`, "success");

      // Give user a moment to see authorization success
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get wallet state (includes address, balance, etc.)
      let walletAddressFromExtension = "";
      
      try {
        // Official Midnight API: call state() method to get wallet state
        console.log("📞 Calling api.state()...");
        const walletState = await walletApi.state();
        console.log("📦 Wallet state:", walletState);
        
        // Extract address from state
        if (walletState && walletState.address) {
          walletAddressFromExtension = walletState.address;
          console.log("✅ Address from wallet state:", walletAddressFromExtension);
        } else {
          console.error("❌ No address in wallet state:", walletState);
        }
      } catch (addrError) {
        console.error("❌ Failed to get wallet state:", addrError);
      }

      // Wallet address is required
      if (!walletAddressFromExtension) {
        showToastMessage("❌ Could not get address from wallet. Please unlock your wallet and try again.", "error");
        return;
      }

      // Decode address if needed
      const decodedAddress = decodeAddress(walletAddressFromExtension);
      setWallet(decodedAddress);
      console.log("📍 Wallet address set:", {
        original: walletAddressFromExtension,
        decoded: decodedAddress
      });

      // Create timestamp-based proof of wallet connection
      const timestamp = Date.now();
      const message = `AtlasCred Credit Score Request\nWallet: ${walletAddressFromExtension}\nTimestamp: ${timestamp}`;

      console.log("📝 Creating wallet proof:", message);

      // Create cryptographic signature for additional security
      // Note: Midnight wallet API doesn't currently expose signData in DAppConnectorWalletAPI
      // The wallet authorization via enable() is sufficient proof of ownership
      let signedData = null;
      const walletApiAny = walletApi as any;
      
      try {
        if (typeof walletApiAny.signData === 'function') {
          showToastMessage(`✍️ Please sign in your ${detectedWalletName} wallet...`, "info");
          const messageHex = Buffer.from(message).toString('hex');
          signedData = await walletApiAny.signData(walletAddressFromExtension, messageHex);
          console.log("✅ Signature received");
        } else {
          console.log("ℹ️ Wallet doesn't support signData method. Using wallet authorization as proof.");
        }
      } catch (signError) {
        console.warn("⚠️ Could not get signature (this is OK):", signError);
        // Continue without signature - wallet authorization via enable() is enough proof
      }

      // Create signature/proof object
      const signature = JSON.stringify({
        signature: signedData?.signature || "wallet_authorized",
        key: signedData?.key || walletAddressFromExtension,
        message: message,
        timestamp: timestamp,
        walletName: detectedWalletName,
        walletAddress: walletAddressFromExtension,
        method: signedData ? "cryptographic_signature" : "wallet_authorization"
      });

      setWalletSignature(signature);
      setWalletConnected(true);
      console.log("✅ Wallet signature stored:", signature.substring(0, 100) + "...");
      showToastMessage(`✅ ${detectedWalletName} wallet connected!`, "success");
    } catch (error) {
      console.error("❌ Wallet connection error:", error);
      if (error instanceof Error) {
        if (error.message.includes("user declined") || error.message.includes("cancelled")) {
          showToastMessage("❌ You cancelled. Please authorize your wallet to continue.", "error");
        } else if (error.message.includes("not enabled")) {
          showToastMessage("❌ Wallet not authorized. Please click 'Authorize' in your wallet.", "error");
        } else {
          showToastMessage(`❌ Wallet error: ${error.message}`, "error");
        }
      } else {
        showToastMessage("❌ Unknown wallet error. Check console for details.", "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent double submissions
    if (isSubmitting) {
      console.warn("⏳ Already submitting, ignoring duplicate click");
      return;
    }
    
    // Validate wallet address format
    if (!validateWallet(wallet)) {
      return;
    }

    setIsSubmitting(true);
    // Fallback: if result doesn't arrive within 10s, stop spinner and show error
    const submitTimeout = setTimeout(() => {
      if (step === "form" && status !== "scored") {
        console.error("⏲️ Score calculation timed out");
        showToastMessage("⏲️ Score calculation is taking too long. Please try again.", "error");
        setIsSubmitting(false);
      }
    }, 10000);

    try {
      // Midnight wallet is already verified via enable() authorization
      // No need for additional blockchain verification
      showToastMessage("🔍 Preparing score calculation...", "info");
      
      console.log("🔍 Wallet address for score calculation:", wallet);
      console.log("🔍 Wallet address type:", typeof wallet);
      console.log("🔍 Wallet address length:", wallet?.length);

      // SECURITY: Verify wallet signature exists
      console.log("🔍 Checking wallet signature:", {
        hasSignature: !!walletSignature,
        walletConnected: walletConnected,
        wallet: wallet
      });
      
      if (!walletSignature) {
        showToastMessage("❌ Please connect your wallet first.", "error");
        setIsSubmitting(false);
        return;
      }

      // SECURITY: Verify document number exists
      if (!documentNumber || documentNumber.trim().length === 0) {
        showToastMessage("❌ Please enter your document number (ID/Passport).", "error");
        setIsSubmitting(false);
        return;
      }

      // SECURITY: Verify tokens are generated
      if (!baseToken || !verificationHash) {
        showToastMessage("❌ Please generate verification tokens first.", "error");
        setIsSubmitting(false);
        return;
      }

      // Wallet verified and signed, proceed with score calculation
      showToastMessage("🔄 Calculating your credit score...", "info");
      
      console.log("📤 Sending score request with signature");
      console.log("🔍 API Base URL:", process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000');
      
      // Add signature, base token, and verification hash to the request
      const scorePayload = {
        walletAddress: wallet, 
        proofs: DEFAULT_PROOFS,
        verifiedDocuments,
        walletSignature: walletSignature,
        baseToken: baseToken,
        verificationHash: verificationHash
      };
      
      console.log("📦 Score payload:", {
        walletAddress: scorePayload.walletAddress,
        hasSignature: !!scorePayload.walletSignature,
        signatureLength: scorePayload.walletSignature?.length,
        baseToken: scorePayload.baseToken?.substring(0, 20) + '...',
        verificationHash: scorePayload.verificationHash?.substring(0, 16) + '...',
        aggregates: aggregates
      });

      await submit(scorePayload);
      console.log("✅ Submit completed, status:", status);
      
      // Stream is now active, result will come via callback
      // Don't set isSubmitting to false yet - wait for result
      console.log("⏳ Waiting for score stream...");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to calculate score";
      console.error("❌ Score submission error:", error);
      showToastMessage(`❌ ${errorMessage}`, "error");
      setIsSubmitting(false);
    }
    // Clear timeout when component unmounts or next submit
    return () => clearTimeout(submitTimeout);
  };

  const handleReset = () => {
    reset(); // Clear session state
    setStep("form"); // Go back to form
    setIsSubmitting(false); // Reset submit state
  };

  if (step === "result" && result) {
    return <ScoreResult result={result} baseToken={baseToken} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-white/20">
        <div className="container-custom flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:scale-105 smooth-transition">
            AtlasCred
          </Link>
          <Link
            href="/lender"
            className="rounded-xl border border-blue-200 bg-white/50 px-5 py-2.5 text-sm font-semibold text-blue-700 backdrop-blur-sm hover:bg-blue-50 hover:shadow-lg smooth-transition"
          >
            Lender Portal →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="section-padding">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl">
            {/* Page Header - Compact */}
            <div className="mb-6 text-center">
              <div className="mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                ✨ Zero-Knowledge Credit Scoring
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                Calculate Your <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Credit Score</span>
              </h1>
              <p className="text-sm text-neutral-600">
                100% free, no bank account required
              </p>
            </div>

            {/* Form Card - Compact */}
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 shadow-xl md:p-8">
              {/* Wallet Connection - OAuth Style */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-neutral-900">
                  🔐 Connect Your Wallet
                </label>
                
                {!walletConnected ? (
                  <div>
                    <button
                      type="button"
                      onClick={connectWallet}
                      disabled={isSubmitting}
                      className="group relative w-full overflow-hidden rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 text-left smooth-transition hover:border-blue-500 hover:shadow-lg disabled:opacity-60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                          <span className="text-2xl">👛</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-bold text-neutral-900">Connect Midnight Wallet</div>
                          <div className="text-xs text-neutral-600">Midnight Lace</div>
                        </div>
                        <div className="text-blue-600 smooth-transition group-hover:translate-x-1">→</div>
                      </div>
                    </button>
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                      <div className="flex items-start gap-2">
                        <span>ℹ️</span>
                        <div>
                          <p className="font-semibold">Secure OAuth-like Connection</p>
                          <p className="mt-1">Click to authorize AtlasCred. Your wallet will confirm the connection and you'll be asked to sign to prove ownership.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-bold text-neutral-900">{walletName} Wallet Connected</div>
                        <div className="mt-1 font-mono text-xs text-neutral-600 break-all">{wallet}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWalletConnected(false);
                          setWallet("");
                          setWalletSignature(null);
                          setWalletName("");
                          showToastMessage("Wallet disconnected", "info");
                        }}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Number & Token Generation - NEW */}
              <div className="mb-6">
                <label htmlFor="documentNumber" className="mb-2 block text-sm font-semibold text-neutral-900">
                  📄 Document Number (ID/Passport)
                </label>
                <input
                  id="documentNumber"
                  type="text"
                  value={documentNumber}
                  onChange={(e) => {
                    setDocumentNumber(e.target.value);
                    // Clear tokens when document changes
                    if (baseToken) {
                      setBaseToken("");
                      setVerificationHash("");
                    }
                  }}
                  disabled={status === "streaming" || isSubmitting}
                  placeholder="e.g., ID123456789 or PASSPORT-ABC123"
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm smooth-transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-neutral-50 disabled:opacity-60"
                  required
                />
                
                {/* Generate Token Button */}
                <button
                  type="button"
                  onClick={generateTokens}
                  disabled={!documentNumber || !walletConnected || status === "streaming" || isSubmitting}
                  className="mt-3 w-full rounded-xl border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 text-sm font-bold text-purple-900 smooth-transition hover:border-purple-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {baseToken ? "✅ Tokens Generated" : "🔐 Generate Verification Tokens"}
                </button>

                {/* Show Base Token if generated */}
                {baseToken && (
                  <div className="mt-3 rounded-lg border-2 border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-bold text-green-900 mb-2">📋 Your Base Token (Share with Lender):</p>
                    <div className="bg-white rounded p-2 font-mono text-xs text-neutral-900 break-all border border-green-300">
                      {baseToken}
                    </div>
                    <p className="text-xs text-green-700 mt-2">💡 Give this token to the lender along with your proof ID</p>
                  </div>
                )}

                <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                  <div className="flex items-start gap-2">
                    <span>🔒</span>
                    <div>
                      <p className="font-semibold">Two-Token Verification System</p>
                      <p className="mt-1">We generate a <strong>base token</strong> and a <strong>verification hash</strong>. The hash is created from: base token + document number. Lender must have BOTH to verify you.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Factors - Compact */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-bold text-neutral-900">
                  📊 Credit Factors
                </h3>

                <div className="space-y-4">
                  <SliderField
                    label="Income Stability"
                    description="Consistency of income over time"
                    weight="30%"
                    value={aggregates.incomeStability}
                    onChange={(v) => setAggregate("incomeStability", v)}
                    disabled={status === "streaming"}
                  />
                  <SliderField
                    label="Repayment Consistency"
                    description="History of meeting financial obligations"
                    weight="35%"
                    value={aggregates.repaymentConsistency}
                    onChange={(v) => setAggregate("repaymentConsistency", v)}
                    disabled={status === "streaming"}
                  />
                  <SliderField
                    label="Savings Rate"
                    description="Ability to save relative to income"
                    weight="20%"
                    value={aggregates.savingsRate}
                    onChange={(v) => setAggregate("savingsRate", v)}
                    disabled={status === "streaming"}
                  />
                  <SliderField
                    label="Community Trust"
                    description="Reputation from peer endorsements"
                    weight="15%"
                    value={aggregates.communityTrust}
                    onChange={(v) => setAggregate("communityTrust", v)}
                    disabled={status === "streaming"}
                  />
                </div>
              </div>

              {/* Document Verification - Compact */}
              <div className="mb-6">
                <DocumentVerification 
                  onDocumentsChange={setVerifiedDocuments}
                />
              </div>

              {/* Submit Button with Meme Loader */}
              <button
                type="submit"
                disabled={status === "streaming" || isSubmitting}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-base font-bold text-white shadow-lg smooth-transition hover:shadow-xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-90 disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {status === "streaming" || isSubmitting ? (
                    <>
                      <span className="text-2xl animate-bounce">🎲</span>
                      <span className="text-sm">Rolling the dice... Banks hate this!</span>
                    </>
                  ) : (
                    <>
                      Calculate Score FREE 🚀
                      <span className="inline-block smooth-transition group-hover:translate-x-1">→</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 smooth-transition group-hover:opacity-100"></div>
              </button>
              
              {/* Toast Notification */}
              <Toast
                message={toastMessage}
                type={toastType}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
              />

              {/* Meme Loading Animation */}
              {(status === "streaming" || isSubmitting) && (
                <div className="mt-6 overflow-hidden rounded-xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6 shadow-lg">
                  <div className="text-center space-y-3">
                    <div className="text-5xl animate-bounce">{['🎲', '🚀', '💸', '⚡', '🔥'][Math.floor(Math.random() * 5)]}</div>
                    <p className="text-xl font-bold text-neutral-900 animate-pulse">
                      {memeMessage}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
                      <span className="inline-block h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                      <span className="animate-pulse">Crunching numbers with ZK magic...</span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function SliderField({
  label,
  description,
  weight,
  value,
  onChange,
  disabled
}: {
  label: string;
  description: string;
  weight: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="group rounded-2xl border-2 border-neutral-100 bg-white p-5 smooth-transition hover:border-blue-200 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-bold text-neutral-900">{label}</label>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gradient-to-r from-blue-100 to-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {weight}
          </span>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {Math.round(value * 100)}%
          </span>
        </div>
      </div>
      <p className="mb-4 text-xs text-neutral-500">{description}</p>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value * 100}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          disabled={disabled}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-neutral-200 smooth-transition hover:bg-neutral-300 disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-600 [&::-webkit-slider-thumb]:to-blue-700 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:smooth-transition [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, #0066ff 0%, #0066ff ${value * 100}%, #e5e5e5 ${value * 100}%, #e5e5e5 100%)`
          }}
        />
      </div>
    </div>
  );
}

function ScoreResult({ result, baseToken, onReset }: { result: any; baseToken: string; onReset: () => void }) {
  const getScoreColor = (score: number) => {
    if (score >= 850) return "from-green-600 to-green-700";
    if (score >= 750) return "from-green-500 to-green-600";
    if (score >= 650) return "from-yellow-500 to-yellow-600";
    if (score >= 500) return "from-orange-500 to-orange-600";
    return "from-red-500 to-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 850) return "from-green-50 to-green-100/50";
    if (score >= 750) return "from-green-50 to-green-100/50";
    if (score >= 650) return "from-yellow-50 to-yellow-100/50";
    if (score >= 500) return "from-orange-50 to-orange-100/50";
    return "from-red-50 to-red-100/50";
  };

  const getScoreRating = (score: number) => {
    if (score >= 850) return "Excellent";
    if (score >= 750) return "Very Good";
    if (score >= 650) return "Good";
    if (score >= 500) return "Fair";
    return "Poor";
  };

  const getBucketLabel = (bucket: number) => {
    const labels = ["300-499", "500-649", "650-749", "750-849", "850+"];
    return labels[bucket] || "Unknown";
  };

  const score = Math.round(result.adjustedScore);
  const scorePercentage = ((score - 300) / 600) * 100; // 300-900 range to 0-100%

  // Mock financial data (in production, this comes from backend)
  const financialData = {
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
    accountAge: 24, // months
    trustBoost: result.midnightProof?.publicState?.documentCount ? result.midnightProof.publicState.documentCount * 5 : 0
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-white/20">
        <div className="container-custom flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:scale-105 smooth-transition">
            AtlasCred
          </Link>
          <button
            onClick={onReset}
            className="rounded-xl border border-blue-200 bg-white/50 px-5 py-2.5 text-sm font-semibold text-blue-700 backdrop-blur-sm hover:bg-blue-50 hover:shadow-lg smooth-transition"
          >
            Calculate Again
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="section-padding">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl">
            {/* Success Message */}
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-2xl animate-bounce">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mb-3 text-5xl font-bold tracking-tight text-neutral-900">
                Your Credit Score Is <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">Ready!</span>
              </h1>
              <p className="text-lg text-neutral-600">
                Complete financial profile with zero-knowledge privacy ✨
              </p>
            </div>

            {/* Score Card - Large */}
            <div className={`glass-card hover-lift mb-10 overflow-hidden rounded-3xl border-2 bg-gradient-to-br ${getScoreBgColor(score)} shadow-2xl`}>
              <div className="p-10 text-center">
                <div className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-600">
                  Your AtlasCred Score
                </div>
                <div className={`mb-4 bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-9xl font-black text-transparent`}>
                  {score}
                </div>
                <div className="mb-6 text-2xl font-bold text-neutral-700">
                  {getScoreRating(score)}
                </div>
                
                {/* Score Bar */}
                <div className="mx-auto mb-6 max-w-md">
                  <div className="mb-3 flex justify-between text-xs font-semibold text-neutral-600">
                    <span>300</span>
                    <span>900</span>
                  </div>
                  <div className="relative h-4 overflow-hidden rounded-full bg-neutral-200">
                    <div 
                      className={`h-full bg-gradient-to-r ${getScoreColor(score)} transition-all duration-1000 ease-out shadow-lg`}
                      style={{ width: `${scorePercentage}%` }}
                    />
                    <div 
                      className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-1000"
                      style={{ left: `${scorePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-neutral-600">Confidence: <strong>{Math.round((result.confidence || 0) * 100)}%</strong></span>
                  </div>
                  {financialData.trustBoost > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-neutral-600">Trust Boost: <strong>+{financialData.trustBoost}%</strong></span>
                    </div>
                  )}
                </div>

                {/* Inline Borderline Boost Bar */}
                <div className="mt-6 max-w-md mx-auto">
                  <ScoreEnhancement 
                    score={score}
                    proofId={result.midnightProof?.proofId || ""}
                    walletAddress={result.midnightProof?.walletAddress || ""}
                    onEnhancementComplete={(newScore) => {
                      console.log("Score enhanced from", score, "to", newScore);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Removed separate enhancement block; now inline inside score card */}

            {/* Financial Overview Grid */}
            <div className="mb-10 grid gap-6 md:grid-cols-3">
              {/* Loan History */}
              <div className="glass-card hover-lift rounded-2xl border border-neutral-200 p-6 shadow-lg">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg">
                    💼
                  </div>
                  <h3 className="font-bold text-neutral-900">Loan History</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">Total Loans</span>
                    <span className="font-bold text-neutral-900">{financialData.totalLoans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">Active</span>
                    <span className="font-bold text-green-600">{financialData.activeLoans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">Completed</span>
                    <span className="font-bold text-blue-600">{financialData.completedLoans}</span>
                  </div>
                </div>
              </div>

              {/* Payment Behavior */}
              <div className="glass-card hover-lift rounded-2xl border border-neutral-200 p-6 shadow-lg">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white text-lg">
                    ✅
                  </div>
                  <h3 className="font-bold text-neutral-900">Payment Record</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">On-Time</span>
                    <span className="font-bold text-green-600">{financialData.onTimePayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">Late</span>
                    <span className="font-bold text-orange-600">{financialData.latePayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">Missed</span>
                    <span className="font-bold text-red-600">{financialData.missedPayments}</span>
                  </div>
                </div>
              </div>

              {/* Financial Health */}
              <div className="glass-card hover-lift rounded-2xl border border-neutral-200 p-6 shadow-lg">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white text-lg">
                    📊
                  </div>
                  <h3 className="font-bold text-neutral-900">Financial Health</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">Utilization</span>
                    <span className="font-bold text-neutral-900">{financialData.creditUtilization}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">Account Age</span>
                    <span className="font-bold text-neutral-900">{financialData.accountAge}mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-600">Avg Repayment</span>
                    <span className="font-bold text-neutral-900">{financialData.avgRepaymentDays}d</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Loan Information */}
            <div className="mb-10 glass-card rounded-3xl border border-neutral-200 p-8 shadow-lg">
              <h3 className="mb-6 text-2xl font-bold text-neutral-900">💰 Borrowing History</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Total Borrowed</div>
                  <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    ₹{(financialData.totalBorrowed / 1000).toFixed(0)}K
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Total Repaid</div>
                  <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    ₹{(financialData.totalRepaid / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>
              
              {/* Repayment Progress */}
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-neutral-700">Repayment Progress</span>
                  <span className="font-bold text-green-600">{Math.round((financialData.totalRepaid / financialData.totalBorrowed) * 100)}%</span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-neutral-200">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-out"
                    style={{ width: `${(financialData.totalRepaid / financialData.totalBorrowed) * 100}%` }}
                  />
                </div>
              </div>

              {/* Payment Reliability */}
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-neutral-700">Payment Reliability</span>
                  <span className="font-bold text-green-600">
                    {Math.round((financialData.onTimePayments / (financialData.onTimePayments + financialData.latePayments + financialData.missedPayments)) * 100)}%
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-neutral-200">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-out"
                    style={{ width: `${(financialData.onTimePayments / (financialData.onTimePayments + financialData.latePayments + financialData.missedPayments)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="mb-10 grid gap-6 md:grid-cols-2">
              {/* Blockchain Proof */}
              <div className="glass-card hover-lift rounded-3xl border border-neutral-200 p-8 shadow-lg">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    Zero-Knowledge Proof
                  </h3>
                </div>
                <div className="space-y-5 text-sm">
                  <div className="group">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Proof ID</div>
                    <div className="rounded-xl bg-neutral-50 p-3 font-mono text-xs text-neutral-900 group-hover:bg-neutral-100 smooth-transition">
                      {result.midnightProof?.proofId || "N/A"}
                    </div>
                  </div>
                  {baseToken && (
                    <div className="group">
                      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">🔑 Base Token (Share with Lender)</div>
                      <div className="rounded-xl bg-green-50 p-3 font-mono text-xs text-green-900 group-hover:bg-green-100 smooth-transition border-2 border-green-200">
                        {baseToken}
                      </div>
                      <div className="mt-2 text-xs text-green-700">
                        💡 Lender needs this token + your document number to verify
                      </div>
                    </div>
                  )}
                  <div className="group">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Contract Address</div>
                    <div className="truncate rounded-xl bg-neutral-50 p-3 font-mono text-xs text-neutral-900 group-hover:bg-neutral-100 smooth-transition">
                      {result.midnightProof?.contractAddress || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Score Bucket (Public)</div>
                    <div className="rounded-xl bg-gradient-to-r from-blue-100 to-blue-50 p-3 text-center text-lg font-black text-blue-700">
                      {getBucketLabel(result.midnightProof?.publicState?.scoreBucket || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Expires</div>
                    <div className="rounded-xl bg-amber-50 p-3 text-center font-semibold text-amber-900">
                      {result.midnightProof?.expiresAt ? new Date(result.midnightProof.expiresAt).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Insights */}
              <div className="glass-card hover-lift rounded-3xl border border-neutral-200 p-8 shadow-lg">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    Score Breakdown
                  </h3>
                </div>
                
                {/* Masumi AI Indicator - Only show if enhancement was paid for */}
                {result.masumiEnhanced && (
                  <div className="mb-6 overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white text-sm font-bold shadow-md">
                        AI
                      </div>
                      <div>
                        <div className="mb-1 text-sm font-bold text-purple-900">✨ Masumi AI Enhancement Applied</div>
                        <div className="text-xs leading-relaxed text-purple-800">You paid 10 DUST tokens for AI-powered score boost</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  {result.rationale?.map((line: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="text-neutral-700">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="glass-card overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-10 shadow-2xl">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <h3 className="text-2xl font-bold text-blue-900">
                  What's Next?
                </h3>
              </div>
              <div className="mb-8 space-y-4 text-sm text-blue-900">
                <p className="flex items-start gap-3 rounded-xl bg-white/50 p-4">
                  <span className="text-xl">✓</span>
                  <span>Your credit score is now <strong>protected by zero-knowledge proof</strong> on Midnight blockchain</span>
                </p>
                <p className="flex items-start gap-3 rounded-xl bg-white/50 p-4">
                  <span className="text-xl">✓</span>
                  <span>Share your <strong className="font-black">Proof ID</strong> and <strong className="font-black">Base Token</strong> with lenders to prove creditworthiness</span>
                </p>
                <p className="flex items-start gap-3 rounded-xl bg-white/50 p-4">
                  <span className="text-xl">✓</span>
                  <span>Lenders will see your score bucket (<strong>{getBucketLabel(result.midnightProof?.publicState?.scoreBucket || 0)}</strong>), not exact score</span>
                </p>
                <p className="flex items-start gap-3 rounded-xl bg-white/50 p-4">
                  <span className="text-xl">✓</span>
                  <span>Your proof expires in <strong>7 days</strong>—recompute to keep it current</span>
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.midnightProof?.proofId || "");
                    alert("Proof ID copied to clipboard!");
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-lg font-bold text-white shadow-xl smooth-transition hover:shadow-2xl hover:scale-[1.02]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    📋 Copy Proof ID
                    <span className="inline-block smooth-transition group-hover:translate-x-1">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 smooth-transition group-hover:opacity-100"></div>
                </button>
                {baseToken && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(baseToken);
                      alert("Base Token copied to clipboard!");
                    }}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-lg font-bold text-white shadow-xl smooth-transition hover:shadow-2xl hover:scale-[1.02]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      🔑 Copy Base Token
                      <span className="inline-block smooth-transition group-hover:translate-x-1">→</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 smooth-transition group-hover:opacity-100"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
