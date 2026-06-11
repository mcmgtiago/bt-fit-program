import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { getProgramData, getSessionInfo, getDayOrder, getCycleLength } from '../utils/workoutSchedule'
import { getUserKey } from '../hooks/useLocalStorage'

const DAY_COLORS = {
  upperA: 'from-red-600 to-red-800',
  lowerA: 'from-orange-600 to-orange-800',
  armsWeak: 'from-purple-600 to-purple-900',
  upperB: 'from-red-700 to-rose-900',
  lowerB: 'from-amber-600 to-orange-800'
}

export default function Workouts({ user }) {
  const navigate = useNavigate()
  const data = getProgramData(user)
  const cycleLength = getCycleLength(user)
  const dayOrder = getDayOrder(user)
  const workoutLogs = JSON.parse(localStorage.getItem(getUserKey(user, 'logs')) || '[]')
  const completedCount = workoutLogs.filter(l => l.completed).length
  const currentInfo = getSessionInfo(completedCount, user)
  const clampedBlock = Math.min(currentInfo.block, 2)

  const [selectedBlock, setSelectedBlock] = useState(clampedBlock)

  const blockData = data.blocks.find(b => b.blockNumber === selectedBlock)
  const weeksInBlock = blockData ? (blockData.weekRange[1] - blockData.weekRange[0] + 1) : 4

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="bg-zinc-900 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">{data.programName}</h1>
        <p className="text-zinc-400 text-sm mt-1">{data.author}</p>

        {/* Block Selector */}
        <div className="flex gap-2 mt-4">
          {data.blocks.map(b => (
            <button
              key={b.blockNumber}
              onClick={() => setSelectedBlock(b.blockNumber)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                selectedBlock === b.blockNumber
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Bloco {b.blockNumber} · S{b.weekRange[0]}-{b.weekRange[1]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Week selector within block */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: weeksInBlock }, (_, i) => i + 1).map(w => {
            const globalWeek = selectedBlock === 1 ? w : w + (blockData?.weekRange[0] - 1 || 4)
            const isCurrentWeek = (currentInfo.weekInBlock === w) && (clampedBlock === selectedBlock)
            return (
              <button
                key={w}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isCurrentWeek ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                Semana {globalWeek} {isCurrentWeek ? '(atual)' : ''}
              </button>
            )
          })}
        </div>

        {blockData && dayOrder.map((dayType) => {
          const day = blockData.days[dayType]
          if (!day) return null
          const exCount = day.exercises.length

          return (
            <button
              key={dayType}
              onClick={() => navigate(`/workouts/${dayType}/${currentInfo.weekInBlock}/${selectedBlock}`)}
              className="w-full text-left"
            >
              <div className={`bg-gradient-to-r ${DAY_COLORS[dayType] || 'from-zinc-700 to-zinc-800'} rounded-2xl p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">{day.name}</h3>
                    <p className="text-white/70 text-sm mt-0.5">{exCount} exercícios</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {day.exercises.slice(0, 3).map(ex => (
                        <span key={ex.id} className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-md">
                          {ex.namePt.split(' ').slice(0, 2).join(' ')}
                        </span>
                      ))}
                      {exCount > 3 && (
                        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-md">+{exCount - 3}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={22} className="text-white/60 shrink-0" />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
