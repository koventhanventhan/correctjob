import Link from 'next/link';
import { Search, MapPin, Briefcase, Building } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-indigo-700 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Find Your Dream Job Today
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 mb-10">
            Connect with top employers and discover opportunities that match your skills.
          </p>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-lg shadow-lg flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center bg-gray-100 rounded px-3 py-2">
              <Search className="h-5 w-5 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Job title, keywords, or company" 
                className="bg-transparent border-none focus:ring-0 text-gray-900 w-full placeholder-gray-500"
              />
            </div>
            <div className="flex-1 flex items-center bg-gray-100 rounded px-3 py-2">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="City, state, or remote" 
                className="bg-transparent border-none focus:ring-0 text-gray-900 w-full placeholder-gray-500"
              />
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded transition-colors">
              Search Jobs
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-1">10,000+</div>
              <div className="text-sm text-gray-500 font-medium">Total Jobs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-1">1,200+</div>
              <div className="text-sm text-gray-500 font-medium">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-1">50,000+</div>
              <div className="text-sm text-gray-500 font-medium">Registered Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-1">100k+</div>
              <div className="text-sm text-gray-500 font-medium">Applications Made</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Software Development', 'Marketing', 'Finance', 'Healthcare', 'Design', 'Customer Support', 'Sales', 'Education'].map((cat) => (
              <Link key={cat} href={`/jobs?category=${cat}`} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center group">
                <Briefcase className="h-8 w-8 text-indigo-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">{cat}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Jobs</h2>
            <Link href="/jobs" className="text-indigo-600 hover:text-indigo-800 font-medium">
              View all jobs &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mock Job Card - we'll replace with a component later */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-500 hover:shadow-md transition-all bg-white flex gap-4">
               <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Building className="h-6 w-6 text-gray-400" />
               </div>
               <div className="flex-1">
                 <h3 className="text-lg font-bold text-gray-900 hover:text-indigo-600"><Link href="/jobs/1">Senior React Developer</Link></h3>
                 <p className="text-gray-600 mb-2">ABC Technologies</p>
                 <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> Chennai (Remote)</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> Full-Time</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">₹8L - ₹12L</span>
                    <Link href="/jobs/1" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-600 px-3 py-1.5 rounded">
                      View Details
                    </Link>
                 </div>
               </div>
            </div>
            {/* Another Mock Card */}
             <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-500 hover:shadow-md transition-all bg-white flex gap-4">
               <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Building className="h-6 w-6 text-gray-400" />
               </div>
               <div className="flex-1">
                 <h3 className="text-lg font-bold text-gray-900 hover:text-indigo-600"><Link href="/jobs/2">Product Marketing Manager</Link></h3>
                 <p className="text-gray-600 mb-2">Global Media Corp</p>
                 <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> Mumbai</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> Full-Time</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">₹15L - ₹20L</span>
                    <Link href="/jobs/2" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-600 px-3 py-1.5 rounded">
                      View Details
                    </Link>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start hiring?</h2>
           <p className="text-lg text-gray-600 mb-8">Post your job today and connect with millions of qualified candidates.</p>
           <Link href="/register?role=employer" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform hover:-translate-y-0.5">
              Post a Job for Free
           </Link>
        </div>
      </section>
    </div>
  );
}
