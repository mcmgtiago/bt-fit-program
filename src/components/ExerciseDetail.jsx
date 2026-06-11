import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { ArrowLeft, Play, Check, Timer, ChevronDown, ChevronUp, Info, Youtube } from 'lucide-react'
import RestTimer from './RestTimer'
import { getProgressionSuggestion, getDeloadWeight } from '../utils/workoutSchedule'
import { getUserKey } from '../hooks/useLocalStorage'

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/)
  return match ? match[1] : null
}

function isLocalVideo(url) {
  return url && !url.startsWith('http') && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov'))
}

function parseTargetReps(repsStr) {
  if (!repsStr) return 10
  const str = String(repsStr)
  const num = parseInt(str.split('-')[0])
  return isNaN(num) ? 10 : num
}

export default function ExerciseDetail({ user }) {
  const { exerciseId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const exercise = state?.exercise
  const dayType = state?.dayType
  const isDeload = state?.isDeload || false

  const [showTimer, setShowTimer] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [currentRestSeconds, setCurrentRestSeconds] = useState(120)

  const exLogs = JSON.parse(localStorage.getItem(getUserKey(user, `exlog_${exerciseId}`)) || '[]')
  const lastWeight = exLogs.length > 0 ? exLogs[exLogs.length - 1].weight : null
  const progression = getProgressionSuggestion(exLogs, lastWeight)
  const suggestedWeight = isDeload && lastWeight ? getDeloadWeight(parseFloat(lastWeight)) : null

  const totalSets = exercise?.workingSets || 3
  const targetReps = parseTargetReps(exercise?.currentWeekData?.reps)

  const [sets, setSets] = useState(
    Array.from({ length: totalSets }, (_, i) => ({
      id: i,
      weight: suggestedWeight || lastWeight || '',
      completedReps: '',
      done: false
    }))
  )
  const [note, setNote] = useState('')

  const parseRestSeconds = useCallback((restStr) => {
    if (!restStr) return 120
    const match = restStr.match(/(\d+(?:\.\d+)?)\s*-?\s*(\d+)?\s*min/)
    if (match) return Math.round((parseFloat(match[1]) + (match[2] ? parseFloat(match[2]) : parseFloat(match[1]))) / 2 * 60)
    const secMatch = restStr.match(/(\d+)\s*s/)
    if (secMatch) return parseInt(secMatch[1])
    return 120
  }, [])

  const handleSetDone = useCallback((idx) => {
    setSets(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], done: !updated[idx].done }
      return updated
    })
    const rest = parseRestSeconds(exercise?.currentWeekData?.rest)
    setCurrentRestSeconds(rest)
    setShowTimer(true)
  }, [exercise, parseRestSeconds])

  const handleSave = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const doneSets = sets.filter(s => s.done)
    const totalVolume = doneSets.reduce((acc, s) => {
      const w = parseFloat(s.weight) || 0
      const r = parseInt(s.completedReps) || targetReps
      return acc + w * r
    }, 0)

    const logEntry = {
      date: today,
      exerciseId,
      sets: doneSets.map(s => ({
        weight: parseFloat(s.weight) || 0,
        completedReps: parseInt(s.completedReps) || targetReps,
        targetReps
      })),
      totalVolume,
      note,
      weight: parseFloat(sets[0]?.weight) || 0
    }

    const updated = [...exLogs, logEntry]
    localStorage.setItem(getUserKey(user, `exlog_${exerciseId}`), JSON.stringify(updated))
    navigate(-1)
  }, [sets, exLogs, user, exerciseId, targetReps, note, navigate])

  if (!exercise) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-zinc-400 mb-4">Exercício não encontrado.</p>
          <button onClick={() => navigate(-1)} className="btn-primary">Voltar</button>
        </div>
      </div>
    )
  }

  const videoId = getYouTubeId(exercise.videoDemo)

  return (
    <div className="min-h-screen bg-zinc-950 pb-32">
      {showTimer && (
        <RestTimer
          defaultSeconds={currentRestSeconds}
          onClose={() => setShowTimer(false)}
        />
      )}

      {/* Header */}
      <div className="bg-zinc-900 sticky top-0 z-10 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-zinc-400">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{exercise.namePt}</h1>
            <p className="text-zinc-500 text-xs truncate">{exercise.nameEn}</p>
          </div>
          <button onClick={() => setShowTimer(true)} className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-300">
            <Timer size={16} />
          </button>
        </div>
        {exercise.technique && exercise.technique !== 'N/A' && (
          <span className="mt-2 inline-block text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-md font-medium">
            {exercise.technique}
          </span>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Info row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-red-500">{exercise.workingSets}</p>
            <p className="text-zinc-500 text-xs">Séries</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-orange-400 leading-tight">{exercise.currentWeekData?.reps || '—'}</p>
            <p className="text-zinc-500 text-xs">Reps</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-yellow-400">{exercise.currentWeekData?.rpe || '—'}</p>
            <p className="text-zinc-500 text-xs">RPE</p>
          </div>
        </div>

        {/* Progression Suggestion */}
        {(progression || isDeload) && (
          <div className={`rounded-2xl px-4 py-3 border ${
            isDeload ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'
          }`}>
            <p className={`text-sm font-semibold ${isDeload ? 'text-yellow-400' : 'text-green-400'}`}>
              {isDeload ? `⚡ Deload: ${suggestedWeight}kg sugerido` : `📈 ${progression}`}
            </p>
          </div>
        )}

        {/* Sets Tracker */}
        <div>
          <h3 className="text-white font-semibold mb-3">Registro das Séries</h3>
          <div className="space-y-2">
            {sets.map((set, i) => (
              <div
                key={set.id}
                className={`card flex items-center gap-3 transition-all ${set.done ? 'border-green-600/30 bg-green-900/10' : ''}`}
              >
                <span className={`text-sm font-bold w-7 text-center ${set.done ? 'text-green-500' : 'text-zinc-500'}`}>
                  {i + 1}
                </span>

                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <label className="text-zinc-500 text-[10px]">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={set.weight}
                      onChange={e => setSets(prev => {
                        const u = [...prev]; u[i] = { ...u[i], weight: e.target.value }; return u
                      })}
                      placeholder="0"
                      className="w-full bg-zinc-800 text-white rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-zinc-500 text-[10px]">Reps</label>
                    <input
                      type="number"
                      value={set.completedReps}
                      onChange={e => setSets(prev => {
                        const u = [...prev]; u[i] = { ...u[i], completedReps: e.target.value }; return u
                      })}
                      placeholder={String(targetReps)}
                      className="w-full bg-zinc-800 text-white rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSetDone(i)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    set.done ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {set.done ? <Check size={16} /> : <Play size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rest Timer Button */}
        <button
          onClick={() => setShowTimer(true)}
          className="w-full btn-secondary flex items-center justify-center gap-2"
        >
          <Timer size={16} />
          Iniciar Descanso ({exercise.currentWeekData?.rest || '2-3min'})
        </button>

        {/* Notes */}
        <div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Info size={16} />
            <span className="text-sm font-medium">Notas de execução</span>
            {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showNotes && exercise.notes && (
            <div className="mt-2 card">
              <p className="text-zinc-300 text-sm leading-relaxed">{exercise.notes}</p>
              {exercise.primaryMuscles && (
                <p className="text-zinc-500 text-xs mt-2">
                  <span className="font-medium text-zinc-400">Músculos: </span>
                  {exercise.primaryMuscles}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Video Demo: YouTube or local file */}
        {(videoId || isLocalVideo(exercise.videoDemo) || exercise.localVideo) && (
          <div>
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Youtube size={16} className="text-red-500" />
              <span className="text-sm font-medium">Ver demonstração em vídeo</span>
              {showVideo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showVideo && (
              <div className="mt-2 rounded-2xl overflow-hidden aspect-video bg-zinc-800">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={exercise.nameEn}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <video
                    src={exercise.localVideo || `/videos/${exerciseId}.mp4`}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    title={exercise.nameEn}
                  />
                )}
              </div>
            )}
          </div>
        )}
        {/* Local video hint when no link set yet */}
        {!videoId && !isLocalVideo(exercise.videoDemo) && !exercise.localVideo && (
          <div className="flex items-center gap-2 text-zinc-600 text-xs">
            <Youtube size={14} />
            <span>Coloque o vídeo em <code className="text-zinc-500">public/videos/{exerciseId}.mp4</code></span>
          </div>
        )}

        {/* Session Note */}
        <div>
          <label className="text-zinc-400 text-sm font-medium block mb-2">Observações desta série</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Como foi? Peso muito leve/pesado, sensações..."
            className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-3 py-2.5 text-sm resize-none h-20 outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-4 py-4 safe-bottom">
        <button
          onClick={handleSave}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Check size={16} />
          Salvar Exercício
        </button>
      </div>
    </div>
  )
}
