import { NavLink } from 'react-router-dom'
import { Home, RotateCcw, Trophy, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../store/auth'
import Avatar from './Avatar'
import { toast } from 'sonner'

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

export default function SideNav() {
  const { user, logout } = useAuth()
  const items = user?.role === 'admin' ? adminNav : memberNav

  const handleLogout = () => {
    toast.success('Até logo!')
    logout()
  }

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-slate-100 z-40">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-lg shrink-0">
            🧀
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">Pão de Queijo</p>
            <p className="text-xs text-slate-400 leading-tight">Gestão de rodadas</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-50 text-amber-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
              <p className="text-xs text-slate-400 truncate leading-tight">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-300 hover:text-red-400 transition-colors p-1"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
