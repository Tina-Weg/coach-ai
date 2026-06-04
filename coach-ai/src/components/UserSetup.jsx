import React, { useState } from 'react'
import { useUser } from '../context/UserContext.jsx'

const AVATARS = ['💪', '🏋️', '🧘', '🏃', '⚡', '🔥', '🦁', '🐯', '🚀', '⭐']
const GOALS = ['增肌', '減脂', '維持體態', '提升體能', '健康生活']
const STYLES = ['嚴格教練', '溫和鼓勵', '科學分析', '幽默風趣']

export default function UserSetup() {
  const { createUser } = useUser()
  const [step, setStep] = useState(1)
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
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <div className="text-xs text-white/60 mb-1">每日熱量目標</div>
                <input type="number" value={form.kcalTarget} onChange={e => set('kcalTarget', +e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">蛋白質目標(g)</div>
                <input type="number" value={form.proteinTarget} onChange={e => set('proteinTarget', +e.target.value)} />
              </div>
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
            <div className="mb-4">
              <div className="text-sm text-white/60 mb-1">Anthropic API Key（選填）</div>
              <input type="password" placeholder="sk-ant-..." value={form.apiKey} onChange={e => set('apiKey', e.target.value)} />
              <div className="text-xs text-white/30 mt-1">用於 AI 食物辨識和教練建議功能</div>
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
