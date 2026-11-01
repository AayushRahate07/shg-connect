const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

// 1. MemberHome.tsx: Remove border-l-4 and apply light full borders
const memberHomePath = path.join(srcDir, 'components/member/MemberHome.tsx');
let mhContent = fs.readFileSync(memberHomePath, 'utf-8');

mhContent = mhContent.replace(
  'className="bg-white p-3.5 rounded-2xl border border-stone-200 border-l-4 border-l-emerald-600 shadow-xs text-left"',
  'className="bg-emerald-50/30 p-3.5 rounded-2xl border border-emerald-200 shadow-xs text-left"'
);

mhContent = mhContent.replace(
  'className="bg-white p-3.5 rounded-2xl border border-stone-200 border-l-4 border-l-amber-500 shadow-xs text-left"',
  'className="bg-amber-50/30 p-3.5 rounded-2xl border border-amber-200 shadow-xs text-left"'
);

mhContent = mhContent.replace(
  'className="bg-white p-3.5 rounded-2xl border border-stone-200 border-l-4 border-l-teal-600 shadow-xs text-left"',
  'className="bg-teal-50/30 p-3.5 rounded-2xl border border-teal-200 shadow-xs text-left"'
);

mhContent = mhContent.replace(
  'className="bg-white p-3.5 rounded-2xl border border-stone-200 border-l-4 border-l-purple-600 shadow-xs text-left"',
  'className="bg-purple-50/30 p-3.5 rounded-2xl border border-purple-200 shadow-xs text-left"'
);

fs.writeFileSync(memberHomePath, mhContent, 'utf-8');
console.log('Updated MemberHome.tsx borders');

// 2. LoansView.tsx
const loansViewPath = path.join(srcDir, 'components/member/LoansView.tsx');
let lvContent = fs.readFileSync(loansViewPath, 'utf-8');
lvContent = lvContent.replace(
  'className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E4E8EF] border-l-4 border-l-blue-600 shadow-card space-y-3.5"',
  'className="bg-blue-50/20 p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-card space-y-3.5"'
);
fs.writeFileSync(loansViewPath, lvContent, 'utf-8');
console.log('Updated LoansView.tsx borders');

// 3. MeetingsView.tsx
const meetingsViewPath = path.join(srcDir, 'components/member/MeetingsView.tsx');
let mvContent = fs.readFileSync(meetingsViewPath, 'utf-8');
mvContent = mvContent.replace(
  'className="bg-white p-6 rounded-2xl border border-[#E7E5E4] border-l-4 border-l-[#0F766E] shadow-card space-y-3"',
  'className="bg-teal-50/20 p-6 rounded-2xl border border-teal-200 shadow-card space-y-3"'
);
fs.writeFileSync(meetingsViewPath, mvContent, 'utf-8');
console.log('Updated MeetingsView.tsx borders');

// 4. SavingsView.tsx
const savingsViewPath = path.join(srcDir, 'components/member/SavingsView.tsx');
let svContent = fs.readFileSync(savingsViewPath, 'utf-8');
svContent = svContent.replace(
  'className="card-hero-green rounded-2xl p-5 sm:p-6 relative overflow-hidden space-y-3.5 border-l-4 border-l-emerald-400"',
  'className="card-hero-green rounded-2xl p-5 sm:p-6 relative overflow-hidden space-y-3.5 border border-emerald-400/40"'
);
svContent = svContent.replace(
  'className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 border-l-4 border-l-amber-500 shadow-sm space-y-3.5"',
  'className="bg-amber-50/20 p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3.5"'
);
fs.writeFileSync(savingsViewPath, svContent, 'utf-8');
console.log('Updated SavingsView.tsx borders');

// 5. PanchasutraVisualizer.tsx
const panchaPath = path.join(srcDir, 'components/panchasutra/PanchasutraVisualizer.tsx');
let pvContent = fs.readFileSync(panchaPath, 'utf-8');
pvContent = pvContent.replace(
  'className="bg-white rounded-2xl border border-[#E7E5E4] border-l-4 border-l-emerald-700 shadow-card overflow-hidden space-y-6"',
  'className="bg-white rounded-2xl border border-emerald-200 shadow-card overflow-hidden space-y-6"'
);
fs.writeFileSync(panchaPath, pvContent, 'utf-8');
console.log('Updated PanchasutraVisualizer.tsx borders');

// 6. OfficeBearerDashboard.tsx
const obdPath = path.join(srcDir, 'pages/OfficeBearerDashboard.tsx');
let obdContent = fs.readFileSync(obdPath, 'utf-8');
obdContent = obdContent.replace(
  'className="rounded-2xl p-5 stat-green border-l-4 border-l-emerald-600 shadow-xs"',
  'className="rounded-2xl p-5 stat-green border border-emerald-300 shadow-xs"'
);
obdContent = obdContent.replace(
  'className="rounded-2xl p-5 stat-red border-l-4 border-l-rose-600 shadow-xs"',
  'className="rounded-2xl p-5 stat-red border border-rose-300 shadow-xs"'
);
obdContent = obdContent.replace(
  'className="rounded-2xl p-5 stat-violet border-l-4 border-l-purple-600 shadow-xs"',
  'className="rounded-2xl p-5 stat-violet border border-purple-300 shadow-xs"'
);
fs.writeFileSync(obdPath, obdContent, 'utf-8');
console.log('Updated OfficeBearerDashboard.tsx borders');

// 7. LoginView.tsx: Rename Animator to SHG Lead (गट मार्गदर्शक)
const loginViewPath = path.join(srcDir, 'components/auth/LoginView.tsx');
let lvAuth = fs.readFileSync(loginViewPath, 'utf-8');
lvAuth = lvAuth.replace(
  "{ id: 'ANIMATOR' as Role, mr: 'अॅनिमेटर', en: 'Animator', icon: ClipboardCheck }",
  "{ id: 'ANIMATOR' as Role, mr: 'गट मार्गदर्शक', en: 'SHG Lead', icon: ClipboardCheck }"
);
fs.writeFileSync(loginViewPath, lvAuth, 'utf-8');
console.log('Updated LoginView.tsx role name');

// 8. Header.tsx: Rename Animator
const headerPath = path.join(srcDir, 'components/Header.tsx');
let hContent = fs.readFileSync(headerPath, 'utf-8');
hContent = hContent.replace(
  "return isMr ? 'सुनिताबाई • प्रेरिका' : 'Field Animator';",
  "return isMr ? 'सुनिताबाई • गट मार्गदर्शक' : 'Sunita-bai • SHG Lead';"
);
fs.writeFileSync(headerPath, hContent, 'utf-8');
console.log('Updated Header.tsx role label');

// 9. Sidebar.tsx: Rename Animator
const sidebarPath = path.join(srcDir, 'components/layout/Sidebar.tsx');
let sbContent = fs.readFileSync(sidebarPath, 'utf-8');
sbContent = sbContent.replace(
  "title: isMr ? 'अॅनिमेटर (Animator)' : 'Field Animator'",
  "title: isMr ? 'गट मार्गदर्शक (SHG Lead)' : 'SHG Lead (Animator)'"
);
fs.writeFileSync(sidebarPath, sbContent, 'utf-8');
console.log('Updated Sidebar.tsx role label');

// 10. AddMemberModal.tsx: Rename Animator
const addMemberModalPath = path.join(srcDir, 'components/member/AddMemberModal.tsx');
let ammContent = fs.readFileSync(addMemberModalPath, 'utf-8');
ammContent = ammContent.replace(
  '<option value="ANIMATOR">{isMr ? \'अॅनिमेटर / मार्गदर्शक\' : \'Animator / Guide\'}</option>',
  '<option value="ANIMATOR">{isMr ? \'गट मार्गदर्शक (SHG Lead)\' : \'SHG Lead (Animator)\'}</option>'
);
fs.writeFileSync(addMemberModalPath, ammContent, 'utf-8');
console.log('Updated AddMemberModal.tsx role label');

console.log('All border and role label updates applied successfully!');
