'use client';

import { Inter, Roboto_Mono } from "next/font/google";
import Link from "next/link";
import '../globals.css'
import BankAccount from './BankAccount';
import { useState } from 'react';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export default function Header() {
  const [activeLink, setActiveLink] = useState('');

  return (
    <div className={`${inter.variable} ${robotoMono.variable} antialiased`}>
      <div className="header bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 relative flex items-center shadow-lg border-b border-gray-700 backdrop-blur-sm">
        <div className="w-full flex justify-center p-6">
          <nav className="relative">
            <ul className="nav_list flex gap-8 list-none">
              <Link 
                className="group relative" 
                href='/'
                onMouseEnter={() => setActiveLink('home')}
                onMouseLeave={() => setActiveLink('')}
              >
                <li className="relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-all duration-300 cursor-pointer">
                  <span className="relative z-10">Home</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100 transform"></div>
                </li>
              </Link>
              
              <Link 
                className="group relative" 
                href='/operations'
                onMouseEnter={() => setActiveLink('operations')}
                onMouseLeave={() => setActiveLink('')}
              >
                <li className="relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-all duration-300 cursor-pointer">
                  <span className="relative z-10">Operations</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100 transform"></div>
                </li>
              </Link>
              
              <Link 
                className="group relative" 
                href='/analytics'
                onMouseEnter={() => setActiveLink('analytics')}
                onMouseLeave={() => setActiveLink('')}
              >
                <li className="relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-all duration-300 cursor-pointer">
                  <span className="relative z-10">Analytics</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100 transform"></div>
                </li>
              </Link>
              
              <Link 
                className="group relative" 
                href='/budget'
                onMouseEnter={() => setActiveLink('budget')}
                onMouseLeave={() => setActiveLink('')}
              >
                <li className="relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-all duration-300 cursor-pointer">
                  <span className="relative z-10">Budget</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100 transform"></div>
                </li>
              </Link>
              
              <Link 
                className="group relative" 
                href='/convert'
                onMouseEnter={() => setActiveLink('convert')}
                onMouseLeave={() => setActiveLink('')}
              >
                <li className="relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-all duration-300 cursor-pointer">
                  <span className="relative z-10">Convert</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100 transform"></div>
                </li>
              </Link>
              
              <Link 
                className="group relative" 
                href='/about'
                onMouseEnter={() => setActiveLink('about')}
                onMouseLeave={() => setActiveLink('')}
              >
                <li className="relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-all duration-300 cursor-pointer">
                  <span className="relative z-10">About</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100 transform"></div>
                </li>
              </Link>
            </ul>
            
            {/* Декоративная линия под навигацией */}
            <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
          </nav>
        </div>
        
        <BankAccount />
        {/* Placeholder for BankAccount positioning */}
        <div className="absolute right-0 top-2.5 w-[220px] h-[60%]"></div>
      </div>
    </div>
  );
}