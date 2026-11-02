const fs = require('fs');
const path = require('path');

// 1. Fix LoginView.tsx
const loginViewPath = path.join(__dirname, '../src/components/auth/LoginView.tsx');
let loginView = fs.readFileSync(loginViewPath, 'utf-8');
loginView = loginView.replace(
  'export const LoginView: React.FC<LoginViewProps> = ({\n  language,\n  onLanguageChange,\n  onLoginSuccess\n}) => {',
  'export const LoginView: React.FC<LoginViewProps> = ({\n  members,\n  language,\n  onLanguageChange,\n  onLoginSuccess,\n  onNavigateRegister\n}) => {'
);
fs.writeFileSync(loginViewPath, loginView, 'utf-8');
console.log('Fixed LoginView.tsx');

// 2. Fix NewUserRegistrationView.tsx
const regViewPath = path.join(__dirname, '../src/components/auth/NewUserRegistrationView.tsx');
let regView = fs.readFileSync(regViewPath, 'utf-8');
regView = regView.replace(
  "import { getAllCachedGroups, saveNewShgGroup, saveMembershipRequest, getAllFromStore } from '../../services/db';",
  "import { getAllCachedGroups, saveNewShgGroup, saveMembershipRequest } from '../../services/db';"
);
fs.writeFileSync(regViewPath, regView, 'utf-8');
console.log('Fixed NewUserRegistrationView.tsx');

// 3. Fix App.tsx
const appPath = path.join(__dirname, '../src/App.tsx');
let app = fs.readFileSync(appPath, 'utf-8');
app = app.replace(
  "import { Member, Transaction, Loan, Meeting, Role, SupportedLanguage, Resolution, PaymentMode, SettlementStatus, OfficerSignature } from './types/shg';",
  "import { Member, Transaction, Loan, Meeting, Role, SupportedLanguage, Resolution, PaymentMode, SettlementStatus, OfficerSignature, MembershipRequest } from './types/shg';"
);
app = app.replace(
  ", getMembershipRequests, updateMembershipRequestStatus, MembershipRequest, updateShgLeadership",
  ", getMembershipRequests, updateMembershipRequestStatus, updateShgLeadership"
);
// Fix group?.shgCode
app = app.replace(
  "if (currentRole === 'OFFICE_BEARER' || currentRole === 'SHG_LEAD') {\n      return !r.shgId || r.shgId === group.shgCode;\n    }",
  "if (currentRole === 'OFFICE_BEARER' || currentRole === 'SHG_LEAD') {\n      return !r.shgId || r.shgId === (group?.shgCode || 'SHG-MH-SAT-2024-0089');\n    }"
);
fs.writeFileSync(appPath, app, 'utf-8');
console.log('Fixed App.tsx');
