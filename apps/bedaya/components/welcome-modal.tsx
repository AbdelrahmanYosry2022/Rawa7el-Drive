"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@rawa7el/ui/dialog";
import { Button } from "@rawa7el/ui/button";
import { ChevronLeft } from "lucide-react";

const slides = [
  {
    id: 1,
    title: "لوحة تحكم شاملة",
    desc: "نظرة عامة على كل نشاط المنصة لحظة بلحظة. إحصائيات فورية ونتائج محدثة.",
    image: "/image.png",
    color: "bg-indigo-50",
  },
  {
    id: 2,
    title: "بناء الاختبارات",
    desc: "واجهة سهلة لبناء الأسئلة وإضافتها. تصحيح تلقائي فوري ودعم للتايمر.",
    image: "/image.png",
    color: "bg-emerald-50",
  },
  {
    id: 3,
    title: "تحليلات دقيقة",
    desc: "تابع مستوى طلابك واعرف نقاط الضعف والقوة من خلال تقارير تفصيلية.",
    image: "/image.png",
    color: "bg-purple-50",
  },
  {
    id: 4,
    title: "تصدير وطباعة",
    desc: "حوّل أي امتحان لملف Word منسق وجاهز للطباعة بضغطة زر واحدة.",
    image: "/image.png",
    color: "bg-orange-50",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeen = window.localStorage.getItem("hasSeenWelcomeTour_v2");
    if (!hasSeen) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    window.localStorage.setItem("hasSeenWelcomeTour_v2", "true");
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        <div className="relative h-[450px] flex flex-col">
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
              تخطي العرض
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center w-full"
              >
                <div className={`w-full h-44 ${slides[currentSlide].color} flex items-center justify-center mb-6 rounded-xl overflow-hidden relative border border-slate-100`}>
                  <img
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].title}
                    className="object-cover w-full h-full opacity-90 hover:opacity-100 transition-opacity"
                  />
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-slate-500 leading-relaxed text-sm px-2">
                  {slides[currentSlide].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide ? "w-6 bg-indigo-600" : "w-2 bg-slate-300"
                    }`}
                  />
                ))}
              </div>

              <Button 
                onClick={nextSlide} 
                className={`flex items-center gap-2 transition-all ${
                    currentSlide === slides.length - 1 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {currentSlide === slides.length - 1 ? (
                  <span>ابدأ المنصة</span>
                ) : (
                  <>
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
