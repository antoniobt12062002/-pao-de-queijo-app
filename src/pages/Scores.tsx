import { useQuery } from '@tanstack/react-query'
import { getAllScores } from '../api/scores'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

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

  return (
    <div className="p-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Placar</h1>
      <ul className="space-y-2">
        {data?.slice().sort((a, b) => b.score - a.score).map((score, index) => (
          <li
            key={score.user_id}
            className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3"
          >
            <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{score.user_name}</p>
              <p className="text-xs text-gray-400">
                {score.times_paid}x pagou · streak {score.current_streak}
              </p>
            </div>
            <span className="text-amber-600 font-bold text-sm">{score.score.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
