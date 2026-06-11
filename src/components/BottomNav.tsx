import { NavLink } from 'react-router-dom'
import { Home, RotateCcw, Trophy, User, Settings } from 'lucide-react'
import { useAuth } from '../store/auth'

const memberNav = [
  { to: '/', icon: Home, label: 'Início', end: true },
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
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch h-16">
        {items.map(({ to, icon: Icon, label, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-1 transition-colors ${
                  isActive ? 'text-amber-500' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-150 ${
                    isActive ? 'bg-amber-50' : ''
                  }`}>
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className={`text-[10px] font-medium leading-none ${
                    isActive ? 'text-amber-500' : 'text-slate-400'
                  }`}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
