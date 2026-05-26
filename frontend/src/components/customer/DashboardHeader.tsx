"use client";

import React from "react";
import { Menu, X } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string;
  userProfileUrl?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export default function DashboardHeader({
  userName,
  userProfileUrl,
  isOpen,
  setIsOpen,
  menuButtonRef,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white shadow sticky top-0 z-50">
      {/* Left: Logo */}
      <div>
        <img src="/images/logo.svg" alt="PetNeo" className="h-10" />
      </div>

      <nav className="flex items-center space-x-4 text-sm font-semibold">
        <div className="flex items-center space-x-2">
          <span>Hello,</span>
          <span className="font-semibold text-pink-600">{userName || "User"}</span>
          <img
            src={userProfileUrl || "/images/customer/paws.png"}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        <button
          aria-label="Menu"
          className="text-2xl transition font-bold focus:outline-none"
          type="button"
          ref={menuButtonRef as any}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>
    </header>
  );
}
