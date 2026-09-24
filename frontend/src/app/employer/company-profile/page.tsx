'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function CompanyProfilePage() {
    const { user } = useAuthStore();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    
    const [formData, setFormData] = useState({
        companyName: '',
        description: '',
        industry: '',
        location: '',
        companySize: '',
        website: ''
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
                setFormData({
                    companyName: res.data.companyName || '',
                    description: res.data.description || '',
                    industry: res.data.industry || '',
                    location: res.data.location || '',
                    companySize: res.data.companySize || '',
                    website: res.data.website || ''
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
            <h1 className="text-2xl font-bold mb-6">Company Profile</h1>
            
            {companyId && (
                <div className={`p-4 mb-6 rounded-md ${isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    <p className="font-semibold">
                        Status: {isApproved ? 'Approved' : 'Pending Approval'}
                    </p>
                    {!isApproved && <p className="text-sm mt-1">Your company must be approved by an admin before you can post jobs.</p>}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium mb-1">Company Name *</label>
                    <input required type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block font-medium mb-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-2 rounded h-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium mb-1">Industry</label>
                        <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Company Size</label>
                        <select name="companySize" value={formData.companySize} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="">Select size...</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Website</label>
                        <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                </div>
                
                <button disabled={saving} type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Saving...' : (companyId ? 'Update Profile' : 'Create Profile')}
                </button>
            </form>
        </div>
    );
}
