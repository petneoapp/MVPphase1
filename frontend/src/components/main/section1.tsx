'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from "lucide-react";

const Navbar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  const handleLogin =  () => {
      router.push('/login');
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-3 sm:px-5 lg:px-7 py-2 sm:py-3">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/images/logo.svg"
            alt="Petneo Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28" // smaller on mobile
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-6">
          {['Dogs', 'Cats', 'Pharmacy', 'Consult', 'Shop'].map((link, idx) => (
            <a
              key={idx}
              href="#"
              className="relative text-gray-700 hover:text-blue-600 font-medium py-2 group transition-colors duration-200 text-sm lg:text-base"
            >
              {link}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </a>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Search (hidden on small screens) */}
          <div className="hidden md:flex items-center bg-gray-50 rounded-full px-3 py-1.5 min-w-[160px] lg:min-w-[220px] border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100">
            <svg
              className="w-4 h-4 text-gray-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-xs lg:text-sm w-full text-gray-700 placeholder-gray-500"
            />
          </div>

          {/* Login */}
          <div className="relative">
            <button
              onClick={handleLogin}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              Login
            </button>
          </div>

          {/* Cart */}
          <button className="relative p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 shadow-sm">
            <ShoppingCart className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2 px-3 pb-4 border-t border-gray-100">
          {/* Mobile search */}
          <div className="flex items-center bg-gray-50 rounded-full px-3 py-1.5 mb-3 border border-gray-200">
            <svg
              className="w-4 h-4 text-gray-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-xs w-full text-gray-700 placeholder-gray-500"
            />
          </div>

          {/* Mobile links */}
          <div className="grid grid-cols-2 gap-2">
            {['Dogs', 'Cats', 'Pharmacy', 'Consult', 'Shop'].map((link, idx) => (
              <a
                key={idx}
                href="#"
                className="text-gray-700 hover:text-blue-600 font-medium block py-2 px-3 text-center text-sm bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
