import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import StudentDashboard from './pages/StudentDashboard'
import StudentsPage from './pages/students'
import NewStudentPage from './pages/students/new'
import AttendancePage from './pages/attendance'
import AttendanceQRPage from './pages/attendance/qr'
import CalendarPage from './pages/calendar'
import HalaqatPage from './pages/halaqat'
import InvitationsPage from './pages/invitations'
import LecturesPage from './pages/lectures'
import LibraryPage from './pages/library'
import MaterialsPage from './pages/materials'
import ReportsPage from './pages/reports'
import WelcomePage from './pages/welcome'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/students/new" element={<NewStudentPage />} />
      <Route path="/attendance" element={<AttendancePage />} />
      <Route path="/attendance/qr" element={<AttendanceQRPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/halaqat" element={<HalaqatPage />} />
      <Route path="/invitations" element={<InvitationsPage />} />
      <Route path="/lectures" element={<LecturesPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/materials" element={<MaterialsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
    </Routes>
  )
}

export default App
