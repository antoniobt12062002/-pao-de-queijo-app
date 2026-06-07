import { NavLink } from 'react-router-dom'
import { useAuth } from '../store/auth'

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/rotation', label: 'Rotação', icon: '🔄' },
  { to: '/scores', label: 'Placar', icon: '🏆' },
  { to: '/profile', label: 'Perfil', icon: '👤' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const items =
    user?.role === 'admin'
      ? [...navItems, { to: '/admin', label: 'Admin', icon: '⚙️' }]
      : navItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
      {items.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          aria-label={label}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs gap-1 px-3 py-1 rounded-lg ${
              isActive ? 'text-amber-500' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
