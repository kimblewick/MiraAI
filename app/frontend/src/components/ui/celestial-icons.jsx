import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Premium SVG celestial icons for astrology theme
 * All icons are designed to be minimalist and elegant
 */

// Constellation pattern - decorative background element
export const ConstellationPattern = ({ className }) => (
  <svg 
    className={cn("absolute inset-0 w-full h-full", className)} 
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="constellation" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
        {/* Stars */}
        <circle cx="20" cy="30" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="60" cy="20" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="100" cy="50" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="140" cy="30" r="1.2" fill="currentColor" opacity="0.5" />
        <circle cx="180" cy="60" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="40" cy="80" r="1.3" fill="currentColor" opacity="0.5" />
        <circle cx="90" cy="100" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="150" cy="90" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="30" cy="140" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="80" cy="160" r="1.2" fill="currentColor" opacity="0.5" />
        <circle cx="120" cy="130" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="170" cy="150" r="1.3" fill="currentColor" opacity="0.5" />
        <circle cx="50" cy="180" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="110" cy="190" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="160" cy="180" r="1" fill="currentColor" opacity="0.3" />
        {/* Connection lines */}
        <line x1="20" y1="30" x2="60" y2="20" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
        <line x1="60" y1="20" x2="100" y2="50" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
        <line x1="140" y1="30" x2="180" y2="60" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
        <line x1="40" y1="80" x2="90" y2="100" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
        <line x1="150" y1="90" x2="170" y2="150" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
        <line x1="80" y1="160" x2="120" y2="130" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#constellation)" />
  </svg>
);

// Elegant crescent moon icon
export const CrescentMoon = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Single star - minimal
export const StarIcon = ({ className, size = 24, filled = false }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"} 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Four-point star - elegant sparkle
export const SparkleIcon = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 3V21M3 12H21M5.63 5.63L18.37 18.37M18.37 5.63L5.63 18.37" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      opacity="0.6"
    />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

// Zodiac wheel - simplified elegant version
export const ZodiacWheel = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
    {/* Cardinal points */}
    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

// Sun icon - elegant radiating design
export const SunIcon = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// Planet with ring (Saturn-like)
export const PlanetIcon = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="12" rx="10" ry="3" stroke="currentColor" strokeWidth="1" opacity="0.5" transform="rotate(-20 12 12)" />
  </svg>
);

// Orbit rings - decorative
export const OrbitRings = ({ className, size = 200 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 200 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
    <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="0.5" opacity="0.05" />
    {/* Orbiting dots */}
    <circle cx="140" cy="100" r="2" fill="currentColor" opacity="0.4" />
    <circle cx="100" cy="40" r="1.5" fill="currentColor" opacity="0.3" />
    <circle cx="30" cy="80" r="1" fill="currentColor" opacity="0.2" />
  </svg>
);

// Celestial divider line
export const CelestialDivider = ({ className }) => (
  <div className={cn("flex items-center gap-4 w-full", className)}>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    <SparkleIcon size={16} className="text-celestial opacity-60" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  </div>
);

// Animated star field background
export const StarField = ({ count = 30, className }) => {
  const stars = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, [count]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-foreground animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

// Gradient orb - ethereal background element
export const GradientOrb = ({ className, size = 400 }) => (
  <div 
    className={cn(
      "absolute rounded-full blur-3xl opacity-20 pointer-events-none",
      className
    )}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, hsl(var(--celestial)) 0%, transparent 70%)`,
    }}
  />
);

// Logo mark - minimalist M with celestial element
export const MiraLogo = ({ className, size = 32 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <path 
      d="M8 22V10L16 18L24 10V22" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="24" cy="8" r="2" fill="currentColor" opacity="0.8" />
  </svg>
);

// Ascendant arrow icon
export const AscendantIcon = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 3L12 21M12 3L6 9M12 3L18 9" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="21" r="2" stroke="currentColor" strokeWidth="1" opacity="0.5" />
  </svg>
);

export default {
  ConstellationPattern,
  CrescentMoon,
  StarIcon,
  SparkleIcon,
  ZodiacWheel,
  SunIcon,
  PlanetIcon,
  OrbitRings,
  CelestialDivider,
  StarField,
  GradientOrb,
  MiraLogo,
  AscendantIcon,
};

