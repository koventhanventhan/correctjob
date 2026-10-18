'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    LuSearch, 
    LuBookOpen, 
    LuClock, 
    LuArrowRight, 
    LuFileText, 
    LuCheck, 
    LuX
} from 'react-icons/lu';

interface Article {
    id: string;
    title: string;
    category: 'Resume & CV' | 'Interview Prep' | 'Salary & Negotiation' | 'Career Growth';
    readTime: string;
    summary: string;
    fullContent: {
        intro: string;
        sections: { heading: string; points: string[] }[];
        proTip: string;
    };
    author: string;
    date: string;
}

const ARTICLES: Article[] = [
    {
        id: 'modern-resume-ats-2026',
        title: 'How to Write an ATS-Friendly Resume That Actually Gets Read in 2026',
        category: 'Resume & CV',
        readTime: '6 min read',
        summary: 'Learn how automated applicant tracking systems (ATS) parse resumes and how to structure your keywords, formatting, and achievements.',
        author: 'Sarah Jenkins, Talent Acquisition Lead',
        date: 'Updated recently',
        fullContent: {
            intro: 'Over 85% of mid-to-large companies screen resumes using automated ATS parsers before a human recruiter glances at them. Formatting errors, nested tables, and missing skill keywords are the leading causes of silent rejection.',
            sections: [
                {
                    heading: '1. Simplify Your Formatting',
                    points: [
                        'Avoid complex 2-column graphics, text boxes, and embedded charts that confuse OCR scanners.',
                        'Use standard font hierarchies: 14–16pt bold headers and 10–11pt body text.',
                        'Stick to PDF format (unless the application explicitly asks for .docx).'
                    ]
                },
                {
                    heading: '2. Align With Keywords From the Job Spec',
                    points: [
                        'Analyze the job description for specific required tech stacks, certifications, and responsibilities.',
                        'Naturally incorporate exact phrasing in your work history bullets (e.g. "Next.js", "C# .NET", "RESTful APIs").',
                        'Include a dedicated Skills section categorized by Frameworks, Languages, and Tools.'
                    ]
                },
                {
                    heading: '3. Highlight Measurable Business Impact',
                    points: [
                        'Use the Google X-Y-Z formula: "Accomplished [X] as measured by [Y] by doing [Z]".',
                        'Example: "Reduced page load time by 42% by migrating critical components to server-side rendering in Next.js."'
                    ]
                }
            ],
            proTip: 'Upload multiple targeted resumes tailored to specific roles on HireConnect rather than submitting one generic document.'
        }
    },
    {
        id: 'star-method-interviews',
        title: 'Mastering the STAR Method for Behavioral Interviews',
        category: 'Interview Prep',
        readTime: '5 min read',
        summary: 'Step-by-step formula to turn vague answers into compelling stories of problem-solving, teamwork, and leadership.',
        author: 'David Chen, Engineering Director',
        date: 'Updated recently',
        fullContent: {
            intro: 'Behavioral interview questions ("Tell me about a time you handled a disagreement", "Describe a high-pressure deadline") are designed to predict future performance based on past behavior. The STAR framework keeps your answers crisp and structured.',
            sections: [
                {
                    heading: 'S – Situation (Set the scene in 15 seconds)',
                    points: [
                        'Provide just enough context: company, timeline, team size, and the challenge faced.',
                        'Avoid over-explaining background details that distract from your actions.'
                    ]
                },
                {
                    heading: 'T – Task (What was your specific responsibility?)',
                    points: [
                        'Clarify what was expected of YOU specifically, not just the general team goal.',
                        'State the constraint or obstacle (e.g., tight deadline, production outage, budget cut).'
                    ]
                },
                {
                    heading: 'A – Action (The meat of your story - 60% of answer)',
                    points: [
                        'Focus on what you personally decided, coded, negotiated, or implemented.',
                        'Use "I" instead of "we" to emphasize your individual contribution and critical thinking.'
                    ]
                },
                {
                    heading: 'R – Result (The outcome and lessons learned)',
                    points: [
                        'Share the concrete result with quantitative data if possible.',
                        'Mention positive feedback, team learnings, or long-term benefits.'
                    ]
                }
            ],
            proTip: 'Prepare 5 versatile core STAR stories from your work history that can adapt to fit leadership, failure, conflict, and innovation prompts.'
        }
    },
    {
        id: 'salary-negotiation-guide',
        title: 'How to Negotiate Your Job Offer Without Fear of Losing It',
        category: 'Salary & Negotiation',
        readTime: '7 min read',
        summary: 'Exact scripts and psychological principles to negotiate higher base pay, signing bonuses, and flexible work terms professionally.',
        author: 'Elena Rostova, Executive Career Coach',
        date: 'Updated recently',
        fullContent: {
            intro: 'Recruiters and employers expect candidates to negotiate. When conducted politely and backed by market research, asking for fair compensation signals business maturity and self-respect.',
            sections: [
                {
                    heading: '1. Never Give the First Number if Possible',
                    points: [
                        'If asked for your current salary, pivot politely: "I am focusing on finding the right role match, and I am looking for a competitive rate in line with current market value."',
                        'Consult our Salary Guide to know the 25th, 50th, and 75th percentile benchmarks for your title.'
                    ]
                },
                {
                    heading: '2. Express Enthusiasm First',
                    points: [
                        'Always start with genuine gratitude: "Thank you so much for this offer. I am thrilled about the opportunity to join the team."',
                        'Review the full package (base, bonus, equity, remote flexibility, health benefits) before countering.'
                    ]
                },
                {
                    heading: '3. Use Value-Based Counter Scripts',
                    points: [
                        '"Based on my recent achievements in [X] and market data for this seniority level, I was targeting closer to $Y. Is there flexibility to reach that figure?"',
                        'If base salary is strictly capped, ask for signing bonuses, extra annual leave, or an accelerated 6-month performance review.'
                    ]
                }
            ],
            proTip: 'Never negotiate via an adversarial tone. Frame yourself and the hiring manager as collaborative problem-solvers reaching an agreement.'
        }
    },
    {
        id: 'transitioning-to-senior-engineer',
        title: 'From Mid-Level to Senior: What Companies Really Look For',
        category: 'Career Growth',
        readTime: '8 min read',
        summary: 'The shift from writing clean code to driving architectural direction, mentoring peers, and aligning engineering with business impact.',
        author: 'Marcus Vance, Tech Lead',
        date: 'Updated recently',
        fullContent: {
            intro: 'Junior engineers focus on "how" to write code. Mid-level engineers focus on "what" needs to be built efficiently. Senior engineers focus on "why" – choosing the right tradeoffs that minimize complexity and deliver business value.',
            sections: [
                {
                    heading: '1. System Design and Technical Judgment',
                    points: [
                        'Learn to weigh tradeoffs: build vs buy, monolithic vs distributed, latency vs consistency.',
                        'Write clear RFCs (Request for Comments) and technical design docs before writing code.',
                        'Anticipate failure modes: database contention, API rate limits, error logging.'
                    ]
                },
                {
                    heading: '2. Force Multiplier & Mentorship',
                    points: [
                        'Conduct thoughtful, constructive code reviews that teach rather than gatekeep.',
                        'Unblock teammates proactively and improve developer tooling and CI/CD automation.'
                    ]
                },
                {
                    heading: '3. Cross-Functional Communication',
                    points: [
                        'Translate technical constraints into language that product managers and executives understand.',
                        'Learn to estimate project scopes accurately and manage expectations early.'
                    ]
                }
            ],
            proTip: 'Document your architectural contributions and cross-team wins in your profile and resume experience bullets.'
        }
    }
];

const CATEGORIES = ['All', 'Resume & CV', 'Interview Prep', 'Salary & Negotiation', 'Career Growth'];

export default function CareerAdvice() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeArticle, setActiveArticle] = useState<Article | null>(null);

    const filtered = ARTICLES.filter((a) => {
        const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
        const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.summary.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50/50 pb-16">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-orange/10 via-amber-500/5 to-transparent border-b border-orange/10 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange/15 text-orange border border-orange/20">
                        <LuBookOpen className="w-3.5 h-3.5" />
                        Career Advice & Practical Guides
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-charcoal tracking-tight">
                        Expert Advice to Advance Your Career
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                        Proven strategies from hiring managers and industry experts to help you write better resumes, ace technical interviews, and negotiate top compensation.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto pt-4">
                        <div className="relative">
                            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search advice (e.g. ATS, Interview, STAR, Salary)..."
                                className="w-full bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm border border-gray-200 shadow-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-hidden"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                {/* Category Pills */}
                <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm flex flex-wrap items-center gap-1.5 mb-8">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                selectedCategory === cat
                                    ? 'bg-orange text-white shadow-xs'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Featured Hero Guide */}
                {selectedCategory === 'All' && !searchTerm && (
                    <div 
                        onClick={() => setActiveArticle(ARTICLES[0])}
                        className="bg-gradient-to-br from-charcoal via-gray-900 to-black text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl cursor-pointer hover:ring-2 hover:ring-orange/50 transition-all group"
                    >
                        <div className="flex items-center gap-2 text-orange text-xs font-bold uppercase tracking-wider mb-2">
                            <LuFileText className="w-4 h-4" />
                            <span>Featured Masterclass</span>
                            <span>•</span>
                            <span>{ARTICLES[0].readTime}</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold group-hover:text-orange transition-colors">
                            {ARTICLES[0].title}
                        </h2>
                        <p className="text-gray-300 text-sm mt-3 leading-relaxed max-w-3xl">
                            {ARTICLES[0].summary}
                        </p>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 text-xs">
                            <span className="text-gray-400">{ARTICLES[0].author}</span>
                            <span className="text-orange font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Read Full Guide →
                            </span>
                        </div>
                    </div>
                )}

                {/* Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {filtered.map((article) => (
                        <div
                            key={article.id}
                            onClick={() => setActiveArticle(article)}
                            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-md hover:border-orange/30 transition-all flex flex-col justify-between cursor-pointer group"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[11px] font-bold text-orange uppercase tracking-wider bg-orange/10 px-2.5 py-0.5 rounded-full">
                                        {article.category}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <LuClock className="w-3.5 h-3.5" />
                                        {article.readTime}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-charcoal group-hover:text-orange transition-colors leading-snug">
                                    {article.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                                    {article.summary}
                                </p>
                            </div>

                            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="text-gray-400 truncate">{article.author}</span>
                                <span className="font-semibold text-orange inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    Read Guide
                                    <LuArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Explore Next Steps CTA */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-charcoal text-base">Ready to put this advice into practice?</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Explore open positions matching your new resume and skills.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/salary-guide"
                            className="px-4 py-2 border border-gray-200 text-charcoal hover:bg-gray-50 text-xs font-semibold rounded-xl transition"
                        >
                            Salary Guide
                        </Link>
                        <Link
                            href="/jobs"
                            className="px-4 py-2 bg-orange hover:bg-orange/90 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                        >
                            Browse Jobs →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Full Article Reader Modal */}
            {activeArticle && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gray-50/50">
                            <div>
                                <span className="text-[11px] font-bold text-orange uppercase tracking-wider bg-orange/15 px-2.5 py-0.5 rounded-full">
                                    {activeArticle.category}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal mt-2 leading-tight">
                                    {activeArticle.title}
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    By {activeArticle.author} • {activeArticle.readTime}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveArticle(null)}
                                className="p-2 text-gray-400 hover:text-charcoal rounded-full hover:bg-gray-100 transition"
                            >
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-700 leading-relaxed">
                            <p className="text-base text-charcoal font-medium bg-orange/5 p-4 rounded-xl border border-orange/10">
                                {activeArticle.fullContent.intro}
                            </p>

                            {activeArticle.fullContent.sections.map((section, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h3 className="text-base font-bold text-charcoal">{section.heading}</h3>
                                    <ul className="space-y-2">
                                        {section.points.map((pt, pIdx) => (
                                            <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                                                <LuCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                <span>{pt}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}

                            {/* Pro Tip Callout */}
                            <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl text-xs text-amber-900">
                                <strong>💡 Pro Tip: </strong>
                                {activeArticle.fullContent.proTip}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <Link
                                href="/jobs"
                                onClick={() => setActiveArticle(null)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange hover:text-orange/80"
                            >
                                Apply to Jobs with This Strategy →
                            </Link>
                            <button
                                onClick={() => setActiveArticle(null)}
                                className="px-4 py-2 bg-charcoal text-white text-xs font-semibold rounded-xl hover:bg-charcoal/90 transition"
                            >
                                Done Reading
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
