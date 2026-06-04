import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useUser } from '../context/UserContext.jsx'
import { saveRecord, getRecordsByDate, getAllRecords } from '../db/index.js'

const PPL = {
  '推A': [
    { id: 'bp', name: '槓鈴臥推', sets: 4, reps: '8-10', muscle: '胸', tip: '下放時感受胸肌拉伸，不要彈胸', icon: '🏋️' },
    { id: 'inc', name: '上斜啞鈴飛鳥', sets: 3, reps: '12', muscle: '上胸', tip: '手肘微彎，頂端擠壓胸肌', icon: '💪' },
    { id: 'ohp', name: '肩推(坐姿)', sets: 4, reps: '8-10', muscle: '肩', tip: '核心收緊，避免腰部過度後仰', icon: '🔼' },
    { id: 'lat', name: '側平舉', sets: 3, reps: '15', muscle: '側肩', tip: '小拇指略高於大拇指，控制動作', icon: '⬆️' },
    { id: 'tri', name: '繩索下壓', sets: 3, reps: '12', muscle: '三頭', tip: '手肘固定，完全伸直後停頓', icon: '💪' },
  ],
  '拉A': [
    { id: 'pu', name: '引體向上', sets: 4, reps: '6-10', muscle: '背', tip: '全程控制，下放時完全伸展', icon: '🔽' },
    { id: 'row', name: '槓鈴划船', sets: 4, reps: '8-10', muscle: '背', tip: '保持背部平直，拉至腹部', icon: '🏋️' },
    { id: 'face', name: 'Face Pull', sets: 3, reps: '15', muscle: '後肩', tip: '繩索拉至臉部兩側，外旋', icon: '🎯' },
    { id: 'cur', name: '槓鈴彎舉', sets: 3, reps: '10', muscle: '二頭', tip: '頂端完全收縮，不要借力', icon: '💪' },
    { id: 'ham', name: '錘式彎舉', sets: 3, reps: '12', muscle: '二頭', tip: '拇指朝上，控制下放', icon: '🔨' },
  ],
  '腿A': [
    { id: 'sq', name: '深蹲', sets: 4, reps: '8-10', muscle: '股四頭', tip: '膝蓋對齊腳尖，背部保持直立', icon: '🦵' },
    { id: 'leg', name: '腿推機', sets: 3, reps: '12', muscle: '腿部', tip: '腳掌位置決定目標肌群', icon: '🦿' },
    { id: 'rdl', name: '羅馬尼亞硬拉', sets: 4, reps: '10', muscle: '後鏈', tip: '髖部主導動作，感受腿後伸展', icon: '🏋️' },
    { id: 'cal', name: '坐姿提踵', sets: 4, reps: '15', muscle: '小腿', tip: '頂端停頓1秒，充分伸展', icon: '⬆️' },
  ],
  '推B': [
    { id: 'dbp', name: '啞鈴臥推', sets: 4, reps: '10-12', muscle: '胸', tip: '增加活動範圍，感受肌肉伸展', icon: '🏋️' },
    { id: 'dip', name: '雙槓撐體', sets: 3, reps: '8-12', muscle: '胸/三頭', tip: '前傾強調胸，直立強調三頭', icon: '⬇️' },
    { id: 'fp', name: '前平舉', sets: 3, reps: '12', muscle: '前肩', tip: '不要借力擺動，控制動作', icon: '⬆️' },
    { id: 'tri2', name: '頭後彎舉', sets: 3, reps: '12', muscle: '三頭長頭', tip: '手肘固定在耳旁，感受充分伸展', icon: '💪' },
  ],
}

const DAYS = Object.keys(PPL)

export default function GymWorkout() {
  const { currentUser } = useUser()
  const [activeDay, setActiveDay] = useState(DAYS[0])
  const [logs, setLogs] = useState({})
  const [done, setDone] = useState({})
  const [historyEx, setHistoryEx] = useState(null)
  const [historyData, setHistoryData] = useState([])

  const exercises = PPL[activeDay]

  useEffect(() => { loadToday() }, [activeDay, currentUser])

  async function loadToday() {
    if (!currentUser) return
    const today = new Date().toISOString().split('T')[0]
    const recs = await getRecordsByDate('workoutLogs', currentUser.id, today)
    const logsMap = {}
    const doneMap = {}
    recs.forEach(r => {
      if (!logsMap[r.exercise]) logsMap[r.exercise] = []
      logsMap[r.exercise].push(r)
      doneMap[r.exercise] = true
    })
    setLogs(logsMap)
    setDone(doneMap)
  }

  async function logSet(exId, weight, reps) {
    if (!weight || !reps) return
    const rec = {
      id: Date.now().toString(), userId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      exercise: exId, weight: +weight, reps: +reps, sets: 1,
    }
    await saveRecord('workoutLogs', rec)
    setDone(d => ({ ...d, [exId]: true }))
    loadToday()
  }

  async function loadHistory(exId) {
    setHistoryEx(exId)
    const all = await getAllRecords('workoutLogs', currentUser.id)
    const exData = all.filter(r => r.exercise === exId)
    const byDate = {}
    exData.forEach(r => {
      if (!byDate[r.date] || r.weight > byDate[r.date]) byDate[r.date] = r.weight
    })
    setHistoryData(Object.entries(byDate).sort().slice(-10).map(([date, weight]) => ({ date: date.slice(5), weight })))
  }

  return (
    <div className="pt-4 fade-in">
      <div className="bebas text-3xl text-accent mb-4">健身房訓練</div>

      {/* Day selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {DAYS.map(d => (
          <button key={d} onClick={() => setActiveDay(d)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap border transition-all ${activeDay === d ? 'border-accent bg-accent/20 text-accent font-bold' : 'border-white/10 text-white/50'}`}>
            {d}
          </button>
        ))}
      </div>

      {/* History chart */}
      {historyEx && historyData.length > 1 && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold">{historyEx} 最大重量趨勢</div>
            <button onClick={() => setHistoryEx(null)} className="text-white/30 hover:text-white">✕</button>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={historyData}>
              <XAxis dataKey="date" tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="weight" stroke="#e8f74a" strokeWidth={2} dot={{ fill: '#e8f74a' }} name="最大重量(kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Exercises */}
      {exercises.map(ex => (
        <ExerciseCard key={ex.id} ex={ex} done={done[ex.id]} logs={logs[ex.id] || []}
          onLog={logSet} onHistory={() => loadHistory(ex.id)} currentUser={currentUser} />
      ))}
    </div>
  )
}

function ExerciseCard({ ex, done, logs, onLog, onHistory, currentUser }) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [showSkip, setShowSkip] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [aiMsg, setAiMsg] = useState('')

  async function handleSkip(reason) {
    if (!currentUser?.apiKey) { setAiMsg('跳過了！記得下次補上。'); return }
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': currentUser.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 100, messages: [{ role: 'user', content: `跳過了${ex.name}（原因：${reason}），對${ex.muscle}訓練有什麼影響？請用30字說明。` }] }),
      })
      const j = await res.json()
      setAiMsg(j.content?.[0]?.text || '')
    } catch { setAiMsg('記得補上這個動作！') }
    setShowSkip(false)
  }

  return (
    <div className={`card mb-3 transition-all ${done ? 'border-success/30 bg-success/5' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ex.icon}</span>
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              {ex.name}
              {done && <span className="text-xs text-success">✓ 完成</span>}
            </div>
            <div className="text-xs text-white/40">{ex.muscle} · {ex.sets}組 × {ex.reps}次</div>
          </div>
        </div>
        <button onClick={onHistory} className="text-xs text-accent border border-accent/20 rounded-lg px-2 py-1 hover:bg-accent/10 transition-colors">
          趨勢
        </button>
      </div>
      <div className="text-xs text-white/40 mb-3 italic">💡 {ex.tip}</div>

      {/* Set dots */}
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: ex.sets }).map((_, i) => (
          <div key={i} className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs transition-all ${i < logs.length ? 'bg-success/30 border-success text-success' : 'border-white/20 text-white/30'}`}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Log input */}
      <div className="flex gap-2 items-center">
        <input type="number" placeholder="重量(kg)" value={weight} onChange={e => setWeight(e.target.value)} className="flex-1 text-sm py-2" />
        <input type="number" placeholder="次數" value={reps} onChange={e => setReps(e.target.value)} className="w-20 text-sm py-2" />
        <button onClick={() => onLog(ex.id, weight, reps)} className="bg-accent text-bg px-3 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">記錄</button>
        <button onClick={() => setShowSkip(!showSkip)} className="text-white/30 hover:text-warning transition-colors text-lg">⊘</button>
      </div>

      {/* Skip */}
      {showSkip && (
        <div className="mt-2 p-2 bg-white/5 rounded-xl fade-in">
          <div className="text-xs text-white/50 mb-2">跳過原因：</div>
          <div className="grid grid-cols-3 gap-1">
            {['受傷', '器材佔用', '時間不夠', '太累', '選擇替代', '其他'].map(r => (
              <button key={r} onClick={() => handleSkip(r)}
                className="text-xs border border-white/10 rounded-lg py-1.5 hover:border-warning/50 hover:text-warning transition-colors">
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {aiMsg && (
        <div className="mt-2 text-xs text-warning/80 bg-warning/5 rounded-lg p-2 fade-in">{aiMsg}</div>
      )}

      {logs.length > 0 && (
        <div className="mt-2 text-xs text-white/40">
          {logs.map((l, i) => <span key={i} className="mr-2">{l.weight}kg×{l.reps}</span>)}
        </div>
      )}
    </div>
  )
}
