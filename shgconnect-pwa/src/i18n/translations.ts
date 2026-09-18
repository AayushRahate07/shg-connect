import { SupportedLanguage } from '../types/shg';

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

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  mr: {
    appName: 'SHGConnect',
    appSubtitle: 'डिजिटल नोंदवही आणि विश्वासार्ह हिशोब',
    nav: {
      home: 'मुख्य पृष्ठ',
      members: 'सभासद',
      loans: 'कर्ज व्यवहार',
      meetings: 'मासिक बैठकी',
      passbook: 'माझे पासबुक',
      panchasutra: 'पंचसूत्र मूल्यमापन',
      reports: 'अहवाल',
      settings: 'सेटिंग्ज',
      sync: 'सिंक केंद्र'
    },
    member: {
      greeting: 'नमस्कार',
      totalSavings: 'एकूण व्यक्तिगत बचत',
      activeLoan: 'सुरू असलेले कर्ज',
      nextEmiDue: 'पुढील हप्ता (EMI)',
      nextMeeting: 'पुढील बैठक',
      savingsGoal: 'बचत ध्येय (Savings Goal)',
      quickActions: 'जलद कृती (Quick Actions)',
      paySavings: 'बचत जमा करा (UPI)',
      repayEmi: 'हप्ता भरा (UPI)',
      viewPassbook: 'पासबुक पहा',
      viewDossier: 'प्रोफाइल / तपशील',
      loanCalculator: 'कर्ज गणक',
      selectMember: 'सभासद निवडा:'
    },
    passbook: {
      title: 'डिजिटल पासबुक नोंद',
      subtitle: 'तुमच्या सर्व जमा व खर्चाच्या खात्रीशीर नोंदी',
      allTransactions: 'सर्व नोंदी',
      savingsOnly: 'फक्त बचत',
      loansOnly: 'फक्त कर्ज',
      credit: 'जमा (+)',
      debit: 'नावे (-)',
      balance: 'अंतिम शिल्लक',
      fingerprint: 'सुरक्षा कोड (Fingerprint)'
    },
    loans: {
      title: 'कर्ज व्यवस्थापन',
      lifecycle: 'कर्ज प्रवास',
      application: 'अर्ज',
      approved: 'मंजूर',
      disbursed: 'वितरित',
      active: 'सुरू',
      closed: 'पूर्ण / बंद',
      remainingBalance: 'बाकी कर्ज शिल्लक',
      monthlyInterest: 'मासिक व्याज दर',
      repaymentProgress: 'परतफेड प्रगती',
      nextDeduction: 'पुढील हप्त्याची तारीख'
    },
    meeting: {
      title: 'मासिक बैठक',
      startMeeting: 'नवीन बैठक सुरू करा',
      step1Attendance: '१. हजेरी',
      step2Quorum: '२. अधिकारी स्वाक्षरी',
      step3Savings: '३. मासिक बचत जमा',
      step4Loans: '४. अंतर्गत कर्ज',
      step5Resolutions: '५. इतिवृत्त / ठराव',
      step6Cash: '६. बचत पेटी मोजणी',
      step7Complete: '७. बैठक पूर्ण',
      meetingComplete: 'बैठक यशस्वीरीत्या पूर्ण झाली!',
      signatoriesVerified: '२-पैकी-३ अधिकारी पिन प्रमाणित'
    },
    panchasutra: {
      title: 'बचत गट कार्यक्षमता आरोग्य (SHG Operational Health)',
      subtitle: 'पंचसूत्रावर आधारित अंतर्गत कार्यक्षमता निर्देशक',
      score: 'कार्यक्षमता आरोग्य (Operational Health)',
      grade: 'श्रेणी (Grade)',
      whyThisScore: 'गुण विश्लेषण',
      regularMeetings: 'नियमित बैठकी',
      regularSavings: 'नियमित बचत',
      internalLending: 'अंतर्गत कर्जबजाारी',
      timelyRecovery: 'वेळेवर परतफेड',
      transparentBookkeeping: 'पारदर्शक हिशोब',
      bookkeeping: 'पारदर्शक हिशोब',
      disclaimer: 'सदर स्कोअर पंचसूत्रावर आधारित अंतर्गत कार्यक्षमता निर्देशांक आहे. हा बँकेचा अधिकृत क्रेडिट रेटिंग किंवा कर्ज मंजुरीचा निर्णय नाही.'
    },
    sync: {
      title: 'डेटा सिंक केंद्र',
      synced: 'अद्ययावत (Synced)',
      pending: 'नोंदी प्रलंबित',
      syncing: 'सिंक होत आहे...',
      conflict: 'सुधारणा आवश्यक',
      offline: 'ऑफलाइन मोड',
      lastSynced: 'शेवटचे सिंक',
      syncNow: 'आता सिंक करा',
      offlineMessage: 'तुम्ही सध्या ऑफलाइन आहात. सर्व नोंदी तुमच्या फोनवर सुरक्षित आहेत.',
      conflictNotice: 'दुसऱ्या फोनवरील नोंदींमध्ये तफावत आढळली आहे.',
      reviewConflicts: 'तफावत तपासा'
    }
  },
  hi: {
    appName: 'SHGConnect',
    appSubtitle: 'डिजिटल रजिस्टर एवं विश्वस्त बही-खाता',
    nav: {
      home: 'मुख्य पृष्ठ',
      members: 'सदस्य',
      loans: 'ऋण प्रबंधन',
      meetings: 'मासिक बैठक',
      passbook: 'मेरा पासबुक',
      panchasutra: 'पंचसूत्र मूल्यांकन',
      reports: 'रिपोर्ट',
      settings: 'सेटिंग्स',
      sync: 'सिंक केंद्र'
    },
    member: {
      greeting: 'नमस्ते',
      totalSavings: 'कुल व्यक्तिगत बचत',
      activeLoan: 'सक्रिय ऋण',
      nextEmiDue: 'अगली किस्त (EMI)',
      nextMeeting: 'अगली बैठक',
      savingsGoal: 'बचत लक्ष्य (Savings Goal)',
      quickActions: 'त्वरित कार्रवाई',
      paySavings: 'बचत जमा करें (UPI)',
      repayEmi: 'किस्त चुकाएं (UPI)',
      viewPassbook: 'पासबुक देखें',
      viewDossier: 'प्रोफाइल विवरण',
      loanCalculator: 'ऋण कैलकुलेटर',
      selectMember: 'सदस्य चुनें:'
    },
    passbook: {
      title: 'डिजिटल पासबुक रिकॉर्ड',
      subtitle: 'आपकी जमा और भुगतान की विश्वसनीय प्रविष्टियां',
      allTransactions: 'सभी लेन-देन',
      savingsOnly: 'केवल बचत',
      loansOnly: 'केवल ऋण',
      credit: 'जमा (+)',
      debit: 'निकासी (-)',
      balance: 'अंतिम शेष',
      fingerprint: 'सुरक्षा कोड'
    },
    loans: {
      title: 'ऋण प्रबंधन',
      lifecycle: 'ऋण चक्र',
      application: 'आवेदन',
      approved: 'स्वीकृत',
      disbursed: 'वितरित',
      active: 'सक्रिय',
      closed: 'पूर्ण / बंद',
      remainingBalance: 'शेष ऋण राशि',
      monthlyInterest: 'मासिक ब्याज दर',
      repaymentProgress: 'पुनर्भुगतान प्रगति',
      nextDeduction: 'अगली देय तिथि'
    },
    meeting: {
      title: 'मासिक बैठक',
      startMeeting: 'नई बैठक शुरू करें',
      step1Attendance: '1. उपस्थिति',
      step2Quorum: '2. अधिकारी पिन',
      step3Savings: '3. बचत संग्रह',
      step4Loans: '4. आन्तरिक ऋण',
      step5Resolutions: '5. प्रस्ताव पंजी',
      step6Cash: '6. नकदी मिलान',
      step7Complete: '7. पूर्ण',
      meetingComplete: 'बैठक सफलतापूर्वक पूर्ण हुई!',
      signatoriesVerified: '2-में-से-3 अधिकारी पिन सत्यापित'
    },
    panchasutra: {
      title: 'एसएचजी कार्यक्षमता स्वास्थ्य (SHG Operational Health)',
      subtitle: 'पंचसूत्र पर आधारित आंतरिक परिचालन मूल्यांकन',
      score: 'परिचालन स्वास्थ्य (Operational Health)',
      grade: 'श्रेणी (Grade)',
      whyThisScore: 'अंक विश्लेषण',
      regularMeetings: 'नियमित बैठकें',
      regularSavings: 'नियमित बचत',
      internalLending: 'आंतरिक ऋण',
      timelyRecovery: 'समय पर वसूली',
      transparentBookkeeping: 'पारदर्शी खाता',
      bookkeeping: 'पारदर्शी खाता',
      disclaimer: 'यह स्कोर पंचसूत्र पर आधारित आंतरिक परिचालन सूचकांक है। यह बैंक का आधिकारिक क्रेडिट रेटिंग या ऋण स्वीकृति निर्णय नहीं है।'
    },
    sync: {
      title: 'डेटा सिंक केंद्र',
      synced: 'अद्यतन (Synced)',
      pending: 'प्रविष्टियां लंबित',
      syncing: 'सिंक हो रहा है...',
      conflict: 'सुधार आवश्यक',
      offline: 'ऑफलाइन मोड',
      lastSynced: 'अंतिम सिंक',
      syncNow: 'अभी सिंक करें',
      offlineMessage: 'आप ऑफ़लाइन हैं। सभी प्रविष्टियाँ आपके फ़ोन पर सुरक्षित हैं।',
      conflictNotice: 'अन्य डिवाइस की प्रविष्टियों में भिन्नता पाई गई है।',
      reviewConflicts: 'समीक्षा करें'
    }
  },
  en: {
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
  }
};
