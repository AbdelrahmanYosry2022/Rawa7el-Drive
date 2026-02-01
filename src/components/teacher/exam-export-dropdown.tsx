'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Loader2, ChevronDown } from 'lucide-react';
import { downloadExamDoc, type ExportQuestion } from '@/lib/export-exam';

interface ExamExportDropdownProps {
  examTitle: string;
  questions: ExportQuestion[];
}

export function ExamExportDropdown({ examTitle, questions }: ExamExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'student' | 'teacher' | null>(null);

  const handleExport = async (withAnswers: boolean) => {
    if (questions.length === 0) {
      alert('لا توجد أسئلة لتصديرها');
      return;
    }

    setIsExporting(true);
    setExportType(withAnswers ? 'teacher' : 'student');

    try {
      await downloadExamDoc({
        examTitle,
        questions,
        withAnswers,
      });
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء تصدير الملف');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              تصدير
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => handleExport(false)}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="font-medium">نسخة الطالب</span>
            <span className="text-xs text-slate-500">بدون الإجابات</span>
          </div>
          {isExporting && exportType === 'student' && (
            <Loader2 className="w-4 h-4 animate-spin mr-auto" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport(true)}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="font-medium">نسخة المعلم</span>
            <span className="text-xs text-slate-500">مع الإجابات الصحيحة</span>
          </div>
          {isExporting && exportType === 'teacher' && (
            <Loader2 className="w-4 h-4 animate-spin mr-auto" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
