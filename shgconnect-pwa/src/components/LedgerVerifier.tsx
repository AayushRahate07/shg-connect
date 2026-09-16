import React, { useState, useEffect } from 'react';
import { Transaction, SupportedLanguage, ChainVerificationResult } from '../types/shg';
import { verifyLedgerIntegrity } from '../services/hashChain';
import { ShieldCheck, ShieldAlert, RefreshCw, Key, Lock, CheckCircle2, AlertTriangle, Bug } from 'lucide-react';

interface LedgerVerifierProps {
  transactions: Transaction[];
  language: SupportedLanguage;
  onSimulateTamper?: () => void;
}

export const LedgerVerifier: React.FC<LedgerVerifierProps> = ({
  transactions,
  language,
  onSimulateTamper
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<ChainVerificationResult | null>(null);

  const runVerification = async () => {
    setLoading(true);
    try {
      const res = await verifyLedgerIntegrity(transactions);
      setResult(res);
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runVerification();
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {language === 'mr' ? 'SHA-256 ब्लॉक पडताळणी टूल' : 'SHA-256 Ledger Audit & Verifier'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'mr'
                ? 'वेब क्रिप्टो API द्वारे स्थानिक ब्लॉक साखळीची तपासणी'
                : 'Append-Only Cryptographic Hash-Chain Integrity Tool'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onSimulateTamper && (
            <button
              onClick={onSimulateTamper}
              className="flex items-center space-x-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              title="Simulate data tampering attack to test verification engine"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'टँपर चाचणी (Simulate Tamper)' : 'Simulate Tamper'}</span>
            </button>
          )}

          <button
            onClick={runVerification}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'mr' ? 'पुन्हा तपासा' : 'Re-verify Chain'}</span>
          </button>
        </div>
      </div>

      {/* Audit Banner */}
      {result && (
        <div className={`p-4 border-b ${
          result.isValid 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center space-x-3">
            {result.isValid ? (
              <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-rose-600 flex-shrink-0 animate-pulse" />
            )}
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {result.isValid
                  ? (language === 'mr' ? '✅ सर्व ब्लॉक सुरक्षित आणि वैध आहेत (Ledger Integrity Intact)' : '✅ Ledger Chain Verified 100% Intact')
                  : (language === 'mr' ? '⚠️ नोंदवहीत बदल/हेरफेर आढळला आहे! (Chain Integrity Tampered)' : '⚠️ Cryptographic Tampering Detected!')}
              </h3>
              <p className="text-xs opacity-90">
                {result.isValid
                  ? `Cryptographic validation passed for all ${result.verifiedBlocksCount} blocks using SHA-256 digest.`
                  : `Block #${result.invalidBlockIndex} fails SHA-256 hash match! Historical records were modified.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formula Note */}
      <div className="bg-slate-50 p-3 px-5 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4 text-amber-600" />
          <span className="font-mono text-[11px] font-semibold text-slate-700">
            BlockHash = SHA256(index + prevHash + timestamp + payload)
          </span>
        </div>
        <span className="text-[11px] bg-slate-200 px-2 py-0.5 rounded font-mono">
          Web Crypto API
        </span>
      </div>

      {/* Block List */}
      <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
        {result?.blocks.map((b) => (
          <div
            key={b.index}
            className={`p-3 rounded-xl border font-mono text-xs transition ${
              b.status === 'VALID'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-rose-50 border-rose-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px]">
                  Block #{b.index}
                </span>
                <span className="text-slate-700 text-xs font-sans font-semibold">
                  {b.payloadSummary}
                </span>
              </span>
              <span className={`px-2 py-0.5 rounded font-sans text-[11px] font-bold ${
                b.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-600 text-white'
              }`}>
                {b.status === 'VALID' ? 'VALID' : 'CORRUPTED'}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 truncate">
              <span className="font-semibold text-slate-600">Stored Hash: </span>
              <span className="text-slate-800 font-bold">{b.actualHash}</span>
            </div>
            {b.status === 'CORRUPTED' && (
              <div className="text-[11px] text-rose-700 font-bold mt-1">
                Expected Hash: {b.expectedHash}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
