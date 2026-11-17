import React, { useState, useEffect } from 'react';
import { Member, SupportedLanguage } from '../../types/shg';
import { HeatReliefProposal, ClimateBufferState } from '../../types/climate';
import {
  getClimateProposals,
  getClimateBufferState,
  saveClimateBufferState,
  updateClimateProposalStatus,
  toggleSimulateEmptyBuffer
} from '../../services/db';
import { getCurrentDynamicOtp, verifyDynamicOtp } from '../../services/otpHandshake';
import { sound } from '../../services/sound';
import { tts } from '../../services/tts';
import { formatINR } from '../../theme/tokens';
import {
  ShieldAlert,
  Flame,
  CheckCircle,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  Ban,
  RefreshCw,
  Coins
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface HeatReliefApprovalPanelProps {
  shgId: string;
  members: Member[];
  language: SupportedLanguage;
  onApproveProposal?: (proposal: HeatReliefProposal) => void;
}

export const HeatReliefApprovalPanel: React.FC<HeatReliefApprovalPanelProps> = ({
  shgId,
  members,
  language,
  onApproveProposal
}) => {
  const isMr = language === 'mr';

  const [proposals, setProposals] = useState<HeatReliefProposal[]>([]);
  const [bufferState, setBufferState] = useState<ClimateBufferState | null>(null);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpHints, setOtpHints] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState<Record<string, string>>({});
  const [activeOtpPropId, setActiveOtpPropId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Load proposals and buffer state
  const loadData = async () => {
    const buf = await getClimateBufferState(shgId);
    setBufferState(buf);
    const props = await getClimateProposals(shgId);
    setProposals(props);
  };

  useEffect(() => {
    loadData();
    const handlePropsUpdate = () => loadData();
    const handleBufUpdate = (e: any) => setBufferState(e.detail);

    window.addEventListener('shg_climate_proposals_updated', handlePropsUpdate);
    window.addEventListener('shg_climate_buffer_updated', handleBufUpdate);
    return () => {
      window.removeEventListener('shg_climate_proposals_updated', handlePropsUpdate);
      window.removeEventListener('shg_climate_buffer_updated', handleBufUpdate);
    };
  }, [shgId]);

  // Load TOTP hints for testing/demo ease
  useEffect(() => {
    async function fetchHints() {
      const hints: Record<string, string> = {};
      for (const p of proposals) {
        hints[p.id] = await getCurrentDynamicOtp(p.memberId);
      }
      setOtpHints(hints);
    }
    if (proposals.length > 0) {
      fetchHints();
      const interval = setInterval(fetchHints, 15000); // refresh every 15s
      return () => clearInterval(interval);
    }
  }, [proposals]);

  if (!bufferState) return null;

  const isBufferDepleted = bufferState.balanceInr <= 0;

  // Toggle simulate empty buffer for judges
  const handleToggleSimulateEmpty = async () => {
    const updated = await toggleSimulateEmptyBuffer(shgId);
    setBufferState(updated);
    sound.playStampSound();
  };

  // Verify OTP and approve proposal
  const handleVerifyOtp = async (proposal: HeatReliefProposal) => {
    const entered = (otpInputs[proposal.id] || '').trim();
    if (entered.length < 4) {
      setOtpError(prev => ({ ...prev, [proposal.id]: isMr ? 'कृपया ४-अंकी OTP टाका' : 'Enter 4-digit OTP' }));
      return;
    }

    setIsVerifying(true);
    const isValid = await verifyDynamicOtp(proposal.memberId, entered);

    if (isValid) {
      sound.playLoanApprovalFanfare();
      await updateClimateProposalStatus(proposal.id, 'APPROVED_OTP', new Date().toISOString());

      const approvedProp: HeatReliefProposal = {
        ...proposal,
        status: 'APPROVED_OTP',
        otpVerifiedAt: new Date().toISOString()
      };

      setProposals(prev => prev.map(p => p.id === proposal.id ? approvedProp : p));
      setActiveOtpPropId(null);
      setOtpError(prev => ({ ...prev, [proposal.id]: '' }));

      if (onApproveProposal) {
        onApproveProposal(approvedProp);
      }

      const msg = isMr
        ? `${proposal.memberName} यांचा उष्मा सहाय्य प्रस्ताव OTP द्वारे प्रमाणित झाला.`
        : `Heat relief for ${proposal.memberName} verified via OTP handshake.`;
      tts.speak(msg);
    } else {
      sound.playStampSound();
      setOtpError(prev => ({ ...prev, [proposal.id]: isMr ? 'अवैध किंवा कालबाह्य OTP' : 'Invalid or expired OTP' }));
    }
    setIsVerifying(false);
  };

  return (
    <div className="bg-white border-2 border-amber-300 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-2xs">
            <Flame className="w-4 h-4 text-white" />
          </span>
          <div>
            <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide">
              {isMr ? 'उष्णता लाट साहाय्य प्रस्ताव (Heat Shield Motions)' : 'Heat-Wage Shield Relief & Penalty Waiver'}
            </h4>
            <p className="text-[11px] text-stone-500">
              {isMr
                ? 'पूर्व-संमत नियमानुसार सदस्यांनी नोंदवलेले उष्मा सहाय्य प्रस्ताव'
                : 'Pre-agreed policy relief claims submitted by heatwave-affected members'}
            </p>
          </div>
        </div>

        {/* Demo Toggle for Judges */}
        <button
          type="button"
          onClick={handleToggleSimulateEmpty}
          className={`text-[11px] font-black px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
            isBufferDepleted
              ? 'bg-rose-100 text-rose-900 border-rose-300'
              : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
          }`}
          title="Click to test the empty-buffer guardrail"
        >
          <Coins className="w-3.5 h-3.5 text-stone-600" />
          <span>
            {isBufferDepleted
              ? (isMr ? 'बफर रिकामे (₹० सिमुलेशन चालू)' : 'Buffer Empty (₹0 Demo Active)')
              : (isMr ? 'बफर शिल्लक: ' + formatINR(bufferState.balanceInr) : 'Buffer: ' + formatINR(bufferState.balanceInr))}
          </span>
        </button>
      </div>

      {/* Empty Buffer Guardrail Banner */}
      {isBufferDepleted && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 text-xs text-rose-950 flex items-start gap-2.5 animate-fadeIn">
          <Ban className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-rose-900 block">
              {isMr ? 'कवच निधी संपला (₹०) — मूळ बचत सुरक्षित!' : 'Climate Buffer Depleted (₹0) — Principal Savings Ring-Fenced!'}
            </span>
            <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
              {isMr
                ? 'बचत गटाचा बफर निधी संपल्यामुळे सदस्यांच्या मूळ बचतीला हात लावला जाणार नाही. नियमानुसार केवळ दंड माफी (Penalty Waiver) संमत होईल.'
                : 'Member principal savings are ring-fenced by constitutional rule and cannot be drawn. System automatically falls back to Penalty Waiver Only.'}
            </p>
          </div>
        </div>
      )}

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <div className="text-center py-4 text-xs text-stone-500 font-medium">
          {isMr ? 'सध्या कोणताही प्रलंबित उष्मा सहाय्य प्रस्ताव नाही.' : 'No pending heatwave relief proposals for this meeting.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {proposals.map((proposal) => {
            const isApproved = proposal.status === 'APPROVED_OTP';
            const effectiveGrant = isBufferDepleted ? 0 : proposal.requestedAmountInr;
            const hint = otpHints[proposal.id] || '----';

            return (
              <div
                key={proposal.id}
                className={`p-3 rounded-xl border transition ${
                  isApproved
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900">
                        {proposal.memberName}
                      </span>
                      <Badge variant={isApproved ? 'success' : isBufferDepleted ? 'warning' : 'neutral'}>
                        {isApproved
                          ? 'OTP Verified'
                          : isBufferDepleted
                          ? 'Penalty Waiver Only'
                          : 'Proposed'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-stone-500 font-mono block mt-0.5">
                      Trigger: WBGT {proposal.measuredWbgtC}°C · Forecast: {proposal.forecastDate}
                    </span>
                  </div>

                  {/* Amount / Action */}
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-emerald-800 block amount-display">
                      {effectiveGrant > 0 ? `+${formatINR(effectiveGrant)} Grant` : '₹0 (Waiver)'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {isBufferDepleted ? 'Late Penalty Waived' : 'Wage Loss Grant + Waiver'}
                    </span>
                  </div>
                </div>

                {/* Handshake OTP Interaction Form */}
                {!isApproved && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200 space-y-2">
                    {activeOtpPropId === proposal.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="४-digit OTP"
                            value={otpInputs[proposal.id] || ''}
                            onChange={(e) =>
                              setOtpInputs(prev => ({
                                ...prev,
                                [proposal.id]: e.target.value.replace(/\D/g, '')
                              }))
                            }
                            className="w-28 text-center tracking-widest font-mono font-black text-sm bg-white border border-stone-300 rounded-lg py-1 outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                          <button
                            type="button"
                            disabled={isVerifying}
                            onClick={() => handleVerifyOtp(proposal)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            {isMr ? 'सत्यापित करा' : 'Verify Handshake'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveOtpPropId(null)}
                            className="px-2 py-1 text-stone-500 hover:text-stone-700 text-xs font-bold cursor-pointer"
                          >
                            {isMr ? 'रद्द' : 'Cancel'}
                          </button>
                        </div>

                        {/* Demo Helper Hint */}
                        <div className="flex items-center gap-2 text-[11px] text-stone-500">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {isMr ? 'सदस्याचा चालू फिरता TOTP कोड:' : "Member's live dynamic TOTP:"}{' '}
                            <strong className="font-mono text-stone-800">{hint}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setOtpInputs(prev => ({ ...prev, [proposal.id]: hint }))}
                            className="text-[10px] text-emerald-700 underline font-bold cursor-pointer"
                          >
                            {isMr ? 'ऑटो-भरा' : 'Auto-fill'}
                          </button>
                        </div>

                        {otpError[proposal.id] && (
                          <span className="text-[11px] font-bold text-rose-600 block">
                            {otpError[proposal.id]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-600">
                          {isMr
                            ? 'निधी वितरणासाठी सदस्याचा थेट उपस्थिती OTP आवश्यक आहे.'
                            : 'Requires member 60s dynamic TOTP handshake before release.'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveOtpPropId(proposal.id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-200" />
                          <span>{isMr ? 'OTP पडताळणी करा' : 'Verify Member OTP'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Approved Proof */}
                {isApproved && (
                  <div className="mt-2 pt-1.5 border-t border-emerald-200/80 flex items-center justify-between text-[11px] text-emerald-800">
                    <span className="flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      {isMr ? '२-पैकी-२ कोरम स्वाक्षरीसाठी तयार' : 'Sealed & Queued for 2-of-3 Quorum'}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700">
                      OTP Verified: {proposal.otpVerifiedAt?.slice(11, 19)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
