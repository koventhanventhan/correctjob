'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getFileUrl } from '@/utils/imageUrl';
import {
    LuLock, LuSave, LuArrowLeft, LuUser, LuMail, LuCamera, LuUpload,
    LuCheck, LuTriangleAlert, LuEye, LuEyeOff
} from 'react-icons/lu';
import Link from 'next/link';

function MessageBox({ msg }: { msg: { text: string; isError: boolean } | null }) {
    if (!msg) return null;
    return (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            msg.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
            {msg.isError ? (
                <LuTriangleAlert className="w-4 h-4 flex-shrink-0" />
            ) : (
                <LuCheck className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{msg.text}</span>
        </div>
    );
}

export default function EmployerSettings() {
    const { user, setUser } = useAuthStore();

    // Profile Photo
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [photoMsg, setPhotoMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Full Name
    const [fullName, setFullName] = useState('');
    const [nameMsg, setNameMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [nameSaving, setNameSaving] = useState(false);

    // Change Email
    const [emailData, setEmailData] = useState({ newEmail: '', currentPassword: '' });
    const [emailMsg, setEmailMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [emailSaving, setEmailSaving] = useState(false);

    // Change Password
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            if (user.profileImage) {
                setPreviewUrl(getFileUrl(user.profileImage));
            }
        }
    }, [user]);

    const initials = user?.fullName
        ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'E';

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
            setPhotoMsg({ text: error.response?.data?.message || 'Failed to upload profile photo.', isError: true });
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleNameSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) return;

        setNameSaving(true);
        setNameMsg(null);

        try {
            const res = await api.put('/auth/profile', { fullName: fullName.trim(), email: user?.email });
            if (res.data.user) setUser(res.data.user);
            setNameMsg({ text: 'Full name updated successfully!', isError: false });
        } catch (error: any) {
            setNameMsg({ text: error.response?.data?.message || 'Failed to update name.', isError: true });
        } finally {
            setNameSaving(false);
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailSaving(true);
        setEmailMsg(null);

        try {
            const res = await api.post('/auth/change-email', emailData);
            if (res.data.user) setUser(res.data.user);
            setEmailMsg({ text: 'Email address updated successfully!', isError: false });
            setEmailData({ newEmail: '', currentPassword: '' });
        } catch (error: any) {
            setEmailMsg({ text: error.response?.data?.message || 'Failed to change email.', isError: true });
        } finally {
            setEmailSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSaving(true);
        setPasswordMsg(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMsg({ text: 'New password and confirm password do not match.', isError: true });
            setPasswordSaving(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMsg({ text: 'New password must be at least 6 characters long.', isError: true });
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
            const errorMsg =
                error.response?.data?.message ||
                error.response?.data?.[0]?.description ||
                'Failed to change password.';
            setPasswordMsg({ text: errorMsg, isError: true });
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href="/employer/dashboard" className="inline-flex items-center text-sm font-medium text-orange hover:text-orange/80 transition-colors">
                    <LuArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-charcoal">Employer Account Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your profile photo, name, email, and password.</p>
            </div>

            <div className="space-y-8">
                {/* SECTION 1: Profile Photo */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <h2 className="text-lg font-semibold text-charcoal mb-2 flex items-center gap-2">
                        <LuCamera className="w-5 h-5 text-orange" /> Profile Photo
                    </h2>
                    <p className="text-xs text-gray-500 mb-6">Upload a photo for your account (JPEG or PNG, max 2MB).</p>

                    <form onSubmit={handlePhotoUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative group">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-2 border-orange/20 shadow-md ring-4 ring-orange/10" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange to-amber-500 text-white font-bold text-2xl flex items-center justify-center shadow-md ring-4 ring-orange/10">
                                    {initials}
                                </div>
                            )}
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-charcoal text-white rounded-full hover:bg-orange shadow-md transition-colors" title="Choose photo">
                                <LuCamera className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-3 w-full">
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange/10 file:text-orange hover:file:bg-orange/20 cursor-pointer" />
                            <p className="text-xs text-gray-400">Supported formats: JPG, PNG. Maximum file size: 2MB.</p>
                            <MessageBox msg={photoMsg} />
                            <button type="submit" disabled={!selectedFile || photoUploading} className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                                <LuUpload className="w-4 h-4 mr-2" />
                                {photoUploading ? 'Uploading...' : 'Upload Photo'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* SECTION 2: Full Name & Email */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
                    <div>
                        <h2 className="text-lg font-semibold text-charcoal mb-2 flex items-center gap-2">
                            <LuUser className="w-5 h-5 text-orange" /> Full Name
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">Update how your name appears on the platform.</p>
                        <form onSubmit={handleNameSave} className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all" />
                            </div>
                            <MessageBox msg={nameMsg} />
                            <button type="submit" disabled={nameSaving} className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange/90 disabled:opacity-50 transition-all shadow-sm">
                                <LuSave className="w-4 h-4 mr-2" />
                                {nameSaving ? 'Saving...' : 'Save Name'}
                            </button>
                        </form>
                    </div>

                    <div className="border-t border-gray-100 pt-8">
                        <h2 className="text-lg font-semibold text-charcoal mb-2 flex items-center gap-2">
                            <LuMail className="w-5 h-5 text-orange" /> Change Email Address
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">To update your login email, enter your new email and confirm with your current password.</p>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 flex items-center justify-between max-w-lg">
                            <span>Current Email:</span>
                            <span className="font-semibold text-charcoal">{user?.email}</span>
                        </div>

                        <form onSubmit={handleEmailChange} className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
                                <input type="email" required placeholder="new-email@example.com" value={emailData.newEmail} onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password (to confirm)</label>
                                <input type="password" required placeholder="Enter current password" value={emailData.currentPassword} onChange={(e) => setEmailData({ ...emailData, currentPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all" />
                            </div>
                            <MessageBox msg={emailMsg} />
                            <button type="submit" disabled={emailSaving} className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange/90 disabled:opacity-50 transition-all shadow-sm">
                                <LuSave className="w-4 h-4 mr-2" />
                                {emailSaving ? 'Updating...' : 'Update Email'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* SECTION 3: Change Password */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <h2 className="text-lg font-semibold text-charcoal mb-2 flex items-center gap-2">
                        <LuLock className="w-5 h-5 text-orange" /> Change Password
                    </h2>
                    <p className="text-xs text-gray-500 mb-6">Ensure your account stays secure by using a strong password.</p>

                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <div className="relative">
                                <input type={showCurrentPw ? 'text' : 'password'} required placeholder="Enter current password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 text-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all" />
                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showCurrentPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <div className="relative">
                                <input type={showNewPw ? 'text' : 'password'} required placeholder="Enter new strong password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 text-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all" />
                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showNewPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <input type={showConfirmPw ? 'text' : 'password'} required placeholder="Re-enter new password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 text-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all" />
                                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showConfirmPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                            )}
                        </div>

                        <MessageBox msg={passwordMsg} />

                        <button type="submit" disabled={passwordSaving} className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange/90 disabled:opacity-50 transition-all shadow-sm">
                            <LuSave className="w-4 h-4 mr-2" />
                            {passwordSaving ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
