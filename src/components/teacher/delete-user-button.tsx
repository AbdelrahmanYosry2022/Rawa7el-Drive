// 'use client' removed for Vite

import { useState } from 'react';
// TODO: Implement deleteUser action for Vite
const deleteUser = async (_id: string) => { console.warn('deleteUser not implemented'); };
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteUserButtonProps {
  userId: string;
  disabled?: boolean;
}

export function DeleteUserButton({ userId, disabled }: DeleteUserButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (disabled) return;

    const confirmed = window.confirm('هل أنت متأكد من حذف هذا المستخدم وجميع محاولاته؟');
    if (!confirmed) return;

    setIsPending(true);
    try {
      await deleteUser(userId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
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
