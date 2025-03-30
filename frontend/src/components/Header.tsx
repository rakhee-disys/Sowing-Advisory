// src/components/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Info } from 'lucide-react';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Toggle Mobile Menu
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">

          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <Link to="/" aria-label="Dexian.India Home">
              <img
                src="/assets/dexlogo.jpeg"
                alt="Dexian.India Logo"
                className="h-10 w-auto"
              />
            </Link>

            <Link to="/" className="font-bold text-xl hover:text-green-600">
              Dexian.India
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-green-500 transition-colors">Home</Link>

            {/* External About Link (Opens in New Tab) */}
            <a
              href="https://dexian.com/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-500 transition-colors"
            >
              About
            </a>

            <Link to="/contact" className="hover:text-green-500 transition-colors">Contact</Link>

            {/* Instruction Icon (After Text Chat) */}
            <div
              className="relative cursor-pointer"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
          
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link to="/" className="hover:text-green-500 transition-colors" onClick={toggleMenu}>
              Home
            </Link>

            {/* External About Link (Opens in New Tab) */}
            <a
              href="https://dexian.com/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-500 transition-colors"
              onClick={toggleMenu}
            >
              About
            </a>

            <Link to="/contact" className="hover:text-green-500 transition-colors" onClick={toggleMenu}>
              Contact
            </Link>

            {/* Instruction in Mobile Menu */}
            <div className="mt-4 text-sm text-gray-700">
              <h3 className="font-semibold mb-2">💬 How to Use Text Chat:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Click "Text Chat" to interact by typing your queries.</li>
                <li>Press "Send" or hit "Enter" to submit your questions.</li>
                <li>Receive AI-generated answers instantly.</li>
              </ul>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
