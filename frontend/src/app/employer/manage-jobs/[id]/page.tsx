'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface ScreeningQuestionItem {
    id?: number;
    questionText: string;
    questionType: string;
    isRequired: boolean;
    idealAnswer?: string;
    orderIndex: number;
}

export default function EditJobPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        responsibilities: '',
        location: '',
        isRemote: false,
        salaryMin: '',
        salaryMax: '',
        experienceMin: '',
        experienceMax: '',
        jobType: 'Full-Time',
        categoryId: '1',
        deadline: ''
    });

    const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestionItem[]>([]);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState('Text');
    const [newQuestionRequired, setNewQuestionRequired] = useState(true);
    const [newQuestionIdealAnswer, setNewQuestionIdealAnswer] = useState('');

    const [status, setStatus] = useState<string>('Draft');
    const [closing, setClosing] = useState(false);

    const fetchJob = async () => {
        try {
            const res = await api.get(`/Jobs/${id}`);
            const job = res.data;
            setStatus(job.status || 'Draft');
            setFormData({
                title: job.title || '',
                description: job.description || '',
                requirements: job.requirements || '',
                responsibilities: job.responsibilities || '',
                location: job.location || '',
                isRemote: job.isRemote || false,
                salaryMin: job.salaryMin?.toString() || '',
                salaryMax: job.salaryMax?.toString() || '',
                experienceMin: job.experienceMin?.toString() || '',
                experienceMax: job.experienceMax?.toString() || '',
                jobType: job.jobType || 'Full-Time',
                categoryId: job.categoryId?.toString() || '1',
                deadline: job.deadline ? job.deadline.split('T')[0] : ''
            });

            if (job.screeningQuestions && Array.isArray(job.screeningQuestions)) {
                setScreeningQuestions(job.screeningQuestions.map((q: any, i: number) => ({
                    id: q.id,
                    questionText: q.questionText,
                    questionType: q.questionType || 'Text',
                    isRequired: q.isRequired ?? true,
                    idealAnswer: q.idealAnswer || '',
                    orderIndex: q.orderIndex ?? i
                })));
            }
        } catch (error: any) {
            console.error(error);
            alert("Failed to fetch job or you don't have permission.");
            router.push('/employer/manage-jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'Employer') {
            router.push('/');
            return;
        }
        if (id) {
            fetchJob();
        }
    }, [user, router, id]);

    const handleClose = async () => {
        if (!window.confirm(`Are you sure you want to close this job post? Candidates will no longer be able to apply.`)) {
            return;
        }
        setClosing(true);
        try {
            await api.post(`/Jobs/${id}/close`);
            setStatus('Closed');
            alert("Job closed successfully.");
            router.push('/employer/manage-jobs');
        } catch (error: any) {
            console.error("Failed to close job", error);
            alert(error.response?.data?.message || "Failed to close the job.");
            setClosing(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleAddQuestion = () => {
        if (!newQuestionText.trim()) return;

        const newItem: ScreeningQuestionItem = {
            questionText: newQuestionText.trim(),
            questionType: newQuestionType,
            isRequired: newQuestionRequired,
            idealAnswer: newQuestionIdealAnswer.trim() || undefined,
            orderIndex: screeningQuestions.length
        };

        setScreeningQuestions([...screeningQuestions, newItem]);
        setNewQuestionText('');
        setNewQuestionType('Text');
        setNewQuestionRequired(true);
        setNewQuestionIdealAnswer('');
    };

    const handleRemoveQuestion = (index: number) => {
        const updated = screeningQuestions
            .filter((_, i) => i !== index)
            .map((q, i) => ({ ...q, orderIndex: i }));
        setScreeningQuestions(updated);
    };

    const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= screeningQuestions.length) return;

        const updated = [...screeningQuestions];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        setScreeningQuestions(updated.map((q, i) => ({ ...q, orderIndex: i })));
    };

    const handleToggleQuestionRequired = (index: number) => {
        const updated = [...screeningQuestions];
        updated[index] = { ...updated[index], isRequired: !updated[index].isRequired };
        setScreeningQuestions(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                categoryId: parseInt(formData.categoryId, 10),
                salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
                experienceMin: formData.experienceMin ? parseInt(formData.experienceMin, 10) : null,
                experienceMax: formData.experienceMax ? parseInt(formData.experienceMax, 10) : null,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
                screeningQuestions: screeningQuestions
            };

            await api.put(`/Jobs/${id}`, payload);
            alert("Job updated successfully.");
            router.push('/employer/manage-jobs');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "An error occurred while updating the job.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading job details...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 my-6 sm:my-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Edit Job</h1>
                    <p className="text-sm text-gray-500 mt-1">Status: <span className="font-semibold text-charcoal">{status}</span></p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-warmwhite rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Job Title *</label>
                    <input
                        required
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Description *</label>
                    <textarea
                        required
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2.5 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-orange/50"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Requirements</label>
                        <textarea
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg h-28 focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Responsibilities</label>
                        <textarea
                            name="responsibilities"
                            value={formData.responsibilities}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg h-28 focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Job Type</label>
                        <select
                            name="jobType"
                            value={formData.jobType}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50 bg-white"
                        >
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Casual">Casual</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>
                    <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-3 p-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                name="isRemote"
                                checked={formData.isRemote}
                                onChange={handleChange}
                                className="w-4 h-4 text-orange focus:ring-orange rounded"
                            />
                            <div>
                                <span className="text-sm font-medium text-charcoal block">Remote Position</span>
                                <span className="text-xs text-gray-500 block">Candidate can work anywhere</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Category</label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50 bg-white"
                        >
                            <option value="1">Software Development</option>
                            <option value="2">Marketing</option>
                            <option value="3">Finance</option>
                            <option value="4">Healthcare</option>
                            <option value="5">Design</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Application Deadline</label>
                        <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Min Salary (LKR)</label>
                        <input
                            type="number"
                            name="salaryMin"
                            value={formData.salaryMin}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Max Salary (LKR)</label>
                        <input
                            type="number"
                            name="salaryMax"
                            value={formData.salaryMax}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Min Exp (Yrs)</label>
                        <input
                            type="number"
                            name="experienceMin"
                            value={formData.experienceMin}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Max Exp (Yrs)</label>
                        <input
                            type="number"
                            name="experienceMax"
                            value={formData.experienceMax}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                </div>

                {/* Screening Questions Builder */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-charcoal">Screening Questions</h2>
                            <p className="text-xs text-gray-500">Add or edit questions candidates must answer when applying.</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-peach text-orange rounded-full">
                            {screeningQuestions.length} Questions
                        </span>
                    </div>

                    {screeningQuestions.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {screeningQuestions.map((q, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                                {q.questionType}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleQuestionRequired(idx)}
                                                className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${
                                                    q.isRequired ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                {q.isRequired ? 'Required *' : 'Optional'}
                                            </button>
                                        </div>
                                        <p className="text-sm font-medium text-charcoal">{q.questionText}</p>
                                        {q.idealAnswer && (
                                            <p className="text-xs text-gray-500 mt-0.5">Ideal answer: {q.idealAnswer}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            type="button"
                                            disabled={idx === 0}
                                            onClick={() => handleMoveQuestion(idx, 'up')}
                                            className="p-1.5 text-gray-500 hover:text-charcoal disabled:opacity-30 rounded hover:bg-gray-200 text-xs"
                                            title="Move Up"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            disabled={idx === screeningQuestions.length - 1}
                                            onClick={() => handleMoveQuestion(idx, 'down')}
                                            className="p-1.5 text-gray-500 hover:text-charcoal disabled:opacity-30 rounded hover:bg-gray-200 text-xs"
                                            title="Move Down"
                                        >
                                            ▼
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(idx)}
                                            className="p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-50 text-xs font-bold"
                                            title="Remove"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-4 bg-gray-50/70 border border-dashed border-gray-300 rounded-lg space-y-3">
                        <div className="font-semibold text-xs text-charcoal uppercase tracking-wider">Add Question</div>
                        <input
                            type="text"
                            placeholder="e.g. Do you have a valid driver's licence?"
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Answer Type</label>
                                <select
                                    value={newQuestionType}
                                    onChange={(e) => setNewQuestionType(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange/50"
                                >
                                    <option value="Text">Free Text</option>
                                    <option value="YesNo">Yes / No</option>
                                    <option value="Number">Numeric Value</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Ideal Answer (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Yes"
                                    value={newQuestionIdealAnswer}
                                    onChange={(e) => setNewQuestionIdealAnswer(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-5">
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={newQuestionRequired}
                                        onChange={(e) => setNewQuestionRequired(e.target.checked)}
                                        className="w-4 h-4 text-orange focus:ring-orange rounded"
                                    />
                                    <span className="text-xs text-charcoal font-medium">Mandatory</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddQuestion}
                                    disabled={!newQuestionText.trim()}
                                    className="px-4 py-2 bg-charcoal text-white text-xs font-semibold rounded-lg hover:bg-charcoal/90 disabled:opacity-40 transition-colors shadow-sm"
                                >
                                    + Add Question
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                    <button
                        disabled={saving || closing}
                        type="submit"
                        className="flex-1 bg-orange text-white font-semibold py-3 px-4 rounded-lg hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-sm text-sm"
                    >
                        {saving ? 'Updating Job...' : 'Update Job Post'}
                    </button>
                    {status !== 'Closed' ? (
                        <button 
                            type="button" 
                            onClick={handleClose} 
                            disabled={saving || closing} 
                            className="sm:w-auto px-6 bg-amber-600 text-white font-semibold py-3 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
                        >
                            {closing ? 'Closing...' : 'Close Job'}
                        </button>
                    ) : (
                        <span className="self-center px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                            Job is Closed
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
