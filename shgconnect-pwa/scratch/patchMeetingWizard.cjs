const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/MeetingWizard.tsx');
let file = fs.readFileSync(filePath, 'utf-8');

const isCrlf = file.includes('\r\n');
if (isCrlf) file = file.replace(/\r\n/g, '\n');

// 1. Update Props interface to support async onCompleteMeeting
const oldProps = `interface MeetingWizardProps {
  members: Member[];
  language: SupportedLanguage;
  monthlySavingsAmount: number;
  onCompleteMeeting: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => void;
  onCancel: () => void;
}`;

const newProps = `interface MeetingWizardProps {
  members: Member[];
  language: SupportedLanguage;
  monthlySavingsAmount: number;
  onCompleteMeeting: (
    attendanceRecord: Record<string, boolean>,
    savingsCollected: { memberId: string; amount: number }[],
    loanDisbursed?: { memberId: string; amount: number; notes: string },
    newResolutions?: Omit<Resolution, 'id' | 'resolutionNumber'>[],
    signatories?: OfficerSignature[],
    signatureProof?: string
  ) => Promise<void> | void;
  onCancel: () => void;
}`;

if (!file.includes(oldProps)) {
  console.error('oldProps not found');
  process.exit(1);
}
file = file.replace(oldProps, newProps);

// 2. Add isSubmitting and commitSuccessData states
const oldStates = `  const [isCommitted, setIsCommitted] = useState<boolean>(false);
  const [committedSignatures, setCommittedSignatures] = useState<OfficerSignature[]>([]);`;

const newStates = `  const [isCommitted, setIsCommitted] = useState<boolean>(false);
  const [committedSignatures, setCommittedSignatures] = useState<OfficerSignature[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [commitSuccessData, setCommitSuccessData] = useState<{
    fingerprint: string;
    merkleRoot: string;
    savings: number;
    disbursed: number;
  } | null>(null);`;

if (!file.includes(oldStates)) {
  console.error('oldStates not found');
  process.exit(1);
}
file = file.replace(oldStates, newStates);

// 3. Update handleFinalSubmit with try/catch, async await, spinner, and resilient fallback
const oldHandleSubmit = `  const handleFinalSubmit = async () => {
    if (!isQuorumMet) {
      setPinErrorMsg(
        language === 'mr'
          ? 'किमान २ पदाधिकाऱ्यांची पिन स्वाक्षरी आवश्यक आहे'
          : 'Minimum 2 officer PIN signatures required'
      );
      return;
    }

    sound.playStampSound();
    const confirmedSigs: OfficerSignature[] = selectedRoles
      .filter(r => verifiedSignatures[r])
      .map(r => {
        const off = DEFAULT_OFFICERS.find(o => o.role === r);
        return {
          role: r,
          signedAt: new Date().toISOString(),
          officerName: off ? off.name : r
        };
      });

    setCommittedSignatures(confirmedSigs);

    // Compute signatureProof hash
    const concatSigners = confirmedSigs.map(s => \`\${s.role}:\${s.signedAt}\`).join('|');
    const proofHash = await calculateSHA256(concatSigners);

    const savingsList = Object.entries(savingsAmounts)
      .filter(([_, amt]) => amt > 0)
      .map(([mId, amt]) => ({ memberId: mId, amount: amt }));

    let loanData = undefined;
    if (disburseLoan && selectedLoanMemberId && loanAmount > 0) {
      loanData = {
        memberId: selectedLoanMemberId,
        amount: loanAmount,
        notes: loanPurpose
      };
    }

    // Emit Quorum Authenticated and Meeting Committed events to eventBus
    await eventBus.emit(
      {
        type: 'QUORUM_SIGNATURES_AUTHENTICATED',
        payload: {
          officerRoles: confirmedSigs.map(s => s.role),
          sessionHash: proofHash
        }
      },
      {
        shgId: 'SHG-MH-2024-884',
        actorId: confirmedSigs[0]?.role || 'TREASURER',
        actorRole: (confirmedSigs[0]?.role as any) || 'TREASURER',
        deviceId: 'dev-pwa-local'
      }
    );

    await eventBus.emit(
      {
        type: 'MEETING_COMMITTED',
        payload: {
          meetingId: \`meet-\${Date.now()}\`,
          blockId: proofHash.substring(0, 10),
          totalSavings: totalSavingsCollected,
          totalDisbursed: loanData ? loanData.amount : 0
        }
      },
      {
        shgId: 'SHG-MH-2024-884',
        actorId: 'animator-1',
        actorRole: 'ANIMATOR',
        deviceId: 'dev-pwa-local'
      }
    );

    if (loanData) {
      sound.playLoanApprovalFanfare();
    } else {
      sound.playCashDepositChime();
    }

    onCompleteMeeting(attendance, savingsList, loanData, sessionResolutions, confirmedSigs, proofHash);
    setIsCommitted(true);
  };`;

const newHandleSubmit = `  const handleFinalSubmit = async () => {
    if (!isQuorumMet) {
      setPinErrorMsg(
        language === 'mr'
          ? 'किमान २ पदाधिकाऱ्यांची पिन स्वाक्षरी आवश्यक आहे'
          : 'Minimum 2 officer PIN signatures required'
      );
      return;
    }

    setIsSubmitting(true);
    setPinErrorMsg('');

    try {
      sound.playStampSound();
      const confirmedSigs: OfficerSignature[] = selectedRoles
        .filter(r => verifiedSignatures[r])
        .map(r => {
          const off = DEFAULT_OFFICERS.find(o => o.role === r);
          return {
            role: r,
            signedAt: new Date().toISOString(),
            officerName: off ? off.name : r
          };
        });

      setCommittedSignatures(confirmedSigs);

      // Compute signatureProof hash
      const concatSigners = confirmedSigs.map(s => \`\${s.role}:\${s.signedAt}\`).join('|');
      const proofHash = await calculateSHA256(concatSigners);

      const savingsList = Object.entries(savingsAmounts)
        .filter(([_, amt]) => amt > 0)
        .map(([mId, amt]) => ({ memberId: mId, amount: amt }));

      let loanData = undefined;
      if (disburseLoan && selectedLoanMemberId && loanAmount > 0) {
        loanData = {
          memberId: selectedLoanMemberId,
          amount: loanAmount,
          notes: loanPurpose
        };
      }

      // Safe eventBus emit
      try {
        await eventBus.emit(
          {
            type: 'QUORUM_SIGNATURES_AUTHENTICATED',
            payload: {
              officerRoles: confirmedSigs.map(s => s.role),
              sessionHash: proofHash
            }
          },
          {
            shgId: 'SHG-MH-2024-884',
            actorId: confirmedSigs[0]?.role || 'TREASURER',
            actorRole: (confirmedSigs[0]?.role as any) || 'TREASURER',
            deviceId: 'dev-pwa-local'
          }
        );

        await eventBus.emit(
          {
            type: 'MEETING_COMMITTED',
            payload: {
              meetingId: \`meet-\${Date.now()}\`,
              blockId: proofHash.substring(0, 10),
              totalSavings: totalSavingsCollected,
              totalDisbursed: loanData ? loanData.amount : 0
            }
          },
          {
            shgId: 'SHG-MH-2024-884',
            actorId: 'animator-1',
            actorRole: 'ANIMATOR',
            deviceId: 'dev-pwa-local'
          }
        );
      } catch (busErr) {
        console.warn('EventBus dispatch warning (non-fatal):', busErr);
      }

      if (loanData) {
        sound.playLoanApprovalFanfare();
      } else {
        sound.playCashDepositChime();
      }

      // Await database batch commit!
      await onCompleteMeeting(attendance, savingsList, loanData, sessionResolutions, confirmedSigs, proofHash);

      const genFingerprint = \`CHK-\${proofHash.substring(0, 4).toUpperCase()}-\${proofHash.substring(4, 8).toUpperCase()}-\${proofHash.substring(8, 12).toUpperCase()}\`;
      setCommitSuccessData({
        fingerprint: genFingerprint,
        merkleRoot: proofHash,
        savings: totalSavingsCollected,
        disbursed: loanData ? loanData.amount : 0
      });
      setIsCommitted(true);
      tts.speak(language === 'mr' ? 'बैठकीची नोंद नोंदवहीत यशस्वीरीत्या जतन झाली आहे.' : 'Meeting session successfully saved to ledger.');
    } catch (err: any) {
      console.error('Failed to commit meeting session:', err);
      setPinErrorMsg(
        language === 'mr'
          ? \`नोंद जतन करताना त्रुटी आली: \${err?.message || 'अज्ञात त्रुटी'}\`
          : \`Failed to commit meeting: \${err?.message || 'Unknown error'}\`
      );
    } finally {
      setIsSubmitting(false);
    }
  };`;

if (!file.includes(oldHandleSubmit)) {
  console.error('oldHandleSubmit not found');
  process.exit(1);
}
file = file.replace(oldHandleSubmit, newHandleSubmit);

// 4. Update Header and Step navigation pills for mobile responsiveness
const oldHeaderPills = `        {/* Step Indicators - Interactive Clickable Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-black">
          <button
            onClick={() => { sound.playStampSound(); setStep(1); }}
            className={\`p-2 rounded-xl border transition \${step === 1 ? 'bg-amber-400 text-amber-950 border-amber-500 shadow' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}\`}
          >
            1. {language === 'mr' ? 'उपस्थिती' : 'Attendance'}
          </button>
          <button
            onClick={() => { sound.playStampSound(); setStep(2); }}
            className={\`p-2 rounded-xl border transition \${step === 2 ? 'bg-amber-400 text-amber-950 border-amber-500 shadow' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}\`}
          >
            2. {language === 'mr' ? 'बचत व रोकड पेटी' : 'Savings & Cash Box'}
          </button>
          <button
            onClick={() => { sound.playStampSound(); setStep(3); }}
            className={\`p-2 rounded-xl border transition \${step === 3 ? 'bg-amber-400 text-amber-950 border-amber-500 shadow' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}\`}
          >
            3. {language === 'mr' ? 'इतिवृत्त व कर्ज' : 'Resolutions & Loan'}
          </button>
          <button
            onClick={() => { sound.playStampSound(); setStep(4); }}
            className={\`p-2 rounded-xl border transition \${step === 4 ? 'bg-amber-400 text-amber-950 border-amber-500 shadow' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}\`}
          >
            4. {language === 'mr' ? 'द्वि-स्वाक्षरी व जतन' : 'Quorum & Commit'}
          </button>
        </div>`;

const newHeaderPills = `        {/* Step Indicators - Interactive Clickable Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-center text-[11px] sm:text-xs font-black">
          <button
            type="button"
            onClick={() => { sound.playStampSound(); setStep(1); }}
            className={\`p-2 rounded-xl border transition truncate \${step === 1 ? 'bg-amber-400 text-stone-900 border-amber-500 shadow-xs font-black' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}\`}
          >
            1. {language === 'mr' ? 'उपस्थिती' : 'Attendance'}
          </button>
          <button
            type="button"
            onClick={() => { sound.playStampSound(); setStep(2); }}
            className={\`p-2 rounded-xl border transition truncate \${step === 2 ? 'bg-amber-400 text-stone-900 border-amber-500 shadow-xs font-black' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}\`}
          >
            2. {language === 'mr' ? 'बचत व रोकड' : 'Savings & Cash'}
          </button>
          <button
            type="button"
            onClick={() => { sound.playStampSound(); setStep(3); }}
            className={\`p-2 rounded-xl border transition truncate \${step === 3 ? 'bg-amber-400 text-stone-900 border-amber-500 shadow-xs font-black' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}\`}
          >
            3. {language === 'mr' ? 'इतिवृत्त व कर्ज' : 'Resolutions & Loan'}
          </button>
          <button
            type="button"
            onClick={() => { sound.playStampSound(); setStep(4); }}
            className={\`p-2 rounded-xl border transition truncate \${step === 4 ? 'bg-amber-400 text-stone-900 border-amber-500 shadow-xs font-black' : 'bg-emerald-950/70 text-emerald-200 border-emerald-800 hover:bg-emerald-900'}\`}
          >
            4. {language === 'mr' ? 'कोरम व जतन' : 'Quorum & Commit'}
          </button>
        </div>`;

if (!file.includes(oldHeaderPills)) {
  console.error('oldHeaderPills not found');
  process.exit(1);
}
file = file.replace(oldHeaderPills, newHeaderPills);

// 5. Update Step 4 Auto-Sign Header & Layout
const oldStep4ContentStart = `        {/* STEP 4: 2-of-3 Multi-Signatory Quorum PIN & Out-of-Band SMS Receipt */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-[#1C1917] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#14532D]" />
                {language === 'mr' ? '४. २-पैकी-३ पदाधिकारी द्वि-स्वाक्षरी (2-of-3 PIN Quorum Consensus)' : 'Step 4: Multi-Signatory PIN Quorum'}
              </h3>
              <p className="text-xs text-stone-600">
                {language === 'mr'
                  ? 'एकल-चालक गैरव्यवहार टाळण्यासाठी किमान २ पदाधिकाऱ्यांचे ४-अंकी पिन आवश्यक.'
                  : 'To eliminate single-operator fraud, at least 2 elected officers must enter their 4-digit PIN.'}
              </p>
            </div>

            {/* Quorum Officer Selector Badges & Quick Auto-Fill Helpers */}
            <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-stone-700">
                  {language === 'mr' ? 'स्वाक्षरी करणाऱ्या २ पदाधिकाऱ्यांची निवड करा:' : 'Select Signatory Officers (Choose 2 or 3):'}
                </div>

                {/* Quick Auto-Fill Helper Badges for Easy Demo */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
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
                  <span className="text-stone-500">Auto-Fill:</span>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('PRESIDENT')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-300"
                    title="Auto-fill President PIN (1111)"
                  >
                    अध्यक्ष (1111)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('TREASURER')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-300"
                    title="Auto-fill Treasurer PIN (3333)"
                  >
                    खजिनदार (3333)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('SECRETARY')}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-300"
                    title="Auto-fill Secretary PIN (2222)"
                  >
                    सचिव (2222)
                  </button>
                </div>
              </div>`;

const newStep4ContentStart = `        {/* STEP 4: 2-of-3 Multi-Signatory Quorum PIN & Out-of-Band SMS Receipt */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-800" />
                {language === 'mr' ? '४. २-पैकी-३ पदाधिकारी स्वाक्षरी (Quorum Consensus)' : 'Step 4: Multi-Signatory PIN Quorum'}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                {language === 'mr'
                  ? 'एकल-चालक गैरव्यवहार टाळण्यासाठी किमान २ पदाधिकाऱ्यांचे ४-अंकी पिन आवश्यक.'
                  : 'To eliminate single-operator fraud, at least 2 elected officers must enter their 4-digit PIN.'}
              </p>
            </div>

            {/* Quorum Officer Selector Badges & Quick Auto-Fill Helpers */}
            <div className="bg-white border border-stone-200 p-3.5 sm:p-4 rounded-2xl space-y-3.5 shadow-2xs">
              
              {/* Auto-Sign Banner: Clean, Responsive without Overlapping */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-emerald-950">
                    {language === 'mr' ? 'स्वाक्षरी करणारे २ पदाधिकारी निवडा:' : 'Select Signatory Officers (Choose 2 or 3):'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleAutoFillPin('PRESIDENT');
                      handleAutoFillPin('TREASURER');
                    }}
                    className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition"
                    title="Auto-sign both President and Treasurer PINs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{language === 'mr' ? '⚡ १-टॅप कोरम स्वाक्षऱ्या भरा' : '⚡ 1-Click Auto-Sign Quorum'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-emerald-200/60 text-[11px] font-bold">
                  <span className="text-emerald-900 font-semibold">{language === 'mr' ? 'पिन:' : 'PINs:'}</span>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('PRESIDENT')}
                    className="bg-white hover:bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300 transition"
                    title="Auto-fill President PIN (1111)"
                  >
                    अध्यक्ष (1111)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('TREASURER')}
                    className="bg-white hover:bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300 transition"
                    title="Auto-fill Treasurer PIN (3333)"
                  >
                    खजिनदार (3333)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillPin('SECRETARY')}
                    className="bg-white hover:bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300 transition"
                    title="Auto-fill Secretary PIN (2222)"
                  >
                    सचिव (2222)
                  </button>
                </div>
              </div>`;

if (!file.includes(oldStep4ContentStart)) {
  console.error('oldStep4ContentStart not found');
  process.exit(1);
}
file = file.replace(oldStep4ContentStart, newStep4ContentStart);

// 6. Update dynamic fingerprint/merkle display and bottom action buttons
const oldBottomSection = `              {isCommitted && (
                <div className="pt-2 border-t border-emerald-200/80 font-mono text-[11px] text-emerald-950 space-y-1">
                  <div className="flex justify-between">
                    <span>Block Fingerprint:</span>
                    <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded">CHK-8F3A-21BC-91D4</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-600">
                    <span>Merkle Root Proof:</span>
                    <span className="truncate max-w-[180px]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                  </div>
                </div>
              )}
            </div>

            {/* Out-of-Band SMS Audit Receipts Drawer (Visible after commit) */}
            {isCommitted && (
              <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center space-x-2 text-amber-950 font-black text-sm">
                  <MessageSquare className="w-5 h-5 text-amber-700" />
                  <span>सदस्यांना ऑफलाईन SMS / WhatsApp पावती पाठवा</span>
                </div>
                <p className="text-xs text-amber-900 font-medium">
                  कोणत्याही ऑनलाईन SMS गेटवेचा वापर न करता मोबाईल वेब शेअर API द्वारे सदस्यांना ऑडीट पावती पाठवा.
                </p>
                <button
                  onClick={handleBroadcastSmsReceipts}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow transition"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>SMS / WhatsApp पावती पाठवा (Broadcast Audit Receipts)</span>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DDD3]">
              <button
                onClick={() => { sound.playStampSound(); setStep(3); }}
                disabled={isCommitted}
                className="px-4 py-2 border border-[#E2DDD3] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>
              {isCommitted ? (
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
              )}
            </div>`;

const newBottomSection = `              {isCommitted && (
                <div className="pt-2 border-t border-emerald-200 font-mono text-[11px] text-emerald-950 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Block Fingerprint:</span>
                    <span className="font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {commitSuccessData?.fingerprint || 'CHK-8F3A-21BC-91D4'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-600">
                    <span>Merkle Root:</span>
                    <span className="truncate max-w-[200px]">{commitSuccessData?.merkleRoot || 'e3b0c442...'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Out-of-Band SMS Audit Receipts Drawer (Visible after commit) */}
            {isCommitted && (
              <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <MessageSquare className="w-5 h-5 text-amber-700" />
                  <span>{language === 'mr' ? 'सदस्यांना ऑफलाईन SMS / WhatsApp पावती पाठवा' : 'Broadcast Audit Receipts via SMS / WhatsApp'}</span>
                </div>
                <p className="text-xs text-amber-900 font-medium">
                  {language === 'mr'
                    ? 'कोणत्याही ऑनलाईन SMS गेटवेचा वापर न करता मोबाईल वेब शेअर द्वारे सदस्यांना पावती पाठवा.'
                    : 'Dispatch cryptographic audit receipts directly to members via mobile share.'}
                </p>
                <button
                  type="button"
                  onClick={handleBroadcastSmsReceipts}
                  className="w-full bg-stone-900 hover:bg-black text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>{language === 'mr' ? 'SMS / WhatsApp पावती पाठवा' : 'Broadcast Receipts'}</span>
                </button>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-stone-200 pb-2">
              <button
                type="button"
                onClick={() => { sound.playStampSound(); setStep(3); }}
                disabled={isCommitted || isSubmitting}
                className="px-4 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'mr' ? 'मागे' : 'Back'}</span>
              </button>

              {isCommitted ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.playStampSound();
                    onCancel();
                  }}
                  className="w-full sm:w-auto font-black px-6 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg bg-emerald-700 hover:bg-emerald-800 text-white transition transform active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  <span>{language === 'mr' ? 'बैठक समाप्त करा आणि डॅशबोर्ड पहा' : 'Finish & Return to Dashboard'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={!isQuorumMet || isSubmitting}
                  className={\`w-full sm:w-auto font-black px-6 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 \${
                    isQuorumMet && !isSubmitting
                      ? 'bg-amber-400 hover:bg-amber-300 text-stone-900 cursor-pointer shadow-amber-200'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                  }\`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'mr' ? 'नोंदवहीत जतन होत आहे...' : 'Saving to Ledger...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{language === 'mr' ? 'नोंदवहीत जतन करा (Commit Block)' : 'Save Session to Ledger'}</span>
                    </>
                  )}
                </button>
              )}
            </div>`;

if (!file.includes(oldBottomSection)) {
  console.error('oldBottomSection not found');
  process.exit(1);
}
file = file.replace(oldBottomSection, newBottomSection);

if (isCrlf) file = file.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, file, 'utf-8');
console.log('Successfully updated MeetingWizard.tsx');
