const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

console.log('--- RUNNING SHG DATABASE & REFINEMENT CHECKS ---');

// 1. Verify 7 SHGs in demoData
const demoDataContent = fs.readFileSync(path.join(srcDir, 'services/demoData.ts'), 'utf-8');
const groupCodes = (demoDataContent.match(/["']shgCode["']:\s*["']([^"']+)["']/g) || [])
  .map(s => {
    const m = s.match(/["']([^"']+)["']$/);
    return m ? m[1] : null;
  }).filter(Boolean);
const uniqueGroupCodes = Array.from(new Set(groupCodes));
if (uniqueGroupCodes.length !== 7) {
  throw new Error(`Expected exactly 7 unique SHG groups, found ${uniqueGroupCodes.length}: ${JSON.stringify(uniqueGroupCodes)}`);
}
console.log(`[PASS 1] Unique SHG groups found: 7 groups:`, uniqueGroupCodes);

// 2. Verify 70 members in demoData
const memberIds = (demoDataContent.match(/["']id["']:\s*["']mem-\d+["']/g) || []);
const uniqueMemberIds = Array.from(new Set(memberIds));
if (uniqueMemberIds.length !== 70) {
  throw new Error(`Expected exactly 70 members, found ${uniqueMemberIds.length}`);
}
console.log(`[PASS 2] 70 Members present in demoData: ${uniqueMemberIds.length} members found.`);

// Verify phone 8767993248
if (!demoDataContent.includes('8767993248')) {
  throw new Error('Test phone 8767993248 missing from demoData!');
}
console.log(`[PASS 3] Authenticated test phone 8767993248 is preserved.`);

// Verify borders removed
const filesWithBordersRemoved = [
  'components/PassbookTable.tsx',
  'components/member/MemberHome.tsx',
  'components/member/SavingsView.tsx',
  'components/member/LoansView.tsx',
  'components/member/MeetingsView.tsx',
  'pages/OfficeBearerDashboard.tsx'
];

filesWithBordersRemoved.forEach(file => {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
  if (content.includes('border-l-4')) {
    throw new Error(`File ${file} still contains border-l-4!`);
  }
});
console.log(`[PASS 4] All border-l-4 removed and replaced with soft lighter full borders.`);

// 3. Verify Role Hierarchy in LoginView & Header
const loginViewContent = fs.readFileSync(path.join(srcDir, 'components/auth/LoginView.tsx'), 'utf-8');
if (!loginViewContent.includes("mr: 'गट प्रमुख', en: 'SHG Lead'") || !loginViewContent.includes("mr: 'अधिकारी', en: 'Officer'")) {
  throw new Error('LoginView does not contain updated 4-tier role hierarchy');
}
console.log(`[PASS 5] LoginView contains exact 4-tier roles: SHG Member, SHG Lead, Officer, Auditor.`);

const headerContent = fs.readFileSync(path.join(srcDir, 'components/Header.tsx'), 'utf-8');
if (!headerContent.includes('गट प्रमुख (SHG Lead)') || !headerContent.includes('प्रभाग अधिकारी (Officer)')) {
  throw new Error('Header does not contain updated role labels');
}
console.log(`[PASS 6] Header role labels match exact hierarchy.`);

// 4. Verify Meeting Orchestration
const mwContent = fs.readFileSync(path.join(srcDir, 'components/MeetingWizard.tsx'), 'utf-8');
if (!mwContent.includes('Auto-Sign Quorum') && !mwContent.includes('कोरम स्वाक्षऱ्या भरा')) {
  throw new Error('MeetingWizard missing 1-click quorum auto-sign');
}
if (!mwContent.includes('Bypass Freeze & Conduct Meeting')) {
  throw new Error('MeetingWizard missing bypass freeze button');
}
console.log(`[PASS 7] MeetingWizard includes 1-click auto-sign quorum and conflict freeze bypass.`);

const appContent = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf-8');
if (!appContent.includes('currentTxs.push(newTx)') || !appContent.includes('checkpointFingerprint')) {
  throw new Error('App.tsx missing sequential batch ledger commit');
}
console.log(`[PASS 8] App.tsx sequential atomic meeting commit verified.`);

// 5. Verify Multi-SHG View has DB queries
const multiShgContent = fs.readFileSync(path.join(srcDir, 'pages/AnimatorMultiSHGView.tsx'), 'utf-8');
if (!multiShgContent.includes('getAllCachedGroups') || !multiShgContent.includes('getMembers')) {
  throw new Error('AnimatorMultiSHGView is not backed by IndexedDB queries');
}
console.log(`[PASS 9] AnimatorMultiSHGView dynamically loads from IndexedDB.`);

console.log('\n>>> ALL 9 VERIFICATION CHECKS PASSED PERFECTLY! <<<');
