import React, { useState, useEffect } from 'react';
import { SupportedLanguage, CashBoxDenominations, CashBoxState } from '../types/shg';
import { Coins, CheckCircle2, AlertTriangle, Calculator, Sparkles } from 'lucide-react';
import { sound } from '../services/sound';

interface CashBoxReconciliationProps {
  expectedCash: number;
  language: SupportedLanguage;
  onReconciliationChange?: (state: CashBoxState) => void;
}

export const CashBoxReconciliation: React.FC<CashBoxReconciliationProps> = ({
  expectedCash,
  language,
  onReconciliationChange
}) => {
  const [denominations, setDenominations] = useState<CashBoxDenominations>({
    n500: 0,
    n200: 0,
    n100: Math.floor(expectedCash / 100),
    n50: 0,
    n20: 0,
    n10: 0,
    coins: expectedCash % 100
  });

  const totalCountedCash =
    denominations.n500 * 500 +
    denominations.n200 * 200 +
    denominations.n100 * 100 +
    denominations.n50 * 50 +
    denominations.n20 * 20 +
    denominations.n10 * 10 +
    denominations.coins;

  const discrepancy = totalCountedCash - expectedCash;
  const isBalanced = discrepancy === 0;

  useEffect(() => {
    if (onReconciliationChange) {
      onReconciliationChange({
        denominations,
        totalCountedCash,
        digitalExpectedCash: expectedCash,
        discrepancy,
        isBalanced
      });
    }
  }, [denominations, totalCountedCash, expectedCash, discrepancy, isBalanced]);

  const handleDenominationChange = (key: keyof CashBoxDenominations, val: number) => {
    sound.playStampSound();
    setDenominations(prev => ({
      ...prev,
      [key]: Math.max(0, val)
    }));
  };

  return (
    <div className="bg-[#FDFBF7] border-2 border-[#E2DDD3] rounded-3xl p-5 shadow-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DDD3] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#14532D] text-amber-400 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#1C1917]">
              {language === 'mr' ? 'बचत पेटी रोकड जुळवणी (Cash Box Denomination Counter)' : 'Physical Cash Box Reconciliation'}
            </h3>
            <p className="text-xs text-stone-600">
              {language === 'mr' ? 'बैठकीत मिळालेल्या प्रत्यक्ष नोटांची मोजणी करा' : 'Physical note denomination count vs expected total'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center space-x-1 ${
          isBalanced ? 'bg-emerald-800 text-white' : 'bg-amber-500 text-amber-950 animate-pulse'
        }`}>
          {isBalanced ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{language === 'mr' ? 'पेटी हिशोब तंतोतंत जुळला' : 'Cash Perfectly Balanced'}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-950" />
              <span>
                {language === 'mr' ? `तफावत: ₹${Math.abs(discrepancy)} ${discrepancy > 0 ? 'जास्त' : 'कमी'}` : `Diff: ₹${discrepancy}`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Grid of Indian Currency Denominations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* ₹500 Note */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
            <span>₹५०० Note</span>
            <span className="text-emerald-800 font-extrabold">₹{denominations.n500 * 500}</span>
          </div>
          <input
            type="number"
            min="0"
            value={denominations.n500}
            onChange={(e) => handleDenominationChange('n500', parseInt(e.target.value) || 0)}
            className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-2 py-1 text-sm font-extrabold text-right text-[#1C1917] outline-none"
          />
        </div>

        {/* ₹200 Note */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
            <span>₹२०० Note</span>
            <span className="text-emerald-800 font-extrabold">₹{denominations.n200 * 200}</span>
          </div>
          <input
            type="number"
            min="0"
            value={denominations.n200}
            onChange={(e) => handleDenominationChange('n200', parseInt(e.target.value) || 0)}
            className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-2 py-1 text-sm font-extrabold text-right text-[#1C1917] outline-none"
          />
        </div>

        {/* ₹100 Note */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
            <span>₹१०० Note</span>
            <span className="text-emerald-800 font-extrabold">₹{denominations.n100 * 100}</span>
          </div>
          <input
            type="number"
            min="0"
            value={denominations.n100}
            onChange={(e) => handleDenominationChange('n100', parseInt(e.target.value) || 0)}
            className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-2 py-1 text-sm font-extrabold text-right text-[#1C1917] outline-none"
          />
        </div>

        {/* ₹50 Note */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
            <span>₹५० Note</span>
            <span className="text-emerald-800 font-extrabold">₹{denominations.n50 * 50}</span>
          </div>
          <input
            type="number"
            min="0"
            value={denominations.n50}
            onChange={(e) => handleDenominationChange('n50', parseInt(e.target.value) || 0)}
            className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-2 py-1 text-sm font-extrabold text-right text-[#1C1917] outline-none"
          />
        </div>

        {/* ₹20 Note */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
            <span>₹२० Note</span>
            <span className="text-emerald-800 font-extrabold">₹{denominations.n20 * 20}</span>
          </div>
          <input
            type="number"
            min="0"
            value={denominations.n20}
            onChange={(e) => handleDenominationChange('n20', parseInt(e.target.value) || 0)}
            className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-2 py-1 text-sm font-extrabold text-right text-[#1C1917] outline-none"
          />
        </div>

        {/* ₹10 Note */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
            <span>₹१० Note</span>
            <span className="text-emerald-800 font-extrabold">₹{denominations.n10 * 10}</span>
          </div>
          <input
            type="number"
            min="0"
            value={denominations.n10}
            onChange={(e) => handleDenominationChange('n10', parseInt(e.target.value) || 0)}
            className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-2 py-1 text-sm font-extrabold text-right text-[#1C1917] outline-none"
          />
        </div>

        {/* Coins / Small Change */}
        <div className="bg-white p-3 rounded-2xl border border-[#E2DDD3] col-span-2 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
            <span>नाणी / सुट्टे (Coins & Change ₹)</span>
            <span className="text-emerald-800 font-extrabold">₹{denominations.coins}</span>
          </div>
          <input
            type="number"
            min="0"
            value={denominations.coins}
            onChange={(e) => handleDenominationChange('coins', parseInt(e.target.value) || 0)}
            className="w-full bg-[#F7F4EC] border border-[#E2DDD3] rounded-xl px-2 py-1 text-sm font-extrabold text-right text-[#1C1917] outline-none"
          />
        </div>
      </div>

      {/* Comparison Reconciliation Footer */}
      <div className="bg-white border border-[#E2DDD3] rounded-2xl p-3 flex flex-wrap items-center justify-between text-xs font-bold">
        <div className="text-stone-600">
          <span>{language === 'mr' ? 'पेटीतील मोजलेली रोकड:' : 'Counted Physical Cash:'} </span>
          <span className="text-base text-[#14532D] font-black">₹{totalCountedCash.toLocaleString('en-IN')}</span>
        </div>
        <div className="text-stone-600">
          <span>{language === 'mr' ? 'एकूण गोळा करणे अपेक्षित:' : 'Expected Digital Total:'} </span>
          <span className="text-base text-[#1C1917] font-black">₹{expectedCash.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
