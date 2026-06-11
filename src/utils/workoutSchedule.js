import brendaData from '../data/brenda.json'
import tiagoData from '../data/tiago.json'

const DAY_ORDERS = {
  tiago: ['upperA', 'lowerA', 'armsWeak', 'upperB', 'lowerB'],
  brenda: ['upperA', 'lowerA', 'upperB', 'lowerB']
}
const DELOAD_INTERVAL_WEEKS = 4

export function getProgramData(username) {
  return username.toLowerCase() === 'brenda' ? brendaData : tiagoData
}

export function getDayOrder(username) {
  return DAY_ORDERS[username.toLowerCase()] || DAY_ORDERS.brenda
}

export function getCycleLength(username) {
  return getDayOrder(username).length
}

export function getCurrentSession(workoutLogs) {
  return (workoutLogs || []).filter(l => l.completed).length
}

export function getSessionInfo(sessionIndex, username) {
  const dayOrder = getDayOrder(username)
  const cycleLength = dayOrder.length
  const dayIndex = sessionIndex % cycleLength
  const weekNumber = Math.floor(sessionIndex / cycleLength) + 1
  const programWeek = ((weekNumber - 1) % 8) + 1
  const block = programWeek <= 4 ? 1 : 2
  const weekInBlock = programWeek <= 4 ? programWeek : programWeek - 4
  const dayType = dayOrder[dayIndex]
  const isDeload = weekNumber > 0 && weekNumber % DELOAD_INTERVAL_WEEKS === 0

  return {
    sessionIndex,
    dayType,
    dayIndex,
    weekNumber,
    programWeek,
    block,
    weekInBlock,
    isDeload,
    dayLabel: getDayLabel(dayType)
  }
}

export function getDayLabel(dayType) {
  const labels = {
    upperA: 'Upper #1',
    lowerA: 'Lower #1',
    upperB: 'Upper #2',
    lowerB: 'Lower #2',
    armsWeak: 'Arms & Weak Points'
  }
  return labels[dayType] || dayType
}

export function getTodaysWorkout(workoutLogs, username) {
  const today = new Date().toISOString().split('T')[0]
  const todayLog = (workoutLogs || []).find(l => l.date === today && l.completed)
  if (todayLog) return { alreadyDone: true, log: todayLog }
  const completedCount = getCurrentSession(workoutLogs)
  return { alreadyDone: false, ...getSessionInfo(completedCount, username) }
}

export function getExercisesForDay(username, dayType, weekInBlock, block) {
  const data = getProgramData(username)
  const blockData = data.blocks.find(b => b.blockNumber === parseInt(block))
  if (!blockData) return []
  const day = blockData.days[dayType]
  if (!day) return []
  const weekIdx = (parseInt(weekInBlock) || 1) - 1
  return day.exercises.map(ex => ({
    ...ex,
    currentWeekData: ex.weeklyData[weekIdx] || ex.weeklyData[ex.weeklyData.length - 1]
  }))
}

export function getDeloadWeight(weight) {
  return Math.round((weight * 0.6) / 2.5) * 2.5
}

export function isDeloadWeek(workoutLogs, username) {
  const completedCount = getCurrentSession(workoutLogs)
  const cycleLength = getCycleLength(username || 'brenda')
  const weekNumber = Math.floor(completedCount / cycleLength) + 1
  return weekNumber > 0 && weekNumber % DELOAD_INTERVAL_WEEKS === 0
}

export function getProgressionSuggestion(exerciseLogs, currentWeight) {
  if (!exerciseLogs || exerciseLogs.length < 2) return null
  const lastTwo = exerciseLogs.slice(-2)
  const allCompleted = lastTwo.every(log =>
    log.sets && log.sets.every(s => s.completedReps >= s.targetReps)
  )
  if (allCompleted) {
    const suggestion = (parseFloat(currentWeight || 0) + 2.5).toFixed(1)
    return `+2.5kg → ${suggestion}kg`
  }
  return null
}

export function getWeekLabel(weekInBlock, block) {
  const globalWeek = block === 1 ? weekInBlock : weekInBlock + 4
  return `Semana ${globalWeek}`
}
