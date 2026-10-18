'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    LuSearch, 
    LuTrendingUp, 
    LuDollarSign, 
    LuArrowRight, 
    LuCalculator, 
    LuSparkles 
} from 'react-icons/lu';

interface SalaryBenchmark {
    role: string;
    category: string;
    minYearly: number;
    medianYearly: number;
    maxYearly: number;
    demand: 'High' | 'Very High' | 'Moderate';
    topSkills: string[];
    experienceLevel: string;
}

const BENCHMARKS: SalaryBenchmark[] = [
    {
        role: 'Full-Stack Developer',
        category: 'Technology',
        minYearly: 85000,
        medianYearly: 125000,
        maxYearly: 165000,
        demand: 'Very High',
        topSkills: ['React', 'Next.js', '.NET', 'TypeScript', 'Node.js', 'PostgreSQL'],
        experienceLevel: 'Mid to Senior'
    },
    {
        role: 'Frontend Engineer',
        category: 'Technology',
        minYearly: 75000,
        medianYearly: 110000,
        maxYearly: 145000,
        demand: 'High',
        topSkills: ['React', 'TypeScript', 'TailwindCSS', 'Next.js', 'State Management'],
        experienceLevel: 'Mid-Level'
    },
    {
        role: 'Backend .NET Engineer',
        category: 'Technology',
        minYearly: 90000,
        medianYearly: 130000,
        maxYearly: 175000,
        demand: 'Very High',
        topSkills: ['C#', '.NET Core', 'Entity Framework', 'Microservices', 'Azure', 'SQL'],
        experienceLevel: 'Senior'
    },
    {
        role: 'AI / Machine Learning Engineer',
        category: 'Technology',
        minYearly: 110000,
        medianYearly: 155000,
        maxYearly: 210000,
        demand: 'Very High',
        topSkills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'MLOps', 'Vector DBs'],
        experienceLevel: 'Specialist'
    },
    {
        role: 'Product Manager',
        category: 'Product',
        minYearly: 95000,
        medianYearly: 135000,
        maxYearly: 180000,
        demand: 'High',
        topSkills: ['Product Strategy', 'User Research', 'Agile/Scrum', 'Data Analytics', 'Roadmapping'],
        experienceLevel: 'Mid to Senior'
    },
    {
        role: 'UI/UX Product Designer',
        category: 'Product',
        minYearly: 75000,
        medianYearly: 105000,
        maxYearly: 140000,
        demand: 'High',
        topSkills: ['Figma', 'Design Systems', 'User Testing', 'Wireframing', 'Prototyping'],
        experienceLevel: 'Mid-Level'
    },
    {
        role: 'DevOps & Cloud Engineer',
        category: 'Technology',
        minYearly: 95000,
        medianYearly: 138000,
        maxYearly: 185000,
        demand: 'Very High',
        topSkills: ['AWS', 'Kubernetes', 'Docker', 'CI/CD Pipelines', 'Terraform'],
        experienceLevel: 'Senior'
    },
    {
        role: 'Digital Marketing Manager',
        category: 'Marketing',
        minYearly: 65000,
        medianYearly: 92000,
        maxYearly: 125000,
        demand: 'Moderate',
        topSkills: ['SEO/SEM', 'Growth Marketing', 'Google Analytics', 'Content Strategy', 'Social Ads'],
        experienceLevel: 'Mid-Level'
    },
    {
        role: 'Data Analyst',
        category: 'Data',
        minYearly: 70000,
        medianYearly: 98000,
        maxYearly: 130000,
        demand: 'High',
        topSkills: ['SQL', 'Python', 'Power BI', 'Tableau', 'Excel Modeling'],
        experienceLevel: 'Entry to Mid'
    },
    {
        role: 'Sales Executive / Account Executive',
        category: 'Sales',
        minYearly: 60000,
        medianYearly: 85000,
        maxYearly: 135000,
        demand: 'High',
        topSkills: ['B2B Sales', 'CRM', 'Contract Negotiation', 'Lead Generation'],
        experienceLevel: 'Mid-Level'
    }
];

const CATEGORIES = ['All', 'Technology', 'Product', 'Data', 'Marketing', 'Sales'];

export default function SalaryGuide() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [period, setPeriod] = useState<'yearly' | 'monthly' | 'hourly'>('yearly');

    // Calculator inputs
    const [calcRole, setCalcRole] = useState(BENCHMARKS[0].role);
    const [userSalary, setUserSalary] = useState<number | ''>(115000);

    const filtered = BENCHMARKS.filter((item) => {
        const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch = item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.topSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCat && matchesSearch;
    });

    const formatCurrency = (amount: number) => {
        let value = amount;
        if (period === 'monthly') value = Math.round(amount / 12);
        if (period === 'hourly') value = Math.round(amount / 1920); // ~40h/wk * 48 wks

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Calculate user comparison
    const targetBenchmark = BENCHMARKS.find(b => b.role === calcRole) || BENCHMARKS[0];
    const comparisonRatio = userSalary ? (Number(userSalary) / targetBenchmark.medianYearly) * 100 : 100;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-16">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-orange/10 via-amber-500/5 to-transparent border-b border-orange/10 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange/15 text-orange border border-orange/20">
                        <LuSparkles className="w-3.5 h-3.5" />
                        2026 Industry Salary Guide & Benchmarks
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-charcoal tracking-tight">
                        Know What You're Worth in Today's Market
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                        Explore verified salary ranges, compensation trends, and high-value skills across competitive tech and business roles.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto pt-4">
                        <div className="relative">
                            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by job title or skill (e.g. Full-Stack, React, C#, AI)..."
                                className="w-full bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm border border-gray-200 shadow-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-hidden"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                {/* Period Selector & Category Filter */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    {/* Categories */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    selectedCategory === cat
                                        ? 'bg-orange text-white shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Period Switch */}
                    <div className="inline-flex rounded-lg bg-gray-100 p-1 self-start sm:self-auto">
                        {(['yearly', 'monthly', 'hourly'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
                                    period === p ? 'bg-white text-charcoal shadow-xs' : 'text-gray-500 hover:text-charcoal'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Salary Benchmarks Grid */}
                <div className="space-y-4 mb-12">
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
                            <LuDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <h3 className="font-semibold text-charcoal">No benchmarks found</h3>
                            <p className="text-xs text-gray-400 mt-1">Try searching with a broader title or selecting another category.</p>
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <div 
                                key={item.role}
                                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-charcoal">{item.role}</h3>
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {item.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span>Level: {item.experienceLevel}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                                <LuTrendingUp className="w-3.5 h-3.5" />
                                                Demand: {item.demand}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="text-xs font-medium text-gray-500">Median {period}</p>
                                        <p className="text-2xl font-extrabold text-orange">
                                            {formatCurrency(item.medianYearly)}
                                        </p>
                                    </div>
                                </div>

                                {/* Salary Range Bar */}
                                <div className="py-4">
                                    <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5">
                                        <span>Min: {formatCurrency(item.minYearly)}</span>
                                        <span className="text-orange font-bold">Median: {formatCurrency(item.medianYearly)}</span>
                                        <span>Max: {formatCurrency(item.maxYearly)}</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full relative overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange rounded-full"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                {/* Skills & Action */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs font-semibold text-gray-500 mr-1">In-demand skills:</span>
                                        {item.topSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="text-[11px] font-medium bg-gray-50 text-charcoal border border-gray-200 px-2 py-0.5 rounded-md"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    <Link
                                        href={`/jobs?keyword=${encodeURIComponent(item.role)}`}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:text-orange/80 shrink-0 self-end sm:self-auto transition"
                                    >
                                        <span>Explore {item.role} Jobs</span>
                                        <LuArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Salary Comparison Calculator */}
                <div className="bg-gradient-to-br from-charcoal to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                    <div className="flex items-center gap-2 text-orange mb-2">
                        <LuCalculator className="w-5 h-5" />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Interactive Comparison Tool</h2>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">How Does Your Salary Compare?</h3>
                    <p className="text-gray-400 text-xs sm:text-sm max-w-xl mb-6">
                        Select a role and enter your annual compensation to see where you stand relative to the market median.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Select Role</label>
                            <select
                                value={calcRole}
                                onChange={(e) => setCalcRole(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-orange focus:border-orange outline-hidden"
                            >
                                {BENCHMARKS.map((b) => (
                                    <option key={b.role} value={b.role} className="bg-gray-800">
                                        {b.role}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Your Annual Salary (USD)</label>
                            <input
                                type="number"
                                value={userSalary}
                                onChange={(e) => setUserSalary(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="e.g. 110000"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-orange focus:border-orange outline-hidden"
                            />
                        </div>
                    </div>

                    {userSalary && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-gray-400">Result for {calcRole}:</p>
                                <p className="text-lg font-bold mt-0.5">
                                    {comparisonRatio >= 100 ? (
                                        <span className="text-emerald-400">
                                            +{Math.round(comparisonRatio - 100)}% above median
                                        </span>
                                    ) : (
                                        <span className="text-amber-400">
                                            {Math.round(100 - comparisonRatio)}% below median
                                        </span>
                                    )}
                                    {' '} (${targetBenchmark.medianYearly.toLocaleString()} median)
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {comparisonRatio < 90
                                        ? 'You might be underpaid based on market trends. Consider reading our Salary Negotiation advice.'
                                        : 'You are well-compensated relative to the current industry average!'}
                                </p>
                            </div>

                            <Link
                                href="/career-advice"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange hover:bg-orange/90 text-white font-semibold text-xs rounded-xl shadow-xs shrink-0 transition"
                            >
                                Read Negotiation Guide →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
