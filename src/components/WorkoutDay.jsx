import { useParams, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { ArrowLeft, Play, CheckCircle2, Clock, Dumbbell, ChevronRight, FileText } from 'lucide-react'
import { getExercisesForDay, getDayLabel, isDeloadWeek, getDeloadWeight } from '../utils/workoutSchedule'
import { getUserKey } from '../hooks/useLocalStorage'

function parseSets(repsStr) {
  if (!repsStr) return 3
  const str = String(repsStr)
  if (str.includes('+')) return parseInt(str) || 3
  if (str.includes('/')) return str.split('/').length
  return 3
}

function parseReps(repsStr) {
  if (!repsStr) return '10'
  const str = String(repsStr)
  if (str.includes('pirâmide') || str.includes('cada perna') || str.includes('+')) return str
  return str
}

export default function WorkoutDay({ user }) {
  const { dayType, weekInBlock, block } = useParams()
  const navigate = useNavigate()
  const exercises = getExercisesForDay(user, dayType, weekInBlock, block)
  const dayLabel = getDayLabel(dayType)
  const workoutLogs = JSON.parse(localStorage.getItem(getUserKey(user, 'logs')) || '[]')
  const deload = isDeloadWeek(workoutLogs, user)

  const [sessionNote, setSessionNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [completedExercises, setCompletedExercises] = useState(new Set())
  const [finishing, setFinishing] = useState(false)

  const allDone = exercises.length > 0 && completedExercises.size === exercises.length

  const handleFinishWorkout = useCallback(() => {
    setFinishing(true)
    const today = new Date().toISOString().split('T')[0]
    const exerciseLogs = JSON.parse(localStorage.getItem(getUserKey(user, `exercise_logs_${dayType}`)) || '[]')
    const todayVolume = exerciseLogs
      .filter(l => l.date === today)
      .reduce((acc, l) => acc + (l.totalVolume || 0), 0)

    const log = {
      date: today,
      dayType,
      dayLabel,
      weekInBlock: parseInt(weekInBlock),
      block: parseInt(block),
      completed: true,
      totalVolume: todayVolume,
      note: sessionNote,
      completedAt: new Date().toISOString()
    }

    const updated = [...workoutLogs, log]
    localStorage.setItem(getUserKey(user, 'logs'), JSON.stringify(updated))
    navigate('/')
  }, [user, dayType, dayLabel, weekInBlock, block, sessionNote, workoutLogs, navigate])

  if (!exercises.length) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <Dumbbell size={48} className="text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">Nenhum exercício encontrado para este dia.</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">Voltar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-32">
      {/* Header */}
      <div className="bg-zinc-900 sticky top-0 z-10 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-zinc-400">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{dayLabel}</h1>
            <p className="text-zinc-400 text-xs">
              Bloco {block} · Semana {parseInt(block) === 1 ? weekInBlock : parseInt(weekInBlock) + 4}
              {deload && ' · DELOAD'}
            </p>
          </div>
        </div>
        {deload && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
            <Clock size={14} className="text-yellow-500" />
            <p className="text-yellow-400 text-xs font-medium">Semana de Deload — reduza os pesos em 40%</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-zinc-400 text-xs">{completedExercises.size}/{exercises.length} exercícios</span>
          {allDone && <span className="text-green-400 text-xs font-semibold">Tudo feito! 🎉</span>}
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-300"
            style={{ width: `${(completedExercises.size / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 pt-4 space-y-3">
        {exercises.map((ex, i) => {
          const done = completedExercises.has(ex.id)
          const displayReps = deload
            ? parseReps(ex.currentWeekData?.reps)
            : parseReps(ex.currentWeekData?.reps)

          return (
            <div
              key={ex.id}
              className={`card transition-all ${done ? 'border-green-600/40 bg-green-900/10' : ''}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => {
                    const next = new Set(completedExercises)
                    done ? next.delete(ex.id) : next.add(ex.id)
                    setCompletedExercises(next)
                  }}
                  className="mt-0.5 shrink-0"
                >
                  {done
                    ? <CheckCircle2 size={22} className="text-green-500" />
                    : <div className="w-[22px] h-[22px] rounded-full border-2 border-zinc-600" />
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-500 font-mono">#{i + 1}</span>
                    {ex.technique && ex.technique !== 'N/A' && (
                      <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded-md font-medium">
                        {ex.technique}
                      </span>
                    )}
                  </div>
                  <h3 className={`font-semibold text-sm mt-0.5 ${done ? 'text-zinc-400 line-through' : 'text-white'}`}>
                    {ex.namePt}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1">
                    {ex.warmupSets > 0 ? `${ex.warmupSets} aquec + ` : ''}{ex.workingSets} séries × {displayReps}
                    {ex.currentWeekData?.rpe && ` · RPE ${ex.currentWeekData.rpe}`}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    <Clock size={10} className="inline mr-1" />
                    {ex.currentWeekData?.rest || '2-3min'} descanso
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/exercise/${ex.id}`, {
                    state: { exercise: ex, user, dayType, weekInBlock: parseInt(weekInBlock), block: parseInt(block), isDeload: deload }
                  })}
                  className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white shrink-0"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Session Note */}
      {showNoteInput && (
        <div className="px-4 mt-4">
          <div className="card">
            <label className="text-zinc-400 text-sm font-medium block mb-2">Nota da sessão</label>
            <textarea
              value={sessionNote}
              onChange={e => setSessionNote(e.target.value)}
              placeholder="Como foi o treino? Peso, sensação, observações..."
              className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-3 py-2.5 text-sm resize-none h-24 outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>
        </div>
      )}

      {/* Finish Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-4 py-4 space-y-2 safe-bottom">
        <div className="flex gap-2">
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="btn-secondary p-3"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={handleFinishWorkout}
            disabled={finishing}
            className={`flex-1 btn-primary flex items-center justify-center gap-2 ${
              allDone ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            <Play size={16} />
            {finishing ? 'Salvando...' : allDone ? 'Treino Concluído!' : 'Marcar como Concluído'}
          </button>
        </div>
      </div>
    </div>
  )
}
