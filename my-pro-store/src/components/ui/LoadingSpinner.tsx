import React from "react";
import Image from "next/image";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  // Size mapping
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };

  // Inner logo size (roughly 50% of spinner)
  const logoSizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Spinning Ring */}
      <div 
        className={`
          animate-spin rounded-full 
          border-4 border-gray-200 border-t-blue-600 
          ${sizeClasses[size]}
        `}
      />
      
      {/* Static Logo in Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <Image 
          src="/logo.ico" 
          alt="Loading..." 
          width={logoSizes[size]} 
          height={logoSizes[size]}
          className="object-contain opacity-90"
        />
      </div>
    </div>
  );
}