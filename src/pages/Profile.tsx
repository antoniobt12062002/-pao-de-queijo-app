import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Users, Flame, SkipForward, CalendarOff, Plus, X, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../store/auth'
import { getUserScore, getUserBadges } from '../api/scores'
import { getAbsences, markAbsent, removeAbsence } from '../api/absences'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'
import NotificationButton from '../components/NotificationButton'

const badgeConfig: Record<string, { label: string; icon: string; color: string }> = {
  novo_na_fila: { label: 'Novo na Fila', icon: '🆕', color: 'bg-sky-50 text-sky-600' },
  nunca_foge: { label: 'Nunca Foge', icon: '💪', color: 'bg-emerald-50 text-emerald-600' },
  queijeiro_fiel: { label: 'Queijeiro Fiel', icon: '🧀', color: 'bg-amber-50 text-amber-600' },
  papai_noel: { label: 'Papai Noel', icon: '🎅', color: 'bg-red-50 text-red-600' },
  big_spender: { label: 'Big Spender', icon: '💸', color: 'bg-violet-50 text-violet-600' },
}

export default function Profile() {
  const { user, logout } = useAuth()
  const qc = useQueryClient()
  const [newAbsenceDate, setNewAbsenceDate] = useState('')

  if (!user) return null

  const { data: score, isLoading: loadingScore, isError, refetch } = useQuery({
    queryKey: ['score', user.id],
    queryFn: () => getUserScore(user.id),
  })

  const { data: badges, isLoading: loadingBadges } = useQuery({
    queryKey: ['badges', user.id],
    queryFn: () => getUserBadges(user.id),
  })

  const { data: absences } = useQuery({
    queryKey: ['absences'],
    queryFn: getAbsences,
  })

  const markAbsentMut = useMutation({
    mutationFn: (date: string) => markAbsent(date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] })
      setNewAbsenceDate('')
      toast.success('Ausência registrada!')
    },
    onError: () => toast.error('Essa data já está registrada.'),
  })

  const removeAbsenceMut = useMutation({
    mutationFn: (date: string) => removeAbsence(date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] })
      toast.success('Ausência removida.')
    },
    onError: () => toast.error('Erro ao remover ausência.'),
  })

  if (loadingScore || loadingBadges)
    return (
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  const displayName = score?.user_name || user?.name || '?'
  const displayEmail = score?.user_email || user?.email || ''

  const stats = [
    { icon: CreditCard, value: score?.times_paid ?? 0, label: 'Pagou', unit: 'x' },
    { icon: Users, value: score?.times_participated ?? 0, label: 'Participou', unit: 'x' },
    { icon: Flame, value: score?.current_streak ?? 0, label: 'Streak', unit: '' },
    { icon: SkipForward, value: score?.skip_count ?? 0, label: 'Skips', unit: '' },
  ]

  return (
    <div className="px-4 pt-6 pb-4 space-y-4 animate-fade-in">
      {/* User card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">{displayName}</h1>
            {displayEmail && <p className="text-sm text-slate-400 truncate">{displayEmail}</p>}
            {score && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {score.score.toFixed(1)} pts
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => { toast.success('Até logo!'); logout() }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>

      {/* Stats grid */}
      {score && (
        <div className="grid grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, value, label, unit }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon size={15} className="text-amber-500" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 leading-none">{value}{unit}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Conquistas</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => {
              const cfg = badgeConfig[b.type]
              return (
                <div
                  key={b.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${cfg?.color ?? 'bg-slate-50 text-slate-600'}`}
                >
                  <span>{cfg?.icon ?? '🏅'}</span>
                  {cfg?.label ?? b.type}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Planned absences */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <CalendarOff size={14} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ausências planejadas</p>
          </div>
          <p className="text-xs text-slate-400 mt-1">Nos dias marcados você será pulado na rotação automaticamente.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={newAbsenceDate}
            onChange={(e) => setNewAbsenceDate(e.target.value)}
            min={new Date().toLocaleDateString('en-CA')}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <button
            onClick={() => newAbsenceDate && markAbsentMut.mutate(newAbsenceDate)}
            disabled={!newAbsenceDate || markAbsentMut.isPending}
            className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-amber-600 transition-colors active:scale-[0.98]"
          >
            <Plus size={15} />
          </button>
        </div>

        {absences && absences.length > 0 ? (
          <ul className="space-y-2">
            {absences.map((a) => (
              <li key={a.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3.5 py-2.5">
                <span className="text-sm font-medium text-slate-700">
                  {new Date(a.date.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: 'short',
                  })}
                </span>
                <button
                  onClick={() => removeAbsenceMut.mutate(a.date.substring(0, 10))}
                  disabled={removeAbsenceMut.isPending}
                  className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50 p-1"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 text-center py-2">Nenhuma ausência registrada.</p>
        )}
      </div>

      <NotificationButton />
    </div>
  )
}
