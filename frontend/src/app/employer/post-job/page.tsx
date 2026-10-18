'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface ScreeningQuestionItem {
    questionText: string;
    questionType: string;
    isRequired: boolean;
    idealAnswer?: string;
    orderIndex: number;
}

export default function PostJobPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submittingMode, setSubmittingMode] = useState<'draft' | 'publish' | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [hasCompany, setHasCompany] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [payHereData, setPayHereData] = useState<any>(null);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

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

    // Screening Questions State
    const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestionItem[]>([]);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState('Text');
    const [newQuestionRequired, setNewQuestionRequired] = useState(true);
    const [newQuestionIdealAnswer, setNewQuestionIdealAnswer] = useState('');

    // Preview Modal State
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'Employer') {
            router.push('/');
            return;
        }
        checkCompany();
        fetchCategories();
    }, [user, router]);

    const checkCompany = async () => {
        try {
            const res = await api.get('/Companies/my-company');
            if (res.data) {
                setHasCompany(true);
                setCompanyInfo(res.data);
                setIsApproved(res.data.isApproved);
                setIsVerified(res.data.verificationStatus === 'Verified');
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setHasCompany(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/Categories');
            if (Array.isArray(res.data)) {
                setCategories(res.data);
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                setCategories(res.data.data);
            }
        } catch {
            // Fallback default categories
            setCategories([
                { id: 1, name: 'Software Development' },
                { id: 2, name: 'Marketing' },
                { id: 3, name: 'Finance' },
                { id: 4, name: 'Healthcare' },
                { id: 5, name: 'Design' }
            ]);
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

    // Screening Question Helpers
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

    const buildPayload = () => ({
        ...formData,
        categoryId: parseInt(formData.categoryId, 10),
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        experienceMin: formData.experienceMin ? parseInt(formData.experienceMin, 10) : null,
        experienceMax: formData.experienceMax ? parseInt(formData.experienceMax, 10) : null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        screeningQuestions: screeningQuestions.length > 0 ? screeningQuestions : undefined
    });

    const handleSaveDraft = async () => {
        if (!formData.title.trim()) {
            alert("Job title is required to save as draft.");
            return;
        }
        if (!formData.description.trim()) {
            alert("Job description is required to save as draft.");
            return;
        }

        setSaving(true);
        setSubmittingMode('draft');
        try {
            const payload = buildPayload();
            await api.post('/Jobs', payload);
            alert("Job saved successfully as a draft.");
            router.push('/employer/manage-jobs');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "An error occurred while saving the draft.");
            setSaving(false);
            setSubmittingMode(null);
        }
    };

    const handlePublishAndPay = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSubmittingMode('publish');
        try {
            const payload = buildPayload();
            const res = await api.post('/Jobs', payload);
            const newJob = res.data;

            // Generate Payment Order
            const paymentRes = await api.post('/Payments/create-order', { jobId: newJob.id });
            const pData = paymentRes.data;
            
            // Set PayHere Data, which triggers form submission via useEffect
            setPayHereData(pData);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "An error occurred while posting the job.");
            setSaving(false);
            setSubmittingMode(null);
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your profile...</div>;

    if (!hasCompany) {
        return (
            <div className="max-w-3xl mx-auto p-6 bg-warmwhite rounded-xl shadow-sm my-8 text-center border border-gray-200">
                <h1 className="text-2xl font-bold mb-4 text-red-600">Company Profile Required</h1>
                <p className="mb-4 text-gray-600">You must create a company profile before you can post jobs.</p>
                <button onClick={() => router.push('/employer/company-profile')} className="bg-orange text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange/90 transition-colors shadow-sm">
                    Create Company Profile
                </button>
            </div>
        );
    }

    if (!isApproved) {
        return (
            <div className="max-w-3xl mx-auto p-6 bg-warmwhite rounded-xl shadow-sm my-8 text-center border border-gray-200">
                <h1 className="text-2xl font-bold mb-4 text-amber-600">Pending Approval</h1>
                <p className="text-gray-600">Your company profile is currently pending admin approval. You can post jobs once it is approved.</p>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="max-w-3xl mx-auto p-6 bg-warmwhite rounded-xl shadow-sm my-8 text-center border border-gray-200">
                <h1 className="text-2xl font-bold mb-4 text-red-600">Identity Verification Required</h1>
                <p className="mb-4 text-gray-600">You must verify your identity before you can post jobs.</p>
                <button onClick={() => router.push('/employer/verification')} className="bg-orange text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange/90 transition-colors shadow-sm">
                    Verify Identity
                </button>
            </div>
        );
    }

    const selectedCategoryName = categories.find(c => c.id.toString() === formData.categoryId)?.name || 'General';

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 my-6 sm:my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Post a New Job</h1>
                    <p className="text-sm text-gray-500 mt-1">Create an engaging job post to attract top talent on Seek.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-charcoal hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview Job Post
                </button>
            </div>
            
            <form onSubmit={handlePublishAndPay} className="bg-warmwhite rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Job Title */}
                <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Job Title *</label>
                    <input
                        required
                        type="text"
                        name="title"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                    />
                </div>
                
                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Job Description *</label>
                    <textarea
                        required
                        name="description"
                        placeholder="Describe the role, team, and day-to-day work..."
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2.5 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-orange/50"
                    />
                </div>

                {/* Requirements & Responsibilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Requirements</label>
                        <textarea
                            name="requirements"
                            placeholder="Key qualifications, skills, and background..."
                            value={formData.requirements}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg h-28 focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Responsibilities</label>
                        <textarea
                            name="responsibilities"
                            placeholder="Primary duties and expectations..."
                            value={formData.responsibilities}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg h-28 focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                </div>

                {/* Location, Remote Toggle & Work Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Location</label>
                        <input
                            type="text"
                            name="location"
                            placeholder="e.g. Colombo, Western Province"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Work Type</label>
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
                                <span className="text-xs text-gray-500 block">Candidate can work from anywhere</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Category & Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Category</label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50 bg-white"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Application Expiry / Deadline</label>
                        <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                </div>

                {/* Salary Range & Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Min Salary (LKR)</label>
                        <input
                            type="number"
                            name="salaryMin"
                            placeholder="e.g. 100000"
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
                            placeholder="e.g. 250000"
                            value={formData.salaryMax}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Min Exp (Years)</label>
                        <input
                            type="number"
                            name="experienceMin"
                            placeholder="0"
                            value={formData.experienceMin}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Max Exp (Years)</label>
                        <input
                            type="number"
                            name="experienceMax"
                            placeholder="5"
                            value={formData.experienceMax}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                        />
                    </div>
                </div>

                {/* Screening Questions Builder Section */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-charcoal">Screening Questions Builder</h2>
                            <p className="text-xs text-gray-500">Ask candidates specific questions when they apply to filter for ideal qualifications.</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-peach text-orange rounded-full">
                            {screeningQuestions.length} Questions Added
                        </span>
                    </div>

                    {/* Question List */}
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
                                            title="Remove Question"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Question Input Box */}
                    <div className="p-4 bg-gray-50/70 border border-dashed border-gray-300 rounded-lg space-y-3">
                        <div className="font-semibold text-xs text-charcoal uppercase tracking-wider">Add New Question</div>
                        <div>
                            <input
                                type="text"
                                placeholder="e.g. How many years of experience do you have with React & Next.js?"
                                value={newQuestionText}
                                onChange={(e) => setNewQuestionText(e.target.value)}
                                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange/50"
                            />
                        </div>
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
                                    placeholder="e.g. Yes or 3+"
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
                
                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="w-full sm:w-1/2 py-3 px-4 border border-gray-300 bg-white text-charcoal font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 text-sm"
                    >
                        {saving && submittingMode === 'draft' ? 'Saving Draft...' : 'Save as Draft'}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-1/2 bg-orange text-white font-semibold py-3 px-4 rounded-lg hover:bg-orange/90 transition-colors shadow-sm disabled:opacity-50 text-sm"
                    >
                        {saving && submittingMode === 'publish' ? 'Processing...' : 'Publish & Pay (5,000 LKR)'}
                    </button>
                </div>
            </form>

            {/* PayHere Checkout Form */}
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

            {/* Job Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 p-6 sm:p-8">
                        <div className="flex justify-between items-start pb-4 border-b border-gray-100 mb-6">
                            <div>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-peach text-orange rounded-full uppercase tracking-wider">
                                    Candidate View Preview
                                </span>
                                <h2 className="text-2xl font-bold text-charcoal mt-2">
                                    {formData.title || "Untitled Job Posting"}
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {companyInfo?.companyName || "Your Company"} • {formData.location || "Location not specified"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="p-2 text-gray-400 hover:text-charcoal rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="px-3 py-1 bg-peach text-orange font-medium text-xs rounded-full">
                                {formData.jobType}
                            </span>
                            {formData.isRemote && (
                                <span className="px-3 py-1 bg-green-50 text-green-700 font-medium text-xs rounded-full">
                                    🌐 Remote
                                </span>
                            )}
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-medium text-xs rounded-full">
                                {selectedCategoryName}
                            </span>
                            {(formData.salaryMin || formData.salaryMax) && (
                                <span className="px-3 py-1 bg-gray-100 text-charcoal font-medium text-xs rounded-full">
                                    💰 {formData.salaryMin ? `${Number(formData.salaryMin).toLocaleString()} LKR` : '0'} 
                                    {formData.salaryMax ? ` - ${Number(formData.salaryMax).toLocaleString()} LKR` : '+'}
                                </span>
                            )}
                            {formData.deadline && (
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 font-medium text-xs rounded-full">
                                    ⏰ Closes {new Date(formData.deadline).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-6 text-sm text-charcoal leading-relaxed">
                            <div>
                                <h3 className="font-bold text-base mb-2 text-charcoal">About the Role</h3>
                                <div className="whitespace-pre-line text-gray-700">
                                    {formData.description || "No description provided yet."}
                                </div>
                            </div>

                            {formData.requirements && (
                                <div>
                                    <h3 className="font-bold text-base mb-2 text-charcoal">Key Requirements</h3>
                                    <div className="whitespace-pre-line text-gray-700">
                                        {formData.requirements}
                                    </div>
                                </div>
                            )}

                            {formData.responsibilities && (
                                <div>
                                    <h3 className="font-bold text-base mb-2 text-charcoal">Responsibilities</h3>
                                    <div className="whitespace-pre-line text-gray-700">
                                        {formData.responsibilities}
                                    </div>
                                </div>
                            )}

                            {/* Screening Questions in Preview */}
                            {screeningQuestions.length > 0 && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-sm text-charcoal mb-3">
                                        Application Screening Questions ({screeningQuestions.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {screeningQuestions.map((q, idx) => (
                                            <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200 text-xs">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-500">Q{idx + 1}.</span>
                                                    <span className="font-medium text-charcoal">{q.questionText}</span>
                                                    {q.isRequired && <span className="text-red-500 font-bold">*</span>}
                                                </div>
                                                <div className="text-gray-400 mt-1 pl-4">
                                                    Type: {q.questionType}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="px-5 py-2.5 bg-charcoal text-white rounded-lg font-medium text-sm hover:bg-charcoal/90 transition-colors shadow-sm"
                            >
                                Back to Editing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
