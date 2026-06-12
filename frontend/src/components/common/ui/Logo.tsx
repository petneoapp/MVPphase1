import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  variant?: "header" | "footer" | "auth" | "dashboard";
  className?: string;
  withLink?: boolean;
}

export function Logo({ variant = "header", className = "", withLink = true }: LogoProps) {
  const isFooter = variant === "footer";
  
  // Define dimensions based on variant
  let width = "w-[120px]";
  let height = "h-[32px]";
  
  if (variant === "header") {
    width = "w-[140px]";
    height = "h-[40px]";
  } else if (variant === "auth") {
    width = "w-[180px]";
    height = "h-[60px]";
  } else if (variant === "dashboard") {
    width = "w-[130px]";
    height = "h-[36px]";
  }

  const content = (
    <div className={`relative ${width} ${height} ${className}`}>
      <Image 
        src="/images/logo.png" 
        alt="PetNeo Logo" 
        fill 
        className={`object-contain ${isFooter ? "brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" : ""}`}
        priority 
      />
    </div>
  );

  if (!withLink) {
    return content;
  }

  return (
    <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
      {content}
    </Link>
  );
}
