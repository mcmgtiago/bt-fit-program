import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Minus } from 'lucide-react'

export default function RestTimer({ defaultSeconds = 120, onClose }) {
  const [seconds, setSeconds] = useState(defaultSeconds)
  const [remaining, setRemaining] = useState(defaultSeconds)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA...').play() } catch {}
            return 0
          }
          return r - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, remaining])

  const adjust = useCallback((delta) => {
    const newSecs = Math.max(5, seconds + delta)
    setSeconds(newSecs)
    setRemaining(r => Math.max(0, r + delta))
  }, [seconds])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    setRemaining(seconds)
    setRunning(true)
  }, [seconds])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const progress = 1 - remaining / seconds
  const circumference = 2 * Math.PI * 54

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-xs border border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Descanso</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* Circular Timer */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#27272a" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={remaining === 0 ? '#22c55e' : '#e53e3e'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white tabular-nums">
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
              {remaining === 0 && (
                <span className="text-green-400 text-xs font-semibold mt-1">Pronto!</span>
              )}
            </div>
          </div>
        </div>

        {/* Adjust Time */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <button onClick={() => adjust(-30)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700">
            <Minus size={16} />
          </button>
          <span className="text-zinc-400 text-sm w-16 text-center">{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2,'0')}</span>
          <button onClick={() => adjust(30)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700">
            <Plus size={16} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[60, 90, 120, 180].map(s => (
            <button
              key={s}
              onClick={() => { setSeconds(s); setRemaining(s); setRunning(true) }}
              className={`py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                seconds === s ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {s >= 60 ? `${s/60}min` : `${s}s`}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setRunning(r => !r)}
            className="flex-1 btn-secondary py-2.5 text-sm font-semibold"
          >
            {running ? 'Pausar' : 'Continuar'}
          </button>
          <button
            onClick={reset}
            className="flex-1 btn-primary py-2.5 text-sm font-semibold"
          >
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  )
}
