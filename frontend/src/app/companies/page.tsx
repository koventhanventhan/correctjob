'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { Building, MapPin, Search } from 'lucide-react';
import { useState } from 'react';

export default function CompaniesPage() {
    const [search, setSearch] = useState('');

    const { data: companies = [], isLoading } = useQuery({
        queryKey: ['public-companies'],
        queryFn: async () => {
            const res = await api.get('/companies');
            return res.data.data || [];
        }
    });

    const filtered = companies.filter((c: any) => 
        c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        c.industry?.toLowerCase().includes(search.toLowerCase()) ||
        c.location?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Companies Hiring Now</h1>
                    <p className="mt-4 text-xl text-gray-600">Discover great places to work and their open roles.</p>
                </div>

                <div className="max-w-xl mx-auto mb-10 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search companies by name, industry, or location..."
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                    />
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-gray-500">Loading companies...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No companies found matching your search.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((company: any) => (
                            <Link href={`/companies/${company.id}`} key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center border border-gray-200 shrink-0">
                                            {company.logoUrl ? (
                                                <img src={company.logoUrl} alt={company.companyName} className="h-12 w-12 object-contain" />
                                            ) : (
                                                <Building className="h-8 w-8 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{company.companyName}</h3>
                                            <p className="text-sm text-gray-500">{company.industry}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">
                                        {company.description || 'No description provided.'}
                                    </p>
                                    <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                                        <span className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1" /> {company.location || 'Location not specified'}
                                        </span>
                                        <span className="text-indigo-600 font-medium group-hover:underline">View Profile</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
