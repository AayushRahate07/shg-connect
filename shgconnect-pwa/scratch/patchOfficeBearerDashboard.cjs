const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/OfficeBearerDashboard.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

// Normalize CRLF to LF for predictable matching
const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

const targetStr = `  return (
    <div className="space-y-6">
      {/* ── Group Hero Banner ── */}`;

const replacementStr = `  if (showWizard) {
    return (
      <div className="space-y-4 animate-fadeIn">
        {/* Active Meeting Session Header */}
        <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                {language === 'mr' ? 'बैठक संचालन सत्र' : 'Active Meeting Session'}
              </span>
              <h2 className="font-black text-sm sm:text-base text-stone-900 leading-tight mt-0.5 truncate">
                {language === 'mr' ? group.nameRegional : group.name} · #{meetings.length + 1}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowWizard(false)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition active:scale-95 flex-shrink-0"
          >
            ✕ {language === 'mr' ? 'बाहेर पडा' : 'Exit'}
          </button>
        </div>

        <MeetingWizard
          members={members}
          language={language}
          monthlySavingsAmount={group.monthlyPoolRate || 500}
          onCancel={() => setShowWizard(false)}
          onCompleteMeeting={async (attendance, savings, loan, resolutions, signatories, proof) => {
            await onCompleteMeetingSession(attendance, savings, loan, resolutions, signatories, proof);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Group Hero Banner ── */}`;

if (!file.includes(targetStr)) {
  console.error('Target string not found');
  process.exit(1);
}

file = file.replace(targetStr, replacementStr);

const oldTernary = `      {/* Guided 7-Step Meeting Wizard */}
      {showWizard ? (
        <MeetingWizard
          members={members}
          language={language}
          monthlySavingsAmount={group.monthlyPoolRate || 500}
          onCancel={() => setShowWizard(false)}
          onCompleteMeeting={async (attendance, savings, loan, resolutions, signatories, proof) => {
            await onCompleteMeetingSession(attendance, savings, loan, resolutions, signatories, proof);
          }}
        />
      ) : (
        <>`;

const newTernary = `      {/* Dynamic Tab Body */}
      <>`;

if (!file.includes(oldTernary)) {
  console.error('Old ternary not found');
  process.exit(1);
}

file = file.replace(oldTernary, newTernary);

const oldEnd = `          )}
        </>
      )}
    </div>`;

const newEnd = `          )}
        </>
    </div>`;

if (!file.includes(oldEnd)) {
  console.error('Old end not found');
  process.exit(1);
}

file = file.replace(oldEnd, newEnd);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('Successfully updated OfficeBearerDashboard.tsx');
