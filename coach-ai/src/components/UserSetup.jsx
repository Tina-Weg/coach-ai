import React, { useState } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { geminiText } from '../utils/gemini.js'

const AVATARS = ['💪', '🏋️', '🧘', '🏃', '⚡', '🔥', '🦁', '🐯', '🚀', '⭐']
const GOALS = ['增肌', '減脂', '維持體態', '提升體能', '健康生活']
const STYLES = ['嚴格教練', '溫和鼓勵', '科學分析', '幽默風趣']

export default function UserSetup() {
  const { createUser } = useUser()
  const [step, setStep] = useState(1)
  const [calculating, setCalculating] = useState(false)
  const [form, setForm] = useState({
    name: '', avatar: '💪', age: '', height: '', weight: '',
    goal: '增肌', kcalTarget: 2000, proteinTarget: 150,
    apiKey: '', coachStyle: '溫和鼓勵',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleCreate() {
    if (!form.name.trim()) return
    await createUser(form)
  }

  async function calcTargets() {
    if (!form.apiKey) { alert('請先輸入 Google AI API Key 才能自動計算'); return }
    if (!form.age || !form.height || !form.weight) { alert('請先填寫年齡、身高、體重'); return }
    setCalculating(true)
    try {
      const text = await geminiText(
        form.apiKey,
        `請根據以下資料計算每日建議熱量和蛋白質攝取量：
年齡：${form.age}歲，身高：${form.height}cm，體重：${form.weight}kg，目標：${form.goal}。
只輸出純JSON：{"kcal":每日建議熱量數字,"protein":每日建議蛋白質克數,"reason":"30字說明"}`
      )
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        setForm(f => ({
          ...f,
          kcalTarget: parsed.kcal || f.kcalTarget,
          proteinTarget: parsed.protein || f.proteinTarget,
        }))
        if (parsed.reason) alert('✓ ' + parsed.reason)
      }
    } catch (err) { alert('計算失敗：' + err.message) }
    setCalculating(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 fade-in">
      <div className="bebas text-6xl text-accent mb-1">COACH AI</div>
      <div className="text-white/40 text-sm mb-8">你的 AI 健身教練</div>

      <div className="card w-full max-w-sm">
        {step === 1 && (
          <div className="fade-in">
            <div className="text-lg font-bold mb-4">建立你的帳號</div>
            <div className="mb-4">
              <div className="text-sm text-white/60 mb-2">選擇頭像</div>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(a => (
                  <button key={a} onClick={() => set('avatar', a)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${form.avatar === a ? 'border-accent bg-accent/20' : 'border-white/10 bg-white/5'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-sm text-white/60 mb-1">姓名 *</div>
              <input placeholder="你的名字" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <div className="text-xs text-white/60 mb-1">年齡</div>
                <input type="number" placeholder="25" value={form.age} onChange={e => set('age', e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">身高(cm)</div>
                <input type="number" placeholder="170" value={form.height} onChange={e => set('height', e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">體重(kg)</div>
                <input type="number" placeholder="65" value={form.weight} onChange={e => set('weight', e.target.value)} />
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-white/60 mb-1">Google AI API Key（選填）</div>
              <input type="password" placeholder="AQ..." value={form.apiKey} onChange={e => set('apiKey', e.target.value)} />
              <div className="text-xs text-white/30 mt-1">用於 AI 自動計算目標和所有 AI 功能</div>
            </div>
            <button className="btn-accent" onClick={() => form.name.trim() && setStep(2)}>下一步</button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <div className="text-lg font-bold mb-4">設定目標</div>
            <div className="mb-4">
              <div className="text-sm text-white/60 mb-2">健身目標</div>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map(g => (
                  <button key={g} onClick={() => set('goal', g)}
                    className={`py-2 px-3 rounded-xl text-sm border transition-all ${form.goal === g ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-white/60">每日目標</div>
                <button onClick={calcTargets} disabled={calculating}
                  className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1 hover:bg-accent/10 transition-colors disabled:opacity-50">
                  {calculating ? '⏳ 計算中...' : '⚡ AI 幫我算'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-white/60 mb-1">每日熱量 (kcal)</div>
                  <input type="number" value={form.kcalTarget} onChange={e => set('kcalTarget', +e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">蛋白質 (g)</div>
                  <input type="number" value={form.proteinTarget} onChange={e => set('proteinTarget', +e.target.value)} />
                </div>
              </div>
              <div className="text-xs text-white/30 mt-1">點「AI 幫我算」根據你的身體數據自動計算</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-white/60 mb-2">教練風格</div>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button key={s} onClick={() => set('coachStyle', s)}
                    className={`py-2 px-3 rounded-xl text-sm border transition-all ${form.coachStyle === s ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 bg-white/5'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setStep(1)}>返回</button>
              <button className="btn-accent flex-1" onClick={handleCreate}>開始訓練</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
