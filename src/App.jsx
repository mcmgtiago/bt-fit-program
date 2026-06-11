import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import Today from './components/Today'
import Workouts from './components/Workouts'
import WorkoutDay from './components/WorkoutDay'
import ExerciseDetail from './components/ExerciseDetail'
import History from './components/History'
import Profile from './components/Profile'
import Comparison from './components/Comparison'
import BottomNav from './components/BottomNav'
import InstallPWA from './components/InstallPWA'

const USERS = {
  tiago: 'euamoabrenda',
  brenda: 'euamoabrenda'
}

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('btfit_user') || null)
  const location = useLocation()

  const handleLogin = (username, password) => {
    if (USERS[username.toLowerCase()] === password) {
      const u = username.toLowerCase()
      setUser(u)
      localStorage.setItem('btfit_user', u)
      return true
    }
    return false
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('btfit_user')
  }

  const showNav = user && !location.pathname.startsWith('/exercise/')

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <div className={`flex-1 overflow-auto ${showNav ? 'pb-20' : ''}`}>
        <Routes>
          <Route path="/" element={<Today user={user} />} />
          <Route path="/workouts" element={<Workouts user={user} />} />
          <Route path="/workouts/:dayType/:weekInBlock/:block" element={<WorkoutDay user={user} />} />
          <Route path="/exercise/:exerciseId" element={<ExerciseDetail user={user} />} />
          <Route path="/history" element={<History user={user} />} />
          <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
          <Route path="/comparison" element={<Comparison user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showNav && <BottomNav user={user} />}
      <InstallPWA />
    </div>
  )
}
