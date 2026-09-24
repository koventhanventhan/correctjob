import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Briefcase className="h-8 w-8 text-indigo-400" />
                            <span className="font-bold text-xl tracking-tight">HireConnect</span>
                        </Link>
                        <p className="text-gray-400 text-sm">
                            Connecting top talent with the best employers worldwide. Your next career move starts here.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">For Job Seekers</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                            <li><Link href="/companies" className="hover:text-white transition-colors">Browse Companies</Link></li>
                            <li><Link href="/register" className="hover:text-white transition-colors">Create Profile</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">For Employers</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/register?role=employer" className="hover:text-white transition-colors">Post a Job</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="/resources" className="hover:text-white transition-colors">Hiring Resources</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Company</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} HireConnect. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
