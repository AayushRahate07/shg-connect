const fs = require('fs');
const path = require('path');

const typePath = path.resolve(__dirname, '../src/types/shg.ts');
let content = fs.readFileSync(typePath, 'utf-8');
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

content = content.replace(
  'export interface Meeting {\n  id: string;',
  'export interface Meeting {\n  id: string;\n  shgId?: string;'
);

if (isCrlf) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(typePath, content, 'utf-8');
console.log('Added shgId?: string to Meeting interface in shg.ts');
