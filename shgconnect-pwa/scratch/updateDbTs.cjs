const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../src/services/db.ts');
let content = fs.readFileSync(dbPath, 'utf-8');
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// Replace activeGroup return logic in seedInitialDataIfNeeded
const oldReturnBlock = `  const activeGroup = groupList.length > 0 ? groupList[0] : INITIAL_GROUP;
  return {
    group: activeGroup,
    members,
    transactions,
    loans,
    meetings,
    officers: DEFAULT_OFFICERS
  };`;

const newReturnBlock = `  // Verify that all 7 groups and all 70 members are seeded in IndexedDB
  const groupsSeedV2 = typeof localStorage !== 'undefined' ? localStorage.getItem('shg_7groups_seeded_v2') : null;
  if (groupList.length < 7 || members.length < 70 || groupsSeedV2 !== 'COMPLETED') {
    try {
      const tx = db.transaction(['group_info', 'members', 'loans'], 'readwrite');
      DEMO_ASSIGNED_GROUPS.forEach(g => tx.objectStore('group_info').put(g));
      DEMO_MEMBERS.forEach(m => tx.objectStore('members').put(m));
      DEMO_LOANS.forEach(l => tx.objectStore('loans').put(l));
      await new Promise<void>((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('shg_7groups_seeded_v2', 'COMPLETED');
      }
      groupList = await getAllFromStore<GroupInfo>('group_info');
      members = await getAllFromStore<Member>('members');
      loans = await getAllFromStore<Loan>('loans');
    } catch (e) {
      console.error('Failed to seed 7 SHG groups into IndexedDB:', e);
    }
  }

  const targetShgId = getCurrentShgId();
  const activeGroup = groupList.find(g => g.shgCode === targetShgId) || groupList[0] || INITIAL_GROUP;
  const activeMembers = members.filter(m => (m.shgId || 'SHG-MH-SAT-2024-0089') === activeGroup.shgCode);
  const activeLoans = loans.filter(l => (l.shgId || 'SHG-MH-SAT-2024-0089') === activeGroup.shgCode);
  const activeMeetings = meetings.filter(m => (m.shgId || 'SHG-MH-SAT-2024-0089') === activeGroup.shgCode || !m.shgId);

  return {
    group: activeGroup,
    members: activeMembers.length > 0 ? activeMembers : members.slice(0, 10),
    transactions,
    loans: activeLoans,
    meetings: activeMeetings,
    officers: DEFAULT_OFFICERS
  };`;

if (!content.includes(oldReturnBlock)) {
  console.error('Could not find oldReturnBlock in db.ts!');
  process.exit(1);
}

content = content.replace(oldReturnBlock, newReturnBlock);

// Update getAllCachedGroups and add getMembersByShg & getLoansByShg
const oldCachedGroups = `export async function getAllCachedGroups(): Promise<GroupInfo[]> {
  const groups = await getAllFromStore<GroupInfo>('group_info');
  return groups;
}`;

const newCachedGroups = `export async function getAllCachedGroups(): Promise<GroupInfo[]> {
  const groups = await getAllFromStore<GroupInfo>('group_info');
  if (groups.length >= 7) return groups;
  await seedInitialDataIfNeeded();
  return await getAllFromStore<GroupInfo>('group_info');
}

export async function getMembersByShg(shgId?: string): Promise<Member[]> {
  const targetShgId = shgId || getCurrentShgId();
  const allMembers = await getAllFromStore<Member>('members');
  return allMembers.filter(m => (m.shgId || 'SHG-MH-SAT-2024-0089') === targetShgId);
}

export async function getLoansByShg(shgId?: string): Promise<Loan[]> {
  const targetShgId = shgId || getCurrentShgId();
  const allLoans = await getAllFromStore<Loan>('loans');
  return allLoans.filter(l => (l.shgId || 'SHG-MH-SAT-2024-0089') === targetShgId);
}`;

if (!content.includes(oldCachedGroups)) {
  console.error('Could not find oldCachedGroups in db.ts!');
  process.exit(1);
}

content = content.replace(oldCachedGroups, newCachedGroups);

if (isCrlf) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(dbPath, content, 'utf-8');
console.log('Successfully updated db.ts with 7 SHG database queries!');
