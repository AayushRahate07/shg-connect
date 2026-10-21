import { Member, Loan, Meeting, Resolution, GroupInfo } from '../types/shg';

export const DEMO_GROUP_INFO: GroupInfo = {
  name: "Savitri Mahila Bachat Gat",
  nameRegional: "सावित्री महिला बचत गट",
  shgCode: "SHG-MH-SAT-2024-0089",
  village: "Shirwal",
  district: "Satara",
  monthlyPoolRate: 500,
  totalGroupFund: 84500,
  federation: {
    state: "Maharashtra",
    district: "Satara",
    block: "Khandala",
    gramPanchayat: "Shirwal Prabhag",
    villageOrganization: "Shirwal Gram Sangha",
    clfName: "Khandala Mahila Cluster Federation"
  }
};

export const DEMO_ASSIGNED_GROUPS: GroupInfo[] = [
  DEMO_GROUP_INFO,
  {
    name: "Jijau Mahila Bachat Gat",
    nameRegional: "जिजाऊ महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0090",
    village: "Lonand",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 62000,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Khandala",
      gramPanchayat: "Lonand Rural",
      villageOrganization: "Lonand Gram Sangha",
      clfName: "Khandala Mahila Cluster Federation"
    }
  },
  {
    name: "Muktai Mahila Bachat Gat",
    nameRegional: "मुक्ताई महिला बचत गट",
    shgCode: "SHG-MH-SAT-2024-0091",
    village: "Bhuinj",
    district: "Satara",
    monthlyPoolRate: 500,
    totalGroupFund: 48000,
    federation: {
      state: "Maharashtra",
      district: "Satara",
      block: "Wai",
      gramPanchayat: "Bhuinj Prabhag",
      villageOrganization: "Bhuinj Gram Sangha",
      clfName: "Wai Taluka Mahila Federation"
    }
  }
];

export const DEMO_CASH_BOX_DENOMINATIONS = [
  { denomination: 500, count: 12, total: 6000 },
  { denomination: 200, count: 25, total: 5000 },
  { denomination: 100, count: 48, total: 4800 },
  { denomination: 50, count: 22, total: 1100 },
  { denomination: 20, count: 35, total: 700 },
  { denomination: 10, count: 50, total: 500 }
];

export const DEMO_MEMBERS: Member[] = [
  { id: "mem-1", shgId: "SHG-MH-SAT-2024-0089", name: "Kamal-tai Patil", nameRegional: "कमलताई पाटील", phone: "8767993248", role: "OFFICE_BEARER", occupation: "Dairy Farming", totalSavings: 18500, activeLoanBalance: 0, trustScore: 98, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-2", shgId: "SHG-MH-SAT-2024-0089", name: "Sunita-bai Deshmukh", nameRegional: "सुनिताबाई देशमुख", phone: "9422033445", role: "OFFICE_BEARER", occupation: "Tailoring & Textile", totalSavings: 21000, activeLoanBalance: 12000, trustScore: 96, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-3", shgId: "SHG-MH-SAT-2024-0089", name: "Anita-tai Shinde", nameRegional: "अनिताताई शिंदे", phone: "9765088990", role: "OFFICE_BEARER", occupation: "Retail Grocery", totalSavings: 14500, activeLoanBalance: 5000, trustScore: 94, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-4", shgId: "SHG-MH-SAT-2024-0089", name: "Meena-bai Jadhav", nameRegional: "मीनाबाई जाधव", phone: "9890122334", role: "MEMBER", occupation: "Goat Farming", totalSavings: 16000, activeLoanBalance: 0, trustScore: 92, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-5", shgId: "SHG-MH-SAT-2024-0089", name: "Rukmini-tai Kulkarni", nameRegional: "रुक्मिणीताई कुलकर्णी", phone: "9158044556", role: "MEMBER", occupation: "Papad & Pickle Unit", totalSavings: 14500, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-6", shgId: "SHG-MH-SAT-2024-0089", name: "Asha-tai Pawar", nameRegional: "आशाताई पवार", phone: "9822155667", role: "MEMBER", occupation: "Organic Farming", totalSavings: 12000, activeLoanBalance: 8000, trustScore: 93, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-7", shgId: "SHG-MH-SAT-2024-0089", name: "Sangeeta-bai Chavan", nameRegional: "संगीताबाई चव्हाण", phone: "9423988776", role: "MEMBER", occupation: "Flour Mill", totalSavings: 15500, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-8", shgId: "SHG-MH-SAT-2024-0089", name: "Lata-bai More", nameRegional: "लताबाई मोरे", phone: "9850123456", role: "MEMBER", occupation: "Poultry Farming", totalSavings: 13000, activeLoanBalance: 6000, trustScore: 89, avatarColor: "bg-teal-600", entityVersion: 1 },
  { id: "mem-9", shgId: "SHG-MH-SAT-2024-0089", name: "Shobha-tai Bhosale", nameRegional: "शोभाताई भोसले", phone: "9822334455", role: "MEMBER", occupation: "Vegetable Vendor", totalSavings: 11500, activeLoanBalance: 14000, trustScore: 88, avatarColor: "bg-cyan-600", entityVersion: 1 },
  { id: "mem-10", shgId: "SHG-MH-SAT-2024-0089", name: "Ujjwala-bai Gaikwad", nameRegional: "उज्ज्वलाबाई गायकवाड", phone: "9867012345", role: "MEMBER", occupation: "Dairy Farming", totalSavings: 17000, activeLoanBalance: 0, trustScore: 95, avatarColor: "bg-fuchsia-600", entityVersion: 1 },
  { id: "mem-11", shgId: "SHG-MH-SAT-2024-0089", name: "Mangal-tai Thorat", nameRegional: "मंगलताई थोरात", phone: "9730456789", role: "MEMBER", occupation: "Bangles & Cosmetics", totalSavings: 9500, activeLoanBalance: 0, trustScore: 87, avatarColor: "bg-amber-600", entityVersion: 1 },
  { id: "mem-12", shgId: "SHG-MH-SAT-2024-0089", name: "Vandana-bai Salunkhe", nameRegional: "वंदनाबाई साळुंखे", phone: "9922567890", role: "MEMBER", occupation: "Garment Tailoring", totalSavings: 13500, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-lime-600", entityVersion: 1 },
  { id: "mem-13", shgId: "SHG-MH-SAT-2024-0089", name: "Chhaya-tai Jagtap", nameRegional: "छायाताई जगताप", phone: "9822789012", role: "MEMBER", occupation: "Drip Irrigation", totalSavings: 19000, activeLoanBalance: 22000, trustScore: 94, avatarColor: "bg-emerald-700", entityVersion: 1 },
  { id: "mem-14", shgId: "SHG-MH-SAT-2024-0089", name: "Rekha-bai Mane", nameRegional: "रेखाबाई माने", phone: "9420890123", role: "MEMBER", occupation: "General Store", totalSavings: 10000, activeLoanBalance: 0, trustScore: 89, avatarColor: "bg-sky-600", entityVersion: 1 },
  { id: "mem-15", shgId: "SHG-MH-SAT-2024-0089", name: "Savita-tai Mohite", nameRegional: "सविताताई मोहिते", phone: "9850901234", role: "MEMBER", occupation: "Handicrafts & Baskets", totalSavings: 8500, activeLoanBalance: 0, trustScore: 86, avatarColor: "bg-orange-600", entityVersion: 1 },
  { id: "mem-16", shgId: "SHG-MH-SAT-2024-0089", name: "Surekha-bai Ghorpade", nameRegional: "सुरेखाबाई घोरपडे", phone: "9890012345", role: "MEMBER", occupation: "Milk Collection Center", totalSavings: 16500, activeLoanBalance: 0, trustScore: 93, avatarColor: "bg-violet-600", entityVersion: 1 }
];

export const DEMO_LOANS: Loan[] = [
  { id: "loan-101", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-2", memberName: "Sunita-bai Deshmukh", principal: 20000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 8000, remainingBalance: 12000, status: 'ACTIVE', dateDisbursed: "2024-05-15", entityVersion: 1 },
  { id: "loan-102", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-3", memberName: "Anita-tai Shinde", principal: 10000, interestRateMonthly: 1.5, tenureMonths: 6, totalPaid: 5000, remainingBalance: 5000, status: 'ACTIVE', dateDisbursed: "2024-06-10", entityVersion: 1 },
  { id: "loan-103", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-6", memberName: "Asha-tai Pawar", principal: 15000, interestRateMonthly: 1.5, tenureMonths: 12, totalPaid: 7000, remainingBalance: 8000, status: 'ACTIVE', dateDisbursed: "2024-04-01", entityVersion: 1 },
  { id: "loan-104", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-8", memberName: "Lata-bai More", principal: 10000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 4000, remainingBalance: 6000, status: 'ACTIVE', dateDisbursed: "2024-07-20", entityVersion: 1 },
  { id: "loan-105", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-9", memberName: "Shobha-tai Bhosale", principal: 20000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 6000, remainingBalance: 14000, status: 'ACTIVE', dateDisbursed: "2024-08-05", entityVersion: 1 },
  { id: "loan-106", shgId: "SHG-MH-SAT-2024-0089", memberId: "mem-13", memberName: "Chhaya-tai Jagtap", principal: 30000, interestRateMonthly: 1.5, tenureMonths: 12, totalPaid: 8000, remainingBalance: 22000, status: 'ACTIVE', dateDisbursed: "2024-03-12", entityVersion: 1 }
];

export const DEMO_MEETINGS: Meeting[] = [
  { id: "meet-12", date: "2026-09-18", meetingNumber: 12, totalSavingsCollected: 8000, totalEmiCollected: 7200, totalDisbursed: 0, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-8F2A-99B1-4C10" },
  { id: "meet-11", date: "2026-08-18", meetingNumber: 11, totalSavingsCollected: 8000, totalEmiCollected: 7200, totalDisbursed: 20000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": false, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-7D1E-03A8-912F" },
  { id: "meet-10", date: "2026-07-18", meetingNumber: 10, totalSavingsCollected: 8000, totalEmiCollected: 6500, totalDisbursed: 10000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-4B8C-7E1A-22DF" },
  { id: "meet-9", date: "2026-06-18", meetingNumber: 9, totalSavingsCollected: 8000, totalEmiCollected: 6000, totalDisbursed: 10000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": false, "mem-16": true }, checkpointFingerprint: "CHK-1E99-4A3C-80EF" },
  { id: "meet-8", date: "2026-05-18", meetingNumber: 8, totalSavingsCollected: 8000, totalEmiCollected: 5500, totalDisbursed: 20000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-33D4-BB82-120C" },
  { id: "meet-7", date: "2026-04-18", meetingNumber: 7, totalSavingsCollected: 8000, totalEmiCollected: 4500, totalDisbursed: 15000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": false, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-9F01-77CC-55A1" },
  { id: "meet-6", date: "2026-03-18", meetingNumber: 6, totalSavingsCollected: 8000, totalEmiCollected: 3500, totalDisbursed: 30000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-22EA-9088-FE44" },
  { id: "meet-5", date: "2026-02-18", meetingNumber: 5, totalSavingsCollected: 8000, totalEmiCollected: 2500, totalDisbursed: 0, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-55BA-1200-CC88" },
  { id: "meet-4", date: "2026-01-18", meetingNumber: 4, totalSavingsCollected: 8000, totalEmiCollected: 2000, totalDisbursed: 0, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-8812-EE77-3311" },
  { id: "meet-3", date: "2025-12-18", meetingNumber: 3, totalSavingsCollected: 8000, totalEmiCollected: 1500, totalDisbursed: 0, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-4411-9988-AA22" },
  { id: "meet-2", date: "2025-11-18", meetingNumber: 2, totalSavingsCollected: 8000, totalEmiCollected: 0, totalDisbursed: 0, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-7D1E-03A8-912F" },
  { id: "meet-1", date: "2025-10-18", meetingNumber: 1, totalSavingsCollected: 8000, totalEmiCollected: 0, totalDisbursed: 0, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true, "mem-9": true, "mem-10": true, "mem-11": true, "mem-12": true, "mem-13": true, "mem-14": true, "mem-15": true, "mem-16": true }, checkpointFingerprint: "CHK-0001-INIT-8844" }
];
