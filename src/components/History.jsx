import { useState, useMemo } from 'react'
import { BarChart2, TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { getProgramData, getDayOrder, getDayLabel } from '../utils/workoutSchedule'
import { getUserKey } from '../hooks/useLocalStorage'

const COLORS = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#805ad5']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value?.toFixed(1)}</p>
      ))}
    </div>
  )
}

export default function History({ user }) {
  const programData = getProgramData(user)
  const dayOrder = getDayOrder(user)
  const workoutLogs = JSON.parse(localStorage.getItem(getUserKey(user, 'logs')) || '[]')
  const completedLogs = workoutLogs.filter(l => l.completed)

  const [selectedDayType, setSelectedDayType] = useState(dayOrder[0])
  const [expandedExercise, setExpandedExercise] = useState(null)

  const sessionsByDay = useMemo(() => {
    const map = {}
    completedLogs.forEach(log => {
      if (!map[log.dayType]) map[log.dayType] = []
      map[log.dayType].push(log)
    })
    return map
  }, [completedLogs])

  const volumeChartData = useMemo(() => {
    return completedLogs.slice(-12).map((log, i) => ({
      name: `S${i + 1}`,
      volume: (log.totalVolume || 0) / 1000,
      label: log.dayLabel || log.dayType
    }))
  }, [completedLogs])

  const allExercisesForDay = useMemo(() => {
    const block = programData.blocks[0]
    return block?.days[selectedDayType]?.exercises || []
  }, [programData, selectedDayType])

  const getExerciseHistory = (exerciseId) => {
    return JSON.parse(localStorage.getItem(getUserKey(user, `exlog_${exerciseId}`)) || '[]')
      .slice(-8)
      .map((log, i) => ({
        name: `S${i + 1}`,
        volume: (log.totalVolume || 0),
        weight: log.sets?.[0]?.weight || 0,
        date: log.date
      }))
  }

  const weeklyVolume = useMemo(() => {
    const byWeek = {}
    completedLogs.forEach(log => {
      if (!log.date) return
      const date = new Date(log.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay() + 1)
      const key = weekStart.toISOString().split('T')[0]
      if (!byWeek[key]) byWeek[key] = 0
      byWeek[key] += (log.totalVolume || 0) / 1000
    })
    return Object.entries(byWeek).slice(-8).map(([date, vol]) => ({
      name: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      volume: parseFloat(vol.toFixed(1))
    }))
  }, [completedLogs])

  return (
    <div className="min-h-screen bg-zinc-950 pb-4">
      {/* Header */}
      <div className="bg-zinc-900 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Histórico</h1>
        <p className="text-zinc-400 text-sm mt-1">{completedLogs.length} sessões registradas</p>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {completedLogs.length === 0 ? (
          <div className="card text-center py-12">
            <BarChart2 size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">Nenhum treino registrado ainda</p>
            <p className="text-zinc-600 text-sm mt-1">Complete seu primeiro treino para ver o histórico</p>
          </div>
        ) : (
          <>
            {/* Weekly Volume Chart */}
            {weeklyVolume.length > 1 && (
              <div className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-red-500" />
                  Volume Semanal (toneladas)
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyVolume} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" fill="#e53e3e" radius={[4, 4, 0, 0]} name="Volume (t)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Session Volume Trend */}
            {volumeChartData.length > 1 && (
              <div className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart2 size={18} className="text-orange-400" />
                  Volume por Sessão (t)
                </h3>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={volumeChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="volume" stroke="#dd6b20" strokeWidth={2} dot={false} name="Volume (t)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sessions List */}
            <div>
              <h3 className="text-white font-semibold mb-3">Sessões Recentes</h3>
              <div className="space-y-2">
                {completedLogs.slice().reverse().slice(0, 20).map((log, i) => (
                  <div key={i} className="card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-600/20 flex items-center justify-center">
                        <Calendar size={16} className="text-red-500" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{log.dayLabel || getDayLabel(log.dayType)}</p>
                        <p className="text-zinc-500 text-xs">
                          {log.date ? new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
                          {log.weekInBlock && ` · Sem. ${log.block === 1 ? log.weekInBlock : log.weekInBlock + 4}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {log.totalVolume > 0 && (
                        <p className="text-zinc-300 text-sm font-semibold">{(log.totalVolume / 1000).toFixed(1)}t</p>
                      )}
                      {log.note && <p className="text-zinc-600 text-xs truncate max-w-[80px]">{log.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise History */}
            <div>
              <h3 className="text-white font-semibold mb-3">Histórico por Exercício</h3>

              {/* Day Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {dayOrder.map(dt => (
                  <button
                    key={dt}
                    onClick={() => setSelectedDayType(dt)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      selectedDayType === dt ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {getDayLabel(dt)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {allExercisesForDay.map(ex => {
                  const history = getExerciseHistory(ex.id)
                  const isExpanded = expandedExercise === ex.id
                  const maxWeight = history.length ? Math.max(...history.map(h => h.weight || 0)) : 0

                  return (
                    <div key={ex.id} className="card">
                      <button
                        onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                        className="w-full flex items-center justify-between"
                      >
                        <div className="text-left">
                          <p className="text-white text-sm font-medium">{ex.namePt.split('(')[0].trim()}</p>
                          {history.length > 0
                            ? <p className="text-zinc-500 text-xs mt-0.5">{history.length} sessões · máx {maxWeight}kg</p>
                            : <p className="text-zinc-600 text-xs mt-0.5">Sem registros ainda</p>
                          }
                        </div>
                        {history.length > 0 && (
                          isExpanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />
                        )}
                      </button>

                      {isExpanded && history.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <ResponsiveContainer width="100%" height={120}>
                            <LineChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} />
                              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Line type="monotone" dataKey="weight" stroke="#e53e3e" strokeWidth={2} dot={{ fill: '#e53e3e', r: 3 }} name="Peso (kg)" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
