const fs = require('fs');
const path = require('path');

const obdPath = path.resolve(__dirname, '../src/pages/OfficeBearerDashboard.tsx');
let content = fs.readFileSync(obdPath, 'utf-8');
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

const oldSignature = `  onCompleteMeetingSession: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[]
  ) => void;`;

const newSignature = `  onCompleteMeetingSession: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => Promise<void> | void;`;

content = content.replace(oldSignature, newSignature);
if (isCrlf) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(obdPath, content, 'utf-8');
console.log('Updated OfficeBearerDashboard.tsx signature successfully');
