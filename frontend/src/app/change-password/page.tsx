'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { 
    LuKey, LuShieldAlert, LuEye, LuEyeOff, 
    LuCheck, LuArrowRight, LuLogOut, LuRefreshCw, LuCircleAlert 
} from 'react-icons/lu';

export default function ChangePasswordPage() {
    const { user, token, setAuth, setUser, logout, isInitializing } = useAuthStore();
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Password strength rules
    const hasMinLen = newPassword.length >= 12;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
    const isStrong = hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial;
    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!currentPassword) {
            setErrorMsg('Please enter your current temporary or existing password.');
            return;
        }

        if (!isStrong) {
            setErrorMsg('New password does not meet all security requirements.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('New password and confirm password do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            // Update auth store with new token and updated user state
            if (user) {
                const updatedUser = { ...user, mustChangePassword: false };
                if (res.data.token) {
                    setAuth(updatedUser, res.data.token);
                } else {
                    setUser(updatedUser);
                }
            }

            setSuccessMsg('Your password has been changed successfully. Redirecting to dashboard...');

            const roleToPath: Record<string, string> = {
                JobSeeker: 'seeker',
                Employer: 'employer',
                Admin: 'admin',
            };
            const rolePath = user?.role ? (roleToPath[user.role] || user.role.toLowerCase()) : 'seeker';

            setTimeout(() => {
                router.push(`/${rolePath}/dashboard`);
            }, 1200);
        } catch (err: any) {
            const msg = err.response?.data?.message 
                        || err.response?.data?.[0]?.description 
                        || (typeof err.response?.data === 'string' ? err.response?.data : null)
                        || 'Failed to change password. Please check your current password.';
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Ignore logout errors
        } finally {
            logout();
            router.push('/login');
        }
    };

    if (!isInitializing && !user && !token) {
        if (typeof window !== 'undefined') {
            router.push('/login');
        }
        return null;
    }

    return (
        <div className="min-h-screen bg-warmwhite flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-lg bg-orange/10 border border-orange/20 flex items-center justify-center text-orange shadow-xs">
                        <LuKey className="w-7 h-7" />
                    </div>
                </div>
                <h2 className="mt-4 text-center text-2xl font-display font-bold text-charcoal">
                    Password Change Required
                </h2>
                <p className="mt-2 text-center text-xs text-gray-600 max-w-sm mx-auto">
                    To safeguard your account and platform security, you must update your temporary or expired password before continuing.
                </p>
            </div>

            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-lg sm:px-10">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-xs text-amber-800 flex items-start gap-2.5">
                        <LuShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                        <div>
                            <span className="font-semibold block mb-0.5">Account Security Policy</span>
                            <span>Navigation to other platform pages is locked until a new strong password is established.</span>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                            <LuCircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
                            <LuCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-xs font-semibold text-charcoal mb-1">
                                Current / Temporary Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    required
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full text-xs p-2.5 pr-9 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrent ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-semibold text-charcoal mb-1">
                                New Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    required
                                    placeholder="Enter new strong password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full text-xs p-2.5 pr-9 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNew ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Strength Checklist */}
                            <div className="mt-2.5 p-3 bg-gray-50 rounded-xl space-y-1 text-[11px]">
                                <span className="font-semibold text-charcoal block mb-1">Requirements:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                    <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                        {hasMinLen ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                        <span>At least 12 characters</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                        {hasUpper ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                        <span>Uppercase letter (A-Z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                        {hasLower ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                        <span>Lowercase letter (a-z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                        {hasDigit ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                        <span>Numeric digit (0-9)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                        {hasSpecial ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                        <span>Special symbol (!@#$...)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-semibold text-charcoal mb-1">
                                Confirm New Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full text-xs p-2.5 pr-9 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirm ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>
                            )}
                            {passwordsMatch && (
                                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                                    <LuCheck className="w-3 h-3" /> Passwords match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !isStrong || !passwordsMatch || !currentPassword}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange hover:bg-orange/90 text-white text-sm font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                        >
                            {isLoading ? (
                                <>
                                    <LuRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <>
                                    <span>Update Password & Continue</span>
                                    <LuArrowRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Signed in as {user?.email}</span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-rose-600 font-medium transition-colors"
                        >
                            <LuLogOut className="w-3.5 h-3.5" />
                            <span>Sign out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
