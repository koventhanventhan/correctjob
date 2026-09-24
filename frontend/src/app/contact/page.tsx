'use client';
import { useState } from 'react';

export default function ContactPage() {
    const [msg, setMsg] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMsg("Thank you for reaching out! We'll get back to you soon.");
    };

    return (
        <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Contact Us</h1>
                    <p className="mt-2 text-lg text-gray-600">Have a question? We'd love to hear from you.</p>
                </div>

                {msg ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-md text-center">
                        <p className="font-medium">{msg}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <select
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option>General Inquiry</option>
                                <option>Technical Support</option>
                                <option>Billing Question</option>
                                <option>Feedback</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Message</label>
                            <textarea
                                required
                                rows={4}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Send Message
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
