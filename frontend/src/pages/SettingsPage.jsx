import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { api, user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState('₹ INR');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.put('/users/profile', { name, currency: currency.split(' ')[1] || '₹' });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setMessage('Passwords do not match');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await api.put('/users/profile', { password: newPassword });
      setMessage('Password updated successfully!');
      setNewPassword(''); setConfirmNewPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update password');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const data = { user, exportDate: new Date().toISOString(), message: 'Data export feature' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'expense-tracker-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'data', label: 'Data', icon: '📦' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          message.includes('success') 
            ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' 
            : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
        }`}>
          {message}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-white/5 pb-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                : 'text-dark-400 hover:text-dark-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 glass-input text-sm"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 glass-input text-sm opacity-50 cursor-not-allowed"
              />
              <p className="text-[11px] text-dark-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 glass-input text-sm appearance-none cursor-pointer"
              >
                <option value="₹ INR" className="bg-dark-800">₹ Indian Rupee (INR)</option>
                <option value="$ USD" className="bg-dark-800">$ US Dollar (USD)</option>
                <option value="€ EUR" className="bg-dark-800">€ Euro (EUR)</option>
                <option value="£ GBP" className="bg-dark-800">£ British Pound (GBP)</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-6 py-3 text-sm disabled:opacity-50">
              <span className="relative z-10">{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 glass-input text-sm"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full px-4 py-3 glass-input text-sm"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-6 py-3 text-sm disabled:opacity-50">
              <span className="relative z-10">{loading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Data tab */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Export Data</h3>
            <p className="text-dark-400 text-sm mb-4">Download your data as a JSON file</p>
            <button onClick={handleExportData} className="btn-primary px-5 py-2.5 text-sm">
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export as JSON
              </span>
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Account</h3>
            <p className="text-dark-400 text-sm mb-4">Sign out of your account on this device</p>
            <button onClick={logout} className="px-5 py-2.5 bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/20 font-semibold text-sm rounded-xl transition-all">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
