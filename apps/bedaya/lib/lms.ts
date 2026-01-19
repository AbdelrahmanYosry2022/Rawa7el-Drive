
// OOP Logic for Bedaya LMS

export class Lecture {
  id: string;
  title: string;
  subject: string;
  date: string;
  hasQuiz: boolean;
  quizScore: number | null;
  hasAssignment: boolean;
  assignmentStatus: 'pending' | 'submitted' | 'graded';

  constructor(id: string, title: string, subject: string, date: string, hasQuiz = false, hasAssignment = false) {
    this.id = id;
    this.title = title;
    this.subject = subject;
    this.date = date;
    this.hasQuiz = hasQuiz;
    this.quizScore = null;
    this.hasAssignment = hasAssignment;
    this.assignmentStatus = 'pending';
  }
}

export class Term {
  id: string;
  name: string;
  lectures: Lecture[];
  attendance: { date: string; status: 'present' | 'absent' | 'excused' }[];
  finalExam: { available: boolean; score: number | null };

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.lectures = [];
    this.attendance = [];
    this.finalExam = { available: false, score: null };
  }

  addLecture(lecture: Lecture) {
    this.lectures.push(lecture);
  }

  addAttendance(date: string, status: 'present' | 'absent' | 'excused') {
    this.attendance.push({ date, status });
  }

  getAttendancePercentage(): number {
    if (this.attendance.length === 0) return 0;
    const presentCount = this.attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / this.attendance.length) * 100);
  }

  getSubmittedAssignmentsCount(): number {
    return this.lectures.filter(l => l.hasAssignment && l.assignmentStatus === 'submitted').length;
  }
}

export class Student {
  id: string;
  name: string;
  phone: string;
  terms: { [key: string]: Term };

  constructor(id: string, name: string, phone: string) {
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.terms = {
      'term-1': new Term('term-1', 'الترم الأول'),
      'term-2': new Term('term-2', 'الترم الثاني'),
      'term-3': new Term('term-3', 'الترم الثالث'),
    };
  }

  getTerm(termId: string) {
    return this.terms[termId];
  }

  saveToStorage() {
    if (typeof window !== 'undefined') {
      const data = {
        id: this.id,
        name: this.name,
        phone: this.phone,
        terms: this.terms
      };
      localStorage.setItem(`student-${this.id}`, JSON.stringify(data));

      // Update student list for "Admin" management
      const studentsList = Student.getStudentsList();
      if (!studentsList.find(s => s.id === this.id)) {
        studentsList.push({ id: this.id, name: this.name });
        localStorage.setItem('bedaya-students-list', JSON.stringify(studentsList));
      }
    }
  }

  static getStudentsList(): { id: string; name: string }[] {
    if (typeof window !== 'undefined') {
      const list = localStorage.getItem('bedaya-students-list');
      return list ? JSON.parse(list) : [];
    }
    return [];
  }

  static deleteStudent(studentId: string) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`student-${studentId}`);
      const list = Student.getStudentsList().filter(s => s.id !== studentId);
      localStorage.setItem('bedaya-students-list', JSON.stringify(list));
    }
  }

  static loadFromStorage(studentId: string): Student | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(`student-${studentId}`);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const student = new Student(parsed.id, parsed.name, parsed.phone);
          // Rehydrate terms
          Object.keys(parsed.terms).forEach(key => {
            const tData = parsed.terms[key];
            const term = new Term(tData.id, tData.name);
            term.lectures = tData.lectures;
            term.attendance = tData.attendance;
            term.finalExam = tData.finalExam;

            const newTerm = new Term(term.id, term.name);
            newTerm.lectures = term.lectures;
            newTerm.attendance = term.attendance;
            newTerm.finalExam = term.finalExam;
            student.terms[key] = newTerm;
          });

          // Fix: If it's the mock student and missing data in Term 2/3 (due to old storage), regenerate terms
          if (student.id === 'mock-1') {
            const t2 = student.getTerm('term-2');
            const t3 = student.getTerm('term-3');
            if (t2.lectures.length === 0 || t3.lectures.length === 0) {
              // Regenerate mock data logic or just overwrite terms
              const mock = Student.createMockStudent();
              student.terms = mock.terms;
              student.saveToStorage();
            }
          }

          return student;
        } catch (e) {
          console.error("Failed to load student data", e);
          return null;
        }
      }
    }
    return null;
  }

  static createMockStudent(id = 'mock-1', name = 'الطالب التجريبي'): Student {
    const student = new Student(id, name, '01000000000');

    // Term 1 Data
    const t1 = student.getTerm('term-1');
    t1.addLecture(new Lecture('l1-1', 'مقدمة في التجويد', 'التجويد', '2024-09-01', true, true));
    t1.addLecture(new Lecture('l1-2', 'أحكام النون الساكنة', 'التجويد', '2024-09-08', true, true));
    t1.addLecture(new Lecture('l1-3', 'أحكام الميم الساكنة', 'التجويد', '2024-09-15', false, false));
    t1.addLecture(new Lecture('l1-4', 'تفسير سورة الفاتحة', 'التفسير', '2024-09-05', true, false));
    t1.addLecture(new Lecture('l1-5', 'الطهارة والوضوء', 'الفقه', '2024-09-10', true, true));

    t1.lectures[0].quizScore = 85;
    t1.lectures[0].assignmentStatus = 'submitted';

    t1.addAttendance('2024-09-01', 'present');
    t1.addAttendance('2024-09-08', 'present');
    t1.addAttendance('2024-09-15', 'absent');
    t1.addAttendance('2024-09-05', 'present');
    t1.addAttendance('2024-09-10', 'excused');

    t1.finalExam = { available: true, score: 95 };

    // Term 2 Data
    const t2 = student.getTerm('term-2');
    t2.addLecture(new Lecture('l2-1', 'المدود - الجزء الأول', 'التجويد', '2025-01-05', true, true));
    t2.addLecture(new Lecture('l2-2', 'المدود - الجزء الثاني', 'التجويد', '2025-01-12', true, false));
    t2.addLecture(new Lecture('l2-3', 'مخارج الحروف', 'التجويد', '2025-01-19', true, true));
    t2.addLecture(new Lecture('l2-4', 'تفسير جزء عم', 'التفسير', '2025-01-07', false, true));

    t2.lectures[0].quizScore = 90;
    t2.lectures[0].assignmentStatus = 'graded';

    t2.addAttendance('2025-01-05', 'present');
    t2.addAttendance('2025-01-12', 'present');
    t2.addAttendance('2025-01-19', 'present');

    // Term 3 Data
    const t3 = student.getTerm('term-3');
    t3.addLecture(new Lecture('l3-1', 'صفات الحروف', 'التجويد', '2025-04-01', true, true));
    t3.addLecture(new Lecture('l3-2', 'الوقف والابتداء', 'التجويد', '2025-04-08', false, true));
    t3.addLecture(new Lecture('l3-3', 'أحكام الصلاة', 'الفقه', '2025-04-05', true, false));

    t3.addAttendance('2025-04-01', 'present');

    return student;
  }
}
