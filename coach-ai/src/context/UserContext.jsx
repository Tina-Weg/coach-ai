import React, { createContext, useContext, useState, useEffect } from 'react'
import { getAllUsers, saveUser, deleteUser } from '../db/index.js'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const all = await getAllUsers()
    setUsers(all)
    const savedId = localStorage.getItem('currentUserId')
    const found = savedId && all.find(u => u.id === savedId)
    if (found) {
      setCurrentUser(found)
    } else if (all.length > 0) {
      setCurrentUser(all[0])
      localStorage.setItem('currentUserId', all[0].id)
    }
    setLoading(false)
  }

  async function createUser(userData) {
    const user = { ...userData, id: Date.now().toString() }
    await saveUser(user)
    setUsers(prev => [...prev, user])
    setCurrentUser(user)
    localStorage.setItem('currentUserId', user.id)
    return user
  }

  async function updateUser(userData) {
    await saveUser(userData)
    setUsers(prev => prev.map(u => u.id === userData.id ? userData : u))
    if (currentUser?.id === userData.id) setCurrentUser(userData)
  }

  async function removeUser(id) {
    await deleteUser(id)
    const remaining = users.filter(u => u.id !== id)
    setUsers(remaining)
    if (currentUser?.id === id) {
      const next = remaining[0] || null
      setCurrentUser(next)
      if (next) localStorage.setItem('currentUserId', next.id)
      else localStorage.removeItem('currentUserId')
    }
  }

  function switchUser(user) {
    setCurrentUser(user)
    localStorage.setItem('currentUserId', user.id)
  }

  return (
    <UserContext.Provider value={{ users, currentUser, loading, createUser, updateUser, removeUser, switchUser, loadUsers }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
