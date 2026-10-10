'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { LuUploadCloud, LuCheckCircle, LuXCircle, LuClock } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmployerVerificationPage() {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!isInitializing && (!user || user.role !== 'Employer')) {
            router.push('/login');
            return;
        }
        
        const fetchCompany = async () => {
            try {
                const res = await api.get('/companies/my-company');
                setCompany(res.data);
            } catch (error: any) {
                if (error.response?.status === 404) {
                    setCompany(null); // No company profile yet
                } else {
                    console.error("Failed to load company profile");
                }
            } finally {
                setLoading(false);
            }
        };
        
        if (user) {
            fetchCompany();
        }
    }, [user, isInitializing, router]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!frontFile) {
            setErrorMsg("Front ID image is required.");
            return;
        }

        setUploading(true);
        setErrorMsg('');
        
        const formData = new FormData();
        formData.append('idCardFront', frontFile);
        if (backFile) {
            formData.append('idCardBack', backFile);
        }

        try {
            const res = await api.post('/companies/verify-identity', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setCompany({ ...company, verificationStatus: res.data.status, verificationNotes: null });
            setFrontFile(null);
            setBackFile(null);
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || error.response?.data || 'Failed to upload documents.');
        } finally {
            setUploading(false);
        }
    };

    if (loading || isInitializing) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    if (!company) {
        return (
            <div className="max-w-3xl mx-auto p-6 bg-warmwhite rounded-lg shadow-md my-8 text-center">
                <h1 className="text-2xl font-bold mb-4 text-red-600">Company Profile Required</h1>
                <p className="mb-4">You must create a company profile before you can verify your identity.</p>
                <Link href="/employer/company-profile" className="bg-orange text-white px-4 py-2 rounded inline-block">
                    Create Company Profile
                </Link>
            </div>
        );
    }

    const status = company.verificationStatus || 'NotSubmitted';

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-charcoal mb-6">Employer Identity Verification</h1>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0">
                        {status === 'Verified' && <LuCheckCircle className="w-12 h-12 text-green-500" />}
                        {status === 'Pending' && <LuClock className="w-12 h-12 text-yellow-500" />}
                        {status === 'Rejected' && <LuXCircle className="w-12 h-12 text-red-500" />}
                        {status === 'NotSubmitted' && <LuUploadCloud className="w-12 h-12 text-gray-400" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-charcoal">
                            Status: <span className={
                                status === 'Verified' ? 'text-green-600' :
                                status === 'Pending' ? 'text-yellow-600' :
                                status === 'Rejected' ? 'text-red-600' : 'text-gray-500'
                            }>{status === 'NotSubmitted' ? 'Not Submitted' : status}</span>
                        </h2>
                        {status === 'Rejected' && company.verificationNotes && (
                            <p className="text-red-600 mt-2 bg-red-50 p-3 rounded"><strong>Reason:</strong> {company.verificationNotes}</p>
                        )}
                        {status === 'Verified' && (
                            <p className="text-gray-600 mt-2">Your identity has been verified. You can now post jobs.</p>
                        )}
                    </div>
                </div>

                {(status === 'NotSubmitted' || status === 'Rejected') && (
                    <form onSubmit={handleUpload} className="space-y-6 pt-4 border-t border-gray-100">
                        <p className="text-gray-600">Please upload a clear, legible photo or scan of your government-issued ID to verify your identity as an employer. This is required before posting jobs.</p>
                        
                        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Front of ID (Required)</label>
                                <input 
                                    type="file" 
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange file:text-white hover:file:bg-orange/90"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Back of ID (Optional)</label>
                                <input 
                                    type="file" 
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-charcoal hover:file:bg-gray-200"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={!frontFile || uploading}
                            className="bg-orange text-white px-6 py-2 rounded-md font-medium hover:bg-orange/90 disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : 'Submit Verification Request'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
