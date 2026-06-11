export function calculateAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function calculateBMI(weight, height) {
  if (!weight || !height) return null
  const heightM = height / 100
  return (weight / (heightM * heightM)).toFixed(1)
}

export function getBMICategory(bmi) {
  if (!bmi) return { label: '—', color: '#6b7280' }
  const b = parseFloat(bmi)
  if (b < 18.5) return { label: 'Abaixo do peso', color: '#60a5fa' }
  if (b < 25) return { label: 'Peso normal', color: '#4ade80' }
  if (b < 30) return { label: 'Sobrepeso', color: '#facc15' }
  return { label: 'Obesidade', color: '#f87171' }
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}
