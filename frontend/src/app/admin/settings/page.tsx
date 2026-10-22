'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getFileUrl } from '@/utils/imageUrl';
import {
    LuLock,
    LuSave,
    LuArrowLeft,
    LuUser,
    LuMail,
    LuCamera,
    LuUpload,
    LuCheck,
    LuTriangleAlert,
    LuEye,
    LuEyeOff,
    LuShield
} from 'react-icons/lu';
import Link from 'next/link';
import { validatePassword, formatIdentityErrors } from '@/utils/passwordValidation';

type SettingsTab = 'photo' | 'name' | 'email' | 'password';

export default function AdminSettings() {
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>('photo');

    // 1. Profile Photo State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [photoMsg, setPhotoMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 2. Full Name State
    const [fullName, setFullName] = useState('');
    const [nameMsg, setNameMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [nameSaving, setNameSaving] = useState(false);

    // 3. Change Email State
    const [emailData, setEmailData] = useState({ newEmail: '', currentPassword: '' });
    const [emailMsg, setEmailMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [emailSaving, setEmailSaving] = useState(false);

    // 4. Change Password State
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            if (user.profileImage) {
                setPreviewUrl(getFileUrl(user.profileImage));
            }
        }
    }, [user]);

    const initials = user?.fullName
        ? user.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'AD';

    // Handle file selection with validation
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhotoMsg(null);
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setPhotoMsg({ text: 'Invalid file type. Only JPEG and PNG images are allowed.', isError: true });
            setSelectedFile(null);
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setPhotoMsg({ text: 'File size exceeds the 2MB limit.', isError: true });
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    // Upload profile photo
    const handlePhotoUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setPhotoMsg({ text: 'Please choose an image file first.', isError: true });
            return;
        }

        setPhotoUploading(true);
        setPhotoMsg(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const res = await api.post('/auth/profile-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.user) {
                setUser(res.data.user);
            } else if (user) {
                setUser({ ...user, profileImage: res.data.profileImage });
            }

            setPhotoMsg({ text: 'Profile photo updated successfully!', isError: false });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to upload profile photo.';
            setPhotoMsg({ text: errorMsg, isError: true });
        } finally {
            setPhotoUploading(false);
        }
    };

    // Save Full Name
    const handleNameSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) return;

        setNameSaving(true);
        setNameMsg(null);

        try {
            const res = await api.put('/auth/profile', {
                fullName: fullName.trim(),
                email: user?.email
            });
            if (res.data.user) {
                setUser(res.data.user);
            }
            setNameMsg({ text: 'Full name updated successfully!', isError: false });
        } catch (error: any) {
            setNameMsg({
                text: error.response?.data?.message || 'Failed to update name.',
                isError: true
            });
        } finally {
            setNameSaving(false);
        }
    };

    // Change Email with current password verification
    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailSaving(true);
        setEmailMsg(null);

        try {
            const res = await api.post('/auth/change-email', emailData);
            if (res.data.user) {
                setUser(res.data.user);
            }
            setEmailMsg({ text: 'Email address updated successfully!', isError: false });
            setEmailData({ newEmail: '', currentPassword: '' });
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to change email.';
            setEmailMsg({ text: errorMsg, isError: true });
        } finally {
            setEmailSaving(false);
        }
    };

    // Change Password
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSaving(true);
        setPasswordMsg(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMsg({ text: 'New password and confirm password do not match.', isError: true });
            setPasswordSaving(false);
            return;
        }

        const validationError = validatePassword(passwordData.newPassword);
        if (validationError) {
            setPasswordMsg({ text: validationError, isError: true });
            setPasswordSaving(false);
            return;
        }

        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordMsg({ text: 'Password changed successfully!', isError: false });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            const errorMsg = formatIdentityErrors(error, 'Failed to change password.');
            setPasswordMsg({ text: errorMsg, isError: true });
        } finally {
            setPasswordSaving(false);
        }
    };

    const navItems: { id: SettingsTab; label: string; icon: any; desc: string }[] = [
        { id: 'photo', label: 'Profile Photo', icon: LuCamera, desc: 'Update account avatar image' },
        { id: 'name', label: 'Display Name', icon: LuUser, desc: 'Your public name & title' },
        { id: 'email', label: 'Change Email', icon: LuMail, desc: 'Login & communication email' },
        { id: 'password', label: 'Password & Security', icon: LuLock, desc: 'Manage access credentials' },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back to Dashboard Navigation */}
            <div className="mb-6">
                <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center text-sm font-medium text-orange hover:text-orange/80 transition-colors"
                >
                    <LuArrowLeft className="w-4 h-4 mr-1.5" /> Back to Admin Dashboard
                </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">Account Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your administrator credentials, email address, and security preferences.
                </p>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="flex md:hidden overflow-x-auto gap-2 border-b border-gray-200 pb-3 mb-6 scrollbar-none">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                                isActive
                                    ? 'bg-charcoal text-white shadow-sm'
                                    : 'bg-warmwhite text-gray-700 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Desktop Two-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Left Navigation */}
                <div className="hidden md:block md:col-span-1 space-y-4">
                    {/* User Mini Card */}
                    <div className="bg-warmwhite rounded-lg border border-gray-200 p-4 text-center shadow-sm">
                        <div className="relative inline-block mb-3">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Admin Preview"
                                    className="w-16 h-16 rounded-full object-cover border-2 border-orange/20 mx-auto shadow-sm"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-orange text-white font-bold text-lg flex items-center justify-center mx-auto shadow-sm">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-charcoal text-sm truncate">{user?.fullName || 'Administrator'}</h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-charcoal text-white">
                            <LuShield className="w-3 h-3 text-orange" /> Administrator
                        </span>
                    </div>

                    {/* Nav Items */}
                    <nav className="bg-warmwhite rounded-lg border border-gray-200 p-2 shadow-sm space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-start gap-3 p-2.5 rounded-md text-left transition-colors ${
                                        isActive
                                            ? 'bg-orange text-white shadow-sm font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100 font-medium'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                                    <div className="min-w-0">
                                        <div className="text-xs leading-tight">{item.label}</div>
                                        <div className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                            {item.desc}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Right Content Area */}
                <div className="md:col-span-3">
                    {/* TAB 1: Profile Photo */}
                    {activeTab === 'photo' && (
                        <div className="bg-warmwhite rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                            <h2 className="text-lg font-bold text-charcoal mb-1 flex items-center gap-2">
                                <LuCamera className="w-5 h-5 text-orange" />
                                Profile Photo
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Upload a clear avatar for your administrator profile (JPEG or PNG, max 2MB).
                            </p>

                            <form onSubmit={handlePhotoUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                {/* Avatar Preview */}
                                <div className="relative group shrink-0">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Profile Preview"
                                            className="w-24 h-24 rounded-full object-cover border-2 border-orange/20 shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-orange text-white font-bold text-2xl flex items-center justify-center shadow-sm">
                                            {initials}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 bg-charcoal text-white rounded-full hover:bg-orange shadow-md transition-colors"
                                        title="Choose photo"
                                    >
                                        <LuCamera className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* File Picker & Actions */}
                                <div className="flex-1 space-y-3 w-full">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        onChange={handleFileChange}
                                        className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20 cursor-pointer"
                                    />
                                    <p className="text-[11px] text-gray-400">
                                        Supported formats: JPG, PNG. Maximum file size: 2MB.
                                    </p>

                                    {photoMsg && (
                                        <div
                                            className={`flex items-center gap-2 p-3 rounded-md text-xs ${
                                                photoMsg.isError
                                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}
                                        >
                                            {photoMsg.isError ? (
                                                <LuTriangleAlert className="w-4 h-4 shrink-0" />
                                            ) : (
                                                <LuCheck className="w-4 h-4 shrink-0" />
                                            )}
                                            <span>{photoMsg.text}</span>
                                        </div>
                                    )}

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={!selectedFile || photoUploading}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-xs font-semibold rounded-md hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                        >
                                            <LuUpload className="w-4 h-4 mr-1.5" />
                                            {photoUploading ? 'Uploading...' : 'Upload Photo'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: Display Name */}
                    {activeTab === 'name' && (
                        <div className="bg-warmwhite rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                            <h2 className="text-lg font-bold text-charcoal mb-1 flex items-center gap-2">
                                <LuUser className="w-5 h-5 text-orange" />
                                Display Name
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Update how your administrator name appears on system logs, jobs, and audits.
                            </p>

                            <form onSubmit={handleNameSave} className="space-y-4 max-w-lg">
                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2.5 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none bg-white transition-colors"
                                    />
                                </div>

                                {nameMsg && (
                                    <div
                                        className={`flex items-center gap-2 p-3 rounded-md text-xs ${
                                            nameMsg.isError
                                                ? 'bg-red-50 text-red-700 border border-red-200'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}
                                    >
                                        {nameMsg.isError ? (
                                            <LuTriangleAlert className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <LuCheck className="w-4 h-4 shrink-0" />
                                        )}
                                        <span>{nameMsg.text}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={nameSaving}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-xs font-semibold rounded-md hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    <LuSave className="w-4 h-4 mr-1.5" />
                                    {nameSaving ? 'Saving...' : 'Save Name'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: Change Email */}
                    {activeTab === 'email' && (
                        <div className="bg-warmwhite rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                            <h2 className="text-lg font-bold text-charcoal mb-1 flex items-center gap-2">
                                <LuMail className="w-5 h-5 text-orange" />
                                Change Email Address
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Update your administrative login email. Password confirmation is required.
                            </p>

                            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600 flex items-center justify-between max-w-lg">
                                <span>Current Email:</span>
                                <span className="font-semibold text-charcoal">{user?.email}</span>
                            </div>

                            <form onSubmit={handleEmailChange} className="space-y-4 max-w-lg">
                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        New Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="new-admin@hireconnect.com"
                                        value={emailData.newEmail}
                                        onChange={(e) =>
                                            setEmailData({ ...emailData, newEmail: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-md p-2.5 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none bg-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        Current Password (to confirm)
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter current password"
                                        value={emailData.currentPassword}
                                        onChange={(e) =>
                                            setEmailData({ ...emailData, currentPassword: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-md p-2.5 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none bg-white transition-colors"
                                    />
                                </div>

                                {emailMsg && (
                                    <div
                                        className={`flex items-center gap-2 p-3 rounded-md text-xs ${
                                            emailMsg.isError
                                                ? 'bg-red-50 text-red-700 border border-red-200'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}
                                    >
                                        {emailMsg.isError ? (
                                            <LuTriangleAlert className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <LuCheck className="w-4 h-4 shrink-0" />
                                        )}
                                        <span>{emailMsg.text}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={emailSaving}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-xs font-semibold rounded-md hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    <LuSave className="w-4 h-4 mr-1.5" />
                                    {emailSaving ? 'Updating...' : 'Update Email'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 4: Password & Security */}
                    {activeTab === 'password' && (
                        <div className="bg-warmwhite rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                            <h2 className="text-lg font-bold text-charcoal mb-1 flex items-center gap-2">
                                <LuLock className="w-5 h-5 text-orange" />
                                Change Password
                            </h2>
                            <p className="text-xs text-gray-500 mb-6">
                                Protect your administrative privileges with a strong, distinct password.
                            </p>

                            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPw ? 'text' : 'password'}
                                            required
                                            placeholder="Enter current password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    currentPassword: e.target.value
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-md p-2.5 pr-10 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none bg-white transition-colors"
                                        />
                                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showCurrentPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPw ? 'text' : 'password'}
                                            required
                                            placeholder="Enter new strong password"
                                            value={passwordData.newPassword}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    newPassword: e.target.value
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-md p-2.5 pr-10 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none bg-white transition-colors"
                                        />
                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNewPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPw ? 'text' : 'password'}
                                            required
                                            placeholder="Re-enter new password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    confirmPassword: e.target.value
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-md p-2.5 pr-10 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none bg-white transition-colors"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirmPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                        <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                                    )}
                                </div>

                                {passwordMsg && (
                                    <div
                                        className={`flex items-center gap-2 p-3 rounded-md text-xs ${
                                            passwordMsg.isError
                                                ? 'bg-red-50 text-red-700 border border-red-200'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}
                                    >
                                        {passwordMsg.isError ? (
                                            <LuTriangleAlert className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <LuCheck className="w-4 h-4 shrink-0" />
                                        )}
                                        <span>{passwordMsg.text}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={passwordSaving}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-xs font-semibold rounded-md hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    <LuSave className="w-4 h-4 mr-1.5" />
                                    {passwordSaving ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
