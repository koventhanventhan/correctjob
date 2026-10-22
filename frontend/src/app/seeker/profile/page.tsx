'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { calculateProfileCompletion } from '@/utils/profile';
import Link from 'next/link';
import { 
    LuSave, 
    LuCircleAlert, 
    LuPlus, 
    LuTrash2, 
    LuBriefcase, 
    LuGraduationCap, 
    LuAward, 
    LuLanguages, 
    LuFileText, 
    LuEye,
    LuEyeOff,
    LuShieldCheck
} from 'react-icons/lu';

export default function SeekerProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Modal states
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [workForm, setWorkForm] = useState({
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: ''
    });

    const [isEduModalOpen, setIsEduModalOpen] = useState(false);
    const [eduForm, setEduForm] = useState({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        isCurrent: false
    });

    const [newSkill, setNewSkill] = useState('');
    const [skillYears, setSkillYears] = useState<number | ''>('');

    const [isLangModalOpen, setIsLangModalOpen] = useState(false);
    const [langForm, setLangForm] = useState({
        language: '',
        proficiency: 'Conversational'
    });

    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [certForm, setCertForm] = useState({
        name: '',
        issuingOrganization: '',
        issueDate: '',
        expiryDate: '',
        credentialUrl: ''
    });

    const fetchProfile = async () => {
        try {
            const res = await api.get('/seekerprofiles/me');
            setProfile(res.data);
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSaveBasic = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        try {
            const res = await api.put('/seekerprofiles/me', {
                careerTitle: profile.careerTitle,
                bio: profile.bio,
                experience: profile.experience,
                education: profile.education,
                location: profile.location,
                linkedInUrl: profile.linkedInUrl,
                portfolioUrl: profile.portfolioUrl,
                isOpenToWork: profile.isOpenToWork
            });
            setProfile((prev: any) => ({ ...prev, ...res.data }));
            setSuccessMsg('Profile details saved successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Failed to save profile", error);
        } finally {
            setSaving(false);
        }
    };

    const toggleOpenToWork = async () => {
        const nextState = !profile?.isOpenToWork;
        try {
            await api.patch('/seekerprofiles/open-to-work', { isOpenToWork: nextState });
            setProfile({ ...profile, isOpenToWork: nextState });
        } catch (error) {
            console.error("Failed to toggle open to work", error);
        }
    };

    // Work History handlers
    const handleAddWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workForm.jobTitle || !workForm.company) return;
        try {
            await api.post('/seekerprofiles/work-history', {
                ...workForm,
                startDate: workForm.startDate ? new Date(workForm.startDate).toISOString() : null,
                endDate: !workForm.isCurrent && workForm.endDate ? new Date(workForm.endDate).toISOString() : null
            });
            setIsWorkModalOpen(false);
            setWorkForm({ jobTitle: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
            fetchProfile();
        } catch (error) {
            console.error("Failed to add work history", error);
        }
    };

    const handleDeleteWork = async (id: number) => {
        if (!confirm('Delete this work experience?')) return;
        try {
            await api.delete(`/seekerprofiles/work-history/${id}`);
            fetchProfile();
        } catch (error) {
            console.error("Failed to delete work history", error);
        }
    };

    // Education handlers
    const handleAddEdu = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eduForm.institution || !eduForm.degree) return;
        try {
            await api.post('/seekerprofiles/education', {
                ...eduForm,
                startDate: eduForm.startDate ? new Date(eduForm.startDate).toISOString() : null,
                endDate: !eduForm.isCurrent && eduForm.endDate ? new Date(eduForm.endDate).toISOString() : null
            });
            setIsEduModalOpen(false);
            setEduForm({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false });
            fetchProfile();
        } catch (error) {
            console.error("Failed to add education", error);
        }
    };

    const handleDeleteEdu = async (id: number) => {
        if (!confirm('Delete this education entry?')) return;
        try {
            await api.delete(`/seekerprofiles/education/${id}`);
            fetchProfile();
        } catch (error) {
            console.error("Failed to delete education", error);
        }
    };

    // Skills handlers
    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkill.trim()) return;
        try {
            await api.post('/seekerprofiles/skills', {
                skillName: newSkill.trim(),
                yearsExperience: skillYears ? Number(skillYears) : null
            });
            setNewSkill('');
            setSkillYears('');
            fetchProfile();
        } catch (error) {
            console.error("Failed to add skill", error);
        }
    };

    const handleDeleteSkill = async (id: number) => {
        try {
            await api.delete(`/seekerprofiles/skills/${id}`);
            fetchProfile();
        } catch (error) {
            console.error("Failed to delete skill", error);
        }
    };

    // Language handlers
    const handleAddLanguage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!langForm.language.trim()) return;
        try {
            await api.post('/seekerprofiles/languages', langForm);
            setIsLangModalOpen(false);
            setLangForm({ language: '', proficiency: 'Conversational' });
            fetchProfile();
        } catch (error) {
            console.error("Failed to add language", error);
        }
    };

    const handleDeleteLanguage = async (id: number) => {
        try {
            await api.delete(`/seekerprofiles/languages/${id}`);
            fetchProfile();
        } catch (error) {
            console.error("Failed to delete language", error);
        }
    };

    // Certification handlers
    const handleAddCert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!certForm.name || !certForm.issuingOrganization) return;
        try {
            await api.post('/seekerprofiles/certifications', {
                ...certForm,
                issueDate: certForm.issueDate ? new Date(certForm.issueDate).toISOString() : null,
                expiryDate: certForm.expiryDate ? new Date(certForm.expiryDate).toISOString() : null
            });
            setIsCertModalOpen(false);
            setCertForm({ name: '', issuingOrganization: '', issueDate: '', expiryDate: '', credentialUrl: '' });
            fetchProfile();
        } catch (error) {
            console.error("Failed to add certification", error);
        }
    };

    const handleDeleteCert = async (id: number) => {
        try {
            await api.delete(`/seekerprofiles/certifications/${id}`);
            fetchProfile();
        } catch (error) {
            console.error("Failed to delete certification", error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">
                <div className="w-8 h-8 border-3 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading your profile...
            </div>
        );
    }

    const completionPct = calculateProfileCompletion(profile);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header with Title and Open to Work status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-display font-bold text-charcoal">My Seeker Profile</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Build your comprehensive profile to increase your visibility to top employers.
                    </p>
                </div>

                {/* Open to Work Toggle & Privacy Notice */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-xl">
                        <button
                            type="button"
                            onClick={toggleOpenToWork}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                profile?.isOpenToWork ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    profile?.isOpenToWork ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal">
                                {profile?.isOpenToWork ? (
                                    <>
                                        <LuEye className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700">Open to Work</span>
                                    </>
                                ) : (
                                    <>
                                        <LuEyeOff className="w-3.5 h-3.5 text-gray-500" />
                                        <span className="text-gray-600">Not Looking</span>
                                    </>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500">
                                {profile?.isOpenToWork ? 'Employers can find your profile' : 'Hidden from employer talent search'}
                            </p>
                        </div>
                    </div>
                    {/* Privacy Note */}
                    <div className="flex items-start gap-1.5 bg-blue-50/70 border border-blue-200/60 rounded-xl p-2.5 max-w-sm text-[11px] text-blue-900 leading-tight">
                        <LuShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                            Verified employers can see your name initial, skills and experience. Your email and phone are shared only if you accept an invitation.
                        </span>
                    </div>
                </div>
            </div>

            {/* Profile Completeness Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h2 className="text-base font-display font-bold text-charcoal">Profile Completeness</h2>
                        <p className="text-xs text-gray-500">Profiles above 80% receive 4x more employer inquiries.</p>
                    </div>
                    <span className="text-xl font-display font-bold text-orange">{completionPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                        className="bg-orange h-full rounded-full transition-all duration-500" 
                        style={{ width: `${completionPct}%` }}
                    />
                </div>
                {completionPct < 100 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50/70 p-2.5 rounded-md mt-3 border border-amber-200/50">
                        <LuCircleAlert className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Tip: Complete your work history, education, and add your skills to reach 100%.</span>
                    </div>
                )}
            </div>

            {/* Basic Info & Summary Form */}
            <form onSubmit={handleSaveBasic} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-charcoal border-b pb-3">Personal & Contact Info</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Career Title / Headline
                        </label>
                        <input
                            type="text"
                            name="careerTitle"
                            value={profile?.careerTitle || ''}
                            onChange={handleChange}
                            placeholder="e.g. Senior Full-Stack Engineer"
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/20 focus:border-orange outline-hidden"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={profile?.location || ''}
                            onChange={handleChange}
                            placeholder="e.g. Sydney, NSW or Remote"
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/20 focus:border-orange outline-hidden"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Professional Bio / Summary
                    </label>
                    <textarea
                        name="bio"
                        value={profile?.bio || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Tell employers about your experience, key strengths, and what you bring to a team..."
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/20 focus:border-orange outline-hidden"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            LinkedIn URL
                        </label>
                        <input
                            type="url"
                            name="linkedInUrl"
                            value={profile?.linkedInUrl || ''}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/..."
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/20 focus:border-orange outline-hidden"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Portfolio / GitHub / Website
                        </label>
                        <input
                            type="url"
                            name="portfolioUrl"
                            value={profile?.portfolioUrl || ''}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange/20 focus:border-orange outline-hidden"
                        />
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-medium">{successMsg}</span>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 bg-orange text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-orange/90 disabled:opacity-50 transition shadow-xs"
                    >
                        <LuSave className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Info'}
                    </button>
                </div>
            </form>

            {/* Work History Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center text-orange">
                            <LuBriefcase className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-charcoal">Work History</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsWorkModalOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange bg-orange/10 hover:bg-orange/20 rounded-lg transition"
                    >
                        <LuPlus className="w-3.5 h-3.5" />
                        Add Role
                    </button>
                </div>

                {!profile?.workHistories || profile.workHistories.length === 0 ? (
                    <p className="text-sm text-gray-500 py-3">No work history listed yet. Add your past experience to showcase your career journey.</p>
                ) : (
                    <div className="space-y-4 divide-y divide-gray-100">
                        {profile.workHistories.map((work: any) => (
                            <div key={work.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-charcoal">{work.jobTitle}</h3>
                                    <p className="text-xs font-semibold text-orange mt-0.5">{work.company}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {work.location && `${work.location} • `}
                                        {work.startDate ? new Date(work.startDate).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'Start'} –{' '}
                                        {work.isCurrent ? 'Present' : work.endDate ? new Date(work.endDate).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'End'}
                                    </p>
                                    {work.description && (
                                        <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{work.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteWork(work.id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md transition"
                                    title="Delete"
                                >
                                    <LuTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Education Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center text-orange">
                            <LuGraduationCap className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-charcoal">Education</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsEduModalOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange bg-orange/10 hover:bg-orange/20 rounded-lg transition"
                    >
                        <LuPlus className="w-3.5 h-3.5" />
                        Add Education
                    </button>
                </div>

                {!profile?.educations || profile.educations.length === 0 ? (
                    <p className="text-sm text-gray-500 py-3">No education listed yet. Add your university degree, college, or diploma.</p>
                ) : (
                    <div className="space-y-4 divide-y divide-gray-100">
                        {profile.educations.map((edu: any) => (
                            <div key={edu.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-charcoal">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                                    <p className="text-xs font-semibold text-orange mt-0.5">{edu.institution}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} – {edu.isCurrent ? 'Present' : edu.endDate ? new Date(edu.endDate).getFullYear() : 'Completed'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteEdu(edu.id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md transition"
                                    title="Delete"
                                >
                                    <LuTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center text-orange">
                            <LuAward className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-charcoal">Skills</h2>
                    </div>
                </div>

                {/* Add Skill Input */}
                <form onSubmit={handleAddSkill} className="flex flex-wrap items-center gap-2 mb-4">
                    <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add skill (e.g. React, C#, SQL)..."
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-orange/20 focus:border-orange outline-hidden flex-1 min-w-[160px]"
                    />
                    <input
                        type="number"
                        min="0"
                        max="50"
                        value={skillYears}
                        onChange={(e) => setSkillYears(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Yrs exp"
                        className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-orange/20 focus:border-orange outline-hidden"
                    />
                    <button
                        type="submit"
                        disabled={!newSkill.trim()}
                        className="px-3 py-1.5 bg-orange text-white rounded-lg text-xs font-semibold hover:bg-orange/90 disabled:opacity-50 transition"
                    >
                        Add
                    </button>
                </form>

                {/* Skills Badges */}
                {!profile?.skills || profile.skills.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">Add your key skills to help employers match your qualifications.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill: any) => (
                            <span 
                                key={skill.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-orange/10 text-charcoal hover:text-orange border border-gray-200 rounded-full text-xs font-medium transition"
                            >
                                <span>{skill.skillName}</span>
                                {skill.yearsExperience && (
                                    <span className="text-[10px] text-gray-400">({skill.yearsExperience}y)</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    className="text-gray-400 hover:text-rose-600 transition"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Languages & Licences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Languages */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <LuLanguages className="w-5 h-5 text-orange" />
                            <h2 className="text-base font-bold text-charcoal">Languages</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsLangModalOpen(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange bg-orange/10 hover:bg-orange/20 rounded-lg transition"
                        >
                            <LuPlus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    {!profile?.languages || profile.languages.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2">No languages specified.</p>
                    ) : (
                        <div className="space-y-2">
                            {profile.languages.map((lang: any) => (
                                <div key={lang.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                    <span className="font-semibold text-charcoal">{lang.language}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                            {lang.proficiency}
                                        </span>
                                        <button onClick={() => handleDeleteLanguage(lang.id)} className="text-gray-400 hover:text-rose-500">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Licences & Certifications */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <LuAward className="w-5 h-5 text-orange" />
                            <h2 className="text-base font-bold text-charcoal">Licences & Certs</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCertModalOpen(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange bg-orange/10 hover:bg-orange/20 rounded-lg transition"
                        >
                            <LuPlus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    {!profile?.certifications || profile.certifications.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2">No licences or certifications added.</p>
                    ) : (
                        <div className="space-y-3">
                            {profile.certifications.map((cert: any) => (
                                <div key={cert.id} className="flex items-start justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                    <div>
                                        <h4 className="font-bold text-charcoal">{cert.name}</h4>
                                        <p className="text-[11px] text-gray-500">{cert.issuingOrganization}</p>
                                    </div>
                                    <button onClick={() => handleDeleteCert(cert.id)} className="text-gray-400 hover:text-rose-500">×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Link to Multi-Resume Manager */}
            <div className="bg-orange/5 border border-orange/20 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-md shadow-xs flex items-center justify-center text-orange shrink-0">
                        <LuFileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-charcoal text-base">Multiple Resumes Management</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                            You currently have {profile?.resumes?.length || (profile?.resumeUrl ? 1 : 0)} resume(s) uploaded.
                        </p>
                    </div>
                </div>
                <Link
                    href="/seeker/resume"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange text-white text-xs font-semibold rounded-md hover:bg-orange/90 transition shadow-sm w-fit"
                >
                    Manage Resumes →
                </Link>
            </div>

            {/* Add Work History Modal */}
            {isWorkModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg border border-gray-200 animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold text-charcoal mb-4">Add Work Experience</h3>
                        <form onSubmit={handleAddWork} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={workForm.jobTitle}
                                    onChange={(e) => setWorkForm({ ...workForm, jobTitle: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Company *</label>
                                <input
                                    type="text"
                                    required
                                    value={workForm.company}
                                    onChange={(e) => setWorkForm({ ...workForm, company: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={workForm.location}
                                    onChange={(e) => setWorkForm({ ...workForm, location: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={workForm.startDate}
                                        onChange={(e) => setWorkForm({ ...workForm, startDate: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-hidden focus:border-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        disabled={workForm.isCurrent}
                                        value={workForm.endDate}
                                        onChange={(e) => setWorkForm({ ...workForm, endDate: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-hidden focus:border-orange disabled:opacity-40"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={workForm.isCurrent}
                                    onChange={(e) => setWorkForm({ ...workForm, isCurrent: e.target.checked })}
                                    className="rounded text-orange focus:ring-orange"
                                />
                                I currently work in this role
                            </label>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Role Description</label>
                                <textarea
                                    rows={3}
                                    value={workForm.description}
                                    onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsWorkModalOpen(false)}
                                    className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange text-white rounded-lg text-xs font-semibold hover:bg-orange/90"
                                >
                                    Add Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Education Modal */}
            {isEduModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg border border-gray-200 animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold text-charcoal mb-4">Add Education</h3>
                        <form onSubmit={handleAddEdu} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Institution / School *</label>
                                <input
                                    type="text"
                                    required
                                    value={eduForm.institution}
                                    onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Degree / Certificate *</label>
                                <input
                                    type="text"
                                    required
                                    value={eduForm.degree}
                                    onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                                    placeholder="e.g. Bachelor of Computer Science"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Field of Study</label>
                                <input
                                    type="text"
                                    value={eduForm.fieldOfStudy}
                                    onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                                    placeholder="e.g. Software Engineering"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsEduModalOpen(false)}
                                    className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange text-white rounded-lg text-xs font-semibold hover:bg-orange/90"
                                >
                                    Add Education
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Language Modal */}
            {isLangModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg border border-gray-200 animate-in fade-in zoom-in-95">
                        <h3 className="text-base font-bold text-charcoal mb-4">Add Language</h3>
                        <form onSubmit={handleAddLanguage} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Language *</label>
                                <input
                                    type="text"
                                    required
                                    value={langForm.language}
                                    onChange={(e) => setLangForm({ ...langForm, language: e.target.value })}
                                    placeholder="e.g. English, Tamil, French"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Proficiency</label>
                                <select
                                    value={langForm.proficiency}
                                    onChange={(e) => setLangForm({ ...langForm, proficiency: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                >
                                    <option value="Basic">Basic</option>
                                    <option value="Conversational">Conversational</option>
                                    <option value="Fluent">Fluent</option>
                                    <option value="Native">Native</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsLangModalOpen(false)}
                                    className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 bg-orange text-white rounded-lg text-xs font-semibold hover:bg-orange/90"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Certification Modal */}
            {isCertModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg border border-gray-200 animate-in fade-in zoom-in-95">
                        <h3 className="text-base font-bold text-charcoal mb-4">Add Licence or Certificate</h3>
                        <form onSubmit={handleAddCert} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={certForm.name}
                                    onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                                    placeholder="e.g. AWS Certified Solutions Architect"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Issuing Organization *</label>
                                <input
                                    type="text"
                                    required
                                    value={certForm.issuingOrganization}
                                    onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                                    placeholder="e.g. Amazon Web Services"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden focus:border-orange"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsCertModalOpen(false)}
                                    className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 bg-orange text-white rounded-lg text-xs font-semibold hover:bg-orange/90"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
