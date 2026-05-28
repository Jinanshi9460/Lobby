import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const GeneralSettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [compactMode, setCompactMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="space-y-6">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-slate-300">Basic preferences available even without login.</p>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white">Appearance</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
            Theme mode
            <button type="button" onClick={toggleTheme} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-100">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </label>
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
            Compact layout
            <input type="checkbox" checked={compactMode} onChange={e => setCompactMode(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
            Reduced motion
            <input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} />
          </label>
        </div>
      </section>
    </div>
  );
};

export default GeneralSettingsPage;
