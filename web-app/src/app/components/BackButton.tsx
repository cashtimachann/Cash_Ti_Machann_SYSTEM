"use client";
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface BackButtonProps {
  fallbackHref?: string; // Default: /dashboard/admin
  label?: string; // Text after the arrow
  className?: string;
  iconOnlyMobile?: boolean; // Hide label on small screens
  from?: string; // explicit origin fallback (overrides fallbackHref)
}

// Heuristic: if history length small (<=1) or navigation originated by direct load, use fallback
export default function BackButton({
  fallbackHref = '/dashboard/admin',
  label = 'Retounen',
  className = 'text-gray-300 hover:text-white transition-colors',
  iconOnlyMobile = false,
  from,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>((e) => {
    e.preventDefault();
    const effectiveFallback = from || fallbackHref;
    // Try going back; if history length <=1, fallback push
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(effectiveFallback);
    }
  }, [router, fallbackHref, from]);

  return (
    <button
      onClick={handleClick}
      className={`${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950 rounded`}
      aria-label={label}
      type="button"
    >
      ← {iconOnlyMobile ? <span className="hidden sm:inline">{label}</span> : label}
    </button>
  );
}
