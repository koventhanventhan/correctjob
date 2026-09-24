'use client';
import { useState } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Lock, Save } from 'lucide-react';

export default function SeekerSettings() {
    const { user } = useAuthStore();
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [msg, setMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg('');

        try {
            await api.post('/auth/change-password', passwordData);
            setMsg('Password changed successfully.');
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (error: any) {
            setMsg(error.response?.data?.message || 'Failed to change password.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            disabled
                            value={user?.fullName || ''}
                            className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Name cannot be changed directly.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            disabled
                            value={user?.email || ''}
                            className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email is associated with your account identity.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2 flex items-center">
                    <Lock className="w-5 h-5 mr-2" /> Change Password
                </h2>
                
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            required
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {msg && (
                        <p className={`text-sm ${msg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                            {msg}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
