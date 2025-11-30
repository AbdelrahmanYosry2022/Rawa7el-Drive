'use client';

import { useTransition } from 'react';
import { deleteUser } from '@/app/actions/teacher/users';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteUserButtonProps {
  userId: string;
  disabled?: boolean;
}

export function DeleteUserButton({ userId, disabled }: DeleteUserButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (disabled) return;

    const confirmed = window.confirm('هل أنت متأكد من حذف هذا المستخدم وجميع محاولاته؟');
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-red-500 hover:text-red-600 hover:bg-red-50"
      disabled={isPending || disabled}
      onClick={handleClick}
      aria-label="حذف المستخدم"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
