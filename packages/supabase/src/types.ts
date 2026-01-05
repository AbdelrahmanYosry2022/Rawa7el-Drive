export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types defined separately to avoid circular references
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT'
export type Platform = 'BEDAYA' | 'TAHT_EL_ESHREEN'
export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'
export type SubmissionStatus = 'ONGOING' | 'COMPLETED' | 'GRADED'
export type TimerMode = 'NONE' | 'EXAM_TOTAL' | 'PER_QUESTION'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
export type ActivityType = 'WORKSHEET' | 'PROJECT' | 'ASSIGNMENT' | 'PRACTICE' | 'READING' | 'OTHER'
export type ResourceType = 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'LINK' | 'OTHER'
export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'ANNOUNCEMENT'
export type HalaqaDay = 'SATURDAY' | 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'
export type CalendarEventStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          avatar: string | null
          role: Role
          platform: Platform
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone?: string | null
          avatar?: string | null
          role?: Role
          platform?: Platform
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          avatar?: string | null
          role?: Role
          platform?: Platform
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Subject: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          platform: Platform
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          platform?: Platform
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          platform?: Platform
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Exam: {
        Row: {
          id: string
          title: string
          description: string | null
          subjectId: string
          durationMinutes: number
          passingScore: number
          maxAttempts: number
          shuffleQuestions: boolean
          shuffleOptions: boolean
          showResults: boolean
          isPublished: boolean
          platform: Platform
          timerMode: TimerMode
          questionTimeSeconds: number | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          subjectId: string
          durationMinutes?: number
          passingScore?: number
          maxAttempts?: number
          shuffleQuestions?: boolean
          shuffleOptions?: boolean
          showResults?: boolean
          isPublished?: boolean
          platform?: Platform
          timerMode?: TimerMode
          questionTimeSeconds?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          subjectId?: string
          durationMinutes?: number
          passingScore?: number
          maxAttempts?: number
          shuffleQuestions?: boolean
          shuffleOptions?: boolean
          showResults?: boolean
          isPublished?: boolean
          platform?: Platform
          timerMode?: TimerMode
          questionTimeSeconds?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Question: {
        Row: {
          id: string
          examId: string
          text: string
          type: QuestionType
          options: Json | null
          correctAnswer: string
          points: number
          order: number
          explanation: string | null
          imageUrl: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          examId: string
          text: string
          type?: QuestionType
          options?: Json | null
          correctAnswer: string
          points?: number
          order?: number
          explanation?: string | null
          imageUrl?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          examId?: string
          text?: string
          type?: QuestionType
          options?: Json | null
          correctAnswer?: string
          points?: number
          order?: number
          explanation?: string | null
          imageUrl?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Submission: {
        Row: {
          id: string
          examId: string
          userId: string
          answers: Json
          score: number | null
          percentage: number | null
          passed: boolean
          status: SubmissionStatus
          startedAt: string
          submittedAt: string | null
          attemptNumber: number
          createdAt: string
        }
        Insert: {
          id: string
          examId: string
          userId: string
          answers: Json
          score?: number | null
          percentage?: number | null
          passed?: boolean
          status?: SubmissionStatus
          startedAt?: string
          submittedAt?: string | null
          attemptNumber?: number
          createdAt?: string
        }
        Update: {
          id?: string
          examId?: string
          userId?: string
          answers?: Json
          score?: number | null
          percentage?: number | null
          passed?: boolean
          status?: SubmissionStatus
          startedAt?: string
          submittedAt?: string | null
          attemptNumber?: number
          createdAt?: string
        }
        Relationships: []
      }
      Attendance: {
        Row: {
          id: string
          sessionId: string
          userId: string
          status: AttendanceStatus
          notes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          sessionId: string
          userId: string
          status?: AttendanceStatus
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          sessionId?: string
          userId?: string
          status?: AttendanceStatus
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      AttendanceSession: {
        Row: {
          id: string
          title: string | null
          date: string
          halaqaId: string | null
          platform: Platform
          createdAt: string
        }
        Insert: {
          id: string
          title?: string | null
          date?: string
          halaqaId?: string | null
          platform?: Platform
          createdAt?: string
        }
        Update: {
          id?: string
          title?: string | null
          date?: string
          halaqaId?: string | null
          platform?: Platform
          createdAt?: string
        }
        Relationships: []
      }
      Notification: {
        Row: {
          id: string
          title: string
          message: string
          type: NotificationType
          receiverId: string
          senderId: string | null
          isRead: boolean
          link: string | null
          createdAt: string
        }
        Insert: {
          id: string
          title: string
          message: string
          type?: NotificationType
          receiverId: string
          senderId?: string | null
          isRead?: boolean
          link?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: NotificationType
          receiverId?: string
          senderId?: string | null
          isRead?: boolean
          link?: string | null
          createdAt?: string
        }
        Relationships: []
      }
      Halaqa: {
        Row: {
          id: string
          name: string
          description: string | null
          teacherId: string
          day: HalaqaDay
          startTime: string
          endTime: string
          location: string | null
          maxStudents: number
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          teacherId: string
          day: HalaqaDay
          startTime: string
          endTime: string
          location?: string | null
          maxStudents?: number
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          teacherId?: string
          day?: HalaqaDay
          startTime?: string
          endTime?: string
          location?: string | null
          maxStudents?: number
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      HalaqaStudent: {
        Row: {
          id: string
          halaqaId: string
          studentId: string
          isActive: boolean
          joinedAt: string
        }
        Insert: {
          id: string
          halaqaId: string
          studentId: string
          isActive?: boolean
          joinedAt?: string
        }
        Update: {
          id?: string
          halaqaId?: string
          studentId?: string
          isActive?: boolean
          joinedAt?: string
        }
        Relationships: []
      }
      Lesson: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          order: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          content?: string | null
          order?: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string | null
          order?: number
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      HalaqaLesson: {
        Row: {
          id: string
          halaqaId: string
          lessonId: string
          scheduledAt: string | null
          completedAt: string | null
          notes: string | null
          createdAt: string
        }
        Insert: {
          id: string
          halaqaId: string
          lessonId: string
          scheduledAt?: string | null
          completedAt?: string | null
          notes?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          halaqaId?: string
          lessonId?: string
          scheduledAt?: string | null
          completedAt?: string | null
          notes?: string | null
          createdAt?: string
        }
        Relationships: []
      }
      StudentEvaluation: {
        Row: {
          id: string
          studentId: string
          halaqaLessonId: string
          evaluatorId: string
          grade: string | null
          notes: string | null
          createdAt: string
        }
        Insert: {
          id: string
          studentId: string
          halaqaLessonId: string
          evaluatorId: string
          grade?: string | null
          notes?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          studentId?: string
          halaqaLessonId?: string
          evaluatorId?: string
          grade?: string | null
          notes?: string | null
          createdAt?: string
        }
        Relationships: []
      }
      Resource: {
        Row: {
          id: string
          title: string
          description: string | null
          type: ResourceType
          url: string
          subjectId: string
          isPublished: boolean
          platform: Platform
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          type: ResourceType
          url: string
          subjectId: string
          isPublished?: boolean
          platform?: Platform
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: ResourceType
          url?: string
          subjectId?: string
          isPublished?: boolean
          platform?: Platform
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Activity: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          type: ActivityType
          subjectId: string
          dueDate: string | null
          attachments: Json | null
          isPublished: boolean
          platform: Platform
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          content?: string | null
          type: ActivityType
          subjectId: string
          dueDate?: string | null
          attachments?: Json | null
          isPublished?: boolean
          platform?: Platform
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string | null
          type?: ActivityType
          subjectId?: string
          dueDate?: string | null
          attachments?: Json | null
          isPublished?: boolean
          platform?: Platform
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      SubjectTeacher: {
        Row: {
          id: string
          subjectId: string
          teacherId: string
          assignedAt: string
        }
        Insert: {
          id: string
          subjectId: string
          teacherId: string
          assignedAt?: string
        }
        Update: {
          id?: string
          subjectId?: string
          teacherId?: string
          assignedAt?: string
        }
        Relationships: []
      }
      CalendarEvent: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          startTime: string | null
          endTime: string | null
          location: string | null
          speakers: Json | null
          status: CalendarEventStatus
          platform: Platform
          createdBy: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          date: string
          startTime?: string | null
          endTime?: string | null
          location?: string | null
          speakers?: Json | null
          status?: CalendarEventStatus
          platform?: Platform
          createdBy: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          startTime?: string | null
          endTime?: string | null
          location?: string | null
          speakers?: Json | null
          status?: CalendarEventStatus
          platform?: Platform
          createdBy?: string
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: Record<string, never>; Returns: string }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      Role: Role
      Platform: Platform
      QuestionType: QuestionType
      SubmissionStatus: SubmissionStatus
      TimerMode: TimerMode
      AttendanceStatus: AttendanceStatus
      ActivityType: ActivityType
      ResourceType: ResourceType
      NotificationType: NotificationType
      HalaqaDay: HalaqaDay
      CalendarEventStatus: CalendarEventStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
