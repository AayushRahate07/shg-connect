import React, { useState } from 'react';
import { GroupInfo } from '../services/db';
import { SupportedLanguage, Member } from '../types/shg';
import { formatINR } from '../theme/tokens';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Building2, Users, AlertTriangle, ShieldCheck, Search, ChevronRight, Activity, ArrowUpRight, CheckCircle2, X } from 'lucide-react';

interface PortfolioSHG {
  id: string;
  name: string;
  nameRegional: string;
  code: string;
  village: string;
  grade: 'A' | 'B' | 'C';
  score: number;
  membersCount: number;
  totalSavings: number;
  activeLoans: number;
  attendanceRate: number;
  recoveryRate: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  redFlags: string[];
}

interface AnimatorMultiSHGViewProps {
  currentGroup: GroupInfo;
  language: SupportedLanguage;
  onSelectSHG?: (shgId: string) => void;
  onOpenAddMember?: () => void;
}

export const AnimatorMultiSHGView: React.FC<AnimatorMultiSHGViewProps> = ({
  currentGroup,
  language,
  onSelectSHG,
  onOpenAddMember
}) => {
  const isMr = language === 'mr';
  const isHi = language === 'hi';

  const [selectedShgModal, setSelectedShgModal] = useState<PortfolioSHG | null>(null);

  // Multi-SHG Portfolio Mock Data assigned to the CRP / Animator
  const portfolio: PortfolioSHG[] = [
    {
      id: 'SHG-MH-SAT-2024-0089',
      name: currentGroup.name,
      nameRegional: currentGroup.nameRegional || 'सावित्री महिला बचत गट',
      code: currentGroup.shgCode || 'SHG-MH-2024-884',
      village: currentGroup.village || 'Shirwal',
      grade: 'A',
      score: 92,
      membersCount: 16,
      totalSavings: 84500,
      activeLoans: 17000,
      attendanceRate: 95,
      recoveryRate: 98,
      syncStatus: 'synced',
      redFlags: []
    },
    {
      id: 'SHG-MH-SAT-2024-0090',
      name: 'Lakshmi Mahila Bachat Gat',
      nameRegional: 'लक्ष्मी महिला बचत गट',
      code: 'SHG-MH-2024-885',
      village: 'Shirwal',
      grade: 'B',
      score: 78,
      membersCount: 12,
      totalSavings: 62000,
      activeLoans: 25000,
      attendanceRate: 83,
      recoveryRate: 88,
      syncStatus: 'pending',
      redFlags: ['मागील १ बैठकीत कोरम पूर्ण नाही', '१ हप्ता २ दिवस थकीत']
    },
    {
      id: 'SHG-MH-SAT-2024-0091',
      name: 'Saraswati Self Help Group',
      nameRegional: 'सरस्वती स्वावलंबन गट',
      code: 'SHG-MH-2024-886',
      village: 'Khandala',
      grade: 'C',
      score: 64,
      membersCount: 15,
      totalSavings: 41000,
      activeLoans: 32000,
      attendanceRate: 70,
      recoveryRate: 72,
      syncStatus: 'conflict',
      redFlags: ['अनियमित मासिक बैठकी (२ महिने उशीर)', 'परतफेड दरात घसरण (७२%)', 'डेटा सिंक तफावत (Conflict)']
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1D5FA8] to-[#174a83] rounded-3xl p-6 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full mb-2 bg-white/15 text-blue-100 border border-white/20">
              <Activity className="w-3.5 h-3.5" />
              {isMr ? 'सीआरपी / प्रेरक बहु-गट डॅशबोर्ड (Multi-SHG Oversight)' : 'Multi-SHG Village Oversight'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isMr ? 'ग्रामसंघांतर्गत बचत गट नियंत्रण' : 'Village Portfolio Management'}
            </h1>
            <p className="text-xs text-blue-200 mt-1 font-medium">
              {currentGroup.village} · {portfolio.length} Assigned SHGs · Multi-Group Local IndexedDB Cache
            </p>
          </div>

          {onOpenAddMember && (
            <button
              onClick={onOpenAddMember}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-4 py-2.5 rounded-2xl text-xs font-black shadow flex items-center space-x-2 transition active:scale-95"
            >
              <span>+</span>
              <span>{isMr ? 'नवीन सदस्य नोंदवा' : 'Register New Member'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Portfolio Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-card text-left space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            {isMr ? 'एकूण बचत गट' : 'Supervised SHGs'}
          </span>
          <span className="text-3xl font-black text-blue-900 block">{portfolio.length} Groups</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-card text-left space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            {isMr ? 'एकूण सभासद संख्या' : 'Total Beneficiaries'}
          </span>
          <span className="text-3xl font-black text-emerald-900 block">43 Members</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-card text-left space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {isMr ? 'सुधारणा आवश्यक गट' : 'Needs Attention'}
          </span>
          <span className="text-3xl font-black text-amber-800 block">1 Group (Grade C)</span>
        </div>
      </div>

      {/* SHG Portfolio Cards Grid */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-gray-900">
          {isMr ? 'नियंत्रणातील बचत गट (Assigned SHGs Portfolio)' : 'Assigned SHGs Portfolio'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {portfolio.map((shg) => {
            const isGradeA = shg.grade === 'A';
            const isGradeB = shg.grade === 'B';

            return (
              <div
                key={shg.id}
                onClick={() => setSelectedShgModal(shg)}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-card hover:shadow-xl transition cursor-pointer space-y-4 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {shg.code} · {shg.village}
                    </span>
                    <h4 className="font-black text-base text-gray-900 mt-0.5">
                      {isMr ? shg.nameRegional : shg.name}
                    </h4>
                  </div>

                  <Badge
                    variant={isGradeA ? 'success' : isGradeB ? 'warning' : 'error'}
                    size="md"
                  >
                    Grade {shg.grade} ({shg.score}/100)
                  </Badge>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-400 font-medium block">
                      {isMr ? 'एकूण बचत' : 'Total Savings'}
                    </span>
                    <span className="font-black text-emerald-800 amount-display mt-0.5 block">
                      {formatINR(shg.totalSavings)}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-400 font-medium block">
                      {isMr ? 'बाकी कर्ज' : 'Active Loans'}
                    </span>
                    <span className="font-black text-amber-800 amount-display mt-0.5 block">
                      {formatINR(shg.activeLoans)}
                    </span>
                  </div>
                </div>

                {/* Performance stats */}
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium pt-1">
                  <span>हजेरी दर: <strong>{shg.attendanceRate}%</strong></span>
                  <span>वसूल दर: <strong>{shg.recoveryRate}%</strong></span>
                </div>

                {/* Red flags indicator */}
                {shg.redFlags.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span className="truncate">{shg.redFlags[0]}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-blue-600 font-bold pt-2 border-t border-gray-100">
                  <span>{isMr ? 'सविस्तर रिपोर्ट व रेड फ्लॅग्ज पहा' : 'View Inspection Report'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SHG Inspection Modal */}
      {selectedShgModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {selectedShgModal.code}
                </span>
                <h3 className="font-black text-lg text-gray-900">
                  {isMr ? selectedShgModal.nameRegional : selectedShgModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedShgModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Red Flags */}
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-900 block">
                    {isMr ? 'पंचसूत्र तपासणी गुण' : 'Panchasutra Score'}
                  </span>
                  <span className="text-2xl font-black text-blue-950 block">
                    {selectedShgModal.score} / 100 (Grade {selectedShgModal.grade})
                  </span>
                </div>
                <Badge variant={selectedShgModal.grade === 'A' ? 'success' : 'warning'} size="md">
                  {selectedShgModal.syncStatus.toUpperCase()}
                </Badge>
              </div>

              {selectedShgModal.redFlags.length > 0 ? (
                <div className="space-y-2 bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs">
                  <span className="font-bold text-rose-900 block flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    {isMr ? 'गटातील गंभीर त्रुटी (Red Flags Detected):' : 'Identified Operational Red Flags:'}
                  </span>
                  <ul className="list-disc pl-4 text-rose-800 space-y-1 font-semibold">
                    {selectedShgModal.redFlags.map((rf, idx) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isMr ? 'या गटात कोणत्याही त्रुटी आढळल्या नाहीत.' : 'Zero operational red flags detected. Excellent performance.'}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  if (onSelectSHG) onSelectSHG(selectedShgModal.id);
                  setSelectedShgModal(null);
                }}
                className="flex-1 bg-[#14532D] hover:bg-emerald-900 text-white font-black py-3 rounded-2xl text-xs shadow transition"
              >
                {isMr ? 'या गटाचा डॅशबोर्ड उघडा' : 'Switch to this SHG Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
