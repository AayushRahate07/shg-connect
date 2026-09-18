import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle2, Shield, X } from 'lucide-react';
import { syncCoordinator } from '../../services/syncCoordinator';
import { NetworkState, SyncState, DerivedSyncStatus } from '../../types/sync';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConflictModal?: () => void;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenConflictModal
}) => {
  const [state, setState] = useState<{
    networkState: NetworkState;
    syncState: SyncState;
    derivedStatus: DerivedSyncStatus;
    pendingCount: number;
    deferredCount: number;
    lastSyncAt: string | null;
  }>({
    networkState: 'ONLINE',
    syncState: 'IDLE',
    derivedStatus: 'SYNCED',
    pendingCount: 0,
    deferredCount: 0,
    lastSyncAt: null
  });

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = syncCoordinator.subscribe(updated => {
        setState(updated);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderStatusCard = () => {
    switch (state.derivedStatus) {
      case 'SYNCED':
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 flex items-center space-x-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-base">Everything is up to date</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                All meeting sessions, savings, and loans are synchronized with the trust ledger.
              </p>
            </div>
          </div>
        );
      case 'PENDING':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-center space-x-4">
            <RefreshCw className="w-10 h-10 text-amber-600 animate-spin flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-base">{state.pendingCount} Changes Waiting to Sync</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Your entries are committed safely to IndexedDB on this device.
              </p>
            </div>
          </div>
        );
      case 'CONFLICT':
        return (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 flex items-center space-x-4">
            <AlertTriangle className="w-10 h-10 text-rose-600 flex-shrink-0 animate-bounce" />
            <div>
              <h4 className="font-extrabold text-base">{state.deferredCount} Conflict Needs Attention</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                A member's record differs between devices. Review and pick which version to keep.
              </p>
            </div>
          </div>
        );
      case 'OFFLINE':
      default:
        return (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-slate-900 flex items-center space-x-4">
            <WifiOff className="w-10 h-10 text-slate-600 flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-base">You're Offline</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Your changes are safe on this device. {state.pendingCount} entries will sync automatically when connected.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0F4C3A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-900/80 rounded-xl">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-lg">Data Synchronization Center</h3>
              <p className="text-xs text-emerald-200">Offline-first local Outbox & HTTP Push/Pull status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-emerald-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {renderStatusCard()}

          {/* Details & Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
              <span className="text-stone-500 font-bold uppercase text-[10px]">Network Connection</span>
              <div className="font-black text-stone-800 mt-0.5 flex items-center gap-1.5">
                {state.networkState === 'ONLINE' ? (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-600" /> Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-slate-500" /> Offline
                  </>
                )}
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
              <span className="text-stone-500 font-bold uppercase text-[10px]">Last Synchronized</span>
              <div className="font-black text-stone-800 mt-0.5">
                {state.lastSyncAt ? new Date(state.lastSyncAt).toLocaleTimeString('en-IN') : 'Just now'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            {state.deferredCount > 0 && onOpenConflictModal && (
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  onClose();
                  onOpenConflictModal();
                }}
              >
                Review Conflict ({state.deferredCount})
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw className={`w-4 h-4 ${state.syncState === 'SYNCING' ? 'animate-spin' : ''}`} />}
              onClick={() => syncCoordinator.syncNow()}
              disabled={state.networkState === 'OFFLINE' || state.syncState === 'SYNCING'}
            >
              {state.syncState === 'SYNCING' ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
