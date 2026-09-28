import { Member, Loan, Meeting, Resolution, SHGGroupInfo } from '../types/shg';
import { GroupInfo } from './db';

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

export const DEMO_MEMBERS: Member[] = [
  { id: "mem-1", name: "Kamal-tai Patil", nameRegional: "कमलताई पाटील", phone: "9823011223", role: "OFFICE_BEARER", totalSavings: 18500, activeLoanBalance: 0, trustScore: 98, avatarColor: "bg-amber-500", entityVersion: 1 },
  { id: "mem-2", name: "Sunita-bai Deshmukh", nameRegional: "सुनिताबाई देशमुख", phone: "9422033445", role: "ANIMATOR", totalSavings: 21000, activeLoanBalance: 12000, trustScore: 95, avatarColor: "bg-emerald-600", entityVersion: 1 },
  { id: "mem-3", name: "Anita-tai Shinde", nameRegional: "अनिताताई शिंदे", phone: "9765088990", role: "MEMBER", totalSavings: 14500, activeLoanBalance: 5000, trustScore: 92, avatarColor: "bg-blue-600", entityVersion: 1 },
  { id: "mem-4", name: "Meena-bai Jadhav", nameRegional: "मीनाबाई जाधव", phone: "9890122334", role: "MEMBER", totalSavings: 16000, activeLoanBalance: 0, trustScore: 90, avatarColor: "bg-purple-600", entityVersion: 1 },
  { id: "mem-5", name: "Rukmini-tai Kulkarni", nameRegional: "रुक्मिणीताई कुलकर्णी", phone: "9158044556", role: "MEMBER", totalSavings: 14500, activeLoanBalance: 0, trustScore: 88, avatarColor: "bg-rose-600", entityVersion: 1 },
  { id: "mem-6", name: "Asha-tai Pawar", nameRegional: "आशाताई पवार", phone: "9822155667", role: "MEMBER", totalSavings: 12000, activeLoanBalance: 8000, trustScore: 94, avatarColor: "bg-[#14532D]", entityVersion: 1 },
  { id: "mem-7", name: "Sangeeta-bai Chavan", nameRegional: "संगीताबाई चव्हाण", phone: "9423988776", role: "MEMBER", totalSavings: 15500, activeLoanBalance: 0, trustScore: 91, avatarColor: "bg-indigo-600", entityVersion: 1 },
  { id: "mem-8", name: "Lata-bai More", nameRegional: "लताबाई मोरे", phone: "9850123456", role: "MEMBER", totalSavings: 13000, activeLoanBalance: 6000, trustScore: 89, avatarColor: "bg-teal-600", entityVersion: 1 }
];

export const DEMO_LOANS: Loan[] = [
  { id: "loan-101", memberId: "mem-2", memberName: "Sunita-bai Deshmukh", principal: 20000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 8000, remainingBalance: 12000, status: 'ACTIVE', dateDisbursed: "2024-05-15", entityVersion: 1 },
  { id: "loan-102", memberId: "mem-3", memberName: "Anita-tai Shinde", principal: 10000, interestRateMonthly: 1.5, tenureMonths: 6, totalPaid: 5000, remainingBalance: 5000, status: 'ACTIVE', dateDisbursed: "2024-06-10", entityVersion: 1 },
  { id: "loan-103", memberId: "mem-6", memberName: "Asha-tai Pawar", principal: 15000, interestRateMonthly: 1.5, tenureMonths: 12, totalPaid: 7000, remainingBalance: 8000, status: 'ACTIVE', dateDisbursed: "2024-04-01", entityVersion: 1 },
  { id: "loan-104", memberId: "mem-8", memberName: "Lata-bai More", principal: 10000, interestRateMonthly: 1.5, tenureMonths: 10, totalPaid: 4000, remainingBalance: 6000, status: 'ACTIVE', dateDisbursed: "2024-07-20", entityVersion: 1 }
];

export const DEMO_MEETINGS: Meeting[] = [
  { id: "meet-1", date: "2026-09-18", meetingNumber: 15, totalSavingsCollected: 4000, totalEmiCollected: 4500, totalDisbursed: 0, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": true, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true }, checkpointFingerprint: "CHK-8F2A-99B1-4C10" },
  { id: "meet-2", date: "2026-09-10", meetingNumber: 14, totalSavingsCollected: 4000, totalEmiCollected: 4500, totalDisbursed: 10000, attendanceRecord: { "mem-1": true, "mem-2": true, "mem-3": true, "mem-4": false, "mem-5": true, "mem-6": true, "mem-7": true, "mem-8": true }, checkpointFingerprint: "CHK-7D1E-03A8-912F" }
];
