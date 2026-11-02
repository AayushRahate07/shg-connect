const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/AnimatorMultiSHGView.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

// 1. Add SwitchLeadershipModal and ArrowRightLeft imports
file = file.replace(
  "import { Building2, Users, AlertTriangle, ShieldCheck, Search, ChevronRight, Activity, ArrowUpRight, CheckCircle2, X, Sparkles } from 'lucide-react';",
  "import { Building2, Users, AlertTriangle, ShieldCheck, Search, ChevronRight, Activity, ArrowUpRight, CheckCircle2, X, Sparkles, ArrowRightLeft } from 'lucide-react';\nimport { SwitchLeadershipModal } from '../components/office/SwitchLeadershipModal';"
);

// 2. Add onSaveLeadership to interface
file = file.replace(
  '  onStartMeetingForSHG?: (shgId: string) => void;\n}',
  '  onStartMeetingForSHG?: (shgId: string) => void;\n  onSaveLeadership?: (\n    shgCode: string,\n    assignments: {\n      presidentMemberId: string;\n      treasurerMemberId: string;\n      secretaryMemberId?: string;\n    }\n  ) => Promise<void> | void;\n}'
);

// 3. Add onSaveLeadership to component props
file = file.replace(
  '  onStartMeetingForSHG\n}) => {',
  '  onStartMeetingForSHG,\n  onSaveLeadership\n}) => {'
);

// 4. Add switchLeadershipGroup state
file = file.replace(
  '  const [selectedShgModal, setSelectedShgModal] = useState<PortfolioSHG | null>(null);',
  '  const [selectedShgModal, setSelectedShgModal] = useState<PortfolioSHG | null>(null);\n  const [switchLeadershipGroup, setSwitchLeadershipGroup] = useState<GroupInfo | null>(null);'
);

// 5. Add Switch Leadership button in SHG Card
const oldCardBtns = `                  {onStartMeetingForSHG && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartMeetingForSHG(shg.code);
                      }}
                      className="flex-1 bg-amber-400 hover:bg-amber-300 text-stone-900 font-black py-1.5 px-2 rounded-xl text-[11px] shadow-xs flex items-center justify-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3 text-stone-900" />
                      <span>{isMr ? 'बैठक चालवा' : 'Run Meeting'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectSHG) onSelectSHG(shg.code);
                    }}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <span>{isMr ? 'डॅशबोर्ड' : 'Manage'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>`;

const newCardBtns = `                  {onStartMeetingForSHG && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartMeetingForSHG(shg.code);
                      }}
                      className="flex-1 bg-amber-400 hover:bg-amber-300 text-stone-900 font-black py-1.5 px-2 rounded-xl text-[11px] shadow-xs flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-stone-900" />
                      <span>{isMr ? 'बैठक चालवा' : 'Run Meeting'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetGroup = cachedGroups.find(c => c.shgCode === shg.code) || currentGroup;
                      setSwitchLeadershipGroup(targetGroup);
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                    title={isMr ? 'पदाधिकारी व खजिनदार बदला' : 'Switch Leadership / Treasurer'}
                  >
                    <ArrowRightLeft className="w-3 h-3 text-blue-700" />
                    <span>{isMr ? 'पदाधिकारी' : 'Officers'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectSHG) onSelectSHG(shg.code);
                    }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <span>{isMr ? 'डॅशबोर्ड' : 'Manage'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>`;

file = file.replace(oldCardBtns, newCardBtns);

// 6. Add button in Inspection modal & SwitchLeadershipModal rendering
const oldModalActions = `            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">`;

const newModalActions = `            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetGroup = cachedGroups.find(c => c.shgCode === selectedShgModal.code) || currentGroup;
                  setSelectedShgModal(null);
                  setSwitchLeadershipGroup(targetGroup);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-2xl text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4 text-amber-300" />
                <span>{isMr ? 'पदाधिकारी व खजिनदार बदला' : 'Switch Leads / Treasurer'}</span>
              </button>`;

file = file.replace(oldModalActions, newModalActions);

// Add SwitchLeadershipModal at the end
file = file.replace(
  '      {/* SHG Inspection Modal */}',
  `      {/* Switch Leadership Modal (Tier 3 Authority) */}
      {switchLeadershipGroup && (
        <SwitchLeadershipModal
          isOpen={!!switchLeadershipGroup}
          onClose={() => setSwitchLeadershipGroup(null)}
          language={language}
          group={switchLeadershipGroup}
          members={allMembers}
          onSaveLeadership={async (shgCode, assignments) => {
            if (onSaveLeadership) {
              await onSaveLeadership(shgCode, assignments);
            }
            const updated = await getMembers();
            setAllMembers(updated);
          }}
        />
      )}

      {/* SHG Inspection Modal */}`
);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('AnimatorMultiSHGView.tsx updated successfully');
