'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { CheckCircle, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const jobId = searchParams.get('jobId');

    const [status, setStatus] = useState<'polling' | 'success' | 'failed'>('polling');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!jobId) {
            router.push('/employer/manage-jobs');
            return;
        }

        let attempts = 0;
        const maxAttempts = 15; // 30 seconds total

        const pollPaymentStatus = async () => {
            try {
                const res = await api.get(`/payments/status/${jobId}`);
                if (res.data.isPaid) {
                    setStatus('success');
                    submitJobForApproval();
                    return; // Stop polling
                }
            } catch (error) {
                console.error("Error checking payment status", error);
            }

            attempts++;
            if (attempts >= maxAttempts) {
                setStatus('failed');
            } else {
                setTimeout(pollPaymentStatus, 2000); // Poll every 2 seconds
            }
        };

        pollPaymentStatus();
    }, [jobId, router]);

    const submitJobForApproval = async () => {
        setSubmitting(true);
        try {
            await api.post(`/jobs/${jobId}/submit`);
            // Automatically handled
        } catch (error) {
            console.error("Failed to submit job", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-8 my-12 bg-white rounded-xl shadow-lg text-center">
            {status === 'polling' && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
                    <p className="text-gray-600">Please wait while we confirm your payment with PayHere. Do not close this page.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h1>
                    <p className="text-gray-600 mb-6">Your payment has been verified. {submitting ? 'Submitting job for admin approval...' : 'Your job has been submitted for admin approval.'}</p>
                    <button 
                        onClick={() => router.push('/employer/manage-jobs')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Go to Manage Jobs
                    </button>
                </div>
            )}

            {status === 'failed' && (
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-bold mb-2 text-red-600">Verification Timeout</h1>
                    <p className="text-gray-600 mb-6">We haven't received confirmation from PayHere yet. This might take a few minutes. Check your jobs dashboard later.</p>
                    <button 
                        onClick={() => router.push('/employer/manage-jobs')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Go to Manage Jobs
                    </button>
                </div>
            )}
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">Loading...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
