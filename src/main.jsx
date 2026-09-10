import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import './app.css'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Pengurus from './Pages/Pengurus/Index'
import Anggota from './Pages/Anggota/Index'
import Petugas from './Pages/Petugas/Index'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pengurus/*" element={<Pengurus />} />
          <Route path="/anggota/*" element={<Anggota />} />
          <Route path="/petugas/*" element={<Petugas />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)

