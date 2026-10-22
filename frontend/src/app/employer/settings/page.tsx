'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getFileUrl } from '@/utils/imageUrl';
import {
    LuLock, LuSave, LuArrowLeft, LuUser, LuMail, LuCamera, LuUpload,
    LuCheck, LuTriangleAlert, LuEye, LuEyeOff, LuShield
} from 'react-icons/lu';
import Link from 'next/link';
import { validatePassword, formatIdentityErrors } from '@/utils/passwordValidation';

function MessageBox({ msg }: { msg: { text: string; isError: boolean } | null }) {
    if (!msg) return null;
    return (
        <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
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
    const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'password'>('profile');

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

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await api.post('/users/profile-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const imagePath = res.data?.imagePath;
            if (imagePath && user) {
                setUser({ ...user, profileImage: imagePath });
                setPreviewUrl(getFileUrl(imagePath));
            }
            setPhotoMsg({ text: 'Profile photo updated successfully!', isError: false });
            setSelectedFile(null);
        } catch (err: any) {
            setPhotoMsg({
                text: err.response?.data?.message || 'Failed to upload photo. Please try again.',
                isError: true,
            });
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleNameSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) {
            setNameMsg({ text: 'Name cannot be empty.', isError: true });
            return;
        }

        setNameSaving(true);
        setNameMsg(null);

        try {
            await api.put('/users/profile', { fullName: fullName.trim() });
            if (user) {
                setUser({ ...user, fullName: fullName.trim() });
            }
            setNameMsg({ text: 'Name updated successfully!', isError: false });
        } catch (err: any) {
            setNameMsg({
                text: err.response?.data?.message || 'Failed to update name. Please try again.',
                isError: true,
            });
        } finally {
            setNameSaving(false);
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailData.newEmail.trim() || !emailData.currentPassword) {
            setEmailMsg({ text: 'Please fill in all fields.', isError: true });
            return;
        }

        setEmailSaving(true);
        setEmailMsg(null);

        try {
            await api.post('/auth/change-email', {
                newEmail: emailData.newEmail.trim(),
                currentPassword: emailData.currentPassword,
            });
            if (user) {
                setUser({ ...user, email: emailData.newEmail.trim() });
            }
            setEmailMsg({ text: 'Email updated successfully!', isError: false });
            setEmailData({ newEmail: '', currentPassword: '' });
        } catch (err: any) {
            setEmailMsg({
                text: err.response?.data?.message || 'Failed to update email. Please check your password.',
                isError: true,
            });
        } finally {
            setEmailSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMsg(null);

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordMsg({ text: 'Please fill in all fields.', isError: true });
            return;
        }

        const clientError = validatePassword(passwordData.newPassword);
        if (clientError) {
            setPasswordMsg({ text: clientError, isError: true });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMsg({ text: 'New passwords do not match.', isError: true });
            return;
        }

        setPasswordSaving(true);

        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordMsg({ text: 'Password changed successfully!', isError: false });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setPasswordMsg({ text: formatIdentityErrors(err), isError: true });
        } finally {
            setPasswordSaving(false);
        }
    };

    const navItems = [
        { id: 'profile' as const, label: 'Profile Details', icon: LuUser, description: 'Photo and display name' },
        { id: 'email' as const, label: 'Email Address', icon: LuMail, description: 'Manage login email' },
        { id: 'password' as const, label: 'Password & Security', icon: LuLock, description: 'Update password' },
    ];

    return (
        <div className="min-h-screen bg-warmwhite">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/employer/dashboard" className="inline-flex items-center text-sm font-medium text-orange hover:underline transition-colors">
                        <LuArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-charcoal">Account Settings</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage your employer account profile, login credentials, and security preferences.</p>
                </div>

                {/* Mobile Tabs */}
                <div className="md:hidden flex border-b border-gray-200 mb-6 overflow-x-auto gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'border-orange text-orange font-bold'
                                        : 'border-transparent text-gray-500 hover:text-charcoal'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Desktop Left Nav */}
                    <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-1">
                        <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors ${
                                            isActive
                                                ? 'bg-orange/10 text-orange font-semibold'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? 'text-orange' : 'text-gray-400'}`} />
                                        <div>
                                            <div className="text-sm font-medium">{item.label}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mt-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                <LuShield className="w-4 h-4 text-orange" />
                                Employer Verification
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed mb-3">
                                Keep your company profile verified to unlock direct candidate search and messaging.
                            </p>
                            <Link href="/employer/verification" className="text-xs font-semibold text-orange hover:underline">
                                View Verification Status →
                            </Link>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                {/* Profile Photo Card */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h2 className="text-lg font-display font-bold text-charcoal flex items-center gap-2">
                                            <LuCamera className="w-5 h-5 text-orange" /> Profile Photo
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">Upload an account photo or avatar (JPEG or PNG, max 2MB).</p>
                                    </div>

                                    <form onSubmit={handlePhotoUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                        <div className="relative group shrink-0">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-orange text-white font-bold text-2xl flex items-center justify-center">
                                                    {initials}
                                                </div>
                                            )}
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()} 
                                                className="absolute bottom-0 right-0 p-2 bg-charcoal text-white rounded-full hover:bg-orange transition-colors" 
                                                title="Choose photo"
                                            >
                                                <LuCamera className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="flex-1 space-y-3 w-full">
                                            <input 
                                                ref={fileInputRef} 
                                                type="file" 
                                                accept="image/jpeg,image/png" 
                                                onChange={handleFileChange} 
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20 cursor-pointer" 
                                            />
                                            <p className="text-xs text-gray-400">Supported formats: JPG, PNG. Maximum file size: 2MB.</p>
                                            <MessageBox msg={photoMsg} />
                                            <div className="flex justify-end pt-2">
                                                <button 
                                                    type="submit" 
                                                    disabled={!selectedFile || photoUploading} 
                                                    className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-sm font-semibold rounded-md hover:bg-orange/90 disabled:opacity-50 transition shadow-sm"
                                                >
                                                    <LuUpload className="w-4 h-4 mr-2" />
                                                    {photoUploading ? 'Uploading...' : 'Upload Photo'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {/* Full Name Card */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h2 className="text-lg font-display font-bold text-charcoal flex items-center gap-2">
                                            <LuUser className="w-5 h-5 text-orange" /> Display Name
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">Update how your name appears across employer management pages.</p>
                                    </div>

                                    <form onSubmit={handleNameSave} className="space-y-4 max-w-lg">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Full Name</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={fullName} 
                                                onChange={(e) => setFullName(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-hidden transition" 
                                            />
                                        </div>
                                        <MessageBox msg={nameMsg} />
                                        <div className="flex justify-end pt-2">
                                            <button 
                                                type="submit" 
                                                disabled={nameSaving} 
                                                className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-sm font-semibold rounded-md hover:bg-orange/90 disabled:opacity-50 transition shadow-sm"
                                            >
                                                <LuSave className="w-4 h-4 mr-2" />
                                                {nameSaving ? 'Saving...' : 'Save Name'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'email' && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="border-b border-gray-100 pb-4 mb-6">
                                    <h2 className="text-lg font-display font-bold text-charcoal flex items-center gap-2">
                                        <LuMail className="w-5 h-5 text-orange" /> Change Email Address
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">To update your login email, enter your new email address and confirm with your current password.</p>
                                </div>

                                <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-700 flex items-center justify-between max-w-lg">
                                    <span className="font-medium">Current Email:</span>
                                    <span className="font-bold text-charcoal">{user?.email}</span>
                                </div>

                                <form onSubmit={handleEmailChange} className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">New Email Address</label>
                                        <input 
                                            type="email" 
                                            required 
                                            placeholder="your-company-email@example.com" 
                                            value={emailData.newEmail} 
                                            onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })} 
                                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-hidden transition" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Current Password (to confirm)</label>
                                        <input 
                                            type="password" 
                                            required 
                                            placeholder="Enter current password" 
                                            value={emailData.currentPassword} 
                                            onChange={(e) => setEmailData({ ...emailData, currentPassword: e.target.value })} 
                                            className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-hidden transition" 
                                        />
                                    </div>
                                    <MessageBox msg={emailMsg} />
                                    <div className="flex justify-end pt-2">
                                        <button 
                                            type="submit" 
                                            disabled={emailSaving} 
                                            className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-sm font-semibold rounded-md hover:bg-orange/90 disabled:opacity-50 transition shadow-sm"
                                        >
                                            <LuSave className="w-4 h-4 mr-2" />
                                            {emailSaving ? 'Updating...' : 'Update Email'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="border-b border-gray-100 pb-4 mb-6">
                                    <h2 className="text-lg font-display font-bold text-charcoal flex items-center gap-2">
                                        <LuLock className="w-5 h-5 text-orange" /> Change Password
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">Ensure your account stays secure with a strong password.</p>
                                </div>

                                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Current Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showCurrentPw ? 'text' : 'password'} 
                                                required 
                                                placeholder="Enter current password" 
                                                value={passwordData.currentPassword} 
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
                                                className="w-full border border-gray-300 rounded-md p-2.5 pr-10 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-hidden transition" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowCurrentPw(!showCurrentPw)} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showCurrentPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">New Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showNewPw ? 'text' : 'password'} 
                                                required 
                                                placeholder="Enter new strong password" 
                                                value={passwordData.newPassword} 
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                                                className="w-full border border-gray-300 rounded-md p-2.5 pr-10 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-hidden transition" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowNewPw(!showNewPw)} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showNewPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showConfirmPw ? 'text' : 'password'} 
                                                required 
                                                placeholder="Re-enter new password" 
                                                value={passwordData.confirmPassword} 
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                                                className="w-full border border-gray-300 rounded-md p-2.5 pr-10 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-hidden transition" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowConfirmPw(!showConfirmPw)} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPw ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                                        )}
                                    </div>

                                    <MessageBox msg={passwordMsg} />

                                    <div className="flex justify-end pt-2">
                                        <button 
                                            type="submit" 
                                            disabled={passwordSaving} 
                                            className="inline-flex items-center justify-center px-4 py-2 bg-orange text-white text-sm font-semibold rounded-md hover:bg-orange/90 disabled:opacity-50 transition shadow-sm"
                                        >
                                            <LuSave className="w-4 h-4 mr-2" />
                                            {passwordSaving ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
