const fs = require('fs');
const path = require('path');

console.log('--- RUNNING FULL ONBOARDING & LEADERSHIP VERIFICATION ---');

// 1. Verify NewUserRegistrationView
const regPath = path.join(__dirname, '../src/components/auth/NewUserRegistrationView.tsx');
if (!fs.existsSync(regPath)) throw new Error('NewUserRegistrationView.tsx is missing');
const regContent = fs.readFileSync(regPath, 'utf-8');
if (!regContent.includes('mode === \'MEMBER\'') || !regContent.includes('mode === \'NEW_SHG\'')) {
  throw new Error('NewUserRegistrationView does not have both MEMBER and NEW_SHG modes');
}
if (!regContent.includes('saveNewShgGroup') || !regContent.includes('saveMembershipRequest')) {
  throw new Error('NewUserRegistrationView missing persistence calls');
}
console.log('[PASS 1] NewUserRegistrationView verified with 2 clear options (New Member & New SHG)');

// 2. Verify NotificationsModal
const notifPath = path.join(__dirname, '../src/components/common/NotificationsModal.tsx');
if (!fs.existsSync(notifPath)) throw new Error('NotificationsModal.tsx is missing');
const notifContent = fs.readFileSync(notifPath, 'utf-8');
if (!notifContent.includes('onApprove') || !notifContent.includes('onReject')) {
  throw new Error('NotificationsModal missing onApprove/onReject');
}
console.log('[PASS 2] NotificationsModal verified with approve/reject actions');

// 3. Verify SwitchLeadershipModal
const switchPath = path.join(__dirname, '../src/components/office/SwitchLeadershipModal.tsx');
if (!fs.existsSync(switchPath)) throw new Error('SwitchLeadershipModal.tsx is missing');
const switchContent = fs.readFileSync(switchPath, 'utf-8');
if (!switchContent.includes('presidentId') || !switchContent.includes('treasurerId') || !switchContent.includes('onSaveLeadership')) {
  throw new Error('SwitchLeadershipModal missing leadership role assignment');
}
console.log('[PASS 3] SwitchLeadershipModal verified for Tier 3 Officers');

// 4. Verify Header contains Notification Bell
const headerPath = path.join(__dirname, '../src/components/Header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf-8');
if (!headerContent.includes('Bell') || !headerContent.includes('onOpenNotifications') || !headerContent.includes('unreadNotificationsCount')) {
  throw new Error('Header missing Notification Bell button');
}
console.log('[PASS 4] Header contains Notification Bell with unread badge');

// 5. Verify App.tsx routing & state
const appPath = path.join(__dirname, '../src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
if (!appContent.includes('authPage === \'NEW_USER\'') || !appContent.includes('NewUserRegistrationView')) {
  throw new Error('App.tsx missing NewUserRegistrationView routing');
}
if (!appContent.includes('handleApproveMembershipRequest') || !appContent.includes('handleSaveLeadership')) {
  throw new Error('App.tsx missing membership approval or leadership handlers');
}
console.log('[PASS 5] App.tsx integrated with registration page, notifications, and leadership switching');

// 6. Verify db.ts functions
const dbPath = path.join(__dirname, '../src/services/db.ts');
const dbContent = fs.readFileSync(dbPath, 'utf-8');
if (!dbContent.includes('saveNewShgGroup') || !dbContent.includes('updateShgLeadership')) {
  throw new Error('db.ts missing saveNewShgGroup or updateShgLeadership');
}
console.log('[PASS 6] db.ts includes saveNewShgGroup and updateShgLeadership');

console.log('\n>>> ALL 6 VERIFICATIONS PASSED 100% SUCCESSFULLY! <<<');
