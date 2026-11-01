const fs = require('fs');
const path = require('path');

const sidebarPath = path.resolve(__dirname, '../src/components/layout/Sidebar.tsx');
let content = fs.readFileSync(sidebarPath, 'utf-8');
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

content = content.replace(
  '  UserCheck\n} from \'lucide-react\';',
  '  UserCheck,\n  Activity\n} from \'lucide-react\';'
);

if (isCrlf) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(sidebarPath, content, 'utf-8');
console.log('Added Activity to Sidebar.tsx imports');
