import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, ShieldAlert, X, Smartphone, Cloud, ArrowRight } from 'lucide-react';
import { DeferredRemoteOperation, ConflictResolutionChoice } from '../types/sync';
import { getDeferredRemoteOps } from '../services/db';
import { syncCoordinator } from '../services/syncCoordinator';
import { formatINR } from '../theme/tokens';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [deferredOps, setDeferredOps] = useState<DeferredRemoteOperation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadOps = async () => {
    setLoading(true);
    try {
      const ops = await getDeferredRemoteOps();
      setDeferredOps(ops);
    } catch (err) {
      console.error("Failed to load deferred ops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOps();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResolve = async (id: string, choice: ConflictResolutionChoice) => {
    await syncCoordinator.resolveConflict(id, choice);
    await loadOps();
    const remaining = await getDeferredRemoteOps();
    if (remaining.length === 0) {
      onClose();
    }
  };

  const getPayloadAmount = (payload: any): number => {
    if (!payload) return 0;
    if (typeof payload.amount === 'number') return payload.amount;
    if (typeof payload.initialSavings === 'number') return payload.initialSavings;
    if (typeof payload.totalSavings === 'number') return payload.totalSavings;
    return 0;
  };

  const getPayloadTitle = (payload: any, fallback: string): string => {
    if (!payload) return fallback;
    return payload.memberName || payload.name || payload.notes || fallback;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#FFF3D8] p-5 border-b border-[#E69A24]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E69A24]/20 text-[#C47A13] rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-lg">
                नोंद फरक निवारण (Conflict Resolution)
              </h3>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                वेगवेगळ्या फोनवर एकाच नोंदीमध्ये फरक आढळला आहे. लेजरमध्ये कोणती नोंद ठेवायची ते निवडा.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="text-center py-10 text-stone-500 font-medium">तपासणी करत आहे... (Checking conflicts)</div>
          ) : deferredOps.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Check className="w-14 h-14 text-emerald-600 mx-auto" />
              <p className="font-black text-stone-900 text-base">सर्व नोंदी सुसंगत आहेत! (All conflicts resolved)</p>
              <p className="text-xs text-stone-500">कोणताही डेटा संघर्ष शिल्लक नाही.</p>
            </div>
          ) : (
            deferredOps.map(op => {
              const localAmt = getPayloadAmount(op.localPayload);
              const remoteAmt = getPayloadAmount(op.remotePayload);
              const combinedAmt = localAmt + remoteAmt;
              const title = getPayloadTitle(op.localPayload, op.entityType);

              return (
                <div
                  key={op.id}
                  className="border border-stone-200 rounded-2xl p-5 bg-[#FAF9F6] space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        {op.entityType}
                      </span>
                      <span className="text-sm font-bold text-stone-800">
                        {title}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium">
                      वेळ: {new Date(op.conflictDetectedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Human-Centric Side-by-Side Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Local Card (This Phone) */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-emerald-600/40 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-emerald-800 font-extrabold pb-1.5 border-b border-stone-100">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-emerald-700" />
                          <span>या फोनवरील नोंद (This Device)</span>
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          Local
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-500 block uppercase font-bold">रक्कम (Amount)</span>
                        <span className="text-2xl font-black text-emerald-900 block amount-display">
                          {formatINR(localAmt)}
                        </span>
                      </div>

                      <div className="pt-1 text-[11px] text-stone-600 space-y-1">
                        <div><strong className="text-stone-700">तपशील:</strong> {op.localPayload?.notes || 'नोंद उपलब्ध'}</div>
                        <div><strong className="text-stone-700">नोंदणीकर्ता:</strong> {op.localPayload?.actorId || 'Officer'}</div>
                      </div>
                    </div>

                    {/* Remote Card (Other Device / Server) */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-amber-600/40 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-amber-800 font-extrabold pb-1.5 border-b border-stone-100">
                        <span className="flex items-center gap-1.5">
                          <Cloud className="w-4 h-4 text-amber-700" />
                          <span>दुसऱ्या फोनवरील नोंद (Other Device)</span>
                        </span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                          Remote
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-500 block uppercase font-bold">रक्कम (Amount)</span>
                        <span className="text-2xl font-black text-amber-900 block amount-display">
                          {formatINR(remoteAmt)}
                        </span>
                      </div>

                      <div className="pt-1 text-[11px] text-stone-600 space-y-1">
                        <div><strong className="text-stone-700">तपशील:</strong> {op.remotePayload?.notes || 'दुसऱ्या फोनवरून नोंद'}</div>
                        <div><strong className="text-stone-700">नोंदणीकर्ता:</strong> {op.remotePayload?.actorId || 'Other Officer'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Human Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
                    <button
                      onClick={() => handleResolve(op.id, 'KEEP_LOCAL')}
                      className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl transition shadow flex items-center gap-1.5 min-h-[44px]"
                    >
                      <span>या फोनची नोंद ठेवा ({formatINR(localAmt)})</span>
                    </button>
                    <button
                      onClick={() => handleResolve(op.id, 'ACCEPT_REMOTE')}
                      className="px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 min-h-[44px]"
                    >
                      <span>दुसऱ्या फोनची नोंद ठेवा ({formatINR(remoteAmt)})</span>
                    </button>
                    {combinedAmt > 0 && (
                      <button
                        onClick={() => handleResolve(op.id, 'RETRY_MERGED')}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition shadow flex items-center gap-1.5 min-h-[44px]"
                      >
                        <span>दोन्ही जोडा ({formatINR(combinedAmt)})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
