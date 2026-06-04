import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useUser } from '../context/UserContext.jsx'
import { getRecordsByDate, saveRecord, getAllRecords } from '../db/index.js'

const QUICK = [150, 250, 500]

export default function Water() {
  const { currentUser } = useUser()
  const [total, setTotal] = useState(0)
  const [records, setRecords] = useState([])
  const [weekData, setWeekData] = useState([])
  const [goal, setGoal] = useState(2000)
  const [notifStart, setNotifStart] = useState('07:00')
  const [notifEnd, setNotifEnd] = useState('22:00')
  const [notifEnabled, setNotifEnabled] = useState(false)

  useEffect(() => {
    const g = localStorage.getItem('waterGoal')
    if (g) setGoal(+g)
    const ns = localStorage.getItem('notifStart')
    if (ns) setNotifStart(ns)
    const ne = localStorage.getItem('notifEnd')
    if (ne) setNotifEnd(ne)
    const ne2 = localStorage.getItem('notifEnabled')
    if (ne2) setNotifEnabled(ne2 === 'true')
    loadData()
  }, [currentUser])

  async function loadData() {
    if (!currentUser) return
    const today = new Date().toISOString().split('T')[0]
    const recs = await getRecordsByDate('water', currentUser.id, today)
    setRecords(recs)
    setTotal(recs.reduce((s, r) => s + r.amount, 0))

    const all = await getAllRecords('water', currentUser.id)
    const byDate = {}
    all.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = 0
      byDate[r.date] += r.amount
    })
    const dates = Object.keys(byDate).sort().slice(-7)
    setWeekData(dates.map(d => ({ date: d.slice(5), amount: byDate[d] })))
  }

  async function addWater(amount) {
    const rec = {
      id: Date.now().toString(), userId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      amount, time: new Date().toTimeString().slice(0, 5),
    }
    await saveRecord('water', rec)
    loadData()
  }

  async function enableNotif() {
    if (!('Notification' in window)) { alert('此瀏覽器不支援推播通知'); return }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      setNotifEnabled(true)
      localStorage.setItem('notifEnabled', 'true')
      scheduleNotif()
    }
  }

  function scheduleNotif() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'WATER_REMINDER', start: notifStart, end: notifEnd,
      })
    }
  }

  function saveNotifSettings() {
    localStorage.setItem('waterGoal', goal)
    localStorage.setItem('notifStart', notifStart)
    localStorage.setItem('notifEnd', notifEnd)
    if (notifEnabled) scheduleNotif()
  }

  const pct = Math.min(100, Math.round((total / goal) * 100))
  const cups = Math.floor(total / 250)

  return (
    <div className="pt-4 fade-in">
      <div className="bebas text-3xl text-cyan mb-4">水分記錄</div>

      {/* Cup animation */}
      <div className="card mb-4 text-center">
        <div className="relative mx-auto mb-4" style={{ width: 120, height: 160 }}>
          <svg viewBox="0 0 120 160" className="w-full h-full">
            <defs>
              <clipPath id="cup-clip">
                <path d="M15,20 L10,150 Q10,155 15,155 L105,155 Q110,155 110,150 L105,20 Z" />
              </clipPath>
            </defs>
            <path d="M15,20 L10,150 Q10,155 15,155 L105,155 Q110,155 110,150 L105,20 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <rect x="10" y={155 - (135 * pct / 100)} width="100" height={135 * pct / 100}
              fill="#2dd4bf" fillOpacity="0.6" clipPath="url(#cup-clip)" className="transition-all duration-500" />
            <text x="60" y="90" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">{pct}%</text>
            <text x="60" y="112" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">{total}ml</text>
          </svg>
        </div>
        <div className="text-2xl font-bold text-cyan">{total} <span className="text-sm text-white/40">/ {goal} ml</span></div>
        <div className="text-xs text-white/40 mt-1">今日已喝 {cups} 杯（250ml/杯）</div>
      </div>

      {/* Quick buttons */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {QUICK.map(ml => (
          <button key={ml} onClick={() => addWater(ml)}
            className="card text-center py-4 hover:border-cyan/50 hover:bg-cyan/10 transition-all active:scale-95">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-lg font-bold text-cyan">+{ml}</div>
            <div className="text-xs text-white/40">ml</div>
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="card mb-4">
        <div className="text-sm font-bold mb-2">自訂飲水量</div>
        <div className="flex gap-2">
          <input type="number" placeholder="輸入 ml" id="customWater" className="flex-1" />
          <button onClick={() => {
            const v = +document.getElementById('customWater').value
            if (v > 0) { addWater(v); document.getElementById('customWater').value = '' }
          }} className="bg-cyan text-bg px-4 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">新增</button>
        </div>
      </div>

      {/* Records today */}
      {records.length > 0 && (
        <div className="card mb-4">
          <div className="text-sm font-bold mb-2">今日記錄</div>
          <div className="space-y-1">
            {records.slice().reverse().map(r => (
              <div key={r.id} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                <span className="text-white/40">{r.time}</span>
                <span className="text-cyan">+{r.amount} ml</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week chart */}
      {weekData.length > 1 && (
        <div className="card mb-4">
          <div className="text-sm font-bold mb-3">近7日飲水量</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekData}>
              <XAxis dataKey="date" tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="amount" fill="#2dd4bf" radius={[4, 4, 0, 0]} name="飲水量(ml)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Notification settings */}
      <div className="card">
        <div className="text-sm font-bold mb-3">⏰ 喝水提醒</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-xs text-white/60 mb-1">開始時間</div>
            <input type="time" value={notifStart} onChange={e => setNotifStart(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">結束時間</div>
            <input type="time" value={notifEnd} onChange={e => setNotifEnd(e.target.value)} />
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-white/60 mb-1">每日目標 (ml)</div>
          <input type="number" value={goal} onChange={e => setGoal(+e.target.value)} />
        </div>
        <div className="flex gap-2">
          {!notifEnabled && (
            <button onClick={enableNotif} className="btn-ghost flex-1 text-sm">開啟推播通知</button>
          )}
          <button onClick={saveNotifSettings} className="btn-accent flex-1 text-sm">儲存設定</button>
        </div>
        {notifEnabled && <div className="text-xs text-success mt-2 text-center">✓ 推播通知已開啟，每2小時提醒一次</div>}
      </div>
    </div>
  )
}
