'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function PostJobPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [hasCompany, setHasCompany] = useState(false);
    const [payHereData, setPayHereData] = useState<any>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        responsibilities: '',
        location: '',
        salaryMin: '',
        salaryMax: '',
        experienceMin: '',
        experienceMax: '',
        jobType: 'Full-Time',
        categoryId: '1',
        deadline: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'Employer') {
            router.push('/');
            return;
        }
        checkCompany();
    }, [user, router]);

    const checkCompany = async () => {
        try {
            const res = await api.get('/Companies/my-company');
            if (res.data) {
                setHasCompany(true);
                setIsApproved(res.data.isApproved);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setHasCompany(false);
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
            const payload = {
                ...formData,
                categoryId: parseInt(formData.categoryId),
                salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
                experienceMin: formData.experienceMin ? parseInt(formData.experienceMin) : null,
                experienceMax: formData.experienceMax ? parseInt(formData.experienceMax) : null,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
            };

            const res = await api.post('/Jobs', payload);
            const newJob = res.data;

            // Generate Payment Order
            const paymentRes = await api.post('/Payments/create-order', { jobId: newJob.id });
            const pData = paymentRes.data;
            
            // Set PayHere Data, which will trigger form submission via useEffect
            setPayHereData(pData);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "An error occurred while posting the job.");
            setSaving(false);
        }
    };

    useEffect(() => {
        if (payHereData) {
            const form = document.getElementById('payhere-form') as HTMLFormElement;
            if (form) {
                form.submit();
            }
        }
    }, [payHereData]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    if (!hasCompany) {
        return (
            <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md my-8 text-center">
                <h1 className="text-2xl font-bold mb-4 text-red-600">Company Profile Required</h1>
                <p className="mb-4">You must create a company profile before you can post jobs.</p>
                <button onClick={() => router.push('/employer/company-profile')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Create Company Profile
                </button>
            </div>
        );
    }

    if (!isApproved) {
        return (
            <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md my-8 text-center">
                <h1 className="text-2xl font-bold mb-4 text-yellow-600">Pending Approval</h1>
                <p>Your company profile is currently pending admin approval. You can post jobs once it's approved.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
            <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium mb-1">Job Title *</label>
                    <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                
                <div>
                    <label className="block font-medium mb-1">Description *</label>
                    <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full border p-2 rounded h-32" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium mb-1">Requirements</label>
                        <textarea name="requirements" value={formData.requirements} onChange={handleChange} className="w-full border p-2 rounded h-24" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Responsibilities</label>
                        <textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} className="w-full border p-2 rounded h-24" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium mb-1">Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Job Type</label>
                        <select name="jobType" value={formData.jobType} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium mb-1">Category</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="1">Software Development</option>
                            <option value="2">Marketing</option>
                            <option value="3">Finance</option>
                            <option value="4">Healthcare</option>
                            <option value="5">Design</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Application Deadline</label>
                        <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4 mt-4">
                    <div>
                        <label className="block font-medium mb-1 text-sm">Min Salary</label>
                        <input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1 text-sm">Max Salary</label>
                        <input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1 text-sm">Min Exp (Yrs)</label>
                        <input type="number" name="experienceMin" value={formData.experienceMin} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1 text-sm">Max Exp (Yrs)</label>
                        <input type="number" name="experienceMax" value={formData.experienceMax} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                </div>
                
                <button disabled={saving} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 disabled:opacity-50 mt-6">
                    {saving ? 'Processing...' : 'Pay & Publish (5,000 LKR)'}
                </button>
            </form>

            {payHereData && (
                <form id="payhere-form" method="post" action="https://sandbox.payhere.lk/pay/checkout" className="hidden">
                    <input type="hidden" name="merchant_id" value={payHereData.merchantId} />
                    <input type="hidden" name="return_url" value={`${window.location.origin}/employer/payment-success?jobId=${payHereData.orderId.split('-')[1]}`} />
                    <input type="hidden" name="cancel_url" value={`${window.location.origin}/employer/payment-cancelled`} />
                    <input type="hidden" name="notify_url" value={`${process.env.NEXT_PUBLIC_API_URL}/payments/notify`} />
                    <input type="hidden" name="order_id" value={payHereData.orderId} />
                    <input type="hidden" name="items" value="Job Posting Fee" />
                    <input type="hidden" name="currency" value={payHereData.currency} />
                    <input type="hidden" name="amount" value={payHereData.amount} />
                    
                    <input type="hidden" name="first_name" value={user?.fullName || "Employer"} />
                    <input type="hidden" name="last_name" value="" />
                    <input type="hidden" name="email" value={user?.email || "employer@example.com"} />
                    <input type="hidden" name="phone" value="0771234567" />
                    <input type="hidden" name="address" value="No.1, Galle Road" />
                    <input type="hidden" name="city" value="Colombo" />
                    <input type="hidden" name="country" value="Sri Lanka" />
                </form>
            )}
        </div>
    );
}
