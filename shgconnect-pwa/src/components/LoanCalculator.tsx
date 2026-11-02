import React, { useState } from 'react';
import { SupportedLanguage, GroupInfo } from '../types/shg';
import { formatINR } from '../theme/tokens';
import { getGroupSettings } from '../services/db';
import { Calculator, ChevronDown, ChevronUp, Check, Info } from 'lucide-react';

interface LoanCalculatorProps {
  language: SupportedLanguage;
  group?: GroupInfo | null;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({ language, group }) => {
  const isMr = language === 'mr';
  const settings = getGroupSettings(group);
  const defaultRate = settings.loanInterestRateMonthly || 1.5;

  // Open empty (0 amount, no zero-row table)
  const [principal, setPrincipal] = useState<number>(0);
  const [monthlyRate, setMonthlyRate] = useState<number>(defaultRate);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Calculate reducing balance schedule only if principal > 0
  const schedule = [];
  let totalInterest = 0;
  let firstMonthEmi = 0;

  if (principal > 0 && tenureMonths > 0) {
    const monthlyPrincipal = principal / tenureMonths;
    let runningBalance = principal;

    for (let m = 1; m <= tenureMonths; m++) {
      const interestForMonth = (runningBalance * monthlyRate) / 100;
      const emi = monthlyPrincipal + interestForMonth;
      const closing = Math.max(0, runningBalance - monthlyPrincipal);

      totalInterest += interestForMonth;
      if (m === 1) firstMonthEmi = Math.round(emi);

      schedule.push({
        month: m,
        openingBalance: runningBalance,
        principalPart: monthlyPrincipal,
        interestPart: interestForMonth,
        totalEmi: emi,
        closingBalance: closing
      });

      runningBalance = closing;
    }
  }

  const averageMonthlyEmi = principal > 0 ? Math.round((principal + totalInterest) / tenureMonths) : 0;

  return (
    <div className="bg-white rounded-lg shadow-2xs border border-stone-200 overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-[#14532D] text-white p-5">
        <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          <span>{isMr ? 'कर्ज हप्ता कॅल्क्युलेटर' : 'Loan Calculator'}</span>
        </h2>
        <p className="text-xs text-emerald-200 mt-0.5">
          {isMr
            ? 'शेकडा दीड रुपये (१.५%) घटत्या बाकीनुसार सोपी व्याज गणना'
            : 'Reducing balance diminishing interest calculator'}
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            {isMr ? 'कर्ज रक्कम निवडा किंवा टाका (₹):' : 'Select or Enter Principal Amount (₹):'}
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[5000, 10000, 25000, 50000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setPrincipal(amt)}
                className={`py-2 px-1 rounded-lg text-xs font-black transition active:scale-95 cursor-pointer ${
                  principal === amt
                    ? 'bg-[#14532D] text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-stone-500 font-black text-sm">₹</span>
            <input
              type="number"
              step="1000"
              value={principal === 0 ? '' : principal}
              placeholder="0 (रक्कम टाका)"
              onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-base font-black text-stone-900 focus:ring-2 focus:ring-emerald-700 outline-none"
            />
          </div>
        </div>

        {/* Rate & Tenure Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex justify-between">
              <span>{isMr ? 'मासिक व्याज दर:' : 'Monthly Interest Rate:'}</span>
              <span className="text-emerald-800 font-black">
                {isMr ? 'शेकडा दीड रुपये (१.५%)' : `${monthlyRate}% / month`}
              </span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.25"
              value={monthlyRate}
              onChange={(e) => setMonthlyRate(parseFloat(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {isMr ? 'परतफेड कालावधी:' : 'Repayment Tenure:'}
            </label>
            <select
              value={tenureMonths}
              onChange={(e) => setTenureMonths(parseInt(e.target.value))}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-700 outline-none cursor-pointer"
            >
              <option value={6}>{isMr ? '६ महिने (अल्प मुदत)' : '6 Months'}</option>
              <option value={10}>{isMr ? '१० महिने' : '10 Months'}</option>
              <option value={12}>{isMr ? '१२ महिने (१ वर्ष - नियमित)' : '12 Months (1 Year)'}</option>
              <option value={24}>{isMr ? '२४ महिने (२ वर्षे)' : '24 Months (2 Years)'}</option>
            </select>
          </div>
        </div>

        {/* Big Answer: "दरमहा ₹X" */}
        {principal > 0 ? (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 p-5 rounded-lg border border-emerald-300 text-center space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 block">
              {isMr ? 'अंदाजे मासिक परतफेड हप्ता' : 'Estimated Monthly EMI'}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-[#14532D] tracking-tight amount-display">
              {isMr ? `दरमहा ${formatINR(averageMonthlyEmi)}` : `${formatINR(averageMonthlyEmi)} / mo`}
            </div>
            <p className="text-xs text-stone-600 font-medium mt-1">
              {isMr
                ? `पहिला हप्ता: ${formatINR(firstMonthEmi)} • एकूण व्याज: ${formatINR(Math.round(totalInterest))} (${tenureMonths} महिने)`
                : `First EMI: ${formatINR(firstMonthEmi)} • Total Interest: ${formatINR(Math.round(totalInterest))}`}
            </p>
          </div>
        ) : (
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 text-center text-xs text-stone-500 font-medium">
            {isMr ? 'कर्ज रक्कम निवडा किंवा वरील बॉक्समध्ये टाका.' : 'Select or enter an amount to calculate repayment.'}
          </div>
        )}

        {/* Collapsible Amortization Schedule under "तपशील" */}
        {principal > 0 && (
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full bg-stone-50 hover:bg-stone-100 p-3 text-xs font-black text-stone-800 flex items-center justify-between transition cursor-pointer"
            >
              <span>{isMr ? 'महिन्यानुसार तपशील पहा' : 'View Monthly Breakdown'}</span>
              {showDetails ? <ChevronUp className="w-4 h-4 text-stone-600" /> : <ChevronDown className="w-4 h-4 text-stone-600" />}
            </button>

            {showDetails && (
              <div className="p-3 bg-white overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 uppercase">
                      <th className="py-2 px-2">{isMr ? 'महिना' : 'Mo'}</th>
                      <th className="py-2 px-2">{isMr ? 'सुरुवातीची बाकी' : 'Opening'}</th>
                      <th className="py-2 px-2">{isMr ? 'मुद्दल' : 'Principal'}</th>
                      <th className="py-2 px-2">{isMr ? 'व्याज' : 'Interest'}</th>
                      <th className="py-2 px-2 font-black text-emerald-900">{isMr ? 'एकूण हप्ता' : 'Total EMI'}</th>
                      <th className="py-2 px-2">{isMr ? 'शिल्लक बाकी' : 'Closing'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-bold text-stone-800">
                    {schedule.map((row) => (
                      <tr key={row.month} className="hover:bg-stone-50">
                        <td className="py-2 px-2 font-black">{row.month}</td>
                        <td className="py-2 px-2 text-stone-600 amount-display">{formatINR(Math.round(row.openingBalance))}</td>
                        <td className="py-2 px-2 amount-display">{formatINR(Math.round(row.principalPart))}</td>
                        <td className="py-2 px-2 text-amber-800 amount-display">{formatINR(Math.round(row.interestPart))}</td>
                        <td className="py-2 px-2 text-emerald-900 font-black amount-display">{formatINR(Math.round(row.totalEmi))}</td>
                        <td className="py-2 px-2 text-stone-600 amount-display">{formatINR(Math.round(row.closingBalance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
