const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/AnimatorDashboard.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

file = file.replace(
  '  onCompleteMeetingSession?: (\n    attendanceRecord: Record<string, boolean>,\n    savingsCollected: { memberId: string; amount: number }[],\n    loanDisbursed?: { memberId: string; amount: number; notes: string },\n    newResolutions?: Omit<Resolution, \'id\' | \'resolutionNumber\'>[],\n    signatories?: OfficerSignature[],\n    signatureProof?: string\n  ) => Promise<void> | void;\n}',
  '  onCompleteMeetingSession?: (\n    attendanceRecord: Record<string, boolean>,\n    savingsCollected: { memberId: string; amount: number }[],\n    loanDisbursed?: { memberId: string; amount: number; notes: string },\n    newResolutions?: Omit<Resolution, \'id\' | \'resolutionNumber\'>[],\n    signatories?: OfficerSignature[],\n    signatureProof?: string\n  ) => Promise<void> | void;\n  onSaveLeadership?: (\n    shgCode: string,\n    assignments: {\n      presidentMemberId: string;\n      treasurerMemberId: string;\n      secretaryMemberId?: string;\n    }\n  ) => Promise<void> | void;\n}'
);

file = file.replace(
  '  onSwitchShg,\n  onCompleteMeetingSession\n}) => {',
  '  onSwitchShg,\n  onCompleteMeetingSession,\n  onSaveLeadership\n}) => {'
);

file = file.replace(
  '              onOpenAddMember={onOpenAddMember}\n              onStartMeetingForSHG={handleStartMeetingForSHG}\n            />',
  '              onOpenAddMember={onOpenAddMember}\n              onStartMeetingForSHG={handleStartMeetingForSHG}\n              onSaveLeadership={onSaveLeadership}\n            />'
);

// Do it for both occurrences (home and members tabs)
file = file.replace(
  '              onOpenAddMember={onOpenAddMember}\n              onStartMeetingForSHG={handleStartMeetingForSHG}\n            />',
  '              onOpenAddMember={onOpenAddMember}\n              onStartMeetingForSHG={handleStartMeetingForSHG}\n              onSaveLeadership={onSaveLeadership}\n            />'
);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('AnimatorDashboard.tsx updated successfully');
