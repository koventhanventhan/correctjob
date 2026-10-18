'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { LuCloudUpload, LuCircleCheck, LuCircleX, LuClock } from 'react-icons/lu';
import { useRouter } from 'next/navigation';

export default function VerificationPage() {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [viewingDoc, setViewingDoc] = useState<string | null>(null);

    const handleViewDocument = async (endpoint: string, docKey: string) => {
        const newTab = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
        try {
            setViewingDoc(docKey);
            const response = await api.get(endpoint, {
                responseType: 'blob'
            });
            const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            if (newTab && !newTab.closed) {
                newTab.location.href = url;
            } else {
                window.open(url, '_blank');
            }
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (error) {
            if (newTab && !newTab.closed) {
                newTab.close();
            }
            console.error("Failed to view document", error);
            alert("Failed to view document. Please try again.");
        } finally {
            setViewingDoc(null);
        }
    };

    useEffect(() => {
        if (!isInitializing && (!user || user.role !== 'JobSeeker')) {
            router.push('/login');
            return;
        }
        
        const fetchProfile = async () => {
            try {
                const res = await api.get('/seekerprofiles/me');
                setProfile(res.data);
            } catch (error) {
                console.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        
        if (user) {
            fetchProfile();
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
        formData.append('front', frontFile);
        if (backFile) {
            formData.append('back', backFile);
        }

        try {
            const res = await api.post('/seekerprofiles/verify-identity', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile({ ...profile, verificationStatus: res.data.status, verificationNotes: null });
            setFrontFile(null);
            setBackFile(null);
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || error.response?.data || 'Failed to upload documents.');
        } finally {
            setUploading(false);
        }
    };

    if (loading || isInitializing) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    const status = profile?.verificationStatus || 'NotSubmitted';

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-charcoal mb-6">Identity Verification</h1>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0">
                        {status === 'Verified' && <LuCircleCheck className="w-12 h-12 text-green-500" />}
                        {status === 'Pending' && <LuClock className="w-12 h-12 text-yellow-500" />}
                        {status === 'Rejected' && <LuCircleX className="w-12 h-12 text-red-500" />}
                        {status === 'NotSubmitted' && <LuCloudUpload className="w-12 h-12 text-gray-400" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-charcoal">
                            Status: <span className={
                                status === 'Verified' ? 'text-green-600' :
                                status === 'Pending' ? 'text-yellow-600' :
                                status === 'Rejected' ? 'text-red-600' : 'text-gray-500'
                            }>{status === 'NotSubmitted' ? 'Not Submitted' : status}</span>
                        </h2>
                        {status === 'Rejected' && profile?.verificationNotes && (
                            <p className="text-red-600 mt-2 bg-red-50 p-3 rounded"><strong>Reason:</strong> {profile.verificationNotes}</p>
                        )}
                        {status === 'Verified' && (
                            <p className="text-gray-600 mt-2">Your identity has been verified. Employers will now see a "Verified" badge next to your name.</p>
                        )}
                        {(profile?.idCardFrontUrl || profile?.idCardBackUrl) && (
                            <div className="mt-3 flex items-center gap-3 text-sm">
                                <span className="text-gray-600 font-medium">Uploaded Documents:</span>
                                {profile.idCardFrontUrl && (
                                    <button
                                        type="button"
                                        onClick={() => handleViewDocument('/seekerprofiles/id-card/front', 'front')}
                                        disabled={viewingDoc === 'front'}
                                        className="text-orange hover:underline font-medium cursor-pointer disabled:opacity-50"
                                    >
                                        {viewingDoc === 'front' ? 'Opening...' : 'View Front'}
                                    </button>
                                )}
                                {profile.idCardBackUrl && (
                                    <button
                                        type="button"
                                        onClick={() => handleViewDocument('/seekerprofiles/id-card/back', 'back')}
                                        disabled={viewingDoc === 'back'}
                                        className="text-orange hover:underline font-medium cursor-pointer disabled:opacity-50"
                                    >
                                        {viewingDoc === 'back' ? 'Opening...' : 'View Back'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {(status === 'NotSubmitted' || status === 'Rejected') && (
                    <form onSubmit={handleUpload} className="space-y-6 pt-4 border-t border-gray-100">
                        <p className="text-gray-600">Please upload a clear, legible photo or scan of your government-issued ID.</p>
                        
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
                            className="w-full sm:w-auto bg-orange text-white px-6 py-2 rounded-md font-medium hover:bg-orange/90 disabled:opacity-50 text-center"
                        >
                            {uploading ? 'Uploading...' : 'Submit Verification Request'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
