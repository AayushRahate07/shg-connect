import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, ShieldAlert, X } from 'lucide-react';
import { DeferredRemoteOperation, ConflictResolutionChoice } from '../types/sync';
import { getDeferredRemoteOps } from '../services/db';
import { syncCoordinator } from '../services/syncCoordinator';

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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-[#E4E6E2] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#FFF3D8] p-5 border-b border-[#E69A24]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E69A24]/20 text-[#C47A13] rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#1F2925] text-lg">
                Record Conflict Resolution ({deferredOps.length})
              </h3>
              <p className="text-xs text-[#6B756F] font-medium mt-0.5">
                A record differs between devices. Choose which version to keep on the ledger.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B756F] hover:text-[#1F2925] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="text-center py-8 text-[#6B756F]">Loading conflict records...</div>
          ) : deferredOps.length === 0 ? (
            <div className="text-center py-8 text-[#6B756F]">
              <Check className="w-12 h-12 text-[#198754] mx-auto mb-2" />
              <p className="font-bold text-[#1F2925]">All conflicts resolved!</p>
            </div>
          ) : (
            deferredOps.map(op => (
              <div
                key={op.id}
                className="border border-[#E4E6E2] rounded-xl p-4 bg-[#F7F6F2] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#E4E6E2] pb-2">
                  <div>
                    <span className="text-xs font-bold text-[#176B52] bg-[#E7F2ED] px-2.5 py-0.5 rounded-full">
                      {op.entityType.toUpperCase()} Record
                    </span>
                  </div>
                  <span className="text-xs text-[#6B756F]">
                    Detected {new Date(op.conflictDetectedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Human Diff Comparison */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Local State */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E4E6E2] space-y-1">
                    <div className="font-bold text-[#1F2925] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#C47A13]" /> This Device Version
                    </div>
                    <div className="text-[#6B756F] font-mono text-[11px] overflow-x-auto whitespace-pre-wrap bg-[#F7F6F2] p-2 rounded-lg mt-1">
                      {JSON.stringify(op.localPayload, null, 2)}
                    </div>
                  </div>

                  {/* Remote State */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E4E6E2] space-y-1">
                    <div className="font-bold text-[#1F2925] flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#176B52]" /> Other Device Version
                    </div>
                    <div className="text-[#6B756F] font-mono text-[11px] overflow-x-auto whitespace-pre-wrap bg-[#F7F6F2] p-2 rounded-lg mt-1">
                      {JSON.stringify(op.remotePayload, null, 2)}
                    </div>
                  </div>
                </div>

                {/* Human Action Choices */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#E7E5E4]">
                  <button
                    onClick={() => handleResolve(op.id, 'KEEP_LOCAL')}
                    className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    या फोनवरील नोंद ठेवा (Keep Local)
                  </button>
                  <button
                    onClick={() => handleResolve(op.id, 'ACCEPT_REMOTE')}
                    className="px-3.5 py-2 bg-white hover:bg-[#F5F5F4] text-[#1C1917] border border-[#E7E5E4] text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    दुसऱ्या डिव्हाइसची नोंद ठेवा (Keep Remote)
                  </button>
                  <button
                    onClick={() => handleResolve(op.id, 'RETRY_MERGED')}
                    className="px-3.5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    दोन्ही जोडून जतन करा (Merge Both)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
