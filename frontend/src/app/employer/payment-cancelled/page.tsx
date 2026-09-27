'use client';

import { useRouter } from 'next/navigation';
import { LuCircleX } from 'react-icons/lu';

export default function PaymentCancelledPage() {
    const router = useRouter();

    return (
        <div className="max-w-xl mx-auto p-8 my-12 bg-warmwhite rounded-xl shadow-lg text-center flex flex-col items-center">
            <LuCircleX className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-700">Payment Cancelled</h1>
            <p className="text-gray-600 mb-6">Your payment process was cancelled or failed. Your job was saved as a Draft.</p>
            
            <div className="flex gap-4">
                <button 
                    onClick={() => router.push('/employer/manage-jobs')}
                    className="bg-peach text-gray-700 border px-6 py-2 rounded-lg hover:bg-gray-200 font-medium"
                >
                    Back to Jobs
                </button>
                <button 
                    onClick={() => router.push('/employer/post-job')}
                    className="bg-orange text-white px-6 py-2 rounded-lg hover:bg-orange/90 font-medium"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
