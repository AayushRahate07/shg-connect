const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/layout/AppShell.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

file = file.replace(
  '  parentTabLabel?: string;\n  demoMode?: boolean;\n  onLogout?: () => void;\n}',
  '  parentTabLabel?: string;\n  demoMode?: boolean;\n  onLogout?: () => void;\n  unreadNotificationsCount?: number;\n  onOpenNotifications?: () => void;\n}'
);

file = file.replace(
  '  parentTabLabel,\n  demoMode = true,\n  onLogout\n}) => {',
  '  parentTabLabel,\n  demoMode = true,\n  onLogout,\n  unreadNotificationsCount,\n  onOpenNotifications\n}) => {'
);

file = file.replace(
  '          parentTabLabel={parentTabLabel}\n          onLogout={onLogout}\n        />',
  '          parentTabLabel={parentTabLabel}\n          onLogout={onLogout}\n          unreadNotificationsCount={unreadNotificationsCount}\n          onOpenNotifications={onOpenNotifications}\n        />'
);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('AppShell.tsx updated successfully');
