'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import Link from 'next/link';

function ForgotPasswordForm() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1 = Request Link, 2 = Reset Password, 3 = Success

    useEffect(() => {
        const queryToken = searchParams.get('token');
        const queryEmail = searchParams.get('email');

        if (queryToken) {
            setToken(queryToken);
            if (queryEmail) {
                setEmail(queryEmail);
            }
            setStep(2);
        }
    }, [searchParams]);

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        setErrorMsg('');
        try {
            const res = await api.post('/auth/forgot-password', { email: email.trim() });
            setMsg(res.data.message || 'If the email exists, a password reset link has been sent to your inbox.');
        } catch (error: any) {
            const errorData = error.response?.data;
            const errorText = typeof errorData === 'string' ? errorData : errorData?.message || 'Failed to send reset link.';
            setErrorMsg(errorText);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg('New password and confirm password do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg('New password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { 
                email: email.trim(), 
                token: token.trim(), 
                newPassword 
            });
            setMsg(res.data.message || 'Password reset successfully.');
            setStep(3);
        } catch (error: any) {
            const errorData = error.response?.data;
            let errorText = 'Failed to reset password. The link or token may be invalid or expired.';
            if (typeof errorData === 'string') {
                errorText = errorData;
            } else if (Array.isArray(errorData)) {
                errorText = errorData.map((e: any) => e.description || e.code).join(' ');
            } else if (errorData?.message) {
                errorText = errorData.message;
            }
            setErrorMsg(errorText);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg sm:px-8 border border-gray-200">
            {step === 1 && (
                <div>
                    {msg ? (
                        <div className="space-y-6">
                            <div className="rounded-md bg-green-50 p-4 border border-green-200">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800">Reset Link Sent</h3>
                                        <div className="mt-2 text-sm text-green-700">
                                            <p>{msg}</p>
                                            <p className="mt-2">Please check your email and click the button or link provided to choose a new password.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col space-y-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setStep(2); setMsg(''); }}
                                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-charcoal bg-white hover:bg-gray-50"
                                >
                                    Already have a reset token? Enter token manually
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMsg(''); }}
                                    className="text-sm text-orange hover:underline text-center"
                                >
                                    Send to a different email
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleForgot} className="space-y-6">
                            <p className="text-sm text-gray-600">
                                Enter the email address associated with your HireConnect account, and we will send you a password reset link.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email address</label>
                                <div className="mt-1">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange focus:border-orange sm:text-sm"
                                    />
                                </div>
                            </div>
                            {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange hover:bg-orange/90 disabled:opacity-50"
                            >
                                {loading ? 'Sending link...' : 'Send Reset Link'}
                            </button>
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="text-xs text-gray-500 hover:text-orange hover:underline"
                                >
                                    Already have a reset token? Click here
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {step === 2 && (
                <form onSubmit={handleReset} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-charcoal">Enter your new password</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Enter the reset token received in your email along with your desired new password.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange focus:border-orange sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reset Token</label>
                        <input
                            type="text"
                            required
                            placeholder="Paste your reset token here"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange focus:border-orange sm:text-sm font-mono text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            required
                            placeholder="Minimum 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange focus:border-orange sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange focus:border-orange sm:text-sm"
                        />
                    </div>

                    {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

                    <div className="flex flex-col space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange hover:bg-orange/90 disabled:opacity-50"
                        >
                            {loading ? 'Resetting password...' : 'Reset Password'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setStep(1); setErrorMsg(''); }}
                            className="text-sm text-gray-500 hover:text-orange hover:underline text-center"
                        >
                            Back to request a new link
                        </button>
                    </div>
                </form>
            )}

            {step === 3 && (
                <div className="text-center py-4">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successfully</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Your password has been updated. You can now use your new password to log in to HireConnect.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange hover:bg-orange/90"
                    >
                        Go to Login
                    </Link>
                </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="text-sm">
                    <Link href="/login" className="font-medium text-orange hover:underline">
                        &larr; Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-warmwhite flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-charcoal">
                    Reset your password
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Suspense fallback={<div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">Loading...</div>}>
                    <ForgotPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
