import { TranslationDictionary } from './types';

export const en: TranslationDictionary = {
  appName: 'SHGConnect',
  appSubtitle: 'Digital Passbook & Grassroots Trust Ledger',
  nav: {
    home: 'Overview',
    members: 'Members',
    loans: 'Loans',
    meetings: 'Meetings',
    passbook: 'Passbook',
    panchasutra: 'Panchasutra',
    reports: 'Reports',
    settings: 'Settings',
    sync: 'Sync Center'
  },
  member: {
    greeting: 'Good day',
    totalSavings: 'Total Personal Savings',
    activeLoan: 'Active Loan Outstanding',
    nextEmiDue: 'Next EMI Due',
    nextMeeting: 'Next Meeting',
    savingsGoal: 'Personal Savings Goal',
    quickActions: 'Quick Actions',
    paySavings: 'Deposit Savings (UPI)',
    repayEmi: 'Repay EMI (UPI)',
    viewPassbook: 'View Passbook',
    viewDossier: 'Member Profile',
    loanCalculator: 'Loan Calculator',
    selectMember: 'Viewing Member:'
  },
  passbook: {
    title: 'Member Passbook Register',
    subtitle: 'Cryptographically verified deposit and repayment records',
    allTransactions: 'All Records',
    savingsOnly: 'Savings Only',
    loansOnly: 'Loans Only',
    credit: 'Credit (+)',
    debit: 'Debit (-)',
    balance: 'Running Balance',
    fingerprint: 'Checkpoint Fingerprint'
  },
  loans: {
    title: 'Loan Lifecycle Management',
    lifecycle: 'Loan Lifecycle',
    application: 'Application',
    approved: 'Approved',
    disbursed: 'Disbursed',
    active: 'Active',
    closed: 'Closed',
    remainingBalance: 'Remaining Balance',
    monthlyInterest: 'Monthly Interest',
    repaymentProgress: 'Repayment Progress',
    nextDeduction: 'Next Due Date'
  },
  meeting: {
    title: 'Monthly Meeting Session',
    startMeeting: 'Start Monthly Meeting',
    step1Attendance: '1. Attendance',
    step2Quorum: '2. Quorum PIN',
    step3Savings: '3. Monthly Savings',
    step4Loans: '4. Internal Loans',
    step5Resolutions: '5. Proceedings',
    step6Cash: '6. Cash Reconciliation',
    step7Complete: '7. Complete',
    meetingComplete: 'Meeting Session Finalized & Committed',
    signatoriesVerified: '2-of-3 Officer PIN Quorum Verified'
  },
  panchasutra: {
    title: 'SHG Operational Health',
    subtitle: 'Internal group health scorecard based on Panchasutra-aligned measures',
    score: 'Operational Health',
    grade: 'Grade',
    whyThisScore: 'Score Breakdown',
    regularMeetings: 'Regular Meetings',
    regularSavings: 'Regular Savings',
    internalLending: 'Internal Lending',
    timelyRecovery: 'Timely Recovery',
    transparentBookkeeping: 'Transparent Books',
    bookkeeping: 'Transparent Books',
    disclaimer: 'Internal SHG operational indicator based on Panchasutra-aligned measures. It is not a bank credit rating or sanction decision.'
  },
  sync: {
    title: 'Data Synchronization Center',
    synced: 'Synced',
    pending: 'Pending Outbox',
    syncing: 'Syncing...',
    conflict: 'Attention Needed',
    offline: 'Offline Mode',
    lastSynced: 'Last Synchronized',
    syncNow: 'Sync Now',
    offlineMessage: 'You are offline. Your records are safely committed to IndexedDB on this device.',
    conflictNotice: 'Data mismatch detected between local and server version.',
    reviewConflicts: 'Review Conflicts'
  }
};
