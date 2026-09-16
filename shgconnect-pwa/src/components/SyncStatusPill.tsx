import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { syncCoordinator } from '../services/syncCoordinator';
import { NetworkState, SyncState, DerivedSyncStatus } from '../types/sync';

interface Props {
  onOpenConflictModal?: () => void;
}

export const SyncStatusPill: React.FC<Props> = ({ onOpenConflictModal }) => {
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
    syncCoordinator.init();
    const unsubscribe = syncCoordinator.subscribe(updated => {
      setState(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleSyncClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.deferredCount > 0 && onOpenConflictModal) {
      onOpenConflictModal();
    } else {
      syncCoordinator.syncNow();
    }
  };

  const renderBadge = () => {
    switch (state.derivedStatus) {
      case 'SYNCED':
        return (
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Synced</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{state.pendingCount} Pending</span>
          </span>
        );
      case 'SYNCING':
        return (
          <span className="flex items-center gap-1 text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-xs font-medium">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Syncing...</span>
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="flex items-center gap-1 text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full text-xs font-medium animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{state.deferredCount} Conflict{state.deferredCount > 1 ? 's' : ''}</span>
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-xs font-medium">
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Offline ({state.pendingCount})</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={handleSyncClick}
      title={state.lastSyncAt ? `Last synced: ${new Date(state.lastSyncAt).toLocaleTimeString()}` : 'Sync engine initialized'}
      className="flex items-center gap-1.5 cursor-pointer select-none hover:opacity-90 transition-opacity"
    >
      {renderBadge()}
      <button
        type="button"
        className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Sync Now"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${state.syncState === 'SYNCING' ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
