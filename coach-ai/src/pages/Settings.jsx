import React, { useState } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { getAllRecords } from '../db/index.js'

const AVATARS = ['💪', '🏋️', '🧘', '🏃', '⚡', '🔥', '🦁', '🐯', '🚀', '⭐']
const GOALS = ['增肌', '減脂', '維持體態', '提升體能', '健康生活']
const STYLES = ['嚴格教練', '溫和鼓勵', '科學分析', '幽默風趣']

export default function Settings() {
  const { currentUser, users, updateUser, createUser, removeUser, switchUser } = useUser()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(currentUser || {})
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', avatar: '💪', age: '', height: '', weight: '', goal: '增肌', kcalTarget: 2000, proteinTarget: 150, apiKey: '', coachStyle: '溫和鼓勵' })
  const [showApiKey, setShowApiKey] = useState(false)
  const [exportMsg, setExportMsg] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setN = (k, v) => setNewUser(f => ({ ...f, [k]: v }))

  async function handleSave() {
    await updateUser(form)
    setEditing(false)
  }

  async function handleAddUser() {
    if (!newUser.name.trim()) return
    await createUser(newUser)
    setShowAddUser(false)
    setNewUser({ name: '', avatar: '💪', age: '', height: '', weight: '', goal: '增肌', kcalTarget: 2000, proteinTarget: 150, apiKey: '', coachStyle: '溫和鼓勵' })
  }

  async function exportData() {
    const stores = ['meals', 'bodyData', 'workoutLogs', 'water', 'sleep']
    const data = { user: currentUser }
    for (const s of stores) {
      data[s] = await getAllRecords(s, currentUser.id)
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `coach-ai-${currentUser.name}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportMsg('資料已匯出！')
    setTimeout(() => setExportMsg(''), 3000)
  }

  if (!currentUser) return null

  return (
    <div className="pt-4 fade-in">
      <div className="bebas text-3xl text-accent mb-4">個人設定</div>

      {/* Current user */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl">{currentUser.avatar}</div>
          <div>
            <div className="font-bold">{currentUser.name}</div>
            <div className="text-xs text-white/40">{currentUser.goal}</div>
          </div>
          <button onClick={() => { setForm({ ...currentUser }); setEditing(!editing) }}
            className="ml-auto text-sm text-accent border border-accent/30 rounded-lg px-3 py-1 hover:bg-accent/10 transition-colors">
            {editing ? '取消' : '編輯'}
          </button>
        </div>

        {editing && (
          <div className="fade-in">
            <div className="flex flex-wrap gap-2 mb-3">
              {AVATARS.map(a => (
                <button key={a} onClick={() => set('avatar', a)}
                  className={`w-9 h-9 rounded-xl text-xl border transition-all ${form.avatar === a ? 'border-accent bg-accent/20' : 'border-white/10'}`}>{a}</button>
              ))}
            </div>
            <input className="mb-2" placeholder="姓名" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><div className="text-xs text-white/60 mb-1">年齡</div><input type="number" value={form.age || ''} onChange={e => set('age', +e.target.value)} /></div>
              <div><div className="text-xs text-white/60 mb-1">身高</div><input type="number" value={form.height || ''} onChange={e => set('height', +e.target.value)} /></div>
              <div><div className="text-xs text-white/60 mb-1">體重</div><input type="number" value={form.weight || ''} onChange={e => set('weight', +e.target.value)} /></div>
            </div>
            <div className="mb-2">
              <div className="text-xs text-white/60 mb-1">目標</div>
              <div className="grid grid-cols-3 gap-1">
                {GOALS.map(g => (
                  <button key={g} onClick={() => set('goal', g)}
                    className={`py-1.5 rounded-lg text-xs border transition-all ${form.goal === g ? 'border-accent bg-accent/20 text-accent' : 'border-white/10'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><div className="text-xs text-white/60 mb-1">熱量目標</div><input type="number" value={form.kcalTarget || ''} onChange={e => set('kcalTarget', +e.target.value)} /></div>
              <div><div className="text-xs text-white/60 mb-1">蛋白質目標</div><input type="number" value={form.proteinTarget || ''} onChange={e => set('proteinTarget', +e.target.value)} /></div>
            </div>
            <div className="mb-2">
              <div className="text-xs text-white/60 mb-1">教練風格</div>
              <div className="grid grid-cols-2 gap-1">
                {STYLES.map(s => (
                  <button key={s} onClick={() => set('coachStyle', s)}
                    className={`py-1.5 rounded-lg text-xs border transition-all ${form.coachStyle === s ? 'border-accent bg-accent/20 text-accent' : 'border-white/10'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-white/60">Anthropic API Key</div>
                <button onClick={() => setShowApiKey(!showApiKey)} className="text-xs text-accent">{showApiKey ? '隱藏' : '顯示'}</button>
              </div>
              <input type={showApiKey ? 'text' : 'password'} placeholder="sk-ant-..." value={form.apiKey || ''} onChange={e => set('apiKey', e.target.value)} />
            </div>
            <button onClick={handleSave} className="btn-accent">儲存</button>
          </div>
        )}

        {!editing && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-white/5 rounded-xl p-2"><div className="text-accent font-bold">{currentUser.kcalTarget}</div><div className="text-xs text-white/40">熱量目標</div></div>
            <div className="bg-white/5 rounded-xl p-2"><div className="text-accent font-bold">{currentUser.proteinTarget}g</div><div className="text-xs text-white/40">蛋白質</div></div>
            <div className="bg-white/5 rounded-xl p-2"><div className="text-accent font-bold">{currentUser.height || '-'}</div><div className="text-xs text-white/40">身高cm</div></div>
          </div>
        )}
      </div>

      {/* Multi-user */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold">帳號管理</div>
          <button onClick={() => setShowAddUser(true)} className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1 hover:bg-accent/10 transition-colors">+ 新增帳號</button>
        </div>
        {users.map(u => (
          <div key={u.id} className={`flex items-center gap-3 py-2 border-b border-white/5 last:border-0 ${currentUser.id === u.id ? 'opacity-100' : 'opacity-60'}`}>
            <span className="text-2xl">{u.avatar}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{u.name}</div>
              <div className="text-xs text-white/40">{u.goal}</div>
            </div>
            {currentUser.id !== u.id && (
              <div className="flex gap-1">
                <button onClick={() => switchUser(u)} className="text-xs text-accent border border-accent/30 rounded-lg px-2 py-1">切換</button>
                <button onClick={() => removeUser(u.id)} className="text-xs text-error border border-error/30 rounded-lg px-2 py-1">刪除</button>
              </div>
            )}
            {currentUser.id === u.id && <span className="text-xs text-success">使用中</span>}
          </div>
        ))}
      </div>

      {/* Data */}
      <div className="card mb-4">
        <div className="text-sm font-bold mb-3">資料管理</div>
        <button onClick={exportData} className="btn-ghost w-full mb-2 text-sm">📥 匯出資料 (JSON)</button>
        {exportMsg && <div className="text-xs text-success text-center">{exportMsg}</div>}
      </div>

      {/* Add user modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={e => e.target === e.currentTarget && setShowAddUser(false)}>
          <div className="bg-card rounded-t-3xl p-6 w-full max-w-[480px] fade-in">
            <div className="text-lg font-bold mb-4">新增帳號</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setN('avatar', a)}
                  className={`w-9 h-9 rounded-xl text-xl border transition-all ${newUser.avatar === a ? 'border-accent bg-accent/20' : 'border-white/10'}`}>{a}</button>
              ))}
            </div>
            <input className="mb-2" placeholder="姓名 *" value={newUser.name} onChange={e => setN('name', e.target.value)} />
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div><div className="text-xs text-white/60 mb-1">年齡</div><input type="number" placeholder="25" value={newUser.age} onChange={e => setN('age', e.target.value)} /></div>
              <div><div className="text-xs text-white/60 mb-1">身高</div><input type="number" placeholder="170" value={newUser.height} onChange={e => setN('height', e.target.value)} /></div>
              <div><div className="text-xs text-white/60 mb-1">體重</div><input type="number" placeholder="65" value={newUser.weight} onChange={e => setN('weight', e.target.value)} /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setShowAddUser(false)}>取消</button>
              <button className="btn-accent flex-1" onClick={handleAddUser}>建立帳號</button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-white/20 py-4">COACH AI v1.0.0 · Made with ❤️</div>
    </div>
  )
}
