import Link from 'next/link';
import { 
  LuSearch, LuMapPin, LuBriefcase,
  LuCode, LuMegaphone, LuBanknote, LuHeartPulse, 
  LuPalette, LuHeadset, LuHandshake, LuGraduationCap 
} from 'react-icons/lu';

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
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-warmwhite py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-12">
          {/* Left: Value Prop */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-charcoal mb-6 leading-tight">
              Find Your Dream<br className="hidden sm:inline" /> Job Today
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto lg:mx-0">
              Connect with top employers and discover opportunities that match your skills. The fastest way to advance your career.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/jobs" className="bg-orange hover:bg-orange/90 text-white font-bold py-3.5 px-8 rounded-xl shadow-xs hover:shadow-md transition-all text-center">
                Browse All Jobs
              </Link>
              <Link href="/register?role=employer" className="bg-white hover:bg-peach/30 text-charcoal font-bold py-3.5 px-8 rounded-xl border border-gray-300 shadow-xs hover:shadow-sm transition-all text-center">
                Post a Job
              </Link>
            </div>
          </div>

          {/* Right: Search Hub */}
          <div className="flex-1 w-full max-w-md lg:max-w-none">
            <div className="bg-peach p-6 sm:p-8 rounded-2xl shadow-sm border border-peach/50">
              <h2 className="text-2xl font-display font-bold text-charcoal mb-6">Start Searching</h2>
              <form action="/jobs" className="flex flex-col gap-4">
                <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-xs border border-gray-100 focus-within:ring-2 focus-within:ring-orange/40 transition-all">
                  <LuSearch className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <input 
                    type="text" 
                    name="keyword"
                    placeholder="Job title, keywords, or company" 
                    className="bg-transparent border-none focus:ring-0 text-charcoal w-full placeholder-gray-500 outline-none text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-xs border border-gray-100 focus-within:ring-2 focus-within:ring-orange/40 transition-all">
                  <LuMapPin className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <input 
                    type="text" 
                    name="location"
                    placeholder="City, state, or remote" 
                    className="bg-transparent border-none focus:ring-0 text-charcoal w-full placeholder-gray-500 outline-none text-sm sm:text-base"
                  />
                </div>
                <button type="submit" className="w-full bg-orange hover:bg-orange/90 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all shadow-md hover:shadow-lg mt-2 text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer">
                  <LuSearch className="h-5 w-5" />
                  <span>Search Jobs</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/70 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange mb-1">10,000+</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Jobs</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange mb-1">1,200+</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">Companies</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange mb-1">50,000+</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">Registered Users</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange mb-1">100,000+</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">Applications Made</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-warmwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-charcoal mb-8 text-center">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {['Software Development', 'Marketing', 'Finance', 'Healthcare', 'Design', 'Customer Support', 'Sales', 'Education'].map((cat) => {
              const Icon = categoryIcons[cat] || LuBriefcase;
              return (
                <Link key={cat} href={`/jobs?category=${cat}`} className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:border-orange/50 hover:-translate-y-1 transition-all text-center group">
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-orange mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xs sm:text-base font-semibold text-charcoal group-hover:text-orange transition-colors line-clamp-1">{cat}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16 bg-warmwhite border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">Featured Jobs</h2>
            <Link href="/jobs" className="text-orange hover:text-orange/80 font-medium transition-colors">
              View all jobs &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-orange hover:shadow-md transition-all flex gap-4">
               <div className="h-12 w-12 rounded-xl bg-peach/60 flex items-center justify-center flex-shrink-0 text-orange">
                  <LuCode className="h-6 w-6" />
               </div>
               <div className="flex-1">
                 <h3 className="text-lg font-bold text-charcoal hover:text-orange transition-colors"><Link href="/jobs/1">Senior React Developer</Link></h3>
                 <p className="text-gray-600 mb-2">ABC Technologies</p>
                 <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><LuMapPin className="h-4 w-4 text-gray-400"/> Chennai (Remote)</span>
                    <span className="flex items-center gap-1"><LuBriefcase className="h-4 w-4 text-gray-400"/> Full-Time</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold text-charcoal">₹8L - ₹12L</span>
                    <Link href="/jobs/1" className="text-sm font-medium text-orange hover:bg-orange hover:text-white border border-orange px-3.5 py-1.5 rounded-lg transition-colors">
                      View Details
                    </Link>
                 </div>
               </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-orange hover:shadow-md transition-all flex gap-4">
               <div className="h-12 w-12 rounded-xl bg-peach/60 flex items-center justify-center flex-shrink-0 text-orange">
                  <LuMegaphone className="h-6 w-6" />
               </div>
               <div className="flex-1">
                 <h3 className="text-lg font-bold text-charcoal hover:text-orange transition-colors"><Link href="/jobs/2">Product Marketing Manager</Link></h3>
                 <p className="text-gray-600 mb-2">Global Media Corp</p>
                 <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><LuMapPin className="h-4 w-4 text-gray-400"/> Mumbai</span>
                    <span className="flex items-center gap-1"><LuBriefcase className="h-4 w-4 text-gray-400"/> Full-Time</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold text-charcoal">₹15L - ₹20L</span>
                    <Link href="/jobs/2" className="text-sm font-medium text-orange hover:bg-orange hover:text-white border border-orange px-3.5 py-1.5 rounded-lg transition-colors">
                      View Details
                    </Link>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-peach py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-3xl font-display font-bold text-charcoal mb-4">Ready to start hiring?</h2>
           <p className="text-lg text-gray-600 mb-8">Post your job today and connect with millions of qualified candidates.</p>
           <Link href="/register?role=employer" className="bg-orange hover:bg-orange/90 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 inline-block">
              Post a Job for Free
           </Link>
        </div>
      </section>
    </div>
  );
}
