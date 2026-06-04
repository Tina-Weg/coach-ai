import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { useUser } from '../context/UserContext.jsx'
import { getRecordsByDate, getAllRecords } from '../db/index.js'

const today = () => new Date().toISOString().split('T')[0]

export default function Dashboard() {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const [data, setData] = useState({ kcal: 0, water: 0, sleep: 0, workout: 0 })
  const [bodyLatest, setBodyLatest] = useState(null)
  const [bodyPrev, setBodyPrev] = useState(null)
  const [aiMsg, setAiMsg] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => { loadData() }, [currentUser])

  async function loadData() {
    if (!currentUser) return
    const d = today()
    const [meals, water, sleepRec, workouts, bodyAll] = await Promise.all([
      getRecordsByDate('meals', currentUser.id, d),
      getRecordsByDate('water', currentUser.id, d),
      getRecordsByDate('sleep', currentUser.id, d),
      getRecordsByDate('completions', currentUser.id, d),
      getAllRecords('bodyData', currentUser.id),
    ])
    const kcal = meals.reduce((s, m) => s + (m.kcal || 0), 0)
    const waterTotal = water.reduce((s, w) => s + (w.amount || 0), 0)
    const sleepHours = sleepRec[0]?.duration || 0
    const doneWorkout = workouts.filter(w => w.status === 'done').length

    setData({ kcal, water: waterTotal, sleep: sleepHours, workout: doneWorkout })

    const sorted = bodyAll.sort((a, b) => b.date.localeCompare(a.date))
    setBodyLatest(sorted[0] || null)
    setBodyPrev(sorted[1] || null)
  }

  async function getAIAdvice() {
    if (!currentUser?.apiKey) { setAiMsg('請先在設定頁輸入 API Key 才能使用 AI 教練功能。'); return }
    setLoadingAI(true)
    try {
      const prompt = `我的今日數據：熱量${data.kcal}kcal（目標${currentUser.kcalTarget}）、水分${data.water}ml、睡眠${data.sleep}小時。根據這些數據給我今日50字的健身建議，教練風格：${currentUser.coachStyle}。`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': currentUser.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 150, messages: [{ role: 'user', content: prompt }] }),
      })
      const json = await res.json()
      setAiMsg(json.content?.[0]?.text || '無法取得建議')
    } catch { setAiMsg('AI 連線失敗，請檢查 API Key') }
    setLoadingAI(false)
  }

  const kcalPct = Math.min(100, Math.round((data.kcal / (currentUser?.kcalTarget || 2000)) * 100))
  const waterPct = Math.min(100, Math.round((data.water / 2000) * 100))
  const sleepPct = Math.min(100, Math.round((data.sleep / 8) * 100))
  const workoutPct = Math.min(100, Math.round((data.workout / 10) * 100))

  const rings = [
    { name: '熱量', value: kcalPct, fill: '#e8f74a' },
    { name: '水分', value: waterPct, fill: '#2dd4bf' },
    { name: '睡眠', value: sleepPct, fill: '#a78bfa' },
    { name: '訓練', value: workoutPct, fill: '#4ade80' },
  ]

  const diff = (key) => {
    if (!bodyLatest || !bodyPrev) return null
    const d = bodyLatest[key] - bodyPrev[key]
    return d > 0 ? `↑${d.toFixed(1)}` : d < 0 ? `↓${Math.abs(d).toFixed(1)}` : '='
  }

  return (
    <div className="pt-4 fade-in">
      <div className="text-white/40 text-xs mb-1">{new Date().toLocaleDateString('zh-TW', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      <div className="text-xl font-bold mb-4">早安，{currentUser?.name} {currentUser?.avatar}</div>

      {/* Rings */}
      <div className="card mb-4">
        <div className="text-sm font-bold mb-3 text-white/70">今日完成度</div>
        <div className="flex items-center gap-4">
          <div style={{ width: 120, height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="100%" data={rings} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'rgba(255,255,255,0.05)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            {rings.map(r => (
              <div key={r.name} className="text-center">
                <div className="text-lg font-bold" style={{ color: r.fill }}>{r.value}%</div>
                <div className="text-xs text-white/50">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <span className="text-accent font-bold">{data.kcal}</span>
            <span className="text-white/40 text-xs"> / {currentUser?.kcalTarget} kcal</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <span className="text-cyan font-bold">{data.water}</span>
            <span className="text-white/40 text-xs"> / 2000 ml</span>
          </div>
        </div>
      </div>

      {/* Body Stats */}
      {bodyLatest && (
        <div className="card mb-4">
          <div className="text-sm font-bold mb-3 text-white/70">最新體組成</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '體重', value: bodyLatest.weight, unit: 'kg', diffKey: 'weight' },
              { label: '體脂率', value: bodyLatest.fat, unit: '%', diffKey: 'fat' },
              { label: '肌肉量', value: bodyLatest.muscle, unit: 'kg', diffKey: 'muscle' },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-accent">{item.value}</div>
                <div className="text-xs text-white/40">{item.label} {item.unit}</div>
                {diff(item.diffKey) && (
                  <div className={`text-xs mt-1 ${diff(item.diffKey)?.startsWith('↓') && item.label !== '體重' ? 'text-success' : diff(item.diffKey)?.startsWith('↑') && item.label === '體脂率' ? 'text-error' : 'text-white/40'}`}>
                    {diff(item.diffKey)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Coach */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-white/70">⚡ AI 教練建議</div>
          <button onClick={getAIAdvice} disabled={loadingAI}
            className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1 hover:bg-accent/10 transition-colors disabled:opacity-50">
            {loadingAI ? '生成中...' : '獲取建議'}
          </button>
        </div>
        {aiMsg ? (
          <p className="text-sm text-white/80 leading-relaxed">{aiMsg}</p>
        ) : (
          <p className="text-sm text-white/30">點擊「獲取建議」讓 AI 教練分析你的數據</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="text-sm font-bold mb-3 text-white/70">快速記錄</div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => navigate('/nutrition')} className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center hover:bg-accent/20 transition-colors">
            <div className="text-2xl mb-1">🥗</div>
            <div className="text-xs text-accent">記錄餐點</div>
          </button>
          <button onClick={() => navigate('/water')} className="bg-cyan/10 border border-cyan/20 rounded-xl p-3 text-center hover:bg-cyan/20 transition-colors">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-xs text-cyan">記錄水分</div>
          </button>
          <button onClick={() => navigate('/gym')} className="bg-success/10 border border-success/20 rounded-xl p-3 text-center hover:bg-success/20 transition-colors">
            <div className="text-2xl mb-1">🏋️</div>
            <div className="text-xs text-success">開始訓練</div>
          </button>
        </div>
      </div>
    </div>
  )
}
