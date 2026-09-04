import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './app.css'
import Login from './Pages/Login'
import Pengurus from './Pages/Pengurus/Index'
import Anggota from './Pages/Anggota/Index'
import Petugas from './Pages/Petugas/Index'
import { AuthProvider, ProtectedRoute } from './lib/auth'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/pengurus/*" element={<ProtectedRoute role="Pengurus"><Pengurus /></ProtectedRoute>} />
          <Route path="/anggota/*" element={<ProtectedRoute role="Anggota"><Anggota /></ProtectedRoute>} />
          <Route path="/petugas/*" element={<ProtectedRoute role="Petugas Sampah"><Petugas /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
