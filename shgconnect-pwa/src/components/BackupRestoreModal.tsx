import React, { useState } from 'react';
import { SupportedLanguage } from '../types/shg';
import { exportLedgerData, importLedgerData } from '../services/db';
import { X, Download, Upload, Database, CheckCircle2, AlertCircle, FileJson } from 'lucide-react';

interface BackupRestoreModalProps {
  language: SupportedLanguage;
  onClose: () => void;
  onRestored: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  language,
  onClose,
  onRestored
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDownloadBackup = () => {
    try {
      const jsonStr = exportLedgerData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const nowStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `shgconnect-backup-${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: language === 'mr' ? 'बॅकअप संचिका यशस्वीपणे डाऊनलोड झाली!' : 'Ledger backup JSON downloaded successfully!'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: language === 'mr' ? 'बॅकअप तयार करताना त्रुटी आली.' : 'Failed to export backup JSON file.'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importLedgerData(content);
        if (success) {
          setFeedback({
            type: 'success',
            message: language === 'mr' ? 'डेटा यशस्वीरीत्या रिस्टोअर झाला!' : 'Ledger state restored successfully from backup JSON!'
          });
          setTimeout(() => {
            onRestored();
            onClose();
          }, 1200);
        } else {
          setFeedback({
            type: 'error',
            message: language === 'mr' ? 'अवैध बॅकअप फाईल स्वरूप.' : 'Invalid or corrupted SHGConnect backup JSON file format.'
          });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">
              {language === 'mr' ? 'बॅकअप व रिस्टोअर (JSON State)' : 'Backup & Restore Ledger Data'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Feedback Banner */}
          {feedback && (
            <div className={`p-3.5 rounded-2xl flex items-center space-x-2 text-xs font-bold ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Section 1: Export Backup */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <FileJson className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-sm text-slate-900">
                {language === 'mr' ? '१. बॅकअप फाईल डाऊनलोड करा' : '1. Export Ledger JSON Backup'}
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'mr'
                ? 'तुमच्या संगणकावर सर्व सभासद, व्यवहार आणि ब्लॉक डेटा सुरक्षा डाऊनलोड करा.'
                : 'Download a standalone `.json` snapshot of all SHG records for offline safety.'}
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{language === 'mr' ? 'बॅकअप डाऊनलोड करा (Export JSON)' : 'Download Backup (.json)'}</span>
            </button>
          </div>

          {/* Section 2: Restore Backup */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-sm text-slate-900">
                {language === 'mr' ? '२. बॅकअप फाईल रिस्टोअर करा' : '2. Restore State from File'}
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'mr'
                ? 'पूर्वी डाऊनलोड केलेली `.json` फाईल निवडून स्थानिक नोंदवही अपडेट करा.'
                : 'Select a previously exported `shgconnect-backup-*.json` file to restore.'}
            </p>
            <label className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow cursor-pointer transition">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>{language === 'mr' ? 'फाईल निवडा (Upload & Restore)' : 'Choose JSON Backup File'}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
