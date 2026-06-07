import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/auth'
import { getUserScore, getUserBadges } from '../api/scores'
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

  const { data: score, isLoading: loadingScore, isError, refetch } = useQuery({
    queryKey: ['score', user!.id],
    queryFn: () => getUserScore(user!.id),
  })

  const { data: badges, isLoading: loadingBadges } = useQuery({
    queryKey: ['badges', user!.id],
    queryFn: () => getUserBadges(user!.id),
  })

  if (loadingScore || loadingBadges)
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  return (
    <div className="p-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{user?.name}</h1>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-red-400">
          Sair
        </button>
      </div>

      {score && (
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Score</span>
            <span className="text-2xl font-bold text-amber-500">{score.score.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>Pagou: <strong>{score.times_paid}x</strong></div>
            <div>Participou: <strong>{score.times_participated}x</strong></div>
            <div>Streak: <strong>{score.current_streak}</strong></div>
            <div>Skips: <strong>{score.skip_count}</strong></div>
          </div>
        </div>
      )}

      {badges && badges.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-4 space-y-2">
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

      <NotificationButton />
    </div>
  )
}
