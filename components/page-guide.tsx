"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// مفتاح localStorage للتشغيل التلقائي
const AUTO_TOUR_KEY = "autoTourEnabled";

// تعريف خطوات الجولة لكل صفحة - جولات مفصلة لكل الصفحات
const tourSteps: Record<string, DriveStep[]> = {
  // ===== صفحات الطالب =====
  "/": [
    {
      popover: {
        title: "مرحباً بك في رواحل درايف! 🎉",
        description: "دعنا نأخذك في جولة سريعة للتعرف على المنصة وميزاتها الرائعة.",
      },
    },
    {
      element: "#dashboard-header",
      popover: {
        title: "لوحة التحكم الرئيسية",
        description: "هنا تجد نظرة عامة على نشاطك في المنصة. العنوان يعرض اسم المنصة وعدد المواد والاختبارات المتاحة.",
      },
    },
    {
      element: "#stats-cards",
      popover: {
        title: "إحصائياتك الشخصية 📊",
        description: "أربع بطاقات تعرض: عدد الاختبارات المنجزة، عدد الاختبارات الناجحة، متوسط درجاتك، ونسبة نجاحك الإجمالية.",
      },
    },
    {
      element: "#recent-exams",
      popover: {
        title: "الاختبارات المتاحة 📝",
        description: "هنا تظهر أحدث الاختبارات المتاحة لك. اضغط على أي اختبار للبدء فيه فوراً!",
      },
    },
  ],

  "/my-exams": [
    {
      popover: {
        title: "سجل اختباراتك 📋",
        description: "في هذه الصفحة تجد كل الاختبارات التي قمت بأدائها سابقاً.",
      },
    },
    {
      element: "#my-exams-table",
      popover: {
        title: "جدول النتائج",
        description: "يعرض اسم الامتحان، التاريخ، الدرجة، وحالة النجاح. اضغط على 'عرض النتيجة' لمشاهدة تفاصيل إجاباتك.",
      },
    },
  ],

  // ===== صفحات المعلم =====
  "/teacher": [
    {
      popover: {
        title: "لوحة تحكم المعلم 🎓",
        description: "مرحباً بك في لوحة الإدارة! هنا تتابع كل نشاط المنصة وإحصائيات الطلاب.",
      },
    },
    {
      element: "#stats-grid",
      popover: {
        title: "إحصائيات المنصة",
        description: "أربع بطاقات تعرض: إجمالي الطلاب، عدد المواد، عدد الاختبارات، وإجمالي المحاولات. أرقام حقيقية تتحدث تلقائياً!",
      },
    },
    {
      element: "#recent-activity",
      popover: {
        title: "آخر محاولات الطلاب 👥",
        description: "جدول يعرض أحدث 5 محاولات: اسم الطالب، الاختبار، النتيجة، والوقت. تابع نشاط طلابك لحظة بلحظة!",
      },
    },
  ],

  "/teacher/subjects": [
    {
      popover: {
        title: "إدارة المواد الدراسية 📚",
        description: "هنا تنشئ وتدير المواد الدراسية. كل مادة تحتوي على مجموعة من الاختبارات.",
      },
    },
    {
      element: "#create-subject-btn",
      popover: {
        title: "إنشاء مادة جديدة ➕",
        description: "اضغط هنا لإضافة مادة جديدة. حدد الاسم واللون والأيقونة لتمييزها.",
      },
    },
    {
      element: "#subjects-grid",
      popover: {
        title: "قائمة المواد",
        description: "كل المواد تظهر هنا كبطاقات. اضغط على أي مادة للدخول وإدارة اختباراتها.",
      },
    },
  ],

  "/teacher/exams": [
    {
      popover: {
        title: "محرر الامتحان ✏️",
        description: "هنا تبني وتدير الامتحان بالكامل: الأسئلة، النتائج، والتحليلات.",
      },
    },
    {
      element: "#exam-header",
      popover: {
        title: "معلومات الامتحان",
        description: "العنوان، المادة، المدة الزمنية، ودرجة النجاح المطلوبة. كل التفاصيل الأساسية في مكان واحد.",
      },
    },
    {
      element: "#export-btn",
      popover: {
        title: "تصدير الامتحان 📄",
        description: "ميزة قوية! حوّل الامتحان لملف Word منسق وجاهز للطباعة. يدعم العربية بالكامل مع نموذج إجابة منفصل.",
      },
    },
    {
      element: "#questions-tab",
      popover: {
        title: "تبويب الأسئلة",
        description: "أضف أسئلة جديدة (اختيار من متعدد أو صح/خطأ)، عدّل الموجودة، أو احذفها. واجهة سهلة وسريعة!",
      },
    },
    {
      element: "#results-tab",
      popover: {
        title: "تبويب النتائج",
        description: "شاهد كل من حل الامتحان: الاسم، الدرجة، حالة النجاح، والتاريخ. تتبع أداء طلابك!",
      },
    },
    {
      element: "#analytics-tab",
      popover: {
        title: "تبويب التحليلات 📈",
        description: "تحليل ذكي! اعرف أي الأسئلة صعبة على الطلاب من خلال نسب الإجابات الصحيحة. يظهر بعد 5 محاولات على الأقل.",
      },
    },
  ],

  // ===== صفحات المواد =====
  "/subjects": [
    {
      popover: {
        title: "صفحة المادة 📖",
        description: "هنا تجد كل الاختبارات المتاحة في هذه المادة.",
      },
    },
  ],

  // ===== صفحة الامتحان للطالب =====
  "/exams": [
    {
      popover: {
        title: "صفحة الامتحان 📝",
        description: "هنا تبدأ الامتحان. اقرأ التعليمات جيداً قبل البدء!",
      },
    },
  ],
};

// دالة للحصول على خطوات الصفحة
function getStepsForPath(pathname: string): DriveStep[] {
  // مطابقة دقيقة أولاً
  if (tourSteps[pathname]) {
    return tourSteps[pathname];
  }

  // مطابقة للـ dynamic routes
  if (pathname.startsWith("/teacher/exams/")) {
    return tourSteps["/teacher/exams"] || [];
  }
  if (pathname.startsWith("/teacher/subjects/")) {
    return tourSteps["/teacher/subjects"] || [];
  }
  if (pathname.startsWith("/subjects/")) {
    return tourSteps["/subjects"] || [];
  }
  if (pathname.startsWith("/exams/")) {
    return tourSteps["/exams"] || [];
  }

  return [];
}

export function PageGuide() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [autoTourEnabled, setAutoTourEnabled] = useState(false);
  const hasRunAutoTour = useRef(false);
  const lastPathname = useRef<string>("");

  // تحميل إعداد التشغيل التلقائي من localStorage
  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem(AUTO_TOUR_KEY);
    setAutoTourEnabled(saved === "true");
  }, []);

  // تشغيل الجولة تلقائياً عند تغيير الصفحة (إذا كان مفعّل)
  useEffect(() => {
    if (!mounted || !autoTourEnabled) return;
    if (lastPathname.current === pathname) return;
    
    lastPathname.current = pathname;
    
    // تأخير بسيط للتأكد من تحميل العناصر
    const timer = setTimeout(() => {
      const steps = getStepsForPath(pathname);
      if (steps.length > 0) {
        runTour(steps);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, mounted, autoTourEnabled]);

  const runTour = (steps: DriveStep[]) => {
    const driverObj = driver({
      showProgress: true,
      steps: steps,
      nextBtnText: "التالي ←",
      prevBtnText: "→ السابق",
      doneBtnText: "إنهاء ✓",
      progressText: "{{current}} من {{total}}",
      animate: true,
      allowClose: true,
      stagePadding: 10,
      stageRadius: 12,
      popoverClass: "rawa7el-tour",
    });
    driverObj.drive();
  };

  const startTour = () => {
    const steps = getStepsForPath(pathname);

    if (steps.length > 0) {
      runTour(steps);
    } else {
      // لو مافي خطوات، نعرض رسالة
      const driverObj = driver({
        showProgress: false,
        steps: [
          {
            popover: {
              title: "لا توجد جولة حالياً",
              description: "هذه الصفحة لا تحتوي على جولة تفاعلية بعد. جرّب صفحات أخرى!",
            },
          },
        ],
        doneBtnText: "حسناً",
      });
      driverObj.drive();
    }
  };

  const toggleAutoTour = () => {
    const newValue = !autoTourEnabled;
    setAutoTourEnabled(newValue);
    window.localStorage.setItem(AUTO_TOUR_KEY, String(newValue));
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
      {/* زر التشغيل التلقائي */}
      <Button
        onClick={toggleAutoTour}
        className={`rounded-full w-12 h-12 shadow-lg transition-all duration-300 ${
          autoTourEnabled
            ? "bg-emerald-500 hover:bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-2"
            : "bg-slate-200 hover:bg-slate-300 text-slate-600"
        }`}
        title={autoTourEnabled ? "إيقاف الجولات التلقائية" : "تفعيل الجولات التلقائية"}
        size="icon"
      >
        {autoTourEnabled ? (
          <Zap className="w-5 h-5" />
        ) : (
          <ZapOff className="w-5 h-5" />
        )}
      </Button>

      {/* زر بدء الجولة يدوياً */}
      <Button
        onClick={startTour}
        className="rounded-full w-14 h-14 shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 hover:scale-105"
        title="شرح الصفحة"
        size="icon"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
    </div>
  );
}
