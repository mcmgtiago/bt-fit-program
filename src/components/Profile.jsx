import { useState, useRef } from 'react'
import { User, Camera, Scale, Ruler, Calendar, LogOut, Plus, Trash2, Image } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { calculateAge, calculateBMI, getBMICategory, formatDate, todayISO } from '../utils/calculations'
import { getUserKey } from '../hooks/useLocalStorage'
import { DEFAULT_PROFILES } from '../utils/defaultProfiles'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0]?.value} kg</p>
    </div>
  )
}

export default function Profile({ user, onLogout }) {
  const storageKey = getUserKey(user, 'profile')
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES[user] || { name: user, birthDate: '', weight: '', height: '', photo: null }
  })

  const weightHistKey = getUserKey(user, 'weight_history')
  const [weightHistory, setWeightHistory] = useState(() =>
    JSON.parse(localStorage.getItem(weightHistKey) || '[]')
  )

  const photosKey = getUserKey(user, 'progress_photos')
  const [progressPhotos, setProgressPhotos] = useState(() =>
    JSON.parse(localStorage.getItem(photosKey) || '[]')
  )

  const [newWeight, setNewWeight] = useState('')
  const [editing, setEditing] = useState(false)
  const [draftProfile, setDraftProfile] = useState(profile)
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const photoInputRef = useRef()
  const profilePhotoRef = useRef()

  const bmi = calculateBMI(profile.weight, profile.height)
  const bmiCategory = getBMICategory(bmi)
  const age = calculateAge(profile.birthDate)

  const saveProfile = () => {
    setProfile(draftProfile)
    localStorage.setItem(storageKey, JSON.stringify(draftProfile))
    setEditing(false)
  }

  const addWeight = () => {
    if (!newWeight) return
    const entry = { date: todayISO(), weight: parseFloat(newWeight) }
    const updated = [...weightHistory, entry]
    setWeightHistory(updated)
    localStorage.setItem(weightHistKey, JSON.stringify(updated))
    setNewWeight('')
    const updatedProfile = { ...profile, weight: parseFloat(newWeight) }
    setProfile(updatedProfile)
    localStorage.setItem(storageKey, JSON.stringify(updatedProfile))
  }

  const removeWeightEntry = (idx) => {
    const updated = weightHistory.filter((_, i) => i !== idx)
    setWeightHistory(updated)
    localStorage.setItem(weightHistKey, JSON.stringify(updated))
  }

  const handleProfilePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const updated = { ...profile, photo: ev.target.result }
      setProfile(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }
    reader.readAsDataURL(file)
  }

  const handleProgressPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const entry = { date: todayISO(), src: ev.target.result }
      const updated = [...progressPhotos, entry]
      setProgressPhotos(updated)
      localStorage.setItem(photosKey, JSON.stringify(updated))
    }
    reader.readAsDataURL(file)
  }

  const removeProgressPhoto = (idx) => {
    const updated = progressPhotos.filter((_, i) => i !== idx)
    setProgressPhotos(updated)
    localStorage.setItem(photosKey, JSON.stringify(updated))
  }

  const chartData = weightHistory.slice(-12).map(w => ({
    name: new Date(w.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: w.weight
  }))

  return (
    <div className="min-h-screen bg-zinc-950 pb-4">
      {/* Header */}
      <div className="bg-zinc-900 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 transition-colors">
            <LogOut size={16} />
            <span className="text-sm">Sair</span>
          </button>
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-zinc-700 overflow-hidden">
              {profile.photo
                ? <img src={profile.photo} alt="profile" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><User size={32} className="text-zinc-500" /></div>
              }
            </div>
            <button
              onClick={() => profilePhotoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center"
            >
              <Camera size={12} className="text-white" />
            </button>
            <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhoto} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile.name || user}</h2>
            {age !== null && <p className="text-zinc-400 text-sm">{age} anos</p>}
            {profile.birthDate && <p className="text-zinc-500 text-xs">{formatDate(profile.birthDate)}</p>}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Scale size={14} className="text-red-500" />
            </div>
            <p className="text-xl font-bold text-white">{profile.weight || '—'}</p>
            <p className="text-zinc-500 text-xs">kg</p>
          </div>
          <div className="card text-center py-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Ruler size={14} className="text-orange-400" />
            </div>
            <p className="text-xl font-bold text-white">{profile.height || '—'}</p>
            <p className="text-zinc-500 text-xs">cm</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xl font-bold" style={{ color: bmiCategory.color }}>{bmi || '—'}</p>
            <p className="text-zinc-500 text-xs">IMC</p>
            {bmi && <p className="text-[10px]" style={{ color: bmiCategory.color }}>{bmiCategory.label}</p>}
          </div>
        </div>

        {/* Edit Profile */}
        {!editing ? (
          <button onClick={() => { setDraftProfile(profile); setEditing(true) }} className="w-full btn-secondary">
            Editar Dados
          </button>
        ) : (
          <div className="card space-y-3">
            <h3 className="text-white font-semibold">Editar Perfil</h3>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Nome</label>
              <input
                value={draftProfile.name || ''}
                onChange={e => setDraftProfile(p => ({ ...p, name: e.target.value }))}
                className="input"
                placeholder="Seu nome"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Peso (kg)</label>
                <input
                  type="number" step="0.1"
                  value={draftProfile.weight || ''}
                  onChange={e => setDraftProfile(p => ({ ...p, weight: parseFloat(e.target.value) }))}
                  className="input"
                  placeholder="90"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Altura (cm)</label>
                <input
                  type="number"
                  value={draftProfile.height || ''}
                  onChange={e => setDraftProfile(p => ({ ...p, height: parseInt(e.target.value) }))}
                  className="input"
                  placeholder="170"
                />
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Data de Nascimento</label>
              <input
                type="date"
                value={draftProfile.birthDate || ''}
                onChange={e => setDraftProfile(p => ({ ...p, birthDate: e.target.value }))}
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 btn-secondary">Cancelar</button>
              <button onClick={saveProfile} className="flex-1 btn-primary">Salvar</button>
            </div>
          </div>
        )}

        {/* Weight History */}
        <div className="card">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Scale size={16} className="text-red-500" />
            Histórico de Peso
          </h3>

          <div className="flex gap-2 mb-4">
            <input
              type="number" step="0.1"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              placeholder="Peso atual (kg)"
              className="input flex-1"
            />
            <button onClick={addWeight} className="btn-primary px-4">
              <Plus size={18} />
            </button>
          </div>

          {chartData.length > 1 && (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="peso" stroke="#e53e3e" strokeWidth={2} dot={{ fill: '#e53e3e', r: 3 }} name="Peso" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {weightHistory.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
              {weightHistory.slice().reverse().map((w, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-zinc-400 text-xs">{new Date(w.date).toLocaleDateString('pt-BR')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{w.weight} kg</span>
                    <button
                      onClick={() => removeWeightEntry(weightHistory.length - 1 - i)}
                      className="text-zinc-600 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Photos */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Image size={16} className="text-orange-400" />
              Fotos de Progresso
            </h3>
            <button
              onClick={() => photoInputRef.current?.click()}
              className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl hover:bg-zinc-700 flex items-center gap-1"
            >
              <Plus size={12} /> Adicionar
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleProgressPhoto} />
          </div>

          {progressPhotos.length === 0 ? (
            <div className="text-center py-6">
              <Camera size={32} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Nenhuma foto ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {progressPhotos.slice().reverse().map((photo, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800 group">
                  <img src={photo.src} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-active:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => removeProgressPhoto(progressPhotos.length - 1 - i)}
                      className="opacity-0 group-active:opacity-100 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                  <p className="absolute bottom-1 left-1 text-[9px] text-white/70 bg-black/40 px-1 rounded">
                    {new Date(photo.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
