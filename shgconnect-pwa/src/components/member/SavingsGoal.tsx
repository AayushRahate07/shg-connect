import React, { useState, useEffect } from 'react';
import { Target, Sparkles, Plus, Check, Edit2, X, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { formatINR } from '../../theme/tokens';
import { SupportedLanguage } from '../../types/shg';

interface SavingsGoalProps {
  memberId: string;
  currentSavings: number;
  monthlyQuota?: number;
  language?: SupportedLanguage;
}

export const SavingsGoal: React.FC<SavingsGoalProps> = ({
  memberId,
  currentSavings,
  monthlyQuota = 300,
  language = 'mr'
}) => {
  const isMr = language === 'mr';
  const storageKey = `shg_goal_${memberId}`;

  const [hasGoal, setHasGoal] = useState<boolean>(false);
  const [targetAmount, setTargetAmount] = useState<number>(25000);
  const [goalName, setGoalName] = useState<string>('मुलीचे शिक्षण व भविष्य');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editAmount, setEditAmount] = useState<string>('25000');
  const [editName, setEditName] = useState<string>('मुलीचे शिक्षण व भविष्य');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.targetAmount) {
            setTargetAmount(parsed.targetAmount);
            setGoalName(parsed.goalName || (isMr ? 'मुलीचे शिक्षण व भविष्य' : 'Future Savings'));
            setHasGoal(true);
          }
        } catch {}
      }
    }
  }, [storageKey, isMr]);

  const handleSaveGoal = () => {
    const amt = parseInt(editAmount) || 25000;
    const name = editName.trim() || (isMr ? 'माझे बचत ध्येय' : 'Savings Goal');
    setTargetAmount(amt);
    setGoalName(name);
    setHasGoal(true);
    setIsEditing(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify({ targetAmount: amt, goalName: name }));
    }
  };

  const handleClearGoal = () => {
    setHasGoal(false);
    setIsEditing(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  };

  // If no goal is set, show welcoming empty state
  if (!hasGoal && !isEditing) {
    return (
      <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/50 border border-dashed border-amber-300 rounded-lg p-5 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-stone-900">
            {isMr ? 'ध्येय ठरवा (पर्यायी)' : 'Set a Savings Goal (Optional)'}
          </h3>
          <p className="text-xs text-stone-600 font-medium max-w-sm mx-auto mt-0.5 leading-relaxed">
            {isMr
              ? 'मुलीचे शिक्षण, शेती साहित्य किंवा संकटासाठी तुमचे वैयक्तिक बचत ध्येय ठरवून प्रगती ट्रॅक करा.'
              : 'Set a voluntary target for education, agriculture, or emergency to track your timeline.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditAmount('25000');
            setEditName(isMr ? 'मुलीचे शिक्षण' : 'Higher Education');
            setIsEditing(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#14532D] hover:bg-emerald-900 text-white rounded-lg text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isMr ? 'ध्येय ठरवा' : 'Set Target'}</span>
        </button>
      </div>
    );
  }

  // Edit / Creation Drawer Modal
  if (isEditing) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-800" />
            <span>{isMr ? 'बचत ध्येय ठरवा' : 'Define Goal'}</span>
          </h4>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 text-stone-400 hover:text-stone-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {isMr ? 'ध्येयाचे नाव / कारण:' : 'Goal Name:'}
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={isMr ? 'उदा. मुलीचे शिक्षण, शेतीचे अवजारे' : 'e.g. Higher Education'}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-bold outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {isMr ? 'लक्ष्य रक्कम (₹):' : 'Target Amount (₹):'}
            </label>
            <div className="flex gap-2">
              {['15000', '25000', '50000', '100000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setEditAmount(amt)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black transition ${
                    editAmount === amt
                      ? 'bg-[#14532D] text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  ₹{parseInt(amt).toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full mt-2 p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-bold outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {hasGoal && (
              <button
                type="button"
                onClick={handleClearGoal}
                className="text-rose-600 font-bold hover:underline"
              >
                {isMr ? 'ध्येय काढून टाका' : 'Remove Goal'}
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 font-bold"
              >
                {isMr ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="px-4 py-1.5 rounded-lg bg-[#14532D] hover:bg-emerald-900 text-white font-bold"
              >
                {isMr ? 'सेव्ह करा' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Goal Display
  const percentage = Math.min(Math.round((currentSavings / targetAmount) * 100), 100);
  const remaining = Math.max(targetAmount - currentSavings, 0);
  const monthsRemaining = monthlyQuota > 0 ? Math.ceil(remaining / monthlyQuota) : 0;
  const yearsRemaining = (monthsRemaining / 12).toFixed(1);

  return (
    <Card className="border border-amber-200 rounded-lg shadow-2xs overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20">
      <CardHeader className="bg-amber-50/60 border-b border-amber-100 flex items-center justify-between py-3">
        <CardTitle className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{goalName}</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
            {percentage}% {isMr ? 'पूर्ण' : 'Achieved'}
          </span>
          <button
            onClick={() => {
              setEditAmount(targetAmount.toString());
              setEditName(goalName);
              setIsEditing(true);
            }}
            className="p-1 text-stone-400 hover:text-stone-700 rounded"
            title={isMr ? 'ध्येय बदला' : 'Edit Goal'}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-[10px] text-stone-500 font-bold uppercase block">
              {isMr ? 'आतापर्यंत जमा बचत' : 'Saved So Far'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#14532D] amount-display mt-0.5">
              {formatINR(currentSavings)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-stone-500 font-bold uppercase block">
              {isMr ? 'ध्येय लक्ष्य' : 'Target Goal'}
            </span>
            <div className="text-base font-bold text-stone-800 amount-display mt-0.5">
              {formatINR(targetAmount)}
            </div>
          </div>
        </div>

        <Progress value={currentSavings} max={targetAmount} variant="saffron" />

        <div className="flex flex-wrap items-center justify-between text-xs text-stone-700 font-medium pt-1 border-t border-amber-100/60 gap-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            {remaining > 0 ? (
              <span>{isMr ? `उर्वरित: ${formatINR(remaining)}` : `${formatINR(remaining)} remaining`}</span>
            ) : (
              <span className="text-emerald-800 font-bold">{isMr ? 'ध्येय पूर्ण झाले! अभिनंदन!' : 'Goal achieved!'}</span>
            )}
          </span>

          {remaining > 0 && (
            <span className="text-stone-500 text-[11px] font-semibold">
              {isMr ? `दरमहा ₹${monthlyQuota} प्रमाणे सुमारे ${yearsRemaining} वर्षे` : `~${yearsRemaining} years at ₹${monthlyQuota}/mo`}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
