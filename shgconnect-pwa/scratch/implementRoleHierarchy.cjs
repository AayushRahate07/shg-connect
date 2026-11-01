const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

console.log('--- IMPLEMENTING SHG ROLE HIERARCHY ---');

// 1. src/types/shg.ts
const shgTypePath = path.join(srcDir, 'types/shg.ts');
let shgTypeContent = fs.readFileSync(shgTypePath, 'utf-8');
const isTypeCrlf = shgTypeContent.includes('\r\n');
shgTypeContent = shgTypeContent.replace(/\r\n/g, '\n');

shgTypeContent = shgTypeContent.replace(
  "export type Role = 'MEMBER' | 'OFFICE_BEARER' | 'ANIMATOR' | 'AUDITOR';",
  `/**
 * SHGConnect Role Hierarchy:
 * - MEMBER: SHG Member (personal savings, loans, passbook)
 * - SHG_LEAD / OFFICE_BEARER: Leads only one SHG (orchestrates meetings & keeps finance lead)
 * - OFFICER / ANIMATOR: Manages multiple SHGs (can also orchestrate meetings in one SHG at a time)
 * - AUDITOR: Government Senior Person (inspects data & collects information for government)
 */
export type Role = 'MEMBER' | 'SHG_LEAD' | 'OFFICE_BEARER' | 'OFFICER' | 'ANIMATOR' | 'AUDITOR';`
);

if (isTypeCrlf) shgTypeContent = shgTypeContent.replace(/\n/g, '\r\n');
fs.writeFileSync(shgTypePath, shgTypeContent, 'utf-8');
console.log('[1/10] Updated types/shg.ts with Role hierarchy');

// 2. src/components/auth/LoginView.tsx
const loginViewPath = path.join(srcDir, 'components/auth/LoginView.tsx');
let lvContent = fs.readFileSync(loginViewPath, 'utf-8');
const isLvCrlf = lvContent.includes('\r\n');
lvContent = lvContent.replace(/\r\n/g, '\n');

// Update roleTabs in LoginView
const oldRoleTabs = `  const roleTabs = [
    { id: 'MEMBER' as Role, mr: 'सभासद', en: 'Member', icon: User },
    { id: 'OFFICE_BEARER' as Role, mr: 'पदाधिकारी', en: 'Officer', icon: Building2 },
    { id: 'ANIMATOR' as Role, mr: 'गट मार्गदर्शक', en: 'SHG Lead', icon: ClipboardCheck },
    { id: 'AUDITOR' as Role, mr: 'लेखापरीक्षक', en: 'Auditor', icon: ShieldCheck }
  ];`;

const newRoleTabs = `  const roleTabs = [
    { id: 'MEMBER' as Role, mr: 'सभासद', en: 'SHG Member', icon: User, descMr: 'वैयक्तिक बचत, कर्ज व पासबुक', descEn: 'Personal savings, loans & passbook' },
    { id: 'OFFICE_BEARER' as Role, mr: 'गट प्रमुख', en: 'SHG Lead', icon: Building2, descMr: 'एका गटाचे नेतृत्व • बैठक संचालन व वित्त', descEn: 'Leads 1 SHG · Orchestrates meetings & finance' },
    { id: 'ANIMATOR' as Role, mr: 'अधिकारी', en: 'Officer', icon: ClipboardCheck, descMr: 'अनेक गटांचे व्यवस्थापन • बैठक संचालन', descEn: 'Manages multiple SHGs · Orchestrates meetings' },
    { id: 'AUDITOR' as Role, mr: 'लेखापरीक्षक', en: 'Auditor', icon: ShieldCheck, descMr: 'शासकीय वरिष्ठ अधिकारी • माहिती संकलन', descEn: 'Govt Senior Official · Inspects data & info' }
  ];`;

if (lvContent.includes(oldRoleTabs)) {
  lvContent = lvContent.replace(oldRoleTabs, newRoleTabs);
}

// Add role description snippet below tabs
const oldTabsGrid = `        {/* 4 Role Selector Chips */}
        <div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 text-center">
            {roleTabs.map(t => {
              const Icon = t.icon;
              const isActive = role === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleRoleChange(t.id)}
                  className={\`py-2 px-1 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center \${
                    isActive
                      ? 'bg-[#14532D] text-white shadow-xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }\`}
                >
                  <Icon className={\`w-3.5 h-3.5 mb-0.5 \${isActive ? 'text-amber-400' : 'text-stone-400'}\`} />
                  <span className="truncate w-full">{isMr ? t.mr : t.en}</span>
                </button>
              );
            })}
          </div>
        </div>`;

const newTabsGrid = `        {/* 4 Role Selector Chips */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 text-center">
            {roleTabs.map(t => {
              const Icon = t.icon;
              const isActive = role === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleRoleChange(t.id)}
                  className={\`py-2 px-1 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center \${
                    isActive
                      ? 'bg-[#14532D] text-white shadow-xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }\`}
                >
                  <Icon className={\`w-3.5 h-3.5 mb-0.5 \${isActive ? 'text-amber-400' : 'text-stone-400'}\`} />
                  <span className="truncate w-full">{isMr ? t.mr : t.en}</span>
                </button>
              );
            })}
          </div>
          {/* Role Responsibility Scope Pill */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-center text-[10px] text-stone-600 font-semibold">
            {roleTabs.find(t => t.id === role)?.[isMr ? 'descMr' : 'descEn']}
          </div>
        </div>`;

if (lvContent.includes(oldTabsGrid)) {
  lvContent = lvContent.replace(oldTabsGrid, newTabsGrid);
}

// Update Auditor text in LoginView
lvContent = lvContent.replace(
  "{isMr ? 'लेखापरीक्षक मोडमध्ये ब्लॉकचेन लेजर, पंचसूत्र गुण व आर्थिक अहवाल थेट तपासता येतात.' : 'Auditor view provides direct access to SHA-256 blocks and Panchasutra health audit.'}",
  "{isMr ? 'शासकीय वरिष्ठ अधिकारी (NABARD / NRLM): सर्व ७ बचत गटांची माहिती गोळा करणे, ब्लॉकचेन लेजर व पंचसूत्र मानांकन तपासणे.' : 'Government Senior Official (NABARD/NRLM): View all 7 SHGs, collect government data, inspect SHA-256 blocks & Panchasutra health.'}"
);

lvContent = lvContent.replace(
  "<span>{isMr ? 'लेखापरीक्षक पोर्टल उघडा' : 'Launch Auditor Portal'}</span>",
  "<span>{isMr ? 'शासकीय तपासणी पोर्टल उघडा' : 'Launch Govt Senior Inspection Portal'}</span>"
);

if (isLvCrlf) lvContent = lvContent.replace(/\n/g, '\r\n');
fs.writeFileSync(loginViewPath, lvContent, 'utf-8');
console.log('[2/10] Updated LoginView.tsx with accurate 4 role definitions');

// 3. src/components/Header.tsx
const headerPath = path.join(srcDir, 'components/Header.tsx');
let hContent = fs.readFileSync(headerPath, 'utf-8');
const isHCrlf = hContent.includes('\r\n');
hContent = hContent.replace(/\r\n/g, '\n');

const oldHeaderRole = `  const getRoleLabel = () => {
    switch (currentRole) {
      case 'OFFICE_BEARER':
        return isMr ? 'कमलताई • खजिनदार' : 'Kamal-tai • Treasurer';
      case 'MEMBER':
        return isMr ? 'सभासद (Member)' : 'SHG Member';
      case 'ANIMATOR':
        return isMr ? 'सुनिताबाई • गट मार्गदर्शक' : 'Sunita-bai • SHG Lead';
      case 'AUDITOR':
        return isMr ? 'बँक / नाबार्ड ऑडिटर' : 'Bank Auditor';
      default:
        return 'User';
    }
  };`;

const newHeaderRole = `  const getRoleLabel = () => {
    switch (currentRole) {
      case 'OFFICE_BEARER':
      case 'SHG_LEAD' as any:
        return isMr ? 'कमलताई • गट प्रमुख (SHG Lead)' : 'Kamal-tai • SHG Lead (Single SHG)';
      case 'MEMBER':
        return isMr ? 'मीनाबाई • सभासद' : 'Meena-bai • SHG Member';
      case 'ANIMATOR':
      case 'OFFICER' as any:
        return isMr ? 'सुनिताबाई • प्रभाग अधिकारी (Officer)' : 'Sunita-bai • Officer (Multi-SHG)';
      case 'AUDITOR':
        return isMr ? 'शासकीय वरिष्ठ अधिकारी (Auditor)' : 'Govt Senior Official (Auditor)';
      default:
        return 'User';
    }
  };`;

if (hContent.includes(oldHeaderRole)) {
  hContent = hContent.replace(oldHeaderRole, newHeaderRole);
}

if (isHCrlf) hContent = hContent.replace(/\n/g, '\r\n');
fs.writeFileSync(headerPath, hContent, 'utf-8');
console.log('[3/10] Updated Header.tsx with role labels');

// 4. src/components/layout/Sidebar.tsx
const sidebarPath = path.join(srcDir, 'components/layout/Sidebar.tsx');
let sbContent = fs.readFileSync(sidebarPath, 'utf-8');
const isSbCrlf = sbContent.includes('\r\n');
sbContent = sbContent.replace(/\r\n/g, '\n');

const oldSbRoleSnippet = `  const getRoleSnippet = () => {
    switch (currentRole) {
      case 'OFFICE_BEARER':
        return { name: isMr ? 'कमलताई पाटील' : 'Kamal-tai Patil', title: isMr ? 'खजिनदार (Treasurer)' : 'Treasurer', bg: 'bg-amber-100 text-amber-900' };
      case 'MEMBER':
        return { name: isMr ? 'मीनाबाई जाधव' : 'Meena-bai Jadhav', title: isMr ? 'सभासद (Member)' : 'SHG Member', bg: 'bg-emerald-100 text-emerald-900' };
      case 'ANIMATOR':
        return { name: isMr ? 'सुनिताबाई देशमुख' : 'Sunita-bai Deshmukh', title: isMr ? 'गट मार्गदर्शक (SHG Lead)' : 'SHG Lead (Animator)', bg: 'bg-blue-100 text-blue-900' };
      case 'AUDITOR':
        return { name: isMr ? 'नाबार्ड / बँक अधिकारी' : 'NABARD / Bank Official', title: isMr ? 'लेखापरीक्षक (Auditor)' : 'Auditor', bg: 'bg-purple-100 text-purple-900' };
      default:
        return { name: 'User', title: 'Member', bg: 'bg-stone-100 text-stone-900' };
    }
  };`;

const newSbRoleSnippet = `  const getRoleSnippet = () => {
    switch (currentRole) {
      case 'OFFICE_BEARER':
      case 'SHG_LEAD' as any:
        return {
          name: isMr ? 'कमलताई पाटील' : 'Kamal-tai Patil',
          title: isMr ? 'गट प्रमुख (SHG Lead - Single SHG)' : 'SHG Lead (1 SHG & Finance)',
          bg: 'bg-amber-100 text-amber-900'
        };
      case 'MEMBER':
        return {
          name: isMr ? 'मीनाबाई जाधव' : 'Meena-bai Jadhav',
          title: isMr ? 'बचत गट सभासद (SHG Member)' : 'SHG Member',
          bg: 'bg-emerald-100 text-emerald-900'
        };
      case 'ANIMATOR':
      case 'OFFICER' as any:
        return {
          name: isMr ? 'सुनिताबाई देशमुख' : 'Sunita-bai Deshmukh',
          title: isMr ? 'प्रभाग अधिकारी (Multi-SHG Officer)' : 'Officer (Manages Multiple SHGs)',
          bg: 'bg-blue-100 text-blue-900'
        };
      case 'AUDITOR':
        return {
          name: isMr ? 'शासकीय वरिष्ठ अधिकारी' : 'Govt Senior Official',
          title: isMr ? 'लेखापरीक्षक (Auditor / Govt Data)' : 'Auditor (Govt Data Collection)',
          bg: 'bg-purple-100 text-purple-900'
        };
      default:
        return { name: 'User', title: 'Member', bg: 'bg-stone-100 text-stone-900' };
    }
  };`;

if (sbContent.includes(oldSbRoleSnippet)) {
  sbContent = sbContent.replace(oldSbRoleSnippet, newSbRoleSnippet);
}

// Update Officer nav items in sidebar
const oldSbOfficerNav = `    if (currentRole === 'ANIMATOR') {
      return [
        { id: 'home', label: isMr ? 'मुख्य डॅशबोर्ड' : 'Dashboard', icon: Home, color: '#1D5FA8' },
        { id: 'members', label: isMr ? 'गट सभासद' : 'SHG Portfolio', icon: Users, color: '#1D5FA8' },
        { id: 'sync', label: isMr ? 'डेटा सिंक केंद्र' : 'Sync Center', icon: RefreshCw, color: '#1D5FA8' },
        { id: 'settings', label: isMr ? 'सेटिंग्ज' : 'Settings', icon: Settings, color: '#1D5FA8' },
      ];
    }`;

const newSbOfficerNav = `    if (currentRole === 'ANIMATOR' || (currentRole as string) === 'OFFICER') {
      return [
        { id: 'home', label: isMr ? 'सर्व ७ गट (Multi-SHG)' : 'Multi-SHG Portfolio', icon: Activity, color: '#1D5FA8' },
        { id: 'meetings', label: isMr ? 'बैठक संचालन' : 'Orchestrate Meeting', icon: Calendar, color: '#1D5FA8' },
        { id: 'members', label: isMr ? 'सर्व ७० सभासद' : 'All 70 Beneficiaries', icon: Users, color: '#1D5FA8' },
        { id: 'sync', label: isMr ? 'डेटा सिंक केंद्र' : 'Sync Center', icon: RefreshCw, color: '#1D5FA8' },
        { id: 'settings', label: isMr ? 'सेटिंग्ज' : 'Settings', icon: Settings, color: '#1D5FA8' },
      ];
    }`;

if (sbContent.includes(oldSbOfficerNav)) {
  sbContent = sbContent.replace(oldSbOfficerNav, newSbOfficerNav);
}

// Update Auditor nav items in sidebar
const oldSbAuditorNav = `    // AUDITOR
    return [
      { id: 'home', label: isMr ? 'ऑडिट डॅशबोर्ड' : 'Audit Dashboard', icon: Home, color: '#6D28D9' },
      { id: 'panchasutra', label: isMr ? 'पंचसूत्र मानांकन' : 'Panchasutra Rating', icon: Award, color: '#6D28D9' },
      { id: 'verifier', label: isMr ? 'ब्लॉक पडताळणी' : 'Hash Verifier', icon: Shield, color: '#6D28D9' },
      { id: 'reports', label: isMr ? 'वित्तीय अहवाल' : 'Financial Reports', icon: FileSpreadsheet, color: '#6D28D9' },
    ];`;

const newSbAuditorNav = `    // AUDITOR
    return [
      { id: 'home', label: isMr ? 'शासकीय तपासणी' : 'Govt Inspection', icon: Home, color: '#6D28D9' },
      { id: 'panchasutra', label: isMr ? 'पंचसूत्र अनुपालन' : 'Panchasutra Compliance', icon: Award, color: '#6D28D9' },
      { id: 'verifier', label: isMr ? 'ब्लॉकचेन पडताळणी' : 'Ledger Integrity', icon: Shield, color: '#6D28D9' },
      { id: 'reports', label: isMr ? 'शासकीय अहवाल गोळा करा' : 'Collect Govt Data', icon: FileSpreadsheet, color: '#6D28D9' },
    ];`;

if (sbContent.includes(oldSbAuditorNav)) {
  sbContent = sbContent.replace(oldSbAuditorNav, newSbAuditorNav);
}

if (isSbCrlf) sbContent = sbContent.replace(/\n/g, '\r\n');
fs.writeFileSync(sidebarPath, sbContent, 'utf-8');
console.log('[4/10] Updated Sidebar.tsx with role items');

// 5. src/components/layout/MobileNav.tsx
const mobileNavPath = path.join(srcDir, 'components/layout/MobileNav.tsx');
let mnContent = fs.readFileSync(mobileNavPath, 'utf-8');
const isMnCrlf = mnContent.includes('\r\n');
mnContent = mnContent.replace(/\r\n/g, '\n');

const oldMnAnimator = `  if (role === 'ANIMATOR') {
    return [
      { id: 'home', label: tHome, icon: Home, color: '#1D5FA8' },
      { id: 'members', label: 'Portfolio', icon: Activity, color: '#1D5FA8' },
      { id: 'sync', label: 'Sync', icon: RefreshCw, color: '#1D5FA8' },
      { id: 'settings', label: language === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings, color: '#1D5FA8' },
    ];
  }`;

const newMnAnimator = `  if (role === 'ANIMATOR' || (role as string) === 'OFFICER') {
    return [
      { id: 'home', label: language === 'mr' ? 'सर्व ७ गट' : 'Portfolio', icon: Activity, color: '#1D5FA8' },
      { id: 'meetings', label: language === 'mr' ? 'बैठक' : 'Meetings', icon: Calendar, color: '#1D5FA8' },
      { id: 'members', label: language === 'mr' ? 'सभासद' : 'Members', icon: Users, color: '#1D5FA8' },
      { id: 'settings', label: language === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings, color: '#1D5FA8' },
    ];
  }`;

if (mnContent.includes(oldMnAnimator)) {
  mnContent = mnContent.replace(oldMnAnimator, newMnAnimator);
}

if (isMnCrlf) mnContent = mnContent.replace(/\n/g, '\r\n');
fs.writeFileSync(mobileNavPath, mnContent, 'utf-8');
console.log('[5/10] Updated MobileNav.tsx');

// 6. src/pages/OfficeBearerDashboard.tsx (SHG Lead Dashboard)
const obdPath = path.join(srcDir, 'pages/OfficeBearerDashboard.tsx');
let obdContent = fs.readFileSync(obdPath, 'utf-8');
const isObdCrlf = obdContent.includes('\r\n');
obdContent = obdContent.replace(/\r\n/g, '\n');

// Update header pill in OfficeBearerDashboard
const oldObdHeader = `<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full mb-3"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#FEF3C7', border: '1px solid rgba(255,255,255,0.2)' }}>
            {group.shgCode}
          </span>`;

const newObdHeader = `<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full mb-3"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#FEF3C7', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Award className="w-3.5 h-3.5 text-amber-300" />
            {language === 'mr' ? 'गट प्रमुख डॅशबोर्ड (SHG Lead)' : 'SHG Lead Dashboard'} · {group.shgCode}
          </span>`;

if (obdContent.includes(oldObdHeader)) {
  obdContent = obdContent.replace(oldObdHeader, newObdHeader);
}

if (isObdCrlf) obdContent = obdContent.replace(/\n/g, '\r\n');
fs.writeFileSync(obdPath, obdContent, 'utf-8');
console.log('[6/10] Updated OfficeBearerDashboard.tsx (SHG Lead)');

fs.writeFileSync(path.join(srcDir, '../scratch/checkpoint_role_hierarchy.txt'), 'done');
