'use client';
import { useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1);

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMsg(res.data.message || 'If the email exists, a reset link has been sent.');
            setStep(2); // In real app, they'd click link in email
        } catch (error) {
            setMsg('Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            const res = await api.post('/auth/reset-password', { email, token, newPassword });
            setMsg(res.data.message || 'Password reset successfully.');
            setStep(3);
        } catch (error: any) {
            setMsg(error.response?.data || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Reset your password
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {step === 1 && (
                        <form onSubmit={handleForgot} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email address</label>
                                <div className="mt-1">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            {msg && <div className="text-sm text-green-600">{msg}</div>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="text-sm text-gray-600 mb-4">
                                {msg}. Enter the token received (check server console in dev) and new password.
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reset Token</label>
                                <input
                                    type="text"
                                    required
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            {msg && !msg.includes('link') && <div className="text-sm text-red-600">{msg}</div>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="text-center">
                            <p className="text-green-600 mb-4">{msg}</p>
                            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                                Return to Login
                            </Link>
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm">
                            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Back to login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
