import React from 'react';
import { SupportedLanguage } from '../../types/shg';
import { translations } from '../../i18n/translations';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileSpreadsheet, Printer, Landmark, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

interface ReportsViewProps {
  language: SupportedLanguage;
  onOpenPassbook: () => void;
  onOpenPanchasutra: () => void;
  onOpenVerifier: () => void;
  onOpenResolutions: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  language,
  onOpenPassbook,
  onOpenPanchasutra,
  onOpenVerifier,
  onOpenResolutions
}) => {
  const t = translations[language] || translations.en;

  const categories = [
    {
      title: 'Financial',
      icon: <Landmark className="w-5 h-5 text-[#176B52]" />,
      items: [
        { label: 'Group Cash Book & Balance Sheet', desc: 'Complete statement of pool savings and loan balances', action: onOpenPassbook },
        { label: 'Member Passbook Statements', desc: 'Individual passbook slips with running balances', action: onOpenPassbook },
        { label: 'Loan Repayment & EMI Log', desc: 'Outstanding balances, interest rates, and UTR references', action: onOpenPassbook }
      ]
    },
    {
      title: 'Operations',
      icon: <Calendar className="w-5 h-5 text-[#E69A24]" />,
      items: [
        { label: 'SHG Operational Health Report', desc: 'Score breakdown and internal operational indicators', action: onOpenPanchasutra },
        { label: 'Proceedings & Resolution Book', desc: 'Meeting minutes, proposed motions, and voting outcomes', action: onOpenResolutions },
        { label: 'Member Attendance Summary', desc: 'Historical attendance percentages per member', action: onOpenPassbook }
      ]
    },
    {
      title: 'Audit',
      icon: <ShieldCheck className="w-5 h-5 text-[#1F2925]" />,
      items: [
        { label: 'SHA-256 Append-Only Ledger Audit', desc: 'Verify cryptographic hash integrity and session Merkle roots', action: onOpenVerifier },
        { label: 'Checkpoint Fingerprint Receipts', desc: 'Receipt codes holding officer quorum verification proofs', action: onOpenVerifier }
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E6E2] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2925]">{t.nav.reports}</h1>
          <p className="text-xs text-[#6B756F] mt-1 font-medium">Group financial statements, meeting proceedings, and audit records</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 bg-[#F7F6F2] hover:bg-[#E7F2ED] text-[#1F2925] border border-[#E4E6E2] px-4 py-2 rounded-xl text-xs font-bold transition"
        >
          <Printer className="w-4 h-4 text-[#176B52]" />
          <span>Print Reports</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-[#E4E6E2] shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="p-4 bg-[#F7F6F2] border-b border-[#E4E6E2] flex items-center space-x-2 font-bold text-sm text-[#1F2925]">
              {cat.icon}
              <span>{cat.title}</span>
            </div>
            <div className="p-4 space-y-3 flex-1">
              {cat.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  onClick={item.action}
                  className="p-3.5 bg-[#F7F6F2]/50 hover:bg-[#E7F2ED] rounded-xl border border-[#E4E6E2] transition cursor-pointer group space-y-1"
                >
                  <div className="font-bold text-xs text-[#1F2925] group-hover:text-[#176B52] flex items-center justify-between">
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#6B756F] group-hover:text-[#176B52] transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[11px] text-[#6B756F] leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

