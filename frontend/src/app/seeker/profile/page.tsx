'use client';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { calculateProfileCompletion } from '@/utils/profile';
import { Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SeekerProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
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
        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        try {
            const res = await api.put('/seekerprofiles/me', profile);
            setProfile(res.data);
            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    const completionPct = calculateProfileCompletion(profile);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 p-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-medium text-gray-900">Profile Completion</h2>
                    <span className="text-lg font-bold text-indigo-600">{completionPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }}></div>
                </div>
                {completionPct < 100 && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" />
                        Complete all fields and <Link href="/seeker/resume" className="text-indigo-600 hover:underline mx-1">upload a resume</Link> to reach 100%.
                    </p>
                )}
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Career Title</label>
                        <input
                            type="text"
                            name="careerTitle"
                            value={profile?.careerTitle || ''}
                            onChange={handleChange}
                            placeholder="e.g. Senior Frontend Developer"
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={profile?.location || ''}
                            onChange={handleChange}
                            placeholder="e.g. New York, NY or Remote"
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio</label>
                    <textarea
                        name="bio"
                        value={profile?.bio || ''}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Tell employers about your professional background and goals..."
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                        <textarea
                            name="experience"
                            value={profile?.experience || ''}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Brief summary of past roles..."
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                        <textarea
                            name="education"
                            value={profile?.education || ''}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Degrees, certifications..."
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                        <input
                            type="url"
                            name="linkedInUrl"
                            value={profile?.linkedInUrl || ''}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/..."
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio/Website URL</label>
                        <input
                            type="url"
                            name="portfolioUrl"
                            value={profile?.portfolioUrl || ''}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-green-600 font-medium">{successMsg}</span>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
