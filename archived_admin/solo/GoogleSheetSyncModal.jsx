import React, { useState, useEffect } from 'react';
import { getActiveGoogleSheetUrl, saveActiveGoogleSheetUrl } from '../../../config/googleSheets';

export default function GoogleSheetSyncModal({
  isOpen = false,
  onClose,
  onSyncSuccess,
  showToast
}) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setWebhookUrl(getActiveGoogleSheetUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    const clean = webhookUrl.trim();
    if (!clean) {
      saveActiveGoogleSheetUrl('');
      showToast?.('Google Sheet sync disconnected.', 'info');
      setTestResult({ success: true, message: 'Google Sheet Webhook disconnected.' });
      return;
    }

    if (!clean.startsWith('https://script.google.com/macros/s/')) {
      showToast?.('Please enter a valid Google Apps Script Web App URL (starts with https://script.google.com/macros/s/...)', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      saveActiveGoogleSheetUrl(clean);
      const res = await fetch(clean, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Google Sheet returned HTTP ${res.status}`);
      }

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error('Google Apps Script did not return JSON. Make sure you selected "Anyone" under "Who has access" when deploying.');
      }

      if (data && data.success) {
        setTestResult({
          success: true,
          message: `Connected successfully! Found ${data.leads ? data.leads.length : 0} enquiries and ${data.bookings ? data.bookings.length : 0} bookings in Google Sheet.`
        });
        showToast?.('Google Sheet connected & synced successfully!', 'success');
        onSyncSuccess?.(data);
      } else {
        throw new Error(data.error || 'Unknown response from Google Sheet script.');
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to Google Sheet Web App.'
      });
      showToast?.(err.message || 'Connection failed', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    saveActiveGoogleSheetUrl('');
    setWebhookUrl('');
    setTestResult({ success: true, message: 'Google Sheet sync disconnected.' });
    showToast?.('Google Sheet sync removed.', 'info');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-m3-inverse-surface/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-m3-surface rounded-m3-2xl shadow-m3-3 border border-m3-outline-variant overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-m3-surface-container-low border-b border-m3-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-m3-md bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-sm shadow-xs">
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
            </div>
            <div>
              <h2 className="text-m3-title-s font-bold text-m3-on-surface">Google Sheets 2-Way Live Sync</h2>
              <p className="text-[11px] text-m3-on-surface-variant font-medium">Auto-receive website enquiries into your Admin board</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-m3-full hover:bg-m3-surface-container text-m3-on-surface-variant flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Quick Setup Instructions */}
          <div className="p-3.5 rounded-m3-xl bg-m3-surface-container-low border border-m3-outline-variant/70 text-m3-on-surface space-y-2">
            <div className="font-bold text-xs flex items-center gap-1.5 text-m3-primary">
              <span className="material-symbols-outlined text-[16px]">help</span>
              <span>How to Link Your Google Sheet (Takes 2 Minutes):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-m3-on-surface-variant leading-relaxed font-medium">
              <li>Create a new sheet on <a href="https://sheets.new" target="_blank" rel="noreferrer" className="underline font-bold text-m3-primary">Google Sheets</a>.</li>
              <li>Click <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Copy and paste all code from <code className="bg-m3-surface-container-high px-1 py-0.5 rounded font-mono text-m3-on-surface">google_apps_script.js</code> in your project folder.</li>
              <li>Click <strong>Deploy &gt; New deployment &gt; Select "Web app"</strong>.</li>
              <li>Set <em>"Who has access"</em> to <strong>"Anyone"</strong> and click Deploy.</li>
              <li>Copy your <strong>Web App URL</strong> and paste it below!</li>
            </ol>
          </div>

          <form onSubmit={handleSaveAndTest} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-m3-on-surface-variant mb-1">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full h-11 bg-m3-surface-container-lowest border border-m3-outline-variant rounded-m3-md px-3 text-xs font-mono text-m3-on-surface focus:outline-none focus:border-m3-primary focus:ring-1 focus:ring-m3-primary"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-m3-lg text-xs font-medium border flex items-start gap-2 ${
                testResult.success
                  ? 'bg-m3-secondary-container border-m3-outline-variant/60 text-m3-on-secondary-container'
                  : 'bg-m3-error-container border-m3-outline-variant/60 text-m3-on-error-container'
              }`}>
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  {testResult.success ? 'check_circle' : 'error'}
                </span>
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-m3-outline-variant/60">
              {webhookUrl ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3.5 py-1.5 text-xs font-bold text-m3-error hover:bg-m3-error-container/20 rounded-full transition-colors"
                >
                  Unlink Sheet
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-m3-on-surface-variant hover:bg-m3-surface-container-high rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-5 py-2.5 bg-m3-primary hover:bg-m3-primary/90 disabled:opacity-50 text-m3-on-primary font-bold text-xs rounded-full shadow-m3-1 flex items-center gap-1.5 transition-all"
                >
                  {isTesting ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-[16px]">sync</span>
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      <span>Save &amp; Sync Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
