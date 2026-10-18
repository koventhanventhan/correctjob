'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getFileUrl } from '@/utils/fileUrl';
import Link from 'next/link';
import { 
    LuBuilding, 
    LuUpload, 
    LuImage, 
    LuGlobe, 
    LuExternalLink, 
    LuCheck, 
    LuSparkles 
} from 'react-icons/lu';
import { FaLinkedin, FaTwitter, FaFacebook } from 'react-icons/fa';

export default function CompanyProfilePage() {
    const { user } = useAuthStore();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        companyName: '',
        description: '',
        benefits: '',
        industry: '',
        location: '',
        companySize: '',
        website: '',
        linkedinUrl: '',
        twitterUrl: '',
        facebookUrl: ''
    });

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.role !== 'Employer') {
            router.push('/');
            return;
        }

        fetchCompany();
    }, [user, router]);

    const fetchCompany = async () => {
        try {
            const res = await api.get('/Companies/my-company');
            if (res.data) {
                setCompanyId(res.data.id);
                setIsApproved(res.data.isApproved);
                setLogoUrl(res.data.logoUrl || null);
                setBannerUrl(res.data.bannerUrl || null);
                setFormData({
                    companyName: res.data.companyName || '',
                    description: res.data.description || '',
                    benefits: res.data.benefits || '',
                    industry: res.data.industry || '',
                    location: res.data.location || '',
                    companySize: res.data.companySize || '',
                    website: res.data.website || '',
                    linkedinUrl: res.data.linkedinUrl || '',
                    twitterUrl: res.data.twitterUrl || '',
                    facebookUrl: res.data.facebookUrl || ''
                });
            }
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error("Failed to fetch company", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Only JPG, PNG, and WebP images are allowed.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Logo file size cannot exceed 2MB.');
            return;
        }

        const data = new FormData();
        data.append('file', file);

        setUploadingLogo(true);
        try {
            const res = await api.post('/Companies/upload-logo', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLogoUrl(res.data.logoUrl);
            alert('Logo uploaded successfully!');
        } catch (error: any) {
            console.error('Failed to upload logo', error);
            alert(error.response?.data?.message || 'Failed to upload logo.');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Only JPG, PNG, and WebP images are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Banner file size cannot exceed 5MB.');
            return;
        }

        const data = new FormData();
        data.append('file', file);

        setUploadingBanner(true);
        try {
            const res = await api.post('/Companies/upload-banner', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBannerUrl(res.data.bannerUrl);
            alert('Banner uploaded successfully!');
        } catch (error: any) {
            console.error('Failed to upload banner', error);
            alert(error.response?.data?.message || 'Failed to upload banner.');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (companyId) {
                await api.put(`/Companies/${companyId}`, formData);
                alert("Company profile updated successfully!");
            } else {
                const res = await api.post('/Companies', formData);
                setCompanyId(res.data.id);
                setIsApproved(res.data.isApproved);
                alert("Company profile created successfully! Please wait for Admin approval.");
            }
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || error.response?.data || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warmwhite">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warmwhite py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">Company Profile</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage your brand presence, benefits, and company details seen by jobseekers.</p>
                    </div>
                    {companyId && isApproved && (
                        <Link 
                            href={`/companies/${companyId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-orange hover:text-orange/80 bg-orange/10 hover:bg-orange/20 px-3.5 py-2 rounded-lg transition-colors"
                        >
                            <LuExternalLink className="w-4 h-4" />
                            View Public Page
                        </Link>
                    )}
                </div>

                {/* Status Alert */}
                {companyId && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                        isApproved 
                            ? 'bg-green-50 border-green-200 text-green-900' 
                            : 'bg-yellow-50 border-yellow-200 text-yellow-900'
                    }`}>
                        <div className={`p-1.5 rounded-full mt-0.5 ${isApproved ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <LuCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">
                                Status: {isApproved ? 'Approved by Admin' : 'Pending Admin Approval'}
                            </p>
                            {!isApproved && (
                                <p className="text-xs text-yellow-700 mt-0.5">
                                    Your company profile is under review. You will be able to publish jobs once verified & approved.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Media Branding (Logo & Banner) */}
                {companyId && (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 space-y-6">
                        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <LuImage className="w-5 h-5 text-orange" />
                            <h2 className="text-lg font-bold text-charcoal">Branding & Media</h2>
                        </div>

                        {/* Banner Preview & Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Company Banner (1200 x 300 recommended, max 5MB)
                            </label>
                            <div className="relative h-40 sm:h-48 w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center group">
                                {bannerUrl ? (
                                    <img 
                                        src={getFileUrl(bannerUrl)} 
                                        alt="Company Banner" 
                                        className="h-full w-full object-cover" 
                                    />
                                ) : (
                                    <div className="text-center p-4">
                                        <LuImage className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">No banner uploaded yet.</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => bannerInputRef.current?.click()}
                                        disabled={uploadingBanner}
                                        className="px-4 py-2 bg-white text-charcoal text-xs font-semibold rounded-lg shadow-sm hover:bg-gray-100 flex items-center gap-1.5 transition-colors"
                                    >
                                        <LuUpload className="w-3.5 h-3.5" />
                                        {uploadingBanner ? 'Uploading...' : (bannerUrl ? 'Change Banner' : 'Upload Banner')}
                                    </button>
                                </div>
                            </div>
                            <input 
                                ref={bannerInputRef}
                                type="file" 
                                accept="image/jpeg,image/png,image/webp" 
                                onChange={handleBannerUpload} 
                                className="hidden" 
                            />
                        </div>

                        {/* Logo Preview & Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Company Logo (Square, max 2MB)
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-gray-200 bg-gray-50 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                    {logoUrl ? (
                                        <img 
                                            src={getFileUrl(logoUrl)} 
                                            alt="Company Logo" 
                                            className="h-full w-full object-contain" 
                                        />
                                    ) : (
                                        <LuBuilding className="h-8 w-8 text-gray-300" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <button 
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        disabled={uploadingLogo}
                                        className="px-3.5 py-1.5 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <LuUpload className="w-3.5 h-3.5" />
                                        {uploadingLogo ? 'Uploading...' : (logoUrl ? 'Change Logo' : 'Upload Logo')}
                                    </button>
                                    <p className="text-xs text-gray-500">JPG, PNG, or WebP. Transparent PNG looks best.</p>
                                </div>
                            </div>
                            <input 
                                ref={logoInputRef}
                                type="file" 
                                accept="image/jpeg,image/png,image/webp" 
                                onChange={handleLogoUpload} 
                                className="hidden" 
                            />
                        </div>
                    </div>
                )}

                {/* Company Information Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 space-y-6">
                    
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                        <LuBuilding className="w-5 h-5 text-orange" />
                        <h2 className="text-lg font-bold text-charcoal">Company Details</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                        <input 
                            required 
                            type="text" 
                            name="companyName" 
                            value={formData.companyName} 
                            onChange={handleChange} 
                            placeholder="e.g. Acme Corporation"
                            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-orange focus:border-orange" 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">About Company</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            placeholder="Tell jobseekers what your company does, your mission, and what makes your workplace unique..."
                            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-orange focus:border-orange h-32" 
                        />
                    </div>

                    {/* Benefits & Perks */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <LuSparkles className="w-4 h-4 text-orange" />
                            <label className="block text-sm font-medium text-gray-700">Benefits & Perks</label>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Detail employee benefits like health insurance, remote flexibility, allowances, performance bonuses, or learning stipends.</p>
                        <textarea 
                            name="benefits" 
                            value={formData.benefits} 
                            onChange={handleChange} 
                            placeholder="• Comprehensive Health & Dental Insurance&#10;• Hybrid / Remote work flexibility&#10;• Annual learning & conference stipend&#10;• 25 days paid annual leave"
                            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-orange focus:border-orange h-28 font-sans" 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                            <input 
                                type="text" 
                                name="industry" 
                                value={formData.industry} 
                                onChange={handleChange} 
                                placeholder="e.g. Information Technology"
                                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-orange focus:border-orange" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input 
                                type="text" 
                                name="location" 
                                value={formData.location} 
                                onChange={handleChange} 
                                placeholder="e.g. Colombo, Sri Lanka"
                                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-orange focus:border-orange" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                            <select 
                                name="companySize" 
                                value={formData.companySize} 
                                onChange={handleChange} 
                                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-orange focus:border-orange bg-white"
                            >
                                <option value="">Select size...</option>
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="500+">500+ employees</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <div className="relative">
                                <LuGlobe className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                <input 
                                    type="url" 
                                    name="website" 
                                    value={formData.website} 
                                    onChange={handleChange} 
                                    placeholder="https://example.com"
                                    className="w-full border border-gray-300 pl-9 p-2.5 rounded-lg text-sm focus:ring-orange focus:border-orange" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                        <h3 className="text-sm font-semibold text-charcoal">Social Profiles</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn Profile</label>
                                <div className="relative">
                                    <FaLinkedin className="w-4 h-4 text-[#0A66C2] absolute left-3 top-3" />
                                    <input 
                                        type="url" 
                                        name="linkedinUrl" 
                                        value={formData.linkedinUrl} 
                                        onChange={handleChange} 
                                        placeholder="https://linkedin.com/company/..."
                                        className="w-full border border-gray-300 pl-9 p-2.5 rounded-lg text-xs focus:ring-orange focus:border-orange" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Twitter / X Profile</label>
                                <div className="relative">
                                    <FaTwitter className="w-4 h-4 text-[#1DA1F2] absolute left-3 top-3" />
                                    <input 
                                        type="url" 
                                        name="twitterUrl" 
                                        value={formData.twitterUrl} 
                                        onChange={handleChange} 
                                        placeholder="https://x.com/..."
                                        className="w-full border border-gray-300 pl-9 p-2.5 rounded-lg text-xs focus:ring-orange focus:border-orange" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Facebook Page</label>
                                <div className="relative">
                                    <FaFacebook className="w-4 h-4 text-[#1877F2] absolute left-3 top-3" />
                                    <input 
                                        type="url" 
                                        name="facebookUrl" 
                                        value={formData.facebookUrl} 
                                        onChange={handleChange} 
                                        placeholder="https://facebook.com/..."
                                        className="w-full border border-gray-300 pl-9 p-2.5 rounded-lg text-xs focus:ring-orange focus:border-orange" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        disabled={saving} 
                        type="submit" 
                        className="w-full bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-sm text-sm"
                    >
                        {saving ? 'Saving Profile...' : (companyId ? 'Update Company Profile' : 'Create Company Profile')}
                    </button>
                </form>
            </div>
        </div>
    );
}
