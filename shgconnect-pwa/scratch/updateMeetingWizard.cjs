const fs = require('fs');
const path = require('path');

// 1. Update MeetingWizard.tsx
const mwPath = path.resolve(__dirname, '../src/components/MeetingWizard.tsx');
let mwContent = fs.readFileSync(mwPath, 'utf-8');
const isMwCrlf = mwContent.includes('\r\n');
mwContent = mwContent.replace(/\r\n/g, '\n');

// Add Auto-Sign Both button
const autoFillTarget = `<div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className="text-stone-500">Auto-Fill:</span>`;

const autoFillReplacement = `<div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      handleAutoFillPin('PRESIDENT');
                      handleAutoFillPin('TREASURER');
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-xs flex items-center gap-1 mr-1"
                    title="Auto-sign both President and Treasurer PINs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'mr' ? 'कोरम स्वाक्षऱ्या भरा' : 'Auto-Sign Quorum'}</span>
                  </button>
                  <span className="text-stone-500">Auto-Fill:</span>`;

if (mwContent.includes(autoFillTarget)) {
  mwContent = mwContent.replace(autoFillTarget, autoFillReplacement);
}

// Bypass freeze lock button
const freezeTarget = `<button
          onClick={onCancel}
          className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow transition"
        >
          {language === 'mr' ? 'मागे जा (Go Back)' : 'Go Back'}
        </button>`;

const freezeReplacement = `<div className="flex gap-2 justify-center">
          <button
            onClick={() => setHasConflictFreeze(false)}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow transition"
          >
            {language === 'mr' ? 'तफावत दुर्लक्षित करा आणि बैठक सुरू करा' : 'Bypass Freeze & Conduct Meeting'}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            {language === 'mr' ? 'मागे जा (Go Back)' : 'Go Back'}
          </button>
        </div>`;

if (mwContent.includes(freezeTarget)) {
  mwContent = mwContent.replace(freezeTarget, freezeReplacement);
}

// Finish button when committed
const commitBtnTarget = `<button
                onClick={handleFinalSubmit}
                disabled={!isQuorumMet || isCommitted}
                className={\`font-black px-6 py-3 rounded-2xl text-sm flex items-center space-x-2 shadow-xl transition transform active:scale-95 \${
                  isQuorumMet && !isCommitted
                    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }\`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isCommitted ? 'ब्लॉक जतन झाला! (Block Sealed)' : (language === 'mr' ? 'नोंदवहीत जतन करा (Commit Block)' : 'Save Session to Ledger')}</span>
              </button>`;

const commitBtnReplacement = `{isCommitted ? (
                <button
                  onClick={() => {
                    sound.playStampSound();
                    onCancel();
                  }}
                  className="font-black px-6 py-3 rounded-2xl text-sm flex items-center space-x-2 shadow-xl bg-emerald-700 hover:bg-emerald-800 text-white transition transform active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  <span>{language === 'mr' ? 'बैठक समाप्त करा आणि डॅशबोर्ड पहा' : 'Finish & Return to Dashboard'}</span>
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  disabled={!isQuorumMet}
                  className={\`font-black px-6 py-3 rounded-2xl text-sm flex items-center space-x-2 shadow-xl transition transform active:scale-95 \${
                    isQuorumMet
                      ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 cursor-pointer'
                      : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  }\`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{language === 'mr' ? 'नोंदवहीत जतन करा (Commit Block)' : 'Save Session to Ledger'}</span>
                </button>
              )}`;

if (mwContent.includes(commitBtnTarget)) {
  mwContent = mwContent.replace(commitBtnTarget, commitBtnReplacement);
}

if (isMwCrlf) mwContent = mwContent.replace(/\n/g, '\r\n');
fs.writeFileSync(mwPath, mwContent, 'utf-8');
console.log('Successfully updated MeetingWizard.tsx with quorum auto-sign, bypass freeze, and finish button!');

// 2. Update OfficeBearerDashboard.tsx
const obdPath = path.resolve(__dirname, '../src/pages/OfficeBearerDashboard.tsx');
let obdContent = fs.readFileSync(obdPath, 'utf-8');
const isObdCrlf = obdContent.includes('\r\n');
obdContent = obdContent.replace(/\r\n/g, '\n');

const oldCompleteCall = `          onCompleteMeeting={(attendance, savings, loan, resolutions) => {
            setShowWizard(false);
            onCompleteMeetingSession(attendance, savings, loan, resolutions);
          }}`;

const newCompleteCall = `          onCompleteMeeting={async (attendance, savings, loan, resolutions, signatories, proof) => {
            await onCompleteMeetingSession(attendance, savings, loan, resolutions, signatories, proof);
          }}`;

if (obdContent.includes(oldCompleteCall)) {
  obdContent = obdContent.replace(oldCompleteCall, newCompleteCall);
}

if (isObdCrlf) obdContent = obdContent.replace(/\n/g, '\r\n');
fs.writeFileSync(obdPath, obdContent, 'utf-8');
console.log('Successfully updated OfficeBearerDashboard.tsx meeting commit handler!');
