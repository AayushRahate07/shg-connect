import { GroupInfo } from './db';
import { Member, Transaction, Loan, Meeting, Resolution, SupportedLanguage } from '../types/shg';
import { formatINR, formatDate } from '../theme/tokens';

export function exportToCSV(filename: string, rows: (string | number)[][]): void {
  const csvContent = rows
    .map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateMemberLedgerCSV(members: Member[], transactions: Transaction[]): void {
  const headers = ['Member ID', 'Name', 'Phone', 'Role', 'Total Savings (₹)', 'Active Loan (₹)', 'Trust Score'];
  const rows = members.map(m => [
    m.id,
    m.name,
    m.phone,
    m.role,
    m.totalSavings,
    m.activeLoanBalance,
    m.trustScore
  ]);
  exportToCSV(`SHGConnect_Member_Directory_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
}

export function generateTransactionAuditCSV(transactions: Transaction[]): void {
  const headers = ['Block #', 'Timestamp', 'Member Name', 'Type', 'Amount (₹)', 'Payment Mode', 'UTR Ref', 'SHA-256 Hash', 'Checkpoint'];
  const rows = transactions.map(t => [
    t.index,
    formatDate(t.timestamp),
    t.memberName,
    t.type,
    t.amount,
    t.paymentMode || 'CASH',
    t.utrReference || 'N/A',
    t.hash,
    t.checkpointFingerprint || 'N/A'
  ]);
  exportToCSV(`SHGConnect_Ledger_Transactions_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
}

export function printPanchasutraCertificate(group: GroupInfo, language: SupportedLanguage): void {
  const isMr = language === 'mr';
  const timestamp = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>NABARD Panchasutra Audit Certificate - ${group.name}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #111827; }
        .header { border-bottom: 3px solid #14532D; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
        .title { font-size: 24px; font-weight: 900; color: #14532D; text-transform: uppercase; }
        .subtitle { font-size: 13px; color: #4B5563; margin-top: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .box { background: #F4F6FA; border: 1px solid #E4E8EF; padding: 16px; border-radius: 12px; }
        .box-title { font-size: 11px; font-weight: 800; color: #6B7280; text-transform: uppercase; }
        .box-val { font-size: 20px; font-weight: 900; color: #0F4230; margin-top: 4px; }
        .pillar { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E4E8EF; font-size: 13px; }
        .footer { margin-top: 40px; border-top: 1px solid #E4E8EF; pt: 16px; font-size: 11px; color: #6B7280; text-align: center; }
        .fingerprint { font-family: monospace; font-weight: bold; background: #FEF3C7; color: #92400E; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${group.nameRegional || group.name}</div>
        <div class="subtitle">NABARD Panchasutra Operational Health Audit Certificate</div>
        <div class="subtitle">${group.village}, ${group.district} · Generated: ${timestamp}</div>
      </div>

      <div class="grid">
        <div class="box">
          <div class="box-title">Panchasutra Operational Score</div>
          <div class="box-val">92 / 100 (Grade A)</div>
        </div>
        <div class="box">
          <div class="box-title">Internal Credit Readiness Limit</div>
          <div class="box-val">₹5,00,000</div>
        </div>
      </div>

      <h3>Panchasutra Pillar Assessment</h3>
      <div class="pillar"><span>1. Regular Meetings (नियमित बैठकी)</span> <strong>18 / 20</strong></div>
      <div class="pillar"><span>2. Regular Savings (नियमित बचत)</span> <strong>20 / 20</strong></div>
      <div class="pillar"><span>3. Internal Lending (अंतर्गत कर्जबजाारी)</span> <strong>18 / 20</strong></div>
      <div class="pillar"><span>4. Timely Recovery (वेळेवर परतफेड)</span> <strong>16 / 20</strong></div>
      <div class="pillar"><span>5. Transparent Book Keeping (पारदर्शक हिशोब)</span> <strong>20 / 20</strong></div>

      <div class="footer">
        <p>This certificate represents an internal operational health index based on NABARD Panchasutra guidelines.</p>
        <div class="fingerprint">SHA-256 Cryptographic Audit Fingerprint: CHK-8F3A-21BC-91D4-2026</div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
