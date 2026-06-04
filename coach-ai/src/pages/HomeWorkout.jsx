import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { saveRecord, getRecordsByDate } from '../db/index.js'

const SCHEDULE = {
  '週一': {
    name: '下肢力量 + HIIT Tabata',
    blocks: [
      { type: 'strength', name: '下肢力量', duration: 18, exercises: [
        { name: '壺鈴深蹲', reps: '4×12', tip: '腳尖朝外30°，深蹲至大腿平行地面' },
        { name: '壺鈴弓步', reps: '3×10/腳', tip: '前腳膝蓋不超過腳尖' },
        { name: '壺鈴單腿硬拉', reps: '3×10/腳', tip: '髖鉸鏈動作，保持背部直立' },
        { name: '彈力繩側走', reps: '3×15步', tip: '維持略蹲姿態，感受臀中肌' },
      ]},
      { type: 'hiit', name: 'HIIT Tabata', duration: 12, rounds: 8, work: 20, rest: 10, exercises: [
        { name: '波比跳', tip: '全力衝刺20秒' },
        { name: '登山者式', tip: '核心收緊，快速交替' },
        { name: '跳躍深蹲', tip: '落地時膝蓋微彎緩衝' },
        { name: '高抬腿', tip: '膝蓋抬至髖部高度' },
      ]},
    ],
  },
  '週二': {
    name: '上肢推 + 超慢跑',
    blocks: [
      { type: 'strength', name: '上肢推力', duration: 15, exercises: [
        { name: '伏地挺身', reps: '4×最多', tip: '身體保持一直線，肘部外展45°' },
        { name: '窄距伏地挺身', reps: '3×12', tip: '手肘貼緊身體，強調三頭' },
        { name: '壺鈴肩推', reps: '3×12', tip: '核心收緊，不要腰部後仰' },
        { name: '彈力繩前平舉', reps: '3×15', tip: '控制下放，感受前肩' },
      ]},
      { type: 'jog', name: '超慢跑', duration: 15, segments: [
        { label: '熱身', min: 2, hr: '60-65%' },
        { label: '超慢跑', min: 10, hr: '65-75%' },
        { label: '緩和', min: 3, hr: '55-60%' },
      ]},
    ],
  },
  '週三': {
    name: '全身循環 + 金字塔HIIT',
    blocks: [
      { type: 'strength', name: '全身循環', duration: 15, exercises: [
        { name: '壺鈴擺盪', reps: '4×15', tip: '髖部爆發力驅動，不是手臂' },
        { name: '彈力繩划船', reps: '4×12', tip: '肩胛後縮，感受背部收縮' },
        { name: '滾筒核心', reps: '3×10', tip: '腹部全程收緊' },
        { name: '瑜珈墊平板支撐', reps: '3×45秒', tip: '臀部不上翹也不下沉' },
      ]},
      { type: 'pyramid', name: '金字塔HIIT', duration: 15, levels: [1,2,3,4,5,4,3,2,1] },
    ],
  },
  '週四': {
    name: '拉力核心 + 恢復超慢跑',
    blocks: [
      { type: 'strength', name: '拉力核心', duration: 15, exercises: [
        { name: '彈力繩反向飛鳥', reps: '3×15', tip: '感受後肩和菱形肌收縮' },
        { name: '毛巾引體輔助', reps: '3×8', tip: '用毛巾繞門把輔助引體向上' },
        { name: '花生球背部放鬆', reps: '3分鐘', tip: '緩慢移動，在緊張點停留' },
        { name: '死蟲式', reps: '3×10', tip: '下背保持貼地，緩慢交替' },
      ]},
      { type: 'jog', name: '恢復超慢跑', duration: 15, segments: [
        { label: '輕鬆慢跑', min: 5, hr: '55-60%' },
        { label: '恢復步伐', min: 7, hr: '60-65%' },
        { label: '放鬆', min: 3, hr: '50-55%' },
      ]},
    ],
  },
  '週五': {
    name: '肩核心 + EMOM HIIT',
    blocks: [
      { type: 'strength', name: '肩核心', duration: 15, exercises: [
        { name: '壺鈴側平舉', reps: '4×12', tip: '小拇指略高，控制動作速度' },
        { name: '彈力繩Y字', reps: '3×15', tip: '雙手成Y字，感受中下斜方肌' },
        { name: '捲腹', reps: '4×20', tip: '頸部放鬆，用腹部力量' },
        { name: '俄羅斯轉體', reps: '3×20', tip: '腳可抬起增加難度' },
      ]},
      { type: 'emom', name: 'EMOM HIIT', duration: 15, rounds: 15, exercises: [
        { name: '10次波比跳' },
        { name: '15次壺鈴擺盪' },
        { name: '20次高抬腿' },
      ]},
    ],
  },
}

const DAYS = Object.keys(SCHEDULE)

export default function HomeWorkout() {
  const { currentUser } = useUser()
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1] || DAYS[0])
  const [activeBlock, setActiveBlock] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [hiitState, setHiitState] = useState({ active: false, phase: 'work', round: 0, timeLeft: 20 })
  const [jogState, setJogState] = useState({ active: false, segIdx: 0, timeLeft: 0 })
  const [done, setDone] = useState({})
  const timerRef = useRef()
  const hiitRef = useRef()

  const schedule = SCHEDULE[activeDay]
  const block = schedule.blocks[activeBlock]

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  function startHIIT() {
    setHiitState({ active: true, phase: 'work', round: 1, timeLeft: block.work || 20 })
    setTimerRunning(true)
    runHIIT(block)
  }

  function runHIIT(b) {
    let phase = 'work', round = 1, timeLeft = b.work || 20
    const total = (b.rounds || 8)
    hiitRef.current = setInterval(() => {
      timeLeft--
      if (timeLeft <= 0) {
        if (phase === 'work') { phase = 'rest'; timeLeft = b.rest || 10 }
        else { round++; phase = 'work'; timeLeft = b.work || 20 }
        if (round > total) { clearInterval(hiitRef.current); setHiitState(s => ({ ...s, active: false })); return }
      }
      setHiitState({ active: true, phase, round, timeLeft })
    }, 1000)
  }

  function stopHIIT() {
    clearInterval(hiitRef.current)
    setHiitState({ active: false, phase: 'work', round: 0, timeLeft: 20 })
  }

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="pt-4 fade-in">
      {/* Global timer */}
      <div className="flex items-center justify-between mb-4">
        <div className="bebas text-3xl text-accent">居家訓練</div>
        <div className="flex items-center gap-2">
          <div className="card px-3 py-1.5 text-accent font-mono text-lg">{formatTime(elapsed)}</div>
          <button onClick={() => setTimerRunning(!timerRunning)}
            className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${timerRunning ? 'border-error text-error' : 'border-success text-success'}`}>
            {timerRunning ? '⏸' : '▶️'}
          </button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {DAYS.map(d => (
          <button key={d} onClick={() => { setActiveDay(d); setActiveBlock(0) }}
            className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border transition-all ${activeDay === d ? 'border-accent bg-accent/20 text-accent font-bold' : 'border-white/10 text-white/50'}`}>
            {d}
          </button>
        ))}
      </div>

      <div className="card mb-4">
        <div className="text-sm font-bold text-accent">{activeDay}：{schedule.name}</div>
        <div className="text-xs text-white/40 mt-1">總時間 40 分鐘</div>
      </div>

      {/* Block selector */}
      <div className="flex gap-2 mb-4">
        {schedule.blocks.map((b, i) => (
          <button key={i} onClick={() => setActiveBlock(i)}
            className={`flex-1 py-2 rounded-xl text-xs border transition-all ${activeBlock === i ? 'border-accent bg-accent/20 text-accent' : 'border-white/10 text-white/50'}`}>
            {b.name} <span className="text-white/40">({b.duration}min)</span>
          </button>
        ))}
      </div>

      {/* Strength block */}
      {block.type === 'strength' && (
        <div>
          {block.exercises.map((ex, i) => (
            <div key={i} className={`card mb-2 transition-all ${done[`${activeDay}-${i}`] ? 'border-success/30 bg-success/5' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{ex.name}</div>
                  <div className="text-xs text-white/40">{ex.reps}</div>
                  <div className="text-xs text-white/30 italic mt-1">💡 {ex.tip}</div>
                </div>
                <button onClick={() => setDone(d => ({ ...d, [`${activeDay}-${i}`]: !d[`${activeDay}-${i}`] }))}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${done[`${activeDay}-${i}`] ? 'bg-success border-success text-bg' : 'border-white/20 text-white/30'}`}>
                  ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HIIT Tabata */}
      {block.type === 'hiit' && (
        <div className="card text-center">
          <div className="text-sm font-bold mb-4">{block.name}</div>
          {hiitState.active ? (
            <div>
              <div className={`text-6xl font-mono font-bold mb-2 ${hiitState.phase === 'work' ? 'text-accent' : 'text-cyan'}`}>
                {hiitState.timeLeft}
              </div>
              <div className={`text-lg mb-2 ${hiitState.phase === 'work' ? 'text-accent' : 'text-cyan'}`}>
                {hiitState.phase === 'work' ? '🔥 衝刺' : '💨 休息'}
              </div>
              <div className="text-sm text-white/40 mb-4">
                第 {hiitState.round} / {block.rounds} 輪 · {block.exercises[(hiitState.round - 1) % block.exercises.length].name}
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all ${hiitState.phase === 'work' ? 'bg-accent' : 'bg-cyan'}`}
                  style={{ width: `${(hiitState.timeLeft / (hiitState.phase === 'work' ? block.work : block.rest)) * 100}%` }} />
              </div>
              <button onClick={stopHIIT} className="btn-ghost">停止</button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                {block.exercises.map((e, i) => <div key={i} className="bg-white/5 rounded-xl p-2">{e.name}</div>)}
              </div>
              <div className="text-sm text-white/40 mb-4">{block.rounds}輪 · {block.work}秒衝刺 / {block.rest}秒休息</div>
              <button onClick={startHIIT} className="btn-accent">開始 Tabata</button>
            </div>
          )}
        </div>
      )}

      {/* Slow jog */}
      {block.type === 'jog' && (
        <div className="card">
          <div className="text-sm font-bold mb-3">{block.name}</div>
          {block.segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/40">{i + 1}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{seg.label}</div>
                <div className="text-xs text-white/40">{seg.min} 分鐘 · 心率 {seg.hr} 最大心率</div>
              </div>
              <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyan rounded-full" style={{ width: `${(seg.min / block.segments.reduce((s, g) => s + g.min, 0)) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="mt-3 p-2 bg-cyan/10 rounded-xl text-xs text-cyan">
            💡 超慢跑：每分鐘 170 步，配速約 8-10 分鐘/公里，用鼻子呼吸
          </div>
        </div>
      )}

      {/* Pyramid */}
      {block.type === 'pyramid' && (
        <div className="card">
          <div className="text-sm font-bold mb-3">金字塔 HIIT</div>
          <div className="flex items-end justify-center gap-1 mb-4 h-20">
            {block.levels.map((l, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-accent/60 transition-all" style={{ height: `${l * 20}%` }} />
            ))}
          </div>
          <div className="text-xs text-white/40 text-center">每格代表運動時長（分鐘），依序遞增遞減</div>
        </div>
      )}

      {/* EMOM */}
      {block.type === 'emom' && (
        <div className="card">
          <div className="text-sm font-bold mb-3">EMOM（每分鐘開始）</div>
          <div className="text-xs text-white/40 mb-3">{block.rounds} 分鐘，循環以下動作</div>
          {block.exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">{i + 1}</div>
              <div className="text-sm">{ex.name}</div>
            </div>
          ))}
          <div className="mt-3 p-2 bg-warning/10 rounded-xl text-xs text-warning">
            ⏱ 在每分鐘的第1秒開始，剩餘時間休息
          </div>
        </div>
      )}
    </div>
  )
}
