import React, { useState, useEffect } from 'react';
import { getActiveGoogleSheetUrl, saveActiveGoogleSheetUrl } from '../../../config/googleSheets';
import { formatCleanDateTime, cleanLocationName } from '../../../utils/dateFormatter';

/**
 * SettingsView - Step 6: Google Sheet Sync & System Settings
 * Dedicated view for non-technical office staff:
 * Manages Google Sheet synchronization, connection testing, and system diagnostics.
 */
export default function SettingsView({
  calculatorQuotes = [],
  onSyncSuccess,
  onOpenResetModal,
  showToast
}) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const currentUrl = getActiveGoogleSheetUrl();
    setWebhookUrl(currentUrl);
    setIsConnected(Boolean(currentUrl && currentUrl.startsWith('https://script.google.com/macros/s/')));
  }, []);

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    const clean = webhookUrl.trim();
    if (!clean) {
      saveActiveGoogleSheetUrl('');
      setIsConnected(false);
      showToast?.('Google Sheet disconnected.', 'info');
      setTestResult({ success: true, message: 'Google Sheet sync disconnected.' });
      return;
    }

    if (!clean.startsWith('https://script.google.com/macros/s/')) {
      showToast?.('Please enter a valid Google Apps Script Web App URL', 'error');
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
        setIsConnected(true);
        const lCount = Array.isArray(data.leads) ? data.leads.length : 0;
        const bCount = Array.isArray(data.bookings) ? data.bookings.length : 0;
        const qCount = Array.isArray(data.calculatorQuotes) ? data.calculatorQuotes.length : 0;

        setTestResult({
          success: true,
          message: `Connected successfully! Found ${lCount} leads, ${bCount} bookings, and ${qCount} calculator quotes in Google Sheets.`
        });
        showToast?.('Google Sheet connected and verified!', 'success');
        onSyncSuccess?.(data);
      } else {
        throw new Error(data.error || 'Google Apps Script returned an error response.');
      }
    } catch (err) {
      setIsConnected(false);
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to Google Sheet Web App.'
      });
      showToast?.('Connection failed: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="bg-m3-surface-container-lowest p-4 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-m3-primary' : 'bg-m3-on-surface-variant'}`}></span>
            <h2 className="text-m3-title-m font-bold text-m3-on-surface">
              6. Google Sheet Sync & Settings
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container border border-m3-outline-variant/50">
              {isConnected ? '🟢 Live Sync Active' : '⚠️ Action Needed'}
            </span>
          </div>
          <p className="text-xs text-m3-on-surface-variant mt-0.5">
            2-way automatic synchronization between your website booking engines and your Google Sheet.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-m3-surface-container-lowest p-5 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 space-y-4">
        <form onSubmit={handleSaveAndTest} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-m3-on-surface mb-1">
              Google Apps Script Web App URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full p-2.5 text-xs font-mono-code font-semibold rounded-m3-md border border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface focus:ring-2 focus:ring-m3-primary"
              />
            </div>
            <p className="text-[11px] text-m3-on-surface-variant mt-1">
              Paste the Web App URL generated when deploying your <code>google_apps_script.js</code> in Google Sheets.
            </p>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div className={`p-3 rounded-m3-md border text-xs font-semibold flex items-start gap-2 ${
              testResult.success
                ? 'bg-m3-secondary-container text-m3-on-secondary-container border-m3-outline-variant/60'
                : 'bg-m3-error-container text-m3-on-error-container border-m3-outline-variant/60'
            }`}>
              <span className="material-symbols-outlined text-[18px] shrink-0">
                {testResult.success ? 'check_circle' : 'error'}
              </span>
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isTesting}
              className="h-10 px-5 bg-m3-primary hover:bg-m3-primary/90 disabled:opacity-50 text-m3-on-primary rounded-full font-bold text-xs flex items-center gap-1.5 shadow-m3-1 transition-colors"
            >
              {isTesting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Verifying Connection...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Save & Test Google Sheet Connection</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sync Explanation for Beginners */}
        <div className="pt-4 border-t border-m3-outline-variant/60">
          <h4 className="text-xs font-bold uppercase text-m3-on-surface mb-2">How 2-Way Sync Works:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="font-bold text-m3-primary block mb-0.5">1. Website Leads</span>
              <p className="text-m3-on-surface-variant text-[11px]">
                When customers calculate rates or send WhatsApp inquiries, they save automatically to your Google Sheet.
              </p>
            </div>
            <div className="p-3 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="font-bold text-m3-primary block mb-0.5">2. Manual Calls</span>
              <p className="text-m3-on-surface-variant text-[11px]">
                When your office staff enters a Google Ads call or direct phone call, it is merged and preserved safely.
              </p>
            </div>
            <div className="p-3 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/50">
              <span className="font-bold text-m3-primary block mb-0.5">3. Live Bookings</span>
              <p className="text-m3-on-surface-variant text-[11px]">
                Active duties, driver assignments, and duty slips are synced so your data is never lost.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Website Visitor Search Trends (Market Intelligence / Shopper Data) */}
      <div className="bg-m3-surface-container-lowest p-5 rounded-m3-xl border border-m3-outline-variant/70 shadow-m3-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-m3-primary text-[20px]">trending_up</span>
              <h3 className="text-sm font-bold text-m3-on-surface">
                Website Visitor Search Trends ({calculatorQuotes.length} Price Checks)
              </h3>
            </div>
            <p className="text-[11px] text-m3-on-surface-variant mt-0.5">
              Anonymous visitors comparing rates on your website calculators. Stored in your Google Sheet (<code>Calculator_Quotes</code> tab) for route popularity and ad budget planning.
            </p>
          </div>
          <span className="text-[11px] font-bold text-m3-on-secondary-container bg-m3-secondary-container border border-m3-outline-variant/50 px-2.5 py-1 rounded-full shrink-0">
            📊 Market Intelligence
          </span>
        </div>

        {calculatorQuotes.length === 0 ? (
          <div className="p-6 text-center rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/50 text-xs text-m3-on-surface-variant">
            No website calculator searches recorded yet. When visitors check fares on your Airport, Outstation, or Tour booking pages, they will log here automatically.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {calculatorQuotes.slice(0, 10).map((q, idx) => (
                <div
                  key={q.quoteId || idx}
                  className="p-3 rounded-m3-lg bg-m3-surface-container-low border border-m3-outline-variant/50 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-m3-on-surface truncate">
                      📍 {cleanLocationName(q.pickup) || 'Chennai'} ➔ {cleanLocationName(q.drop)}
                    </div>
                    <div className="text-[11px] text-m3-on-surface-variant flex items-center gap-1.5 mt-0.5">
                      <span>🚗 {q.vehicle}</span>
                      <span>•</span>
                      <span>{q.tripType || 'Round Trip'}</span>
                      {q.timestamp && (
                        <>
                          <span>•</span>
                          <span className="text-m3-on-surface-variant/80 font-mono-code">{formatCleanDateTime(q.timestamp)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-m3-primary block">
                      ₹{Number(q.estimatedFare || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-m3-on-surface-variant">Estimated</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-m3-on-surface-variant text-right">
              Showing recent searches • All entries saved in Google Sheet (Calculator_Quotes)
            </p>
          </div>
        )}
      </div>

      {/* Danger Zone: Full System Reset */}
      <div className="bg-m3-error-container/40 p-4 rounded-m3-xl border border-m3-outline-variant/70 flex items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-m3-on-surface block">Clear All Test / Old Data</span>
          <span className="text-m3-on-surface-variant text-[11px]">
            Permanently clear all test entries and start with a clean slate for real business operations.
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenResetModal}
          className="h-9 px-4 bg-m3-error hover:bg-m3-error/90 text-m3-on-error rounded-full font-bold shrink-0 flex items-center gap-1 shadow-xs transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
          <span>Reset to Zero</span>
        </button>
      </div>
    </div>
  );
}
