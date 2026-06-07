import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { getAllScores } from '../api/scores'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

const medals = ['🥇', '🥈', '🥉']

export default function Scores() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['scores'],
    queryFn: getAllScores,
  })

  if (isLoading)
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  const sorted = data?.slice().sort((a, b) => b.score - a.score) ?? []

  return (
    <div className="p-4 pt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-800">Placar</h1>
      </div>

      <ul className="space-y-2">
        {sorted.map((score, index) => (
          <li
            key={score.user_id}
            className="bg-white rounded-3xl px-4 py-3 shadow-md flex items-center gap-3"
          >
            <span className="text-lg w-7 text-center flex-shrink-0">
              {index < 3 ? medals[index] : <span className="text-gray-400 font-bold text-sm">{index + 1}</span>}
            </span>
            <Avatar name={score.user_name || score.user_id} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{score.user_name}</p>
              <p className="text-xs text-gray-400">
                {score.times_paid}x pagou · streak {score.current_streak}
              </p>
            </div>
            <span className="bg-amber-100 text-amber-700 font-bold text-sm px-2.5 py-0.5 rounded-full flex-shrink-0">
              {score.score.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
