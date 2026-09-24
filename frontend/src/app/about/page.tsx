'use client';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="bg-white">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">About Us</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Empowering careers, connecting talent.
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                        HireConnect is the premier destination for job seekers to discover great opportunities and for employers to find the perfect fit.
                    </p>
                </div>

                <div className="mt-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                            <p className="text-lg text-gray-600 mb-6">
                                We believe that finding the right job shouldn't be a struggle. Our mission is to bridge the gap between talented individuals and forward-thinking companies through a seamless, transparent, and efficient platform.
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose HireConnect?</h3>
                            <ul className="space-y-4 text-gray-600">
                                <li className="flex items-start">
                                    <span className="h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3 shrink-0">✓</span>
                                    <span>Verified companies and authentic job postings.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3 shrink-0">✓</span>
                                    <span>Advanced tracking so you always know your application status.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3 shrink-0">✓</span>
                                    <span>Tools designed for both job seekers and employers to succeed.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-gray-50 p-8 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                            <div className="space-y-6">
                                <div className="flex items-center">
                                    <Mail className="h-6 w-6 text-indigo-600 mr-4" />
                                    <span className="text-gray-700">support@hireconnect.com</span>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="h-6 w-6 text-indigo-600 mr-4" />
                                    <span className="text-gray-700">+1 (555) 123-4567</span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="h-6 w-6 text-indigo-600 mr-4" />
                                    <span className="text-gray-700">123 Tech Boulevard, Suite 400<br/>San Francisco, CA 94105</span>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <Link href="/contact" className="text-indigo-600 font-medium hover:text-indigo-500">
                                    Send us a message &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
