import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts'
import { useUser } from '../context/UserContext.jsx'
import { saveRecord, getAllRecords } from '../db/index.js'
import { geminiImage, geminiText, parseJSON } from '../utils/gemini.js'

const FIELDS = [
  { key: 'weight', label: '體重', unit: 'kg' },
  { key: 'fat', label: '體脂率', unit: '%' },
  { key: 'muscle', label: '肌肉量', unit: 'kg' },
  { key: 'visceral', label: '內臟脂肪', unit: '' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'skeletal', label: '骨骼肌率', unit: '%' },
  { key: 'bmr', label: '基礎代謝率', unit: 'kcal' },
]
const RANGES = ['1週', '1月', '3月', '6月', '全部']

export default function BodyComp() {
  const { currentUser } = useUser()
  const [records, setRecords] = useState([])
  const [range, setRange] = useState('1月')
  const [showAdd, setShowAdd] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [form, setForm] = useState({ weight: '', fat: '', muscle: '', visceral: '', bmi: '', skeletal: '', bmr: '', note: '' })
  const [aiAnalysis, setAiAnalysis] = useState('')
  const fileRef = useRef()

  useEffect(() => { loadRecords() }, [currentUser])

  async function loadRecords() {
    if (!currentUser) return
    const all = await getAllRecords('bodyData', currentUser.id)
    setRecords(all.sort((a, b) => a.date.localeCompare(b.date)))
  }

  function getFilteredData() {
    const now = new Date()
    const days = range === '1週' ? 7 : range === '1月' ? 30 : range === '3月' ? 90 : range === '6月' ? 180 : 9999
    const cutoff = new Date(now - days * 86400000).toISOString().split('T')[0]
    return records.filter(r => r.date >= cutoff)
  }

  async function addRecord() {
    const rec = { ...form, id: Date.now().toString(), userId: currentUser.id, date: new Date().toISOString().split('T')[0] }
    Object.keys(rec).forEach(k => { if (rec[k] !== '' && !isNaN(rec[k]) && k !== 'note') rec[k] = +rec[k] })
    await saveRecord('bodyData', rec)
    setShowAdd(false)
    setForm({ weight: '', fat: '', muscle: '', visceral: '', bmi: '', skeletal: '', bmr: '', note: '' })
    await loadRecords()
  }

  async function analyzePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!currentUser?.apiKey) { alert('請先設定 Google AI API Key'); return }
    setAnalyzing(true)
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = e => res(e.target.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const text = await geminiImage(
        currentUser.apiKey, base64, file.type,
        '這是一張體脂計APP的截圖，請讀取所有數值，只輸出純JSON格式：{"weight":體重數字,"fat":體脂率數字,"muscle":肌肉量數字,"visceral":內臟脂肪數字,"bmi":BMI數字,"skeletal":骨骼肌率數字,"bmr":基礎代謝率數字}，如果找不到某個數值就填null'
      )
      const parsed = parseJSON(text)
      if (!parsed) { alert('無法辨識截圖，請確認是體脂計數據截圖'); setAnalyzing(false); return }
      setForm(f => ({
        ...f,
        ...Object.fromEntries(
          Object.entries(parsed)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
      }))
      setShowAdd(true)
    } catch (err) { alert('辨識失敗：' + err.message) }
    setAnalyzing(false)
  }

  async function getAIAnalysis() {
    if (!currentUser?.apiKey || records.length < 2) { setAiAnalysis('需要至少2筆數據才能分析趨勢'); return }
    const latest = records[records.length - 1]
    const first = records[0]
    try {
      const text = await geminiText(
        currentUser.apiKey,
        `我的體組成變化：體重${first.weight}→${latest.weight}kg，體脂${first.fat}→${latest.fat}%，肌肉${first.muscle}→${latest.muscle}kg。健身目標：${currentUser.goal}。請給100字的分析建議。`
      )
      setAiAnalysis(text)
    } catch { setAiAnalysis('分析失敗，請檢查 API Key') }
  }

  const filtered = getFilteredData()
  const latest = records[records.length - 1]
  const prev = records[records.length - 2]

  return (
    <div className="pt-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="bebas text-3xl text-accent">體組成</div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={analyzing}
            className="text-xs bg-purple/20 text-purple border border-purple/30 rounded-lg px-3 py-1.5 hover:bg-purple/30 transition-colors disabled:opacity-50">
            {analyzing ? '⏳ 辨識中...' : '📷 掃描截圖'}
          </button>
          <button onClick={() => setShowAdd(true)} className="text-xs bg-accent text-bg rounded-lg px-3 py-1.5 font-bold">+ 輸入</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={analyzePhoto} />
      </div>

      {latest && (
        <div className="card mb-4">
          <div className="text-xs text-white/40 mb-3">{latest.date} 最新量測</div>
          <div className="grid grid-cols-4 gap-2">
            {FIELDS.slice(0, 4).map(f => {
              const d = prev ? (latest[f.key] - prev[f.key]) : null
              return (
                <div key={f.key} className="bg-white/5 rounded-xl p-2 text-center">
                  <div className="text-lg font-bold text-accent">{latest[f.key] || '-'}</div>
                  <div className="text-xs text-white/40">{f.label}</div>
                  {d !== null && d !== 0 && (
                    <div className={`text-xs ${d > 0 ? 'text-warning' : 'text-success'}`}>
                      {d > 0 ? '↑' : '↓'}{Math.abs(d).toFixed(1)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {RANGES.map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-all ${range === r ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 text-white/50'}`}>
            {r}
          </button>
        ))}
      </div>

      {filtered.length > 1 && (
        <div className="card mb-4">
          <div className="text-sm font-bold mb-3">體重趨勢</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={filtered.map(r => ({ date: r.date.slice(5), weight: r.weight }))}>
              <XAxis dataKey="date" tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="weight" stroke="#e8f74a" strokeWidth={2} dot={false} name="體重(kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {filtered.length > 1 && (
        <div className="card mb-4">
          <div className="text-sm font-bold mb-3">體脂率 & 肌肉量</div>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={filtered.map(r => ({ date: r.date.slice(5), fat: r.fat, muscle: r.muscle }))}>
              <XAxis dataKey="date" tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="fat" fill="#f8714420" stroke="#f87171" strokeWidth={2} name="體脂率(%)" />
              <Line type="monotone" dataKey="muscle" stroke="#4ade80" strokeWidth={2} dot={false} name="肌肉量(kg)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-white/70">AI 趨勢分析</div>
          <button onClick={getAIAnalysis} className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1 hover:bg-accent/10 transition-colors">分析</button>
        </div>
        <p className="text-sm text-white/70">{aiAnalysis || '點擊分析按鈕獲取 AI 建議'}</p>
      </div>

      <div className="card">
        <div className="text-sm font-bold mb-3">歷史記錄</div>
        {records.slice().reverse().slice(0, 10).map(r => (
          <div key={r.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
            <div className="text-xs text-white/40">{r.date}</div>
            <div className="text-xs text-right">
              <span className="text-accent">{r.weight}kg</span>
              <span className="text-white/40"> · {r.fat}% · {r.muscle}kg</span>
            </div>
          </div>
        ))}
        {!records.length && <div className="text-center text-white/30 text-sm py-4">點「📷 掃描截圖」上傳體脂計截圖</div>}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-card rounded-t-3xl p-6 w-full max-w-[480px] max-h-[80vh] overflow-y-auto fade-in">
            <div className="text-lg font-bold mb-1">體組成數據</div>
            {Object.values(form).some(v => v && v !== '') && <div className="text-xs text-success mb-3">✓ AI 已讀取數值，請確認後儲存</div>}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <div className="text-xs text-white/60 mb-1">{f.label}{f.unit ? ` (${f.unit})` : ''}</div>
                  <input type="number" step="0.1" placeholder="輸入數值" value={form[f.key]}
                    onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="mb-3">
              <div className="text-xs text-white/60 mb-1">備註</div>
              <input placeholder="備註（選填）" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn-accent flex-1" onClick={addRecord}>儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
