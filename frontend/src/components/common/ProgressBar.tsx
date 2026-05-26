"use client";

import React from "react";

interface ProgressBarProps {
  percentage: number;
  className?: string;
}

export default function ProgressBar({ percentage, className = "" }: ProgressBarProps) {
  // Clamp value between 0 and 100 for safety
  const safePercentage = Math.max(0, Math.min(percentage, 100));
  
  return (
    <div className={`flex items-center w-full ${className}`}>
      <div className="w-full bg-pink-100 rounded-full h-3 relative">
        <div
          className="bg-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
      <span className="ml-3 text-black text-base font-medium min-w-[3rem]">
        {safePercentage}%
      </span>
    </div>
  );
}
