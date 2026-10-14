import { TranslationDictionary } from './types';

export const mr: TranslationDictionary = {
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
};
