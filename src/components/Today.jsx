import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Zap, Calendar, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react'
import { getTodaysWorkout, getExercisesForDay, getWeekLabel, isDeloadWeek } from '../utils/workoutSchedule'
import { getUserKey } from '../hooks/useLocalStorage'

export default function Today({ user }) {
  const navigate = useNavigate()
  const [workoutLogs, setWorkoutLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(getUserKey(user, 'logs'))) || [] } catch { return [] }
  })

  const workout = getTodaysWorkout(workoutLogs, user)
  const isDeload = isDeloadWeek(workoutLogs, user)

  const exercises = workout.alreadyDone
    ? []
    : getExercisesForDay(user, workout.dayType, workout.weekInBlock, workout.block)

  const totalVolume = workoutLogs
    .filter(l => l.completed)
    .slice(-4)
    .reduce((acc, log) => acc + (log.totalVolume || 0), 0)

  const weekSessions = workoutLogs.filter(l => {
    if (!l.date) return false
    const logDate = new Date(l.date)
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1))
    startOfWeek.setHours(0, 0, 0, 0)
    return logDate >= startOfWeek && l.completed
  }).length

  return (
    <div className="min-h-screen bg-zinc-950 pb-4">
      {/* Header */}
      <div className="bg-zinc-900 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-zinc-400 text-sm">Olá, {user === 'tiago' ? 'Tiago' : 'Brenda'} 👋</span>
          <span className="text-zinc-500 text-xs">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Seu treino de hoje</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Deload Warning */}
        {isDeload && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-yellow-500 font-semibold text-sm">Semana de Deload!</p>
              <p className="text-zinc-400 text-xs mt-0.5">Reduza os pesos em 40%. Foco na recuperação e execução.</p>
            </div>
          </div>
        )}

        {/* Today's Workout Card */}
        {workout.alreadyDone ? (
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-white">Treino concluído!</p>
              <p className="text-zinc-400 text-sm">Ótimo trabalho hoje. Descanse e volte amanhã 💪</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/workouts/${workout.dayType}/${workout.weekInBlock}/${workout.block}`)}
            className="w-full bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-left shadow-lg shadow-red-600/20 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                {getWeekLabel(workout.weekInBlock, workout.block)}
              </span>
              <ChevronRight size={20} className="text-white/70" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{workout.dayLabel}</h2>
            <p className="text-red-200 text-sm">{exercises.length} exercícios</p>
            <div className="mt-4 flex gap-2 flex-wrap">
              {exercises.slice(0, 4).map(ex => (
                <span key={ex.id} className="bg-white/15 text-white text-xs px-2 py-1 rounded-lg">
                  {ex.namePt.split(' ').slice(0, 2).join(' ')}
                </span>
              ))}
              {exercises.length > 4 && (
                <span className="bg-white/15 text-white text-xs px-2 py-1 rounded-lg">
                  +{exercises.length - 4}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-500">{workoutLogs.filter(l => l.completed).length}</p>
            <p className="text-zinc-500 text-xs mt-1">Treinos</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-orange-400">{weekSessions}</p>
            <p className="text-zinc-500 text-xs mt-1">Esta semana</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {workout.alreadyDone ? '—' : `S${workout.programWeek || 1}`}
            </p>
            <p className="text-zinc-500 text-xs mt-1">No programa</p>
          </div>
        </div>

        {/* Exercise List Preview */}
        {!workout.alreadyDone && exercises.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Exercícios de hoje</h3>
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={ex.id} className="card flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{ex.namePt}</p>
                    <p className="text-zinc-500 text-xs">
                      {ex.workingSets}×{ex.currentWeekData?.reps} · RPE {ex.currentWeekData?.rpe}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {workoutLogs.filter(l => l.completed).length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Sessões recentes</h3>
            <div className="space-y-2">
              {workoutLogs.filter(l => l.completed).slice(-3).reverse().map((log, i) => (
                <div key={i} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                      <Zap size={14} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{log.dayLabel || log.dayType}</p>
                      <p className="text-zinc-500 text-xs">{log.date ? new Date(log.date).toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                  </div>
                  {log.totalVolume > 0 && (
                    <span className="text-zinc-400 text-xs">{(log.totalVolume / 1000).toFixed(1)}t</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
