import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, BarChart2, User } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Hoje' },
  { path: '/workouts', icon: Dumbbell, label: 'Treinos' },
  { path: '/history', icon: BarChart2, label: 'Histórico' },
  { path: '/profile', icon: User, label: 'Perfil' }
]

export default function BottomNav({ user }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 safe-bottom z-50">
      <div className="flex items-stretch">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                isActive ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            <Icon size={20} strokeWidth={isActive => isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
