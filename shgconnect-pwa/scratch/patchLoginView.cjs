const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/auth/LoginView.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

file = file.replace(
  'interface LoginViewProps {\n  members: Member[];\n  language: SupportedLanguage;\n  onLanguageChange: (lang: SupportedLanguage) => void;\n  onLoginSuccess: (session: { memberId: string; phone: string; role: Role; memberName?: string; shgId?: string }) => void;\n}',
  'interface LoginViewProps {\n  members: Member[];\n  language: SupportedLanguage;\n  onLanguageChange: (lang: SupportedLanguage) => void;\n  onLoginSuccess: (session: { memberId: string; phone: string; role: Role; memberName?: string; shgId?: string }) => void;\n  onNavigateRegister?: () => void;\n}'
);

file = file.replace(
  'export const LoginView: React.FC<LoginViewProps> = ({\n  members,\n  language,\n  onLanguageChange,\n  onLoginSuccess\n}) => {',
  'export const LoginView: React.FC<LoginViewProps> = ({\n  members,\n  language,\n  onLanguageChange,\n  onLoginSuccess,\n  onNavigateRegister\n}) => {'
);

const oldJoinBlock = `        {/* Below Button: Join SHG & Optional Custom PIN Access */}
        <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
          <button
            type="button"
            onClick={() => {
              setJoinSubmitted(false);
              setShowJoinModal(true);
            }}
            className="text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isMr ? 'नवीन सभासद? बचत गटात सामील व्हा' : 'New? Apply to Join an SHG'}</span>
          </button>`;

const newJoinBlock = `        {/* New User Registration Callout Banner */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
          <div className="text-left">
            <span className="text-xs font-black text-emerald-950 block">
              {isMr ? 'नवीन वापरकर्ता आहात का?' : 'New User?'}
            </span>
            <span className="text-[10px] text-emerald-800 font-medium block">
              {isMr ? 'गटात सामील व्हा किंवा नवीन गट सुरू करा' : 'Join an SHG or Register New Group'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onNavigateRegister) onNavigateRegister();
              else {
                setJoinSubmitted(false);
                setShowJoinModal(true);
              }
            }}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            {isMr ? 'नोंदणी करा' : 'Register'}
          </button>
        </div>

        {/* Below Button: Custom PIN Access */}
        <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
          <button
            type="button"
            onClick={() => {
              if (onNavigateRegister) onNavigateRegister();
              else {
                setJoinSubmitted(false);
                setShowJoinModal(true);
              }
            }}
            className="text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isMr ? 'नवीन सभासद / नवीन बचत गट नोंदणी' : 'New User? Register / Join SHG'}</span>
          </button>`;

file = file.replace(oldJoinBlock, newJoinBlock);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('LoginView.tsx updated successfully');
