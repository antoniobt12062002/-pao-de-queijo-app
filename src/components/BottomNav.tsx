import { NavLink } from 'react-router-dom'
import { Home, RotateCcw, Trophy, User, Settings } from 'lucide-react'
import { useAuth } from '../store/auth'

const memberNav = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/rotation', icon: RotateCcw, label: 'Rotação', end: false },
  { to: '/scores', icon: Trophy, label: 'Placar', end: false },
  { to: '/profile', icon: User, label: 'Perfil', end: false },
]

const adminNav = [
  ...memberNav,
  { to: '/admin', icon: Settings, label: 'Admin', end: false },
]

export default function BottomNav() {
  const { user } = useAuth()
  const items = user?.role === 'admin' ? adminNav : memberNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100">
      <ul className="flex items-stretch h-16">
        {items.map(({ to, icon: Icon, label, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-0.5 transition-colors ${
                  isActive ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200 ${isActive ? 'bg-amber-50' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                  <span className={`text-[10px] font-medium transition-all ${isActive ? 'text-amber-500' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
