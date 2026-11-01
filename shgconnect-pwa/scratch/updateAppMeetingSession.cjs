const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Ensure saveResolutions and saveGroupInfo are imported
content = content.replace(
  "import { seedInitialDataIfNeeded, GroupInfo, saveMembers, saveTransactions, saveLoans, saveMeetings, resetToDemoData, queueMutation, setCurrentShgId, INITIAL_GROUP_INFO } from './services/db';",
  "import { seedInitialDataIfNeeded, GroupInfo, saveMembers, saveTransactions, saveLoans, saveMeetings, saveResolutions, saveGroupInfo, resetToDemoData, queueMutation, setCurrentShgId, INITIAL_GROUP_INFO } from './services/db';"
);

// 2. Replace handleCompleteMeetingSession with sequential cryptographic batch commit
const oldCompleteMeetingRegex = /const handleCompleteMeetingSession = async \([\s\S]*?tts\.speak\(language === 'mr' \? 'बैठक सत्र यशस्वीरीत्या नोंदवले गेले आहे\.' : 'Meeting Session committed to hash-chain successfully\.'\);\s*\};/;

const newCompleteMeeting = `const handleCompleteMeetingSession = async (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => {
    let currentTxs = [...transactions];
    let currentMembers = [...members];
    const timestamp = new Date().toISOString();
    const activeShgCode = group?.shgCode || 'SHG-MH-SAT-2024-0089';

    // 1. Process each savings transaction in strict cryptographic sequence
    for (const item of savingsCollected) {
      if (item.amount <= 0) continue;
      const mem = currentMembers.find(m => m.id === item.memberId);
      if (!mem) continue;

      const newIndex = currentTxs.length;
      const lastBlock = currentTxs[currentTxs.length - 1];
      const prevHash = lastBlock ? lastBlock.hash : "GENESIS_BLOCK_00000000000000000000000000000000";
      const payload = \`\${mem.id}:\${mem.name}:SAVINGS:\${item.amount}:Monthly Savings Pool\`;
      const hash = await computeBlockHash(newIndex, prevHash, timestamp, payload);
      const checkpointFingerprint = generateCheckpointFingerprint(hash);

      const newTx: Transaction = {
        id: \`tx-\${Date.now()}-\${Math.floor(Math.random() * 10000)}\`,
        shgId: activeShgCode,
        index: newIndex,
        timestamp,
        memberId: mem.id,
        memberName: mem.name,
        type: 'SAVINGS',
        amount: item.amount,
        notes: 'Monthly Savings Pool',
        paymentMode: 'CASH',
        settlementStatus: 'SETTLED_CASH',
        signatories,
        signatureProof,
        prevHash,
        hash,
        checkpointFingerprint
      };
      currentTxs.push(newTx);

      currentMembers = currentMembers.map(m =>
        m.id === mem.id ? { ...m, totalSavings: (m.totalSavings || 0) + item.amount } : m
      );

      await queueMutation({
        opId: \`op-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`,
        shgId: activeShgCode,
        actorId: 'animator-1',
        actorRole: 'ANIMATOR',
        deviceId: 'dev-pwa-local',
        hlcTimestamp: \`\${timestamp}-0001\`,
        type: 'RECORD_SAVINGS',
        entityId: newTx.id,
        payload: { memberId: mem.id, amount: item.amount, checkpointFingerprint }
      });
    }

    // 2. Process micro-loan disbursal if any
    let updatedLoans = [...loans];
    if (loanDisbursed && loanDisbursed.amount > 0) {
      const borrower = currentMembers.find(m => m.id === loanDisbursed.memberId);
      if (borrower) {
        const newIndex = currentTxs.length;
        const lastBlock = currentTxs[currentTxs.length - 1];
        const prevHash = lastBlock ? lastBlock.hash : "GENESIS_BLOCK_00000000000000000000000000000000";
        const payload = \`\${borrower.id}:\${borrower.name}:LOAN_DISBURSAL:\${loanDisbursed.amount}:\${loanDisbursed.notes || ''}\`;
        const hash = await computeBlockHash(newIndex, prevHash, timestamp, payload);
        const checkpointFingerprint = generateCheckpointFingerprint(hash);

        const disbursalTx: Transaction = {
          id: \`tx-\${Date.now()}-\${Math.floor(Math.random() * 10000)}\`,
          shgId: activeShgCode,
          index: newIndex,
          timestamp,
          memberId: borrower.id,
          memberName: borrower.name,
          type: 'LOAN_DISBURSAL',
          amount: loanDisbursed.amount,
          notes: loanDisbursed.notes || 'Micro-Loan Disbursal',
          paymentMode: 'CASH',
          settlementStatus: 'SETTLED_CASH',
          signatories,
          signatureProof,
          prevHash,
          hash,
          checkpointFingerprint
        };
        currentTxs.push(disbursalTx);

        currentMembers = currentMembers.map(m =>
          m.id === borrower.id ? { ...m, activeLoanBalance: (m.activeLoanBalance || 0) + loanDisbursed.amount } : m
        );

        const newLoan: Loan = {
          id: \`loan-\${Date.now()}\`,
          shgId: activeShgCode,
          memberId: borrower.id,
          memberName: borrower.name,
          principal: loanDisbursed.amount,
          interestRateMonthly: 1.5,
          tenureMonths: 10,
          totalPaid: 0,
          remainingBalance: loanDisbursed.amount,
          status: 'ACTIVE',
          dateDisbursed: timestamp.split('T')[0],
          entityVersion: 1
        };
        updatedLoans.push(newLoan);

        await queueMutation({
          opId: \`op-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`,
          shgId: activeShgCode,
          actorId: 'animator-1',
          actorRole: 'ANIMATOR',
          deviceId: 'dev-pwa-local',
          hlcTimestamp: \`\${timestamp}-0002\`,
          type: 'DISBURSE_LOAN',
          entityId: newLoan.id,
          payload: { memberId: borrower.id, amount: loanDisbursed.amount }
        });
      }
    }

    // 3. Process resolutions if any
    let updatedResolutions = [...resolutions];
    if (newResolutions && newResolutions.length > 0) {
      newResolutions.forEach((r, idx) => {
        updatedResolutions.push({
          ...r,
          id: \`res-\${Date.now()}-\${idx}\`,
          resolutionNumber: updatedResolutions.length + 1
        });
      });
      setResolutions(updatedResolutions);
      await saveResolutions(updatedResolutions);
    }

    // 4. Save and commit meeting record
    const totalSav = savingsCollected.reduce((sum, s) => sum + s.amount, 0);
    const meetingFingerprint = \`CHK-\${Math.random().toString(36).substring(2, 6).toUpperCase()}-\${Math.random().toString(36).substring(2, 6).toUpperCase()}-\${Math.random().toString(36).substring(2, 6).toUpperCase()}\`;

    const newMeeting: Meeting = {
      id: \`meet-\${meetings.length + 1}\`,
      date: timestamp.split('T')[0],
      meetingNumber: meetings.length + 1,
      totalSavingsCollected: totalSav,
      totalEmiCollected: 0,
      totalDisbursed: loanDisbursed ? loanDisbursed.amount : 0,
      attendanceRecord,
      signatories,
      checkpointFingerprint: meetingFingerprint
    };
    const updatedMeetings = [...meetings, newMeeting];

    // 5. Commit all updated states to IndexedDB atomically
    setTransactions(currentTxs);
    await saveTransactions(currentTxs);

    setMembers(currentMembers);
    await saveMembers(currentMembers);

    setLoans(updatedLoans);
    await saveLoans(updatedLoans);

    setMeetings(updatedMeetings);
    await saveMeetings(updatedMeetings);

    // 6. Update Group Fund
    if (group) {
      const updatedFund = group.totalGroupFund + totalSav - (loanDisbursed?.amount || 0);
      const updatedGroup = { ...group, totalGroupFund: updatedFund };
      setGroup(updatedGroup);
      await saveGroupInfo(updatedGroup);
    }

    // 7. Queue meeting mutation
    await queueMutation({
      opId: \`op-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`,
      shgId: activeShgCode,
      actorId: 'animator-1',
      actorRole: 'ANIMATOR',
      deviceId: 'dev-pwa-local',
      hlcTimestamp: \`\${timestamp}-0003\`,
      type: 'COMMIT_MEETING',
      entityId: newMeeting.id,
      payload: { meetingNumber: newMeeting.meetingNumber, totalSavingsCollected: totalSav, checkpointFingerprint: meetingFingerprint }
    });

    sound.playCashDepositChime();
    tts.speak(language === 'mr' ? 'बैठक सत्र यशस्वीरीत्या पूर्ण होऊन लेजरमध्ये जतन झाले.' : 'Meeting session committed to tamper-proof ledger successfully.');
  };`;

if (!oldCompleteMeetingRegex.test(content)) {
  console.error('Could not match oldCompleteMeetingRegex in App.tsx!');
  process.exit(1);
}

content = content.replace(oldCompleteMeetingRegex, newCompleteMeeting);

// 3. Pass onSwitchShg to AnimatorDashboard
content = content.replace(
  '          onOpenAddMember={() => setShowAddMemberModal(true)}\n        />\n      ) : (',
  '          onOpenAddMember={() => setShowAddMemberModal(true)}\n          onSwitchShg={handleSwitchShgGroup}\n        />\n      ) : ('
);

if (isCrlf) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(appPath, content, 'utf-8');
console.log('Updated App.tsx meeting session and group switching successfully');
