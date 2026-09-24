'use client';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Upload, FileText, Download } from 'lucide-react';

export default function SeekerResume() {
    const [profile, setProfile] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/seekerprofiles/me');
            setProfile(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('resumeFile', file);

        setUploading(true);
        setMsg('');

        try {
            await api.post('/seekerprofiles/resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMsg('Resume uploaded successfully!');
            setFile(null);
            fetchProfile(); // Refresh to show new resume URL
        } catch (error) {
            setMsg('Failed to upload resume.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async () => {
        try {
            // Need to download Blob
            const response = await api.get('/seekerprofiles/download-resume', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Resume.pdf'); // Assuming PDF for simplicity, or extract from response headers
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download resume");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Resume</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Current Resume</h2>
                {profile?.resumeUrl ? (
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-4 rounded-md">
                        <div className="flex items-center">
                            <FileText className="w-8 h-8 text-indigo-600 mr-3" />
                            <div>
                                <p className="font-medium text-gray-900">Resume Uploaded</p>
                                <p className="text-xs text-gray-500">Last updated recently</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleDownload}
                            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                            <Download className="w-4 h-4 mr-1" /> Download
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500">You haven't uploaded a resume yet.</p>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Upload New Resume</h2>
                <form onSubmit={handleUpload}>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-4">Upload a PDF or Word document (Max 5MB)</p>
                        <input 
                            type="file" 
                            accept=".pdf,.doc,.docx" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="text-sm text-gray-500"
                        />
                    </div>
                    {msg && <p className={`mt-4 text-sm ${msg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload Resume'}
                    </button>
                </form>
            </div>
        </div>
    );
}
