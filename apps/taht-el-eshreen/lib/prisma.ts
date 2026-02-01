
// Mock implementation of Prisma Client since @prisma/client is not available
const mockSubject = {
  id: '1',
  title: 'اللغة العربية', // changed from name to title
  name: 'اللغة العربية',
  description: 'مادة اللغة العربية للصف الأول الثانوي',
  icon: 'book',
  color: '#3B82F6', // blue-500
  platform: 'TAHT_EL_ESHREEN',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { exams: 5, resources: 3, activities: 2, questions: 10 }
};

const mockSubjects = [
  { ...mockSubject, id: '1', title: 'اللغة العربية', color: '#3B82F6' },
  { ...mockSubject, id: '2', title: 'الرياضيات', color: '#EF4444', icon: 'calculator', _count: { exams: 3, resources: 2, activities: 1, questions: 15 } },
  { ...mockSubject, id: '3', title: 'الفيزياء', color: '#10B981', icon: 'zap', _count: { exams: 2, resources: 4, activities: 0, questions: 8 } }
];

const mockExams = [
  {
    id: '1',
    title: 'اختبار النحو الأول',
    durationMinutes: 45,
    timerMode: 'EXAM_TOTAL',
    createdAt: new Date(),
    subjectId: '1',
    subject: mockSubjects[0],
    _count: { questions: 20 }
  },
  {
    id: '2',
    title: 'اختبار البلاغة',
    durationMinutes: 30,
    timerMode: 'PER_QUESTION',
    createdAt: new Date(Date.now() - 86400000), // yesterday
    subjectId: '1',
    subject: mockSubjects[0],
    _count: { questions: 10 }
  },
  {
    id: '3',
    title: 'اختبار الجبر',
    durationMinutes: 60,
    timerMode: 'NONE',
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    subjectId: '2',
    subject: mockSubjects[1],
    _count: { questions: 15 }
  }
];

const mockActivities = [
  {
    id: 'act-1',
    title: 'واجب منزلي',
    description: 'حل تمارين ص 50',
    type: 'ASSIGNMENT',
    subjectId: '1',
    dueDate: new Date(Date.now() + 86400000), // tomorrow
    createdAt: new Date(),
  },
  {
    id: 'act-2',
    title: 'مشروع الرياضيات',
    description: 'بحث عن فيثاغورس',
    type: 'PROJECT',
    subjectId: '2',
    dueDate: new Date(Date.now() + 172800000), // 2 days
    createdAt: new Date(),
  }
];

const mockResources = [
  {
    id: 'res-1',
    title: 'ملخص النحو',
    type: 'PDF',
    url: 'https://example.com/file.pdf',
    subjectId: '1',
    createdAt: new Date(),
    size: 1024 * 500, // 500KB
  },
  {
    id: 'res-2',
    title: 'فيديو شرح المعادلات',
    type: 'VIDEO',
    url: 'https://example.com/video.mp4',
    subjectId: '2',
    createdAt: new Date(),
    size: 1024 * 1024 * 100, // 100MB
  }
];

const mockPrisma = {
  subject: {
    findMany: async (args: any) => {
      let result = [...mockSubjects];

      // Handle includes
      if (args?.include) {
        result = result.map(s => {
          const enhancedSubject: any = { ...s };
          
          if (args.include.exams) {
            enhancedSubject.exams = mockExams.filter(e => e.subjectId === s.id);
          }
          if (args.include.activities) {
            enhancedSubject.activities = mockActivities.filter(a => a.subjectId === s.id);
          }
          if (args.include.resources) {
            enhancedSubject.resources = mockResources.filter(r => r.subjectId === s.id);
          }
          
          // Ensure _count exists
          if (!enhancedSubject._count) {
             enhancedSubject._count = { 
               exams: mockExams.filter(e => e.subjectId === s.id).length,
               activities: mockActivities.filter(a => a.subjectId === s.id).length,
               resources: mockResources.filter(r => r.subjectId === s.id).length,
             };
          }

          return enhancedSubject;
        });
      }
      return result;
    },
    create: async () => ({ id: 'new-id', ...mockSubject }),
    update: async () => ({ id: '1', ...mockSubject }),
    delete: async () => ({ id: '1', ...mockSubject }),
    findUnique: async (args: any) => {
       const subject = mockSubjects.find(s => s.id === args.where.id);
       if (!subject) return null;
       
       // Basic include support for findUnique as well
       if (args?.include) {
         const enhancedSubject: any = { ...subject };
         if (args.include.exams) {
            enhancedSubject.exams = mockExams.filter(e => e.subjectId === subject.id);
         }
         return enhancedSubject;
       }
       return subject;
    }
  },
  exam: {
    findMany: async () => mockExams,
    findUnique: async () => mockExams[0],
    create: async () => mockExams[0],
    update: async () => mockExams[0],
    delete: async () => mockExams[0],
  },
  resource: {
    findMany: async () => mockResources,
    count: async () => mockResources.length,
    findUnique: async () => mockResources[0],
    create: async () => mockResources[0],
    update: async () => mockResources[0],
    delete: async () => mockResources[0],
  },
  activity: {
    findMany: async () => mockActivities,
    count: async () => mockActivities.length,
    findUnique: async () => mockActivities[0],
    create: async () => mockActivities[0],
    update: async () => mockActivities[0],
    delete: async () => mockActivities[0],
  },
  user: {
    findUnique: async () => ({
      id: 'dummy-user-id',
      email: 'dummy@example.com',
      role: 'ADMIN',
      platform: 'TAHT_EL_ESHREEN'
    }),
    create: async () => ({
      id: 'dummy-user-id',
      email: 'dummy@example.com',
      role: 'ADMIN',
      platform: 'TAHT_EL_ESHREEN'
    }),
    update: async (args: any) => ({
      id: args.where.id,
      email: 'dummy@example.com',
      role: args.data.role || 'ADMIN',
      platform: 'TAHT_EL_ESHREEN'
    }),
    delete: async () => ({ id: 'deleted-user' }),
    findMany: async () => [
      {
        id: 'dummy-user-id',
        email: 'dummy@example.com',
        role: 'ADMIN',
        createdAt: new Date(),
        name: 'Admin User'
      },
      {
        id: 'student-user-id',
        email: 'student@example.com',
        role: 'STUDENT',
        createdAt: new Date(),
        name: 'Student User'
      }
    ]
  },
  submission: {
    findMany: async () => [
      {
        id: 'sub-1',
        createdAt: new Date(),
        passed: true,
        exam: {
          title: 'اختبار النحو الأول',
          subject: { title: 'اللغة العربية' },
          questions: [
            { id: 'q1', text: 'سؤال 1', points: 5, correctAnswer: 'a', options: ['a', 'b'] }
          ]
        },
        answers: { 'q1': 'a' }
      }
    ],
    findUnique: async () => null,
    create: async () => ({ id: 'new-sub' }),
    deleteMany: async () => ({ count: 1 }),
  }
};

// Export as any to bypass type checking since we don't have the real types
export const prisma = mockPrisma as any;
