export interface TranslationDictionary {
  appName: string;
  appSubtitle: string;
  nav: {
    home: string;
    members: string;
    loans: string;
    meetings: string;
    passbook: string;
    panchasutra: string;
    reports: string;
    settings: string;
    sync: string;
  };
  member: {
    greeting: string;
    totalSavings: string;
    activeLoan: string;
    nextEmiDue: string;
    nextMeeting: string;
    savingsGoal: string;
    quickActions: string;
    paySavings: string;
    repayEmi: string;
    viewPassbook: string;
    viewDossier: string;
    loanCalculator: string;
    selectMember: string;
  };
  passbook: {
    title: string;
    subtitle: string;
    allTransactions: string;
    savingsOnly: string;
    loansOnly: string;
    credit: string;
    debit: string;
    balance: string;
    fingerprint: string;
  };
  loans: {
    title: string;
    lifecycle: string;
    application: string;
    approved: string;
    disbursed: string;
    active: string;
    closed: string;
    remainingBalance: string;
    monthlyInterest: string;
    repaymentProgress: string;
    nextDeduction: string;
  };
  meeting: {
    title: string;
    startMeeting: string;
    step1Attendance: string;
    step2Quorum: string;
    step3Savings: string;
    step4Loans: string;
    step5Resolutions: string;
    step6Cash: string;
    step7Complete: string;
    meetingComplete: string;
    signatoriesVerified: string;
  };
  panchasutra: {
    title: string;
    subtitle: string;
    score: string;
    grade: string;
    whyThisScore: string;
    regularMeetings: string;
    regularSavings: string;
    internalLending: string;
    timelyRecovery: string;
    transparentBookkeeping: string;
    bookkeeping: string;
    disclaimer: string;
  };
  sync: {
    title: string;
    synced: string;
    pending: string;
    syncing: string;
    conflict: string;
    offline: string;
    lastSynced: string;
    syncNow: string;
    offlineMessage: string;
    conflictNotice: string;
    reviewConflicts: string;
  };
}
