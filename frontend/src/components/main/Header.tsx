"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/common/ui/Logo";
import { ShoppingBag, Search, User, Menu, X, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/common/ui/Button";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, flow } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Wellness Shop", href: "/shop" },
    { name: "Vets & Services", href: "/services" },
    { name: "Emergency", href: "/emergency", textClass: "text-rose-600 hover:text-rose-700 font-medium" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] ${
        isScrolled
          ? "bg-white/85 backdrop-blur-md border-b border-[var(--color-border)] shadow-[var(--shadow-premium-sm)]"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Logo variant="header" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="relative group py-2"
              >
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  link.textClass
                    ? link.textClass
                    : pathname === link.href
                    ? "text-[var(--color-primary-600)]"
                    : "text-slate-600 group-hover:text-[var(--color-foreground)]"
                }`}>
                  {link.name}
                </span>
                {/* Optional Subtle Indicator */}
                {pathname === link.href && !link.textClass && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-primary-600)] rounded-full opacity-0 lg:opacity-100" />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button className="text-slate-500 hover:text-[var(--color-foreground)] transition-colors duration-300 p-2 rounded-full hover:bg-[var(--color-surface-hover)]">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/cart" className="relative text-slate-500 hover:text-[var(--color-foreground)] transition-colors duration-300 p-2 rounded-full hover:bg-[var(--color-surface-hover)]">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-primary-600)] rounded-full border border-white"></span>
            </Link>
            
            <div className="h-6 w-px bg-[var(--color-border)] mx-2"></div>
            
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" className="hidden lg:flex" leftIcon={<LayoutDashboard className="w-4 h-4" />} onClick={() => router.push(flow === 'partner' ? '/partner/dashboard' : '/customer/dashboard')}>
                My Dashboard
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="hidden lg:flex" leftIcon={<User className="w-4 h-4" />} onClick={() => router.push('/login')}>
                Sign In
              </Button>
            )}
            
            <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
              Ask AI
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-3">
            <Link href="/cart" className="relative text-slate-500 p-2">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-primary-600)] rounded-full border border-white"></span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 hover:text-[var(--color-foreground)] p-2 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[var(--color-border)] rounded-b-3xl shadow-[var(--shadow-premium-lg)] animate-in slide-in-from-top-2 duration-300 ease-out z-40">
          <div className="px-4 pt-4 pb-8 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block px-4 py-3.5 rounded-2xl text-base font-medium transition-premium ${
                  pathname === link.href
                    ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                    : link.textClass || "text-slate-700 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-6 mt-4 border-t border-[var(--color-border)] grid grid-cols-2 gap-4">
              {isAuthenticated ? (
                <Button variant="outline" className="w-full justify-center" onClick={() => { setMobileMenuOpen(false); router.push(flow === 'partner' ? '/partner/dashboard' : '/customer/dashboard'); }}>Dashboard</Button>
              ) : (
                <Button variant="outline" className="w-full justify-center" onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}>Sign In</Button>
              )}
              <Button variant="primary" className="w-full justify-center">Ask AI</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
