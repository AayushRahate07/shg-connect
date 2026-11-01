const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/pages/AnimatorDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

content = content.replace(
  '  onOpenAddMember?: () => void;\n}',
  '  onOpenAddMember?: () => void;\n  onSwitchShg?: (shgId: string) => void;\n}'
);

content = content.replace(
  '  onOpenAddMember\n}) => {',
  '  onOpenAddMember,\n  onSwitchShg\n}) => {'
);

content = content.replace(
  `          onSelectSHG={(shgId) => {
            if (onSelectTab) onSelectTab('home');
          }}`,
  `          onSelectSHG={(shgId) => {
            if (onSwitchShg) onSwitchShg(shgId);
            if (onSelectTab) onSelectTab('home');
          }}`
);

if (isCrlf) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Updated AnimatorDashboard.tsx successfully');
