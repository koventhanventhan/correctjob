'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LuSearch, LuMapPin, LuBriefcase,
  LuCode, LuMegaphone, LuBanknote, LuHeartPulse, 
  LuPalette, LuHeadset, LuHandshake, LuGraduationCap,
  LuArrowRight
} from 'react-icons/lu';
import api from '@/services/api';
import { formatSalary } from '@/utils/currency';
import { Button } from '@/components/ui/Button';

const categoryIcons: Record<string, React.ElementType> = {
  'Software Development': LuCode,
  'Marketing': LuMegaphone,
  'Finance': LuBanknote,
  'Healthcare': LuHeartPulse,
  'Design': LuPalette,
  'Customer Support': LuHeadset,
  'Sales': LuHandshake,
  'Education': LuGraduationCap,
};

export default function Home() {
  const [stats, setStats] = useState<{ jobsCount: number | null; companiesCount: number | null }>({
    jobsCount: null,
    companiesCount: null,
  });

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      api.get('/jobs?pageSize=1'),
      api.get('/companies?pageSize=1'),
    ]).then(([jobsRes, compRes]) => {
      if (!isMounted) return;
      const jCount = jobsRes.status === 'fulfilled' ? (jobsRes.value.data?.pagination?.totalCount ?? null) : null;
      const cCount = compRes.status === 'fulfilled' ? (compRes.value.data?.totalCount ?? null) : null;
      setStats({ jobsCount: jCount, companiesCount: cCount });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Clean Seek-Style */}
      <section className="bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-12">
          {/* Left: Value Proposition */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange/10 text-orange border border-orange/20 mb-4">
              Connecting Talent in Sri Lanka
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-charcoal mb-4 leading-tight tracking-tight">
              Find the right job.<br />Build a career you love.
            </h1>
            <p className="text-base text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Discover verified opportunities across technology, finance, marketing, and more with transparent salaries in LKR.
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link href="/jobs">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse All Jobs
                </Button>
              </Link>
              <Link href="/register?role=employer">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Seek-style Search Box */}
          <div className="flex-1 w-full max-w-lg">
            <div className="bg-warmwhite p-6 sm:p-7 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold font-display text-charcoal mb-4">Search Openings</h2>
              <form action="/jobs" className="flex flex-col gap-3.5">
                <div className="flex items-center bg-white rounded-md px-3.5 py-2.5 border border-gray-300 focus-within:border-orange focus-within:ring-1 focus-within:ring-orange transition-colors">
                  <LuSearch className="h-5 w-5 text-gray-400 mr-2.5 shrink-0" />
                  <input 
                    type="text" 
                    name="keyword"
                    placeholder="Job title, skills, or company" 
                    className="bg-transparent border-none text-charcoal w-full placeholder-gray-400 outline-none text-sm"
                  />
                </div>
                <div className="flex items-center bg-white rounded-md px-3.5 py-2.5 border border-gray-300 focus-within:border-orange focus-within:ring-1 focus-within:ring-orange transition-colors">
                  <LuMapPin className="h-5 w-5 text-gray-400 mr-2.5 shrink-0" />
                  <input 
                    type="text" 
                    name="location"
                    placeholder="City, region, or Remote" 
                    className="bg-transparent border-none text-charcoal w-full placeholder-gray-400 outline-none text-sm"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full mt-1">
                  <LuSearch className="h-4 w-4 mr-2" />
                  <span>Search Jobs</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Real Stats Section (Only shown if API provides real data, fake stats removed) */}
      {(stats.jobsCount !== null || stats.companiesCount !== null) && (
        <section className="py-8 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-xl mx-auto text-center">
              {stats.jobsCount !== null && (
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-xs">
                  <div className="text-2xl sm:text-3xl font-bold font-display text-orange mb-1">
                    {stats.jobsCount.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Verified Active Jobs</div>
                </div>
              )}
              {stats.companiesCount !== null && (
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-xs">
                  <div className="text-2xl sm:text-3xl font-bold font-display text-orange mb-1">
                    {stats.companiesCount.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Approved Companies</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Popular Categories */}
      <section className="py-14 bg-warmwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-display font-bold text-charcoal mb-2">Explore Categories</h2>
            <p className="text-sm text-gray-600">Find job opportunities categorized by industry sectors</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Software Development', 'Marketing', 'Finance', 'Healthcare', 'Design', 'Customer Support', 'Sales', 'Education'].map((cat) => {
              const Icon = categoryIcons[cat] || LuBriefcase;
              return (
                <Link 
                  key={cat} 
                  href={`/jobs?category=${encodeURIComponent(cat)}`} 
                  className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs hover:border-orange hover:shadow-sm transition-all text-center group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-md bg-peach/40 text-orange border border-peach flex items-center justify-center group-hover:bg-orange group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-charcoal group-hover:text-orange transition-colors truncate">{cat}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-14 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-charcoal">Featured Jobs</h2>
              <p className="text-sm text-gray-600">Hand-picked career openings from top employers</p>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-orange hover:text-orange/80 inline-flex items-center gap-1 transition-colors">
              <span>View all jobs</span>
              <LuArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all flex flex-col justify-between">
               <div>
                 <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-charcoal hover:text-orange transition-colors">
                        <Link href="/jobs">Senior React Developer</Link>
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">ABC Technologies</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Full-Time
                    </span>
                 </div>
                 <div className="flex flex-wrap gap-3 text-xs text-gray-500 my-3">
                    <span className="flex items-center gap-1"><LuMapPin className="h-3.5 w-3.5 text-gray-400"/> Colombo (Remote)</span>
                    <span className="flex items-center gap-1"><LuBriefcase className="h-3.5 w-3.5 text-gray-400"/> Engineering</span>
                 </div>
               </div>
               <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                  <span className="text-sm font-bold text-charcoal">
                    {formatSalary(80000, 120000)}
                  </span>
                  <Link href="/jobs">
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </Link>
               </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all flex flex-col justify-between">
               <div>
                 <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-charcoal hover:text-orange transition-colors">
                        <Link href="/jobs">Product Marketing Manager</Link>
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">Global Media Corp</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Full-Time
                    </span>
                 </div>
                 <div className="flex flex-wrap gap-3 text-xs text-gray-500 my-3">
                    <span className="flex items-center gap-1"><LuMapPin className="h-3.5 w-3.5 text-gray-400"/> Colombo</span>
                    <span className="flex items-center gap-1"><LuBriefcase className="h-3.5 w-3.5 text-gray-400"/> Marketing</span>
                 </div>
               </div>
               <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                  <span className="text-sm font-bold text-charcoal">
                    {formatSalary(150000, 200000)}
                  </span>
                  <Link href="/jobs">
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Solid Warm White / Charcoal */}
      <section className="bg-warmwhite py-14 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
           <h2 className="text-2xl sm:text-3xl font-display font-bold text-charcoal mb-3">Ready to start hiring?</h2>
           <p className="text-sm text-gray-600 mb-6">Post your vacancies today and reach qualified talent across Sri Lanka.</p>
           <Link href="/register?role=employer">
              <Button size="lg">
                 Post a Job
              </Button>
           </Link>
        </div>
      </section>
    </div>
  );
}
