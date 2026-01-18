
// OOP Logic for Bedaya LMS

export class Lecture {
  id: string;
  title: string;
  date: string;
  hasQuiz: boolean;
  quizScore: number | null;
  hasAssignment: boolean;
  assignmentStatus: 'pending' | 'submitted' | 'graded';

  constructor(id: string, title: string, date: string, hasQuiz = false, hasAssignment = false) {
    this.id = id;
    this.title = title;
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
              
              // Re-attach methods by assigning to new instance
              // (Simple object assignment doesn't restore methods)
              // We need to recreate the object with methods
              const newTerm = new Term(term.id, term.name);
              newTerm.lectures = term.lectures;
              newTerm.attendance = term.attendance;
              newTerm.finalExam = term.finalExam;
              student.terms[key] = newTerm; 
          });
          return student;
        } catch (e) {
          console.error("Failed to load student data", e);
          return null;
        }
      }
    }
    return null;
  }

  static createMockStudent(): Student {
    const student = new Student('mock-1', 'الطالب التجريبي', '01000000000');
    
    // Term 1 Data
    const t1 = student.getTerm('term-1');
    t1.addLecture(new Lecture('l1', 'مقدمة في التجويد', '2024-09-01', true, true));
    t1.addLecture(new Lecture('l2', 'أحكام النون الساكنة', '2024-09-08', true, true));
    t1.addLecture(new Lecture('l3', 'أحكام الميم الساكنة', '2024-09-15', false, false));
    
    t1.lectures[0].quizScore = 85;
    t1.lectures[0].assignmentStatus = 'submitted';
    
    t1.addAttendance('2024-09-01', 'present');
    t1.addAttendance('2024-09-08', 'present');
    t1.addAttendance('2024-09-15', 'absent');

    return student;
  }
}
