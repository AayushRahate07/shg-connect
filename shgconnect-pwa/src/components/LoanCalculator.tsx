import React, { useState } from 'react';
import { SupportedLanguage } from '../types/shg';
import { Calculator, Percent, Calendar, IndianRupee, PieChart } from 'lucide-react';

interface LoanCalculatorProps {
  language: SupportedLanguage;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({ language }) => {
  const [principal, setPrincipal] = useState<number>(10000);
  const [monthlyRate, setMonthlyRate] = useState<number>(1.5); // 1.5% per month
  const [tenureMonths, setTenureMonths] = useState<number>(6);

  // Calculate reducing balance schedule
  const monthlyPrincipal = principal / tenureMonths;
  let runningBalance = principal;
  let totalInterest = 0;

  const schedule = [];
  for (let m = 1; m <= tenureMonths; m++) {
    const interestForMonth = (runningBalance * monthlyRate) / 100;
    const emi = monthlyPrincipal + interestForMonth;
    const closing = Math.max(0, runningBalance - monthlyPrincipal);

    totalInterest += interestForMonth;

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

  const totalRepayment = principal + totalInterest;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-900 text-white p-5">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          {language === 'mr' ? 'कर्ज व्याज कॅल्क्युलेटर (Reducing Balance)' : 'Diminishing Interest Loan Calculator'}
        </h2>
        <p className="text-xs text-emerald-200">
          {language === 'mr'
            ? '१-२% मासिक घटत्या शिल्लकीनुसार (Reducing Balance) व्याज गणना'
            : 'SHG 1-2% monthly reducing balance interest schedule'}
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'mr' ? 'कर्ज रक्कम (Principal Amount ₹)' : 'Principal Amount (₹)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="1000"
                value={principal}
                onChange={(e) => setPrincipal(Math.max(1000, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between">
              <span>{language === 'mr' ? 'मासिक व्याज दर (% Monthly Rate)' : 'Monthly Interest Rate'}</span>
              <span className="text-emerald-700 font-bold">{monthlyRate}% / month</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.25"
              value={monthlyRate}
              onChange={(e) => setMonthlyRate(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'mr' ? 'कर्ज कालावधी (Tenure in Months)' : 'Tenure (Months)'}
            </label>
            <select
              value={tenureMonths}
              onChange={(e) => setTenureMonths(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={10}>10 Months</option>
              <option value={12}>12 Months</option>
              <option value={18}>18 Months</option>
              <option value={24}>24 Months</option>
            </select>
          </div>

          {/* Quick Summary Cards */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-amber-950">
              <span>{language === 'mr' ? 'एकूण व्याज (Total Interest):' : 'Total Interest:'}</span>
              <span className="text-emerald-800 font-extrabold">₹{Math.round(totalInterest).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-950 pt-1 border-t border-amber-200">
              <span>{language === 'mr' ? 'एकूण परतफेड (Total Repayment):' : 'Total Payable:'}</span>
              <span className="text-slate-900 font-extrabold">₹{Math.round(totalRepayment).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Repayment Schedule Table */}
        <div className="md:col-span-2 overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">
            {language === 'mr' ? 'मासिक हप्ता वेळापत्रक (Monthly Schedule)' : 'Reducing Balance Amortization Schedule'}
          </h3>

          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                <th className="p-2">Month</th>
                <th className="p-2 text-right">Opening (₹)</th>
                <th className="p-2 text-right">Principal (₹)</th>
                <th className="p-2 text-right">Interest (₹)</th>
                <th className="p-2 text-right text-emerald-800">EMI (₹)</th>
                <th className="p-2 text-right">Closing (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {schedule.map((s) => (
                <tr key={s.month} className="hover:bg-slate-50">
                  <td className="p-2 font-bold font-sans text-slate-900">M-{s.month}</td>
                  <td className="p-2 text-right text-slate-600">₹{Math.round(s.openingBalance)}</td>
                  <td className="p-2 text-right text-slate-800">₹{Math.round(s.principalPart)}</td>
                  <td className="p-2 text-right text-amber-700 font-bold">₹{Math.round(s.interestPart)}</td>
                  <td className="p-2 text-right text-emerald-700 font-extrabold font-sans">₹{Math.round(s.totalEmi)}</td>
                  <td className="p-2 text-right text-slate-600">₹{Math.round(s.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
