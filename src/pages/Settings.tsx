import React from 'react';
import { 
  Moon, 
  Sun, 
  Palette, 
  Check, 
  User, 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../components/auth/AuthProvider';

const COLORS = [
  { name: 'Default Blue', value: '#2563eb' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Slate', value: '#475569' },
];

export const Settings = () => {
  const { theme, primaryColor, setTheme, setPrimaryColor, toggleTheme } = useTheme();
  const { profile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Settings</h2>
          <p className="text-sm font-medium text-slate-500">Customize your workspace and account preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">
              <Palette size={18} />
              Appearance
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all">
              <User size={18} />
              Account Profile
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all">
              <Bell size={18} />
              Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all">
              <Shield size={18} />
              Security
            </button>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Appearance Section */}
          <div className="geometric-card p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Theme Mode</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                    theme === 'light' 
                    ? 'border-primary bg-primary/5 text-primary shadow-inner shadow-primary/5' 
                    : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-400'
                  }`}
                >
                  <Sun size={32} strokeWidth={theme === 'light' ? 2.5 : 1.5} />
                  <span className="font-black text-xs uppercase tracking-widest">Light Mode</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                    theme === 'dark' 
                    ? 'border-primary bg-primary/5 text-primary shadow-inner shadow-primary/5' 
                    : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-400'
                  }`}
                >
                  <Moon size={32} strokeWidth={theme === 'dark' ? 2.5 : 1.5} />
                  <span className="font-black text-xs uppercase tracking-widest">Dark Mode</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-700">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Primary Accent Color</h3>
              <div className="flex flex-wrap gap-4">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setPrimaryColor(color.value)}
                    className="group relative flex flex-col items-center gap-2"
                  >
                    <div 
                      className={`w-12 h-12 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center ${
                        primaryColor === color.value ? 'ring-4 ring-offset-4 ring-offset-white dark:ring-offset-slate-800 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      {primaryColor === color.value && <Check className="text-white" size={20} />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-slate-50 dark:border-slate-700">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest">Auto Appearance</h4>
                    <p className="text-xs font-medium text-blue-700/70 dark:text-blue-300/50">Sync theme with your system preferences automatically.</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-not-allowed">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="geometric-card p-8">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[2rem] bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center font-black text-2xl uppercase shadow-inner">
                  {profile?.name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase">{profile?.name || 'User Profile'}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{profile?.role || 'Member'}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
