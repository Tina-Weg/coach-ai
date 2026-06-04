import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useUser } from '../context/UserContext.jsx'
import { getRecordsByDate, saveRecord, deleteRecord, getAllRecords } from '../db/index.js'

const today = () => new Date().toISOString().split('T')[0]
const MEAL_TYPES = ['早餐', '午餐', '點心', '晚餐', '宵夜']

export default function Nutrition() {
  const { currentUser } = useUser()
  const [meals, setMeals] = useState([])
  const [tab, setTab] = useState('today')
  const [showAdd, setShowAdd] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carb: '', fat: '', type: '午餐' })
  const [weekData, setWeekData] = useState([])
  const [monthData, setMonthData] = useState([])
  const fileRef = useRef()

  useEffect(() => { loadMeals() }, [currentUser, tab])

  async function loadMeals() {
    if (!currentUser) return
    if (tab === 'today') {
      const m = await getRecordsByDate('meals', currentUser.id, today())
      setMeals(m)
    } else {
      const all = await getAllRecords('meals', currentUser.id)
      buildChartData(all)
    }
  }

  function buildChartData(all) {
    const byDate = {}
    all.forEach(m => {
      if (!byDate[m.date]) byDate[m.date] = { kcal: 0, protein: 0 }
      byDate[m.date].kcal += m.kcal || 0
      byDate[m.date].protein += m.protein || 0
    })
    const dates = Object.keys(byDate).sort().slice(-7)
    setWeekData(dates.map(d => ({ date: d.slice(5), kcal: byDate[d].kcal, target: currentUser.kcalTarget })))
    const byMonth = {}
    Object.keys(byDate).forEach(d => {
      const m = d.slice(0, 7)
      if (!byMonth[m]) byMonth[m] = { reached: 0, total: 0 }
      byMonth[m].total++
      if (byDate[d].kcal >= currentUser.kcalTarget * 0.9) byMonth[m].reached++
    })
    setMonthData(Object.keys(byMonth).slice(-3).map(m => ({ month: m.slice(5), reached: byMonth[m].reached, total: byMonth[m].total })))
  }

  async function addMeal(mealData) {
    const record = { ...mealData, id: Date.now().toString(), userId: currentUser.id, date: today(), time: new Date().toTimeString().slice(0, 5) }
    await saveRecord('meals', record)
    loadMeals()
    setShowAdd(false)
    setForm({ name: '', kcal: '', protein: '', carb: '', fat: '', type: '午餐' })
  }

  async function removeMeal(id) {
    await deleteRecord('meals', id)
    loadMeals()
  }

  async function analyzePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!currentUser?.apiKey) { alert('請先在設定頁面輸入 Anthropic API Key'); return }
    setAnalyzing(true)
    try {
      const base64 = await toBase64(file)
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentUser.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: '你是專業營養師。用戶上傳食物照片，你必須估算營養成分。只輸出純JSON，不要任何說明文字。',
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
            { type: 'text', text: '請辨識這張圖片中的食物，估算一份的營養成分，用JSON格式回覆：{"name":"食物名稱(中文)","kcal":熱量數字,"protein":蛋白質克數,"carb":碳水化合物克數,"fat":脂肪克數}' }
          ]}],
        }),
      })
      const json = await res.json()
      if (json.error) { alert('API 錯誤：' + json.error.message); setAnalyzing(false); return }
      const text = json.content?.[0]?.text || ''
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) { alert('AI 無法辨識此圖片，請重試'); setAnalyzing(false); return }
      const parsed = JSON.parse(match[0])
      setForm(f => ({
        ...f,
        name: parsed.name || f.name,
        kcal: parsed.kcal ? String(Math.round(parsed.kcal)) : f.kcal,
        protein: parsed.protein ? String(Math.round(parsed.protein)) : f.protein,
        carb: parsed.carb ? String(Math.round(parsed.carb)) : f.carb,
        fat: parsed.fat ? String(Math.round(parsed.fat)) : f.fat,
      }))
      setShowAdd(true)
    } catch (err) { alert('辨識失敗：' + err.message) }
    setAnalyzing(false)
  }

  function toBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = e => res(e.target.result.split(',')[1])
      r.onerror = rej
      r.readAsDataURL(file)
    })
  }

  const totals = meals.reduce((s, m) => ({
    kcal: s.kcal + (m.kcal || 0), protein: s.protein + (m.protein || 0),
    carb: s.carb + (m.carb || 0), fat: s.fat + (m.fat || 0),
  }), { kcal: 0, protein: 0, carb: 0, fat: 0 })

  const macroData = [
    { name: '蛋白質', value: totals.protein, color: '#4ade80' },
    { name: '碳水', value: totals.carb, color: '#e8f74a' },
    { name: '脂肪', value: totals.fat, color: '#fb923c' },
  ]

  return (
    <div className="pt-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="bebas text-3xl text-accent">營養記錄</div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={analyzing}
            className="text-xs bg-purple/20 text-purple border border-purple/30 rounded-lg px-3 py-1.5 hover:bg-purple/30 transition-colors disabled:opacity-50">
            {analyzing ? '⏳ 辨識中...' : '📷 拍照'}
          </button>
          <button onClick={() => setShowAdd(true)} className="text-xs bg-accent text-bg rounded-lg px-3 py-1.5 font-bold">+ 新增</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={analyzePhoto} />
      </div>

      <div className="flex bg-card rounded-xl p-1 mb-4">
        {['today', 'week', 'month'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-accent text-bg' : 'text-white/50'}`}>
            {t === 'today' ? '今日' : t === 'week' ? '週報' : '月報'}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <>
          <div className="card mb-4">
            <div className="flex items-center gap-4">
              <div style={{ width: 80, height: 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={macroData} dataKey="value" cx="50%" cy="50%" innerRadius={20} outerRadius={38} paddingAngle={2}>
                    {macroData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-accent">{totals.kcal} <span className="text-sm text-white/40">/ {currentUser?.kcalTarget} kcal</span></div>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {macroData.map(m => (
                    <div key={m.name} className="text-center">
                      <div className="text-sm font-bold" style={{ color: m.color }}>{m.name === '蛋白質' ? totals.protein : m.name === '碳水' ? totals.carb : totals.fat}g</div>
                      <div className="text-xs text-white/40">{m.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {[
              { label: '熱量', val: totals.kcal, max: currentUser?.kcalTarget || 2000, color: '#e8f74a' },
              { label: '蛋白質', val: totals.protein, max: currentUser?.proteinTarget || 150, color: '#4ade80' },
            ].map(b => (
              <div key={b.label} className="mt-2">
                <div className="flex justify-between text-xs text-white/50 mb-1"><span>{b.label}</span><span>{b.val}/{b.max}</span></div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, b.val / b.max * 100)}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>

          {MEAL_TYPES.map(type => {
            const typeMeals = meals.filter(m => m.type === type)
            if (!typeMeals.length) return null
            return (
              <div key={type} className="mb-3">
                <div className="text-xs text-white/40 mb-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/5" />{type}<div className="h-px flex-1 bg-white/5" />
                </div>
                {typeMeals.map(m => (
                  <div key={m.id} className="card mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-white/40">{m.kcal}kcal · P{m.protein}g · C{m.carb}g · F{m.fat}g</div>
                    </div>
                    <button onClick={() => removeMeal(m.id)} className="text-white/20 hover:text-error transition-colors ml-2">✕</button>
                  </div>
                ))}
              </div>
            )
          })}
          {!meals.length && <div className="text-center text-white/30 text-sm py-8">還沒有記錄，點擊「拍照」讓 AI 辨識食物，或點「新增」手動輸入</div>}
        </>
      )}

      {tab === 'week' && (
        <div className="card">
          <div className="text-sm font-bold mb-3">近7日熱量趨勢</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weekData}>
              <XAxis dataKey="date" tick={{ fill: '#ffffff60', fontSize: 11 }} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="kcal" stroke="#e8f74a" strokeWidth={2} dot={{ fill: '#e8f74a' }} name="熱量" />
              <Line type="monotone" dataKey="target" stroke="#ffffff20" strokeWidth={1} strokeDasharray="4 4" dot={false} name="目標" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'month' && (
        <div className="card">
          <div className="text-sm font-bold mb-3">每月達標天數</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthData}>
              <XAxis dataKey="month" tick={{ fill: '#ffffff60', fontSize: 11 }} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="reached" fill="#e8f74a" radius={[4, 4, 0, 0]} name="達標天數" />
              <Bar dataKey="total" fill="#ffffff10" radius={[4, 4, 0, 0]} name="總天數" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-card rounded-t-3xl p-6 w-full max-w-[480px] fade-in">
            <div className="text-lg font-bold mb-1">新增飲食記錄</div>
            {form.name ? <div className="text-xs text-success mb-3">✓ AI 已辨識：{form.name}，請確認數值後按新增</div> : <div className="text-xs text-white/40 mb-3">請填寫食物資訊</div>}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-all ${form.type === t ? 'border-accent bg-accent/20 text-accent' : 'border-white/10'}`}>
                  {t}
                </button>
              ))}
            </div>
            <input className="mb-2" placeholder="食物名稱" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input type="number" placeholder="熱量 (kcal)" value={form.kcal} onChange={e => setForm(f => ({ ...f, kcal: e.target.value }))} />
              <input type="number" placeholder="蛋白質 (g)" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
              <input type="number" placeholder="碳水 (g)" value={form.carb} onChange={e => setForm(f => ({ ...f, carb: e.target.value }))} />
              <input type="number" placeholder="脂肪 (g)" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn-accent flex-1" onClick={() => form.name && addMeal(form)}>新增</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
