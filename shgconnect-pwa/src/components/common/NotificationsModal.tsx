import React, { useState, useEffect } from 'react';
import { MembershipRequest, SupportedLanguage, Role } from '../../types/shg';
import { getMembershipRequests } from '../../services/db';
import { Bell, Check, X, Users, Building2, Calendar, Phone, Briefcase, CheckCircle2 } from 'lucide-react';
import { sound } from '../../services/sound';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  currentRole: Role;
  currentGroupCode: string;
  onApprove: (req: MembershipRequest) => Promise<void> | void;
  onReject: (reqId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  language,
  currentRole,
  currentGroupCode,
  onApprove,
  onReject
}) => {
  const isMr = language === 'mr';
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  const loadRequests = () => {
    const all = getMembershipRequests();
    // Tier 2 (SHG Lead): Scoped to their specific group, or Savitri Gat, or fallback to all
    // Tier 3 (Officer): Oversees all groups across cluster
    if (currentRole === 'OFFICE_BEARER' || currentRole === 'SHG_LEAD') {
      const scoped = all.filter(r => !r.shgId || r.shgId === currentGroupCode || r.shgId === 'SHG-MH-SAT-2024-0089');
      setRequests(scoped.length > 0 ? scoped : all);
    } else {
      setRequests(all);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
      const handler = () => loadRequests();
      window.addEventListener('shg_requests_updated', handler);
      return () => window.removeEventListener('shg_requests_updated', handler);
    }
  }, [isOpen, currentGroupCode, currentRole]);

  if (!isOpen) return null;

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const historyRequests = requests.filter(r => r.status !== 'PENDING');

  const handleApproveClick = async (req: MembershipRequest) => {
    sound.playStampSound();
    await onApprove(req);
    loadRequests();
  };

  const handleRejectClick = (reqId: string) => {
    sound.playStampSound();
    onReject(reqId);
    loadRequests();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn select-none font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-stone-900">
                  {isMr ? 'सूचना व प्रलंबित विनंत्या' : 'Notifications & Requests'}
                </h3>
                {pendingRequests.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {currentRole === 'OFFICER' || currentRole === 'ANIMATOR'
                  ? (isMr ? 'प्रभाग अधिकारी कक्ष (सर्व बचत गट)' : 'Officer Oversight (All SHGs)')
                  : (isMr ? 'गट प्रमुख कक्ष (स्थानिक बचत गट)' : 'SHG Lead Desk (Group Specific)')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 px-4 pt-2 bg-stone-50/40 text-xs font-bold gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'PENDING'
                ? 'border-emerald-700 text-emerald-800 font-black'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {isMr ? 'प्रलंबित विनंत्या' : 'Pending Requests'} ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'HISTORY'
                ? 'border-emerald-700 text-emerald-800 font-black'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {isMr ? 'इतिहास / निर्णय' : 'History'} ({historyRequests.length})
          </button>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {activeTab === 'PENDING' && (
            <>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-10 space-y-3 text-stone-400">
                  <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-700">
                      {isMr ? 'सर्व विनंत्या पूर्ण झाल्या आहेत' : 'All Clear! No Pending Requests'}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                      {isMr
                        ? 'कोणत्याही नवीन सभासदाचे अर्ज सध्या प्रलंबित नाहीत. नवीन नोंदणी झाल्यास येथे दिसेल.'
                        : 'No pending membership requests waiting for officer or lead approval.'}
                    </p>
                  </div>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border-2 border-amber-300 p-4 shadow-sm hover:shadow transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center text-sm border border-amber-300">
                          {req.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-stone-900 leading-tight">
                            {req.name}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-stone-600 mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400" /> +91 {req.phone}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {isMr ? 'नवीन अर्ज' : 'New Request'}
                      </span>
                    </div>

                    {/* Metadata pill box */}
                    <div className="bg-stone-50 rounded-xl p-2.5 text-xs text-stone-600 space-y-1 border border-stone-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-stone-400" />
                          {isMr ? 'बचत गट:' : 'SHG:'}
                        </span>
                        <span className="font-bold text-stone-800">
                          {req.shgName || req.shgId}
                        </span>
                      </div>
                      {req.occupation && (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-stone-500 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-stone-400" />
                            {isMr ? 'व्यवसाय:' : 'Occupation:'}
                          </span>
                          <span className="font-medium text-stone-800">{req.occupation}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5 border-t border-stone-200">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {isMr ? 'अर्ज तारीख:' : 'Applied on:'}
                        </span>
                        <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRejectClick(req.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isMr ? 'नाकारा' : 'Reject'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveClick(req)}
                        className="px-4 py-1.5 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 border border-emerald-800 transition active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isMr ? 'मंजूर करा (Approve)' : 'Approve Member'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'HISTORY' && (
            <>
              {historyRequests.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400 font-medium">
                  {isMr ? 'कोणताही पूर्वीचा इतिहास उपलब्ध नाही.' : 'No processed requests in history.'}
                </div>
              ) : (
                historyRequests.map(req => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-stone-200 p-3.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900">{req.name}</span>
                        <span className="font-mono text-stone-500 text-[11px]">+91 {req.phone}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        {req.shgName || req.shgId} · {req.occupation || '—'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {req.status === 'APPROVED' ? (isMr ? 'मंजूर' : 'Approved') : (isMr ? 'नाकारले' : 'Rejected')}
                    </span>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {isMr ? 'बंद करा' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
