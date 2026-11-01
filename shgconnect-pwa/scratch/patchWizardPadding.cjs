const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/MeetingWizard.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

file = file.replace(
  '<div className="bg-[#FDFBF7] rounded-3xl shadow-2xl border-2 border-[#14532D] overflow-hidden">',
  '<div className="bg-[#FDFBF7] rounded-3xl shadow-xl border border-emerald-900/20 overflow-hidden mb-12 sm:mb-6">'
);

file = file.replace(
  '<div className="bg-[#14532D] text-white p-5">',
  '<div className="bg-[#14532D] text-white p-4 sm:p-5">'
);

file = file.replace(
  '<div className="p-6">',
  '<div className="p-4 sm:p-6">'
);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('Wizard padding updated');
