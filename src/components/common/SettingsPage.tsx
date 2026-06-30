import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/api';
import { Bell, Globe, Shield, SlidersHorizontal, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

// Types for settings
interface SettingItem {
  key: string;
  label: string;
  type: 'text' | 'toggle' | 'select' | 'number';
  value: any;
  options?: { label: string; value: string }[];
}

interface SettingsSection {
  title: string;
  icon: React.FC<{ className?: string }>;
  items: SettingItem[];
}

// Default settings structure (used as fallback if API fails)
const defaultSections: SettingsSection[] = [
  {
    title: 'General',
    icon: SlidersHorizontal,
    items: [
      { key: 'language', label: 'Language', type: 'select', value: 'en-US', options: [{ label: 'English (US)', value: 'en-US' }, { label: 'English (UK)', value: 'en-GB' }] },
      { key: 'timezone', label: 'Time Zone', type: 'select', value: 'Asia/Kolkata', options: [{ label: 'Asia/Kolkata', value: 'Asia/Kolkata' }, { label: 'UTC', value: 'UTC' }] },
      { key: 'dateFormat', label: 'Date Format', type: 'select', value: 'DD/MM/YYYY', options: [{ label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' }, { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' }] },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { key: 'emailAlerts', label: 'Email Alerts', type: 'toggle', value: true },
      { key: 'smsAlerts', label: 'SMS Alerts', type: 'toggle', value: false },
      { key: 'inventoryWarnings', label: 'Inventory Warnings', type: 'toggle', value: true },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { key: 'twoFactor', label: 'Two-Factor Auth', type: 'toggle', value: false },
      { key: 'passwordPolicy', label: 'Password Policy', type: 'select', value: 'strong', options: [{ label: 'Weak', value: 'weak' }, { label: 'Medium', value: 'medium' }, { label: 'Strong', value: 'strong' }] },
      { key: 'sessionTimeout', label: 'Session Timeout', type: 'select', value: '30', options: [{ label: '15 mins', value: '15' }, { label: '30 mins', value: '30' }, { label: '60 mins', value: '60' }] },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [sections, setSections] = useState<SettingsSection[]>(defaultSections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Load settings from API (only if admin)
  const fetchSettings = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.getSettings();
      const settingsData = response.data || {};

      const updatedSections = defaultSections.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          value: settingsData[item.key] !== undefined ? settingsData[item.key] : item.value,
        })),
      }));

      setSections(updatedSections);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError(err.message || 'Failed to load settings. Using default values.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [isAdmin]);

  const handleChange = (sectionIndex: number, itemIndex: number, newValue: any) => {
    const updated = [...sections];
    updated[sectionIndex].items[itemIndex].value = newValue;
    setSections(updated);
    setSuccessMessage('');
    setError('');
  };

  const saveSettings = async () => {
    if (!isAdmin) {
      setError('Only administrators can modify settings.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      const payload: Record<string, any> = {};
      sections.forEach(section => {
        section.items.forEach(item => {
          payload[item.key] = item.value;
        });
      });

      await apiService.updateSettings(payload);
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      const msg = err.message || 'Failed to save settings';
      if (err.message && err.message.toLowerCase().includes('permission')) {
        setError('You do not have permission to change settings. Only administrators can do this.');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------- Access Denied for non-admin ----------
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
          <p className="text-slate-600 mt-2">
            Settings can only be modified by administrators. 
            Please contact your system administrator if you need to change any settings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">System</p>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            <Shield className="w-4 h-4" />
            Admin Only
          </span>
        </div>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {sections.map((section, sectionIdx) => {
          const Icon = section.icon;
          return (
            <section key={section.title} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              </div>
              <div className="space-y-4">
                {section.items.map((item, itemIdx) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    {item.type === 'toggle' ? (
                      <button
                        onClick={() => handleChange(sectionIdx, itemIdx, !item.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          item.value ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : item.type === 'select' ? (
                      <select
                        value={item.value}
                        onChange={(e) => handleChange(sectionIdx, itemIdx, e.target.value)}
                        className="text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer"
                      >
                        {item.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={item.type === 'number' ? 'number' : 'text'}
                        value={item.value}
                        onChange={(e) => handleChange(sectionIdx, itemIdx, e.target.value)}
                        className="text-sm font-medium text-slate-900 bg-transparent border-0 focus:ring-0 focus:outline-none text-right w-24"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}