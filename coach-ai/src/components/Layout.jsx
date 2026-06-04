import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'

const TABS = [
  { path: '/', icon: '🏠', label: '首頁' },
  { path: '/nutrition', icon: '🥗', label: '營養' },
  { path: '/body', icon: '📊', label: '體組成' },
  { path: '/gym', icon: '🏋️', label: '健身房' },
  { path: '/home-workout', icon: '🏃', label: '居家' },
  { path: '/water', icon: '💧', label: '水分' },
  { path: '/sleep', icon: '😴', label: '睡眠' },
  { path: '/settings', icon: '⚙️', label: '設定' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, users, switchUser } = useUser()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-white/5">
        <div className="bebas text-2xl text-accent tracking-wider">COACH AI</div>
        <div className="relative">
          <button
            className="w-9 h-9 rounded-full bg-card border border-white/10 flex items-center justify-center text-lg select-none"
            onLongPress={() => setShowUserMenu(true)}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {currentUser?.avatar || '👤'}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-11 bg-card border border-white/10 rounded-2xl p-3 min-w-[180px] z-50 shadow-xl fade-in">
              <div className="text-xs text-white/40 mb-2 px-1">切換帳號</div>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => { switchUser(u); setShowUserMenu(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${currentUser?.id === u.id ? 'bg-accent/20 text-accent' : 'hover:bg-white/5'}`}
                >
                  <span>{u.avatar || '👤'}</span>
                  <span>{u.name}</span>
                  {currentUser?.id === u.id && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
              <button
                onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:bg-white/5 mt-1 border-t border-white/5 pt-2"
              >
                <span>➕</span><span>管理帳號</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showUserMenu && <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-bg/95 backdrop-blur-md border-t border-white/5 z-40">
        <div className="grid grid-cols-8 py-2">
          {TABS.map(tab => {
            const active = location.pathname === tab.path
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-0.5 py-1 transition-all"
              >
                <span className={`text-lg ${active ? 'scale-110' : 'opacity-50'}`}>{tab.icon}</span>
                <span className={`text-[9px] ${active ? 'text-accent font-bold' : 'text-white/40'}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
