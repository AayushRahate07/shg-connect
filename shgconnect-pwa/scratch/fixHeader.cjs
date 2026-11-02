const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/Header.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

file = file.replace(
  '  unreadNotificationsCount = 0,\n  onOpenNotifications,\n}) => {\n  onLogout,\n}) => {',
  '  unreadNotificationsCount = 0,\n  onOpenNotifications,\n}) => {'
);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('Fixed Header.tsx syntax');
