import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const STORAGE_KEY = 'lobby_admin_settings';

const AdminSettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    securityAlerts: true,
    vendorApprovalAlerts: true,
    autoSuspendThreshold: 5,
    riskyOrderReview: true,
    autoHideOutOfStock: true,
    maintenanceBanner: false,
    digestFrequency: 'daily',
    dashboardDensity: 'comfortable',
    animationLevel: 'balanced'
  });
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const persisted = localStorage.getItem(STORAGE_KEY);
    if (persisted) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(persisted) }));
      } catch {
        // Ignore malformed persisted settings.
      }
    }
  }, []);

  const updateSetting = (key, value) => {
    setSavedMessage('');
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSavedMessage('Admin settings saved successfully.');
  };

  const resetSettings = () => {
    const defaults = {
      securityAlerts: true,
      vendorApprovalAlerts: true,
      autoSuspendThreshold: 5,
      riskyOrderReview: true,
      autoHideOutOfStock: true,
      maintenanceBanner: false,
      digestFrequency: 'daily',
      dashboardDensity: 'comfortable',
      animationLevel: 'balanced'
    };
    setSettings(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    setSavedMessage('Settings reset to defaults.');
  };

  const statusChips = useMemo(
    () => [
      settings.securityAlerts ? 'Security Monitoring On' : 'Security Monitoring Off',
      settings.maintenanceBanner ? 'Maintenance Banner Active' : 'Maintenance Banner Hidden',
      `Digest: ${settings.digestFrequency}`
    ],
    [settings]
  );

  return (
    <div className="space-y-6">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold text-white">Admin Settings</h1>
        <p className="mt-2 text-slate-300">Control platform security, moderation defaults, alerts, and panel behavior from one place.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {statusChips.map(chip => (
            <span key={chip} className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white">Security & Moderation</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Security event alerts
              <input type="checkbox" checked={settings.securityAlerts} onChange={e => updateSetting('securityAlerts', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Vendor approval alerts
              <input type="checkbox" checked={settings.vendorApprovalAlerts} onChange={e => updateSetting('vendorApprovalAlerts', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Review risky orders
              <input type="checkbox" checked={settings.riskyOrderReview} onChange={e => updateSetting('riskyOrderReview', e.target.checked)} />
            </label>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              <div className="mb-2 flex items-center justify-between">
                <span>Auto-suspend threshold</span>
                <span className="text-cyan-300">{settings.autoSuspendThreshold} reports</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.autoSuspendThreshold}
                onChange={e => updateSetting('autoSuspendThreshold', Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white">Experience & Notifications</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Theme mode
              <button type="button" onClick={toggleTheme} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-100">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Auto hide out-of-stock
              <input type="checkbox" checked={settings.autoHideOutOfStock} onChange={e => updateSetting('autoHideOutOfStock', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Maintenance banner
              <input type="checkbox" checked={settings.maintenanceBanner} onChange={e => updateSetting('maintenanceBanner', e.target.checked)} />
            </label>
            <label className="block rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              <span className="mb-2 block">Digest frequency</span>
              <select value={settings.digestFrequency} onChange={e => updateSetting('digestFrequency', e.target.value)} className="w-full">
                <option value="realtime">Realtime</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
                <span className="mb-2 block">Dashboard density</span>
                <select value={settings.dashboardDensity} onChange={e => updateSetting('dashboardDensity', e.target.value)} className="w-full">
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </label>
              <label className="block rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
                <span className="mb-2 block">Animation level</span>
                <select value={settings.animationLevel} onChange={e => updateSetting('animationLevel', e.target.value)} className="w-full">
                  <option value="minimal">Minimal</option>
                  <option value="balanced">Balanced</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white">Actions</h2>
        <p className="mt-1 text-sm text-slate-300">Save your admin panel personalization or reset to clean defaults.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={saveSettings} className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
            Save Settings
          </button>
          <button type="button" onClick={resetSettings} className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-5 py-3 text-sm text-amber-200 hover:bg-amber-500/20">
            Reset Defaults
          </button>
        </div>
        {savedMessage && <p className="mt-3 text-sm text-emerald-300">{savedMessage}</p>}
      </section>
    </div>
  );
};

export default AdminSettingsPage;
