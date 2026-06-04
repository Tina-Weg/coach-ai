import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext.jsx'
import Layout from './components/Layout.jsx'
import UserSetup from './components/UserSetup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Nutrition from './pages/Nutrition.jsx'
import BodyComp from './pages/BodyComp.jsx'
import GymWorkout from './pages/GymWorkout.jsx'
import HomeWorkout from './pages/HomeWorkout.jsx'
import Water from './pages/Water.jsx'
import Sleep from './pages/Sleep.jsx'
import Settings from './pages/Settings.jsx'

function AppRoutes() {
  const { currentUser, loading } = useUser()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="bebas text-5xl text-accent mb-2">COACH AI</div>
        <div className="text-sm text-white/40">載入中...</div>
      </div>
    </div>
  )

  if (!currentUser) return <UserSetup />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/body" element={<BodyComp />} />
        <Route path="/gym" element={<GymWorkout />} />
        <Route path="/home-workout" element={<HomeWorkout />} />
        <Route path="/water" element={<Water />} />
        <Route path="/sleep" element={<Sleep />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  )
}
