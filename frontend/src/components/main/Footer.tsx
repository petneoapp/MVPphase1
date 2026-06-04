import React from "react";
import Link from "next/link";
import { ShieldCheck, HeartPulse, Stethoscope, Instagram, Twitter, Facebook } from "lucide-react";
import { Logo } from "@/components/common/ui/Logo";

export function Footer() {
  return (
    <footer className="bg-[var(--color-primary-950)] text-white/80 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-16 border-b border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Verified Professionals</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Every veterinarian and seller on our platform undergoes strict credential verification.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">24/7 Emergency Care</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Access to after-hours clinics and an intelligent AI assistant for immediate triage.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Holistic Wellness</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Curated products and services designed for every stage of your pet's life.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-16 border-b border-white/5">
          <div className="col-span-2 lg:col-span-2 pr-8">
            <div className="mb-6">
              <Logo variant="footer" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              The intelligent healthcare and wellness ecosystem for modern pet parents. 
              Connecting you with verified care, curated products, and peace of mind.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Discover</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/shop" className="hover:text-(--color-primary-400) transition-colors">Wellness Shop</Link></li>
              <li><Link href="/services" className="hover:text-(--color-primary-400) transition-colors">Nearby Vets</Link></li>
              <li><Link href="/services" className="hover:text-(--color-primary-400) transition-colors">Grooming & Boarding</Link></li>
              <li><Link href="/ai" className="hover:text-(--color-primary-400) transition-colors">AI Symptom Checker</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/emergency" className="text-rose-400 hover:text-rose-300 font-medium transition-colors">Emergency Info</Link></li>
              <li><Link href="/contact" className="hover:text-(--color-primary-400) transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-(--color-primary-400) transition-colors">FAQs</Link></li>
              <li><Link href="/shipping" className="hover:text-(--color-primary-400) transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Partners</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/partner/signup" className="hover:text-(--color-primary-400) transition-colors">Join as a Vet</Link></li>
              <li><Link href="/partner/signup" className="hover:text-(--color-primary-400) transition-colors">Become a Seller</Link></li>
              <li><Link href="/login" className="hover:text-(--color-primary-400) transition-colors">Partner Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} PetNeo Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
