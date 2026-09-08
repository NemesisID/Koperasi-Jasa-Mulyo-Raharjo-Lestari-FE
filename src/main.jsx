import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import './app.css'
import Login from './Pages/Login'
import Pengurus from './Pages/Pengurus/Index'
import Anggota from './Pages/Anggota/Index'
import Petugas from './Pages/Petugas/Index'
import Welcome from './Pages/Welcome'
import AuthLogin from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import ForgotPassword from './Pages/Auth/ForgotPassword'
import ResetPassword from './Pages/Auth/ResetPassword'
import ConfirmPassword from './Pages/Auth/ConfirmPassword'
import VerifyEmail from './Pages/Auth/VerifyEmail'
import Dashboard from './Pages/Dashboard'
import ProfileEdit from './Pages/Profile/Edit'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/pengurus/*" element={<Pengurus />} />
        <Route path="/anggota/*" element={<Anggota />} />
        <Route path="/petugas/*" element={<Petugas />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/confirm-password" element={<ConfirmPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfileEdit />} />
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
