// 'use client' removed for Vite

import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  ariaLabel?: string;
}

export function BackButton({ className, ariaLabel = 'رجوع' }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm',
        className,
      )}
      aria-label={ariaLabel}
    >
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
