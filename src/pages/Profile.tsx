import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Users, Zap, SkipForward, CalendarOff, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../store/auth'
import { getUserScore, getUserBadges } from '../api/scores'
import { getAbsences, markAbsent, removeAbsence } from '../api/absences'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'
import NotificationButton from '../components/NotificationButton'

const badgeLabels: Record<string, string> = {
  novo_na_fila: 'Novo na Fila 🆕',
  nunca_foge: 'Nunca Foge 💪',
  queijeiro_fiel: 'Queijeiro Fiel 🧀',
  papai_noel: 'Papai Noel 🎅',
  big_spender: 'Big Spender 💸',
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

  const { data: badges, isLoading: loadingBadges, isError: isBadgesError } = useQuery({
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
      <div className="p-4 space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  const displayName = score?.user_name || user?.name || user?.id || '?'
  const displayEmail = score?.user_email || user?.email || ''

  const handleLogout = () => {
    toast.success('Até logo!')
    logout()
  }

  return (
    <div className="p-4 pt-6 space-y-4">
      {/* Header with large Avatar */}
      <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center gap-3">
        <Avatar name={displayName} size="lg" />
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800">{displayName}</h1>
          {displayEmail && (
            <p className="text-sm text-gray-400">{displayEmail}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          Sair
        </button>
      </div>

      {score && (
        <div className="bg-white rounded-3xl shadow-md p-4 space-y-4">
          {/* Score highlight */}
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-sm text-gray-600 font-medium">Score</span>
            <span className="text-2xl font-bold text-amber-500">{(score.score ?? 0).toFixed(1)}</span>
          </div>

          {/* Stats grid with icons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Pagou</p>
                <p className="text-sm font-semibold text-gray-800">{score.times_paid}x</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Participou</p>
                <p className="text-sm font-semibold text-gray-800">{score.times_participated}x</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Streak</p>
                <p className="text-sm font-semibold text-gray-800">{score.current_streak}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkipForward className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Skips</p>
                <p className="text-sm font-semibold text-gray-800">{score.skip_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBadgesError && (
        <p className="text-sm text-red-400 text-center">Erro ao carregar badges.</p>
      )}
      {!isBadgesError && badges && badges.length > 0 && (
        <div className="bg-white rounded-3xl shadow-md p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Badges</p>
          <ul className="space-y-1">
            {badges.map((b) => (
              <li key={b.id} className="flex justify-between text-sm">
                <span>{badgeLabels[b.type] ?? b.type}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(b.earned_at).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ausências planejadas */}
      <div className="bg-white rounded-3xl shadow-md p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarOff className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-medium text-gray-700">Ausências planejadas</p>
        </div>
        <p className="text-xs text-gray-400">
          Nos dias marcados você será pulado na rotação automaticamente.
        </p>

        <div className="flex gap-2">
          <input
            type="date"
            value={newAbsenceDate}
            onChange={(e) => setNewAbsenceDate(e.target.value)}
            min={new Date().toLocaleDateString('en-CA')}
            className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            onClick={() => newAbsenceDate && markAbsentMut.mutate(newAbsenceDate)}
            disabled={!newAbsenceDate || markAbsentMut.isPending}
            className="flex items-center gap-1 bg-amber-500 text-white px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {absences && absences.length > 0 ? (
          <ul className="space-y-1.5">
            {absences.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-gray-700">
                  {new Date(a.date.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: 'short',
                  })}
                </span>
                <button
                  onClick={() => removeAbsenceMut.mutate(a.date.substring(0, 10))}
                  disabled={removeAbsenceMut.isPending}
                  className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">Nenhuma ausência registrada.</p>
        )}
      </div>

      <NotificationButton />
    </div>
  )
}
