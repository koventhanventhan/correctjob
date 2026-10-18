'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
    LuUpload, 
    LuFileText, 
    LuDownload, 
    LuTrash2, 
    LuStar, 
    LuCheck,
    LuPlus,
    LuCircleAlert
} from 'react-icons/lu';

interface ResumeItem {
    id: number;
    title: string;
    fileUrl: string;
    fileName: string;
    isDefault: boolean;
    uploadedAt: string;
}

export default function SeekerResume() {
    const [resumes, setResumes] = useState<ResumeItem[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [resumeTitle, setResumeTitle] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const fetchResumes = async () => {
        try {
            const res = await api.get('/seekerprofiles/resumes');
            setResumes(res.data || []);
        } catch (error) {
            console.error('Failed to load resumes', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 4000);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (resumeTitle.trim()) {
            formData.append('title', resumeTitle.trim());
        }
        formData.append('isDefault', String(isDefault || resumes.length === 0));

        setUploading(true);
        setMsg(null);

        try {
            await api.post('/seekerprofiles/resumes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showMessage('Resume uploaded successfully!', 'success');
            setFile(null);
            setResumeTitle('');
            setIsDefault(false);
            fetchResumes();
        } catch (error: any) {
            showMessage(error.response?.data?.message || 'Failed to upload resume.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await api.put(`/seekerprofiles/resumes/${id}/default`);
            showMessage('Default resume updated.', 'success');
            fetchResumes();
        } catch {
            showMessage('Failed to set default resume.', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this resume?')) return;
        try {
            await api.delete(`/seekerprofiles/resumes/${id}`);
            showMessage('Resume deleted.', 'success');
            fetchResumes();
        } catch {
            showMessage('Failed to delete resume.', 'error');
        }
    };

    const handleDownload = async (resume: ResumeItem) => {
        try {
            const response = await api.get('/seekerprofiles/download-resume', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', resume.fileName || `${resume.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch {
            alert('Failed to download resume.');
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
                <div className="w-8 h-8 border-3 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading resumes...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-charcoal">Resumes & Documents</h1>
                    <p className="text-sm text-gray-600">Store multiple resumes tailored to different job roles.</p>
                </div>
            </div>

            {msg && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                    {msg.type === 'success' ? <LuCheck className="w-4 h-4 text-emerald-600" /> : <LuCircleAlert className="w-4 h-4 text-rose-600" />}
                    <span>{msg.text}</span>
                </div>
            )}

            {/* Existing Resumes List */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-bold text-charcoal mb-4">Saved Resumes ({resumes.length})</h2>
                {resumes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <LuFileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm">No resumes uploaded yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Upload your resume below to start applying faster.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {resumes.map((item) => (
                            <div 
                                key={item.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                                    item.isDefault ? 'bg-orange/5 border-orange/30 shadow-xs' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'
                                } gap-3`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        item.isDefault ? 'bg-orange text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        <LuFileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-charcoal text-sm">{item.title}</h3>
                                            {item.isDefault && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange/15 text-orange px-2 py-0.5 rounded-full">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.fileName} • Uploaded {new Date(item.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    {!item.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(item.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-orange hover:bg-orange/5 rounded-lg transition"
                                            title="Set as default resume for quick applications"
                                        >
                                            <LuStar className="w-3.5 h-3.5" />
                                            Set Default
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDownload(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-charcoal bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                        title="Download"
                                    >
                                        <LuDownload className="w-3.5 h-3.5" />
                                        Download
                                    </button>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="inline-flex items-center gap-1 p-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                        title="Delete resume"
                                    >
                                        <LuTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload New Resume */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                    <LuPlus className="w-5 h-5 text-orange" />
                    Upload New Resume
                </h2>

                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Resume Label / Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={resumeTitle}
                            onChange={(e) => setResumeTitle(e.target.value)}
                            placeholder="e.g. Frontend Specialist, Product Manager"
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/20 focus:border-orange outline-hidden"
                        />
                    </div>

                    <div className="border-2 border-dashed border-gray-200 hover:border-orange/50 rounded-xl p-8 text-center transition-colors bg-gray-50/40">
                        <LuUpload className="w-8 h-8 text-orange mx-auto mb-2" />
                        <p className="text-sm font-semibold text-charcoal">
                            {file ? file.name : 'Choose a file to upload'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                        <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-charcoal text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer shadow-xs transition">
                            <span>Browse File</span>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {resumes.length > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                                className="rounded text-orange focus:ring-orange"
                            />
                            Set as primary default resume for job applications
                        </label>
                    )}

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="w-full bg-orange text-white py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-orange/90 disabled:opacity-50 transition shadow-sm"
                    >
                        {uploading ? 'Uploading resume...' : 'Save & Upload Resume'}
                    </button>
                </form>
            </div>
        </div>
    );
}
