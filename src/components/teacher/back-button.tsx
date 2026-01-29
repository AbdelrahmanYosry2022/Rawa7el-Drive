'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  ariaLabel?: string;
}

export function BackButton({ className, ariaLabel = 'رجوع' }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
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
