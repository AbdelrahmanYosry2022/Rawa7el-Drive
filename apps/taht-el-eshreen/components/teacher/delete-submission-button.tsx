'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteSubmission } from '@/app/actions/teacher/exams';

interface DeleteSubmissionButtonProps {
  submissionId: string;
}

export function DeleteSubmissionButton({ submissionId }: DeleteSubmissionButtonProps) {
  const handleDelete = async () => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه المحاولة؟ لا يمكن التراجع عن هذا الإجراء.');
    
    if (confirmed) {
      try {
        await deleteSubmission(submissionId);
      } catch (error) {
        console.error('Failed to delete submission:', error);
        alert('حدث خطأ أثناء حذف المحاولة');
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
      title="حذف المحاولة"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
