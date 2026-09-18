import React from 'react';
import { Target, Award, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { formatINR } from '../../theme/tokens';

interface SavingsGoalProps {
  currentSavings: number;
  targetAmount?: number;
  goalName?: string;
}

export const SavingsGoal: React.FC<SavingsGoalProps> = ({
  currentSavings,
  targetAmount = 10000,
  goalName = 'Emergency & Medical Fund'
}) => {
  const percentage = Math.min(Math.round((currentSavings / targetAmount) * 100), 100);
  const remaining = Math.max(targetAmount - currentSavings, 0);

  return (
    <Card variant="parchment">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-stone-800">
          <Target className="w-4 h-4 text-amber-600" />
          <span>{goalName}</span>
        </CardTitle>
        <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          {percentage}% Achieved
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-xs text-stone-500 font-bold uppercase">Saved So Far</span>
            <div className="text-2xl font-black text-[#14532D]">{formatINR(currentSavings)}</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-500 font-bold uppercase">Goal Target</span>
            <div className="text-base font-bold text-stone-700">{formatINR(targetAmount)}</div>
          </div>
        </div>

        <Progress value={currentSavings} max={targetAmount} variant="amber" />

        <div className="flex items-center justify-between text-xs text-stone-600 font-medium pt-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {remaining > 0 ? `${formatINR(remaining)} remaining` : 'Goal achieved! 🎉'}
          </span>
          <span className="text-stone-500">Monthly Quota: ₹500</span>
        </div>
      </CardContent>
    </Card>
  );
};
