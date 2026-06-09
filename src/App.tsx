import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import Home from './pages/Home'
import Rotation from './pages/Rotation'
import Scores from './pages/Scores'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/rotation" element={<Rotation />} />
            <Route path="/scores" element={<Scores />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </>
  )
}
