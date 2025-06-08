import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current viewport is mobile size
 * Uses client-side only detection to avoid hydration mismatches
 * @param breakpoint - The maximum width considered mobile (default: 1023px)
 * @returns boolean indicating if the viewport is mobile size
 */
export function useIsMobile(breakpoint: number = 1023): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Set initial value
    checkIsMobile();

    // Add event listener for resize
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  return isMobile;
} 