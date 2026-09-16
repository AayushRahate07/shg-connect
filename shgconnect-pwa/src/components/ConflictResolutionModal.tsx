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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-rose-50 dark:bg-rose-950/40 p-4 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-600 rounded-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                Concurrency Conflicts ({deferredOps.length})
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Remote server updates contradict un-synced local changes. Review and select resolution.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading deferred operations...</div>
          ) : deferredOps.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">All conflicts resolved!</p>
            </div>
          ) : (
            deferredOps.map(op => (
              <div
                key={op.id}
                className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      {op.entityType.toUpperCase()} #{op.entityId}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      Server Seq #{op.serverSeq}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(op.conflictDetectedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Diff Comparison */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  {/* Local State */}
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40">
                    <div className="font-sans font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Device (Local) Version (v{op.localVersion})
                    </div>
                    <pre className="text-amber-950 dark:text-amber-200 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(op.localPayload, null, 2)}
                    </pre>
                  </div>

                  {/* Remote State */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-900/40">
                    <div className="font-sans font-bold text-blue-900 dark:text-blue-300 mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Remote Server Version (v{op.remoteVersion})
                    </div>
                    <pre className="text-blue-950 dark:text-blue-200 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(op.remotePayload, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Action Choices */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleResolve(op.id, 'KEEP_LOCAL')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Keep Local Version
                  </button>
                  <button
                    onClick={() => handleResolve(op.id, 'ACCEPT_REMOTE')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Accept Remote Version
                  </button>
                  <button
                    onClick={() => handleResolve(op.id, 'RETRY_MERGED')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Merge & Save
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
