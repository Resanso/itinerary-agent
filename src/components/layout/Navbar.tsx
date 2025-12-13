'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui';

// Custom Logo Icon - Location pin with mountains/waves
const LogoIcon = () => (
  <div className="relative w-7 h-7 flex items-center justify-center">
    <svg 
      width="28" 
      height="28" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="absolute"
    >
      {/* Location Pin Shape */}
      <path 
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
        fill="var(--color-primary)"
      />
      {/* Mountains/Waves inside pin */}
      <path 
        d="M8 14 L10 12 L12 13 L14 11 L16 12 L16 16 L8 16 Z" 
        fill="white" 
        opacity="0.95"
      />
      {/* Additional wave lines */}
      <path 
        d="M9 15 L11 13 L13 14 L15 12" 
        stroke="white" 
        strokeWidth="1" 
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  </div>
);

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Create', path: '/create' },
  { label: 'Tips', path: '/tips' },
  { label: 'Etiquette', path: '/etiquette' },
  { label: 'Saved', path: '/saved' },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
      <div className="w-full px-[10px]">
        {/* Glassmorphism Navbar Container */}
        <div 
          className="rounded-full px-6 glass border shadow-diffused"
          style={{ 
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '9999px',
            paddingTop: '0.875rem',
            paddingBottom: '0.875rem',
          }}
        >
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5" onClick={closeMobileMenu}>
              <LogoIcon />
              <span className="text-xl font-bold font-heading tracking-tight" style={{ color: 'var(--color-primary)' }}>
                Itinerary Agent
              </span>
            </Link>

            {/* Desktop Navigation - Centered */}
            <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      'px-3 py-2 font-medium transition-all duration-200 tracking-tight',
                      isActive
                        ? 'text-primary'
                        : 'text-text-primary hover:text-primary'
                    )}
                    style={{
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Get Started Button */}
            <div className="hidden md:block ml-auto">
              <Link href="/create">
                <Button variant="primary" size="md" className="rounded-[var(--radius-button)]">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-[var(--radius-button)] hover:bg-secondary transition-colors ml-auto"
              aria-label="Toggle menu"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={closeMobileMenu}
                      className={cn(
                        'px-4 py-3 rounded-lg font-medium transition-all duration-200',
                        isActive
                          ? 'text-primary bg-secondary'
                          : 'text-text-primary hover:text-primary hover:bg-secondary'
                      )}
                      style={{
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div className="mt-3">
                  <Link href="/create" onClick={closeMobileMenu}>
                    <Button variant="primary" fullWidth className="rounded-[var(--radius-button)]">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

