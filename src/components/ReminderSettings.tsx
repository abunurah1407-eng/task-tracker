import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings, Mail, Save } from 'lucide-react';

interface ReminderSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number;
  dayName: string;
}

const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getReminderSettings();
      setSettings(data);
    } catch (error: any) {
      alert(`Failed to load reminder settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setMessage(null);
      const result = await api.updateReminderSettings({
        enabled: settings.enabled,
        frequency: settings.frequency,
        dayOfWeek: settings.dayOfWeek,
      });
      setSettings({
        enabled: result.enabled,
        frequency: result.frequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
        dayOfWeek: result.dayOfWeek,
        dayName: result.dayName,
      });
      setMessage(result.message || 'Settings saved successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      alert(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const result = await api.testReminderEmail();
      alert(result.message || 'Test email sent successfully');
    } catch (error: any) {
      alert(`Failed to send test email: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!settings) {
    return <div className="p-4 text-red-600">Failed to load settings</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Weekly Reminder Settings</h2>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-lg font-semibold text-gray-700">Enable Reminder Emails</label>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Frequency
          </label>
          <select
            value={settings.frequency}
            onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Day of Week (only show if weekly, biweekly, or monthly) */}
        {settings.frequency !== 'daily' && (
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Day of Week
            </label>
            <select
              value={settings.dayOfWeek}
              onChange={(e) => setSettings({ ...settings, dayOfWeek: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {dayNamesEn.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Current: {dayNamesEn[settings.dayOfWeek]}
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Settings Summary</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>Status:</strong> {settings.enabled ? 'Enabled ✓' : 'Disabled ✗'}
            </li>
            <li>
              <strong>Frequency:</strong> {settings.frequency}
            </li>
            {settings.frequency !== 'daily' && (
              <li>
                <strong>Day:</strong> {dayNamesEn[settings.dayOfWeek]}
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !settings.enabled}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>
    </div>
  );
}

