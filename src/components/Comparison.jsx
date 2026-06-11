import { useMemo } from 'react'
import { Users, Trophy, TrendingUp, Dumbbell } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getUserKey } from '../hooks/useLocalStorage'
import { DEFAULT_PROFILES } from '../utils/defaultProfiles'
import { calculateBMI } from '../utils/calculations'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(1)}</p>
      ))}
    </div>
  )
}

function StatCard({ label, tiago, brenda, unit = '', highlight }) {
  const tiagoWins = parseFloat(tiago) > parseFloat(brenda)
  return (
    <div className="card">
      <p className="text-zinc-400 text-xs mb-2">{label}</p>
      <div className="flex justify-between items-end">
        <div className="text-center flex-1">
          <div className={`text-xl font-bold ${highlight === 'tiago' && tiagoWins ? 'text-red-400' : 'text-white'}`}>
            {tiago || '—'}{tiago ? unit : ''}
          </div>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
            Tiago {highlight === 'tiago' && tiagoWins && <Trophy size={10} className="text-yellow-400" />}
          </p>
        </div>
        <div className="w-px h-8 bg-zinc-700 mx-2" />
        <div className="text-center flex-1">
          <div className={`text-xl font-bold ${highlight === 'brenda' && !tiagoWins ? 'text-orange-400' : 'white'}`}>
            {brenda || '—'}{brenda ? unit : ''}
          </div>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
            Brenda {highlight === 'brenda' && !tiagoWins && <Trophy size={10} className="text-yellow-400" />}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Comparison({ user }) {
  const tiagoLogs = JSON.parse(localStorage.getItem(getUserKey('tiago', 'logs')) || '[]').filter(l => l.completed)
  const brendaLogs = JSON.parse(localStorage.getItem(getUserKey('brenda', 'logs')) || '[]').filter(l => l.completed)
  const tiagoProfile = JSON.parse(localStorage.getItem(getUserKey('tiago', 'profile')) || 'null') || DEFAULT_PROFILES.tiago
  const brendaProfile = JSON.parse(localStorage.getItem(getUserKey('brenda', 'profile')) || 'null') || DEFAULT_PROFILES.brenda

  const tiagoVolume = tiagoLogs.reduce((acc, l) => acc + (l.totalVolume || 0), 0)
  const brendaVolume = brendaLogs.reduce((acc, l) => acc + (l.totalVolume || 0), 0)
  const tiagoBMI = calculateBMI(tiagoProfile.weight, tiagoProfile.height)
  const brendaBMI = calculateBMI(brendaProfile.weight, brendaProfile.height)

  const weeklyData = useMemo(() => {
    const getWeekly = (logs) => {
      const byWeek = {}
      logs.forEach(log => {
        if (!log.date) return
        const date = new Date(log.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay() + 1)
        const key = weekStart.toISOString().split('T')[0]
        if (!byWeek[key]) byWeek[key] = 0
        byWeek[key] += (log.totalVolume || 0) / 1000
      })
      return byWeek
    }

    const tWeekly = getWeekly(tiagoLogs)
    const bWeekly = getWeekly(brendaLogs)
    const allKeys = [...new Set([...Object.keys(tWeekly), ...Object.keys(bWeekly)])].sort().slice(-8)

    return allKeys.map(k => ({
      name: new Date(k).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      Tiago: parseFloat((tWeekly[k] || 0).toFixed(1)),
      Brenda: parseFloat((bWeekly[k] || 0).toFixed(1))
    }))
  }, [tiagoLogs, brendaLogs])

  const sessionsData = useMemo(() => {
    const labels = ['Upper A', 'Lower A', 'Arms/Weak', 'Upper B', 'Lower B']
    const dayTypes = ['upperA', 'lowerA', 'armsWeak', 'upperB', 'lowerB']
    return dayTypes.map((dt, i) => ({
      name: labels[i],
      Tiago: tiagoLogs.filter(l => l.dayType === dt).length,
      Brenda: brendaLogs.filter(l => l.dayType === dt).length
    })).filter(d => d.Tiago > 0 || d.Brenda > 0)
  }, [tiagoLogs, brendaLogs])

  return (
    <div className="min-h-screen bg-zinc-950 pb-4">
      {/* Header */}
      <div className="bg-zinc-900 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-red-500" />
          Comparação
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Tiago vs Brenda</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Total Sessions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <div className="text-3xl font-bold text-red-500 mb-1">{tiagoLogs.length}</div>
            <p className="text-zinc-400 text-sm font-medium">Tiago</p>
            <p className="text-zinc-600 text-xs">sessões</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">{brendaLogs.length}</div>
            <p className="text-zinc-400 text-sm font-medium">Brenda</p>
            <p className="text-zinc-600 text-xs">sessões</p>
          </div>
        </div>

        {/* Volume Total */}
        <StatCard
          label="Volume Total Acumulado"
          tiago={(tiagoVolume / 1000).toFixed(1)}
          brenda={(brendaVolume / 1000).toFixed(1)}
          unit="t"
          highlight="tiago"
        />

        {/* Physical Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Peso" tiago={tiagoProfile.weight} brenda={brendaProfile.weight} unit="kg" />
          <StatCard label="IMC" tiago={tiagoBMI} brenda={brendaBMI} />
        </div>

        {/* Weekly Volume Chart */}
        {weeklyData.length > 1 && (
          <div className="card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-red-500" />
              Volume Semanal (toneladas)
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                <Bar dataKey="Tiago" fill="#e53e3e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Brenda" fill="#dd6b20" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sessions by Day */}
        {sessionsData.length > 0 && (
          <div className="card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Dumbbell size={16} className="text-orange-400" />
              Sessões por Tipo de Treino
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={sessionsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                <Bar dataKey="Tiago" fill="#e53e3e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Brenda" fill="#dd6b20" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tiagoLogs.length === 0 && brendaLogs.length === 0 && (
          <div className="card text-center py-12">
            <Users size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">Nenhum dado para comparar ainda</p>
            <p className="text-zinc-600 text-sm mt-1">Complete alguns treinos para ver a comparação</p>
          </div>
        )}
      </div>
    </div>
  )
}
