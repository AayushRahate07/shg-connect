import { TranslationDictionary } from './types';

export const hi: TranslationDictionary = {
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
};
