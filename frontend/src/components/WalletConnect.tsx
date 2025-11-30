"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type WalletConnectProps = {
  onConnect: (address: string, signature: string) => void;
  disabled?: boolean;
};

declare global {
  interface Window {
    cardano?: {
      lace?: {
        enable: () => Promise<any>;
        isEnabled: () => Promise<boolean>;
        getUsedAddresses: () => Promise<string[]>;
        signData: (address: string, payload: string) => Promise<{ signature: string; key: string }>;
      };
      [key: string]: any;
    };
  }
}

export function WalletConnect({ onConnect, disabled }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if Lace wallet is installed
      if (!window.cardano?.lace) {
        setError("Lace Wallet not found. Please install Lace extension.");
        setIsConnecting(false);
        return;
      }

      // Enable wallet connection
      const api = await window.cardano.lace.enable();
      
      // Get wallet address
      const addresses = await api.getUsedAddresses();
      if (!addresses || addresses.length === 0) {
        setError("No addresses found in wallet.");
        setIsConnecting(false);
        return;
      }

      // Convert hex address to bech32 format
      const hexAddress = addresses[0];
      const bech32Address = hexToBech32(hexAddress);

      // Create message to sign (proof of ownership)
      const timestamp = Date.now();
      const message = `AtlasCred Credit Score Request\nTimestamp: ${timestamp}\nAddress: ${bech32Address}`;
      
      // Request signature from wallet
      const signResult = await api.signData(bech32Address, Buffer.from(message).toString('hex'));
      
      // Call parent with verified address and signature
      onConnect(bech32Address, JSON.stringify({ 
        signature: signResult.signature, 
        key: signResult.key,
        message,
        timestamp 
      }));

      setIsConnecting(false);
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      setIsConnecting(false);
    }
  };

  // Helper to convert hex address to bech32 (simplified)
  const hexToBech32 = (hex: string): string => {
    // In production, use @emurgo/cardano-serialization-lib-browser
    // For demo, we'll try to extract from cardano API
    return hex; // This should be properly converted
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={connectWallet}
        disabled={disabled || isConnecting}
        className="group relative w-full overflow-hidden rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 text-base font-bold text-blue-900 shadow-md smooth-transition hover:shadow-lg hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          {isConnecting ? (
            <>
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></span>
              <span>Connecting to Lace Wallet...</span>
            </>
          ) : (
            <>
              <span className="text-2xl">👛</span>
              <span>Connect Lace Wallet (Required)</span>
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Secure</span>
            </>
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 opacity-0 smooth-transition group-hover:opacity-100"></div>
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Connection Failed</p>
                <p className="text-xs mt-1">{error}</p>
                <a 
                  href="https://www.lace.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-xs mt-2 inline-block"
                >
                  Install Lace Wallet →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        <div className="flex items-start gap-2">
          <span className="text-base">🔒</span>
          <div>
            <p className="font-semibold mb-1">Why Connect Wallet?</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Proves Ownership</strong>: Cryptographic signature verifies you own the wallet</li>
              <li>• <strong>Prevents Fraud</strong>: Can't steal someone else's credit score</li>
              <li>• <strong>Trustless</strong>: Lender verifies signature on-chain without trusting you</li>
              <li>• <strong>Privacy</strong>: No passwords or personal data shared</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
