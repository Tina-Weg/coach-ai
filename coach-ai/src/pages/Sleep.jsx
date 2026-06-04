import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useUser } from '../context/UserContext.jsx'
import { getRecordsByDate, saveRecord, getAllRecords } from '../db/index.js'

export default function Sleep() {
  const { currentUser } = useUser()
  const [records, setRecords] = useState([])
  const [weekData, setWeekData] = useState([])
  const [form, setForm] = useState({ bedtime: '23:00', wakeTime: '07:00', quality: 4, note: '' })
  const [todayRec, setTodayRec] = useState(null)
  const [aiAdvice, setAiAdvice] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [avgSleep, setAvgSleep] = useState(0)

  useEffect(() => { loadData() }, [currentUser])

  async function loadData() {
    if (!currentUser) return
    const today = new Date().toISOString().split('T')[0]
    const todayRecs = await getRecordsByDate('sleep', currentUser.id, today)
    setTodayRec(todayRecs[0] || null)

    const all = await getAllRecords('sleep', currentUser.id)
    const sorted = all.sort((a, b) => a.date.localeCompare(b.date))
    const last7 = sorted.slice(-7)
    setWeekData(last7.map(r => ({ date: r.date.slice(5), hours: r.duration, quality: r.quality })))
    if (last7.length) setAvgSleep(+(last7.reduce((s, r) => s + r.duration, 0) / last7.length).toFixed(1))
    setRecords(sorted.slice(-10).reverse())
  }

  function calcDuration(bed, wake) {
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let mins = (wh * 60 + wm) - (bh * 60 + bm)
    if (mins < 0) mins += 1440
    return +(mins / 60).toFixed(1)
  }

  async function saveSleep() {
    const duration = calcDuration(form.bedtime, form.wakeTime)
    const rec = {
      id: Date.now().toString(), userId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      bedtime: form.bedtime, wakeTime: form.wakeTime,
      duration, quality: form.quality, note: form.note,
    }
    await saveRecord('sleep', rec)
    loadData()
  }

  async function getAIAdvice() {
    if (!currentUser?.apiKey) { setAiAdvice('請先設定 API Key'); return }
    setLoadingAI(true)
    try {
      const avgQ = weekData.length ? (weekData.reduce((s, r) => s + r.quality, 0) / weekData.length).toFixed(1) : form.quality
      const prompt = `我最近7天平均睡眠${avgSleep}小時，睡眠品質平均${avgQ}/5分。今晚睡眠：${form.bedtime}入睡，${form.wakeTime}起床，品質${form.quality}/5。請給50字恢復建議。`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': currentUser.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 150, messages: [{ role: 'user', content: prompt }] }),
      })
      const j = await res.json()
      setAiAdvice(j.content?.[0]?.text || '')
    } catch { setAiAdvice('分析失敗') }
    setLoadingAI(false)
  }

  const previewDuration = calcDuration(form.bedtime, form.wakeTime)

  return (
    <div className="pt-4 fade-in">
      <div className="bebas text-3xl text-purple mb-4">睡眠記錄</div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple">{avgSleep}</div>
          <div className="text-xs text-white/40">平均睡眠時數</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-accent">
            {weekData.length ? (weekData.reduce((s, r) => s + r.quality, 0) / weekData.length).toFixed(1) : '-'}
          </div>
          <div className="text-xs text-white/40">平均品質 / 5</div>
        </div>
      </div>

      {/* Input form */}
      <div className="card mb-4">
        <div className="text-sm font-bold mb-3">記錄今日睡眠</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-white/60 mb-1">就寢時間</div>
            <input type="time" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} />
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">起床時間</div>
            <input type="time" value={form.wakeTime} onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))} />
          </div>
        </div>
        <div className="text-center mb-3">
          <span className="text-2xl font-bold text-purple">{previewDuration}</span>
          <span className="text-white/40 text-sm"> 小時</span>
        </div>
        <div className="mb-3">
          <div className="text-xs text-white/60 mb-2">睡眠品質</div>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, quality: s }))}
                className={`text-2xl transition-all ${s <= form.quality ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                ⭐
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-white/60 mb-1">備註（選填）</div>
          <input placeholder="做夢 / 難入睡 / 中途醒來..." value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>
        <button onClick={saveSleep} className="btn-accent">儲存記錄</button>
      </div>

      {/* AI Advice */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-white/70">🌙 AI 睡眠建議</div>
          <button onClick={getAIAdvice} disabled={loadingAI}
            className="text-xs text-purple border border-purple/30 rounded-lg px-3 py-1 hover:bg-purple/10 transition-colors disabled:opacity-50">
            {loadingAI ? '分析中...' : '獲取建議'}
          </button>
        </div>
        <p className="text-sm text-white/70">{aiAdvice || '記錄睡眠後點擊獲取 AI 建議'}</p>
      </div>

      {/* Week chart */}
      {weekData.length > 1 && (
        <div className="card mb-4">
          <div className="text-sm font-bold mb-3">近7日睡眠趨勢</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekData}>
              <XAxis dataKey="date" tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} domain={[0, 10]} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="hours" fill="#a78bfa" radius={[4, 4, 0, 0]} name="睡眠時數" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="text-sm font-bold mb-3">歷史記錄</div>
        {records.map(r => (
          <div key={r.id} className="py-2 border-b border-white/5 last:border-0">
            <div className="flex justify-between items-center">
              <div className="text-xs text-white/40">{r.date}</div>
              <div className="flex items-center gap-2">
                <span className="text-purple font-bold">{r.duration}h</span>
                <span>{'⭐'.repeat(r.quality)}</span>
              </div>
            </div>
            {r.note && <div className="text-xs text-white/30 mt-1">{r.note}</div>}
          </div>
        ))}
        {!records.length && <div className="text-center text-white/30 text-sm py-4">尚無記錄</div>}
      </div>
    </div>
  )
}
