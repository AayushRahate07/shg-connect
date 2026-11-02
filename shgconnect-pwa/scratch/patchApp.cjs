const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/App.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

// 1. Imports
file = file.replace(
  "import { seedInitialDataIfNeeded, GroupInfo, saveMembers, saveTransactions, saveLoans, saveMeetings, saveResolutions, saveGroupInfo, saveScheduledMeeting, resetToDemoData, queueMutation, setCurrentShgId, INITIAL_GROUP_INFO } from './services/db';",
  "import { seedInitialDataIfNeeded, GroupInfo, saveMembers, saveTransactions, saveLoans, saveMeetings, saveResolutions, saveGroupInfo, saveScheduledMeeting, resetToDemoData, queueMutation, setCurrentShgId, INITIAL_GROUP_INFO, getMembershipRequests, updateMembershipRequestStatus, MembershipRequest, updateShgLeadership } from './services/db';"
);

file = file.replace(
  "import { LoginView } from './components/auth/LoginView';",
  "import { LoginView } from './components/auth/LoginView';\nimport { NewUserRegistrationView } from './components/auth/NewUserRegistrationView';\nimport { NotificationsModal } from './components/common/NotificationsModal';"
);

// 2. States & Handlers
const oldStateBlock = `export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<Role>('MEMBER');
  // Privacy & Banking Security: Session is memory-only. Refreshing or reopening lands securely on Login screen.
  const [session, setSession] = useState<{ memberId: string; phone: string; role: Role; memberName?: string; shgId?: string } | null>(null);`;

const newStateBlock = `export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<Role>('MEMBER');
  // Privacy & Banking Security: Session is memory-only. Refreshing or reopening lands securely on Login screen.
  const [session, setSession] = useState<{ memberId: string; phone: string; role: Role; memberName?: string; shgId?: string } | null>(null);
  const [authPage, setAuthPage] = useState<'LOGIN' | 'NEW_USER'>('LOGIN');
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);`;

file = file.replace(oldStateBlock, newStateBlock);

// 3. Add refreshMembershipRequests and handlers after handleLogout
const oldLogoutBlock = `  const handleLogout = () => {
    setSession(null);
    setCurrentRole('MEMBER');
    setActiveTab('home');
    try {
      localStorage.removeItem('shg_auth_session_v1');
    } catch (e) {}
  };`;

const newLogoutBlock = `  const handleLogout = () => {
    setSession(null);
    setCurrentRole('MEMBER');
    setActiveTab('home');
    setAuthPage('LOGIN');
    try {
      localStorage.removeItem('shg_auth_session_v1');
    } catch (e) {}
  };

  const refreshMembershipRequests = () => {
    setMembershipRequests(getMembershipRequests());
  };

  useEffect(() => {
    refreshMembershipRequests();
  }, [session, currentRole]);

  // Compute unread pending requests for the active role & group
  const unreadNotificationsCount = membershipRequests.filter(r => {
    if (r.status !== 'PENDING') return false;
    if (currentRole === 'OFFICE_BEARER' || currentRole === 'SHG_LEAD') {
      return !r.shgId || r.shgId === group?.shgCode;
    }
    if (currentRole === 'OFFICER' || currentRole === 'ANIMATOR') {
      return true; // Officer oversees all pending requests
    }
    return false;
  }).length;

  const handleApproveMembershipRequest = async (req: MembershipRequest) => {
    updateMembershipRequestStatus(req.id, 'APPROVED');
    const avatarColors = ['bg-amber-500', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600'];
    const newMember: Member = {
      id: 'mem-' + Date.now(),
      shgId: req.shgId || group.shgCode,
      name: req.name,
      nameRegional: req.nameRegional || req.name,
      phone: req.phone,
      role: 'MEMBER',
      totalSavings: 0,
      activeLoanBalance: 0,
      trustScore: 90,
      occupation: req.occupation || 'सभासद',
      joinedDate: new Date().toISOString().split('T')[0],
      avatarColor: avatarColors[members.length % avatarColors.length],
      entityVersion: 1
    };

    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    await saveMembers(updatedMembers);
    refreshMembershipRequests();
    sound.playCashDepositChime();
    tts.speak(
      language === 'mr'
        ? \`\${req.name} यांना बचत गटात समाविष्ट करण्यात आले आहे.\`
        : \`\${req.name} has been approved into the SHG.\`
    );
  };

  const handleRejectMembershipRequest = (reqId: string) => {
    updateMembershipRequestStatus(reqId, 'REJECTED');
    refreshMembershipRequests();
  };

  const handleSaveLeadership = async (
    shgCode: string,
    assignments: {
      presidentMemberId: string;
      treasurerMemberId: string;
      secretaryMemberId?: string;
    }
  ) => {
    const updatedAllMembers = await updateShgLeadership(shgCode, assignments);
    setMembers(updatedAllMembers);
    await reloadAllData();
  };`;

file = file.replace(oldLogoutBlock, newLogoutBlock);

// 4. Update the !session render block to support authPage === 'NEW_USER'
const oldLoginRender = `    if (!session) {
    return (
      <LoginView
        members={members}
        language={language}
        onLanguageChange={handleLanguageChange}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }`;

const newLoginRender = `  if (!session) {
    if (authPage === 'NEW_USER') {
      return (
        <NewUserRegistrationView
          language={language}
          onLanguageChange={handleLanguageChange}
          onBackToLogin={() => setAuthPage('LOGIN')}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    return (
      <LoginView
        members={members}
        language={language}
        onLanguageChange={handleLanguageChange}
        onLoginSuccess={handleLoginSuccess}
        onNavigateRegister={() => setAuthPage('NEW_USER')}
      />
    );
  }`;

file = file.replace(oldLoginRender, newLoginRender);

// 5. Pass notifications props to AppShell
const oldAppShell = `      onGoBack={handleGoBack}
      parentTabLabel={parentTabLabel}
      onLogout={handleLogout}
    >`;

const newAppShell = `      onGoBack={handleGoBack}
      parentTabLabel={parentTabLabel}
      onLogout={handleLogout}
      unreadNotificationsCount={unreadNotificationsCount}
      onOpenNotifications={() => {
        refreshMembershipRequests();
        setShowNotificationsModal(true);
      }}
    >`;

file = file.replace(oldAppShell, newAppShell);

// 6. Pass onSaveLeadership to AnimatorDashboard
const oldAnimator = `          onSwitchShg={handleSwitchShgGroup}
          onCompleteMeetingSession={handleCompleteMeetingSession}
        />`;

const newAnimator = `          onSwitchShg={handleSwitchShgGroup}
          onCompleteMeetingSession={handleCompleteMeetingSession}
          onSaveLeadership={handleSaveLeadership}
        />`;

file = file.replace(oldAnimator, newAnimator);

// 7. Render NotificationsModal inside AppShell
const oldAppShellClose = `      {/* Data Sync Center Modal */}
      <SyncCenterModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onOpenConflictModal={() => setShowConflictModal(true)}
      />
    </AppShell>`;

const newAppShellClose = `      {/* Data Sync Center Modal */}
      <SyncCenterModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onOpenConflictModal={() => setShowConflictModal(true)}
      />

      {/* Notifications Desk Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        language={language}
        currentRole={currentRole}
        currentGroupCode={group?.shgCode || 'SHG-MH-SAT-2024-0089'}
        onApprove={handleApproveMembershipRequest}
        onReject={handleRejectMembershipRequest}
      />
    </AppShell>`;

file = file.replace(oldAppShellClose, newAppShellClose);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('App.tsx updated successfully');
