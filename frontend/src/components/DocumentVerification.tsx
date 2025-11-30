"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Upload, FileText, Shield, TrendingUp } from "lucide-react";

export type DocumentType = 'aadhar' | 'pan' | 'mobile' | 'passport' | 'drivingLicense' | 'bankStatement' | 'utilityBill' | 'employmentLetter';

export type VerifiedDocument = {
  type: DocumentType;
  verified: boolean;
  verifiedAt?: string;
  trustBoost: number;
};

const DOCUMENT_CONFIG: Record<DocumentType, { label: string; boost: number; icon: string }> = {
  aadhar: { label: "Aadhar Card", boost: 25, icon: "🪪" },
  pan: { label: "PAN Card", boost: 25, icon: "💳" },
  passport: { label: "Passport", boost: 20, icon: "🛂" },
  drivingLicense: { label: "Driving License", boost: 15, icon: "🚗" },
  mobile: { label: "Mobile Number", boost: 10, icon: "📱" },
  bankStatement: { label: "Bank Statement", boost: 20, icon: "🏦" },
  utilityBill: { label: "Utility Bill", boost: 12, icon: "💡" },
  employmentLetter: { label: "Employment Letter", boost: 18, icon: "💼" }
};

type Props = {
  onDocumentsChange: (docs: VerifiedDocument[]) => void;
};

export function DocumentVerification({ onDocumentsChange }: Props) {
  const [verifiedDocs, setVerifiedDocs] = useState<VerifiedDocument[]>([]);
  const [hoveredDoc, setHoveredDoc] = useState<DocumentType | null>(null);

  const totalBoost = verifiedDocs.reduce((sum, doc) => sum + doc.trustBoost, 0);

  const handleDocumentUpload = (type: DocumentType) => {
    // Simulate document verification (in production, this would upload to backend)
    const isAlreadyVerified = verifiedDocs.some(d => d.type === type);
    
    if (isAlreadyVerified) {
      // Remove document
      const updated = verifiedDocs.filter(d => d.type !== type);
      setVerifiedDocs(updated);
      onDocumentsChange(updated);
    } else {
      // Add document
      const newDoc: VerifiedDocument = {
        type,
        verified: true,
        verifiedAt: new Date().toISOString(),
        trustBoost: DOCUMENT_CONFIG[type].boost
      };
      const updated = [...verifiedDocs, newDoc];
      setVerifiedDocs(updated);
      onDocumentsChange(updated);
    }
  };

  const isVerified = (type: DocumentType) => verifiedDocs.some(d => d.type === type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Verify Your Identity
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            Upload documents to boost your credit score. Each verified document increases trust.
          </p>
        </div>
        
        {/* Total Boost Badge */}
        <AnimatePresence>
          {totalBoost > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-white shadow-lg"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">+{totalBoost} Points</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {(Object.keys(DOCUMENT_CONFIG) as DocumentType[]).map((docType) => {
          const config = DOCUMENT_CONFIG[docType];
          const verified = isVerified(docType);
          const isHovered = hoveredDoc === docType;

          return (
            <motion.button
              key={docType}
              type="button"
              onClick={() => handleDocumentUpload(docType)}
              onHoverStart={() => setHoveredDoc(docType)}
              onHoverEnd={() => setHoveredDoc(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative overflow-hidden rounded-xl border-2 p-4 transition-all ${
                verified
                  ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50"
                  : "border-neutral-200 bg-white hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {/* Background Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0"
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center space-y-2">
                {/* Icon */}
                <motion.div
                  className="text-3xl"
                  animate={{ rotate: verified ? [0, 10, -10, 0] : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {config.icon}
                </motion.div>

                {/* Label */}
                <div className="text-center">
                  <p className="text-xs font-medium text-neutral-900">{config.label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-blue-600">+{config.boost}</p>
                </div>

                {/* Verified Badge */}
                <AnimatePresence>
                  {verified && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-1 -top-1"
                    >
                      <CheckCircle2 className="h-6 w-6 text-green-500 drop-shadow-lg" fill="white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload Indicator */}
                {!verified && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                )}
              </div>

              {/* Shimmer Effect on Hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: isHovered ? "100%" : "-100%" }}
                transition={{ duration: 0.6 }}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Verified Documents List */}
      <AnimatePresence>
        {verifiedDocs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
              <FileText className="h-4 w-4" />
              Verified Documents ({verifiedDocs.length})
            </div>
            <div className="space-y-1.5">
              {verifiedDocs.map((doc) => (
                <motion.div
                  key={doc.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span>{DOCUMENT_CONFIG[doc.type].icon}</span>
                    <span className="font-medium text-neutral-700">{DOCUMENT_CONFIG[doc.type].label}</span>
                  </div>
                  <span className="text-xs font-semibold text-green-600">
                    +{doc.trustBoost}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-800">
          <strong>💡 Pro Tip:</strong> Verify Aadhar + PAN for maximum boost (+50 points). Government IDs carry the highest trust value.
        </p>
      </div>
    </div>
  );
}
