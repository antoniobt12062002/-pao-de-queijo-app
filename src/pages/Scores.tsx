import { useQuery } from '@tanstack/react-query'
import { Trophy, Flame, CreditCard } from 'lucide-react'
import { getAllScores } from '../api/scores'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../store/auth'

export default function Scores() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['scores'],
    queryFn: getAllScores,
  })

  if (isLoading)
    return (
      <div className="px-4 pt-6 space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-36 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  const sorted = data?.slice().sort((a, b) => b.score - a.score) ?? []
  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3

  const podiumHeight = ['h-20', 'h-28', 'h-16']
  const podiumLabel = ['2º', '1º', '3º']
  const podiumScoreIdx = [1, 0, 2]

  return (
    <div className="px-4 pt-6 pb-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Placar</h1>
        <p className="text-sm text-slate-400 mt-0.5">{sorted.length} participantes</p>
      </div>

      {/* Podium */}
      {top3.length >= 2 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 pt-4 pb-0 overflow-hidden">
          <div className="flex items-end justify-center gap-2">
            {podiumOrder.map((score, i) => {
              if (!score) return <div key={i} className="flex-1" />
              const realIdx = podiumScoreIdx[i]
              const isMe = score.user_id === user?.id
              return (
                <div key={score.user_id} className="flex-1 flex flex-col items-center">
                  {realIdx === 0 && <span className="text-xl mb-1">👑</span>}
                  <Avatar name={score.user_name} size={realIdx === 0 ? 'lg' : 'md'} />
                  <p className={`text-xs font-bold mt-1.5 truncate max-w-full px-1 ${isMe ? 'text-amber-500' : 'text-slate-800'}`}>
                    {score.user_name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">{score.score.toFixed(0)} pts</p>
                  <div
                    className={`w-full rounded-t-xl flex items-start justify-center pt-2 ${
                      realIdx === 0 ? 'bg-amber-400' : realIdx === 1 ? 'bg-slate-300' : 'bg-amber-200'
                    } ${podiumHeight[i]}`}
                  >
                    <span className="text-white font-extrabold text-sm">{podiumLabel[i]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {rest.map((score, index) => {
            const rank = index + 4
            const isMe = score.user_id === user?.id
            return (
              <div
                key={score.user_id}
                className={`flex items-center gap-3 px-5 py-3.5 ${
                  index < rest.length - 1 ? 'border-b border-slate-50' : ''
                } ${isMe ? 'bg-amber-50' : ''}`}
              >
                <span className="text-sm font-bold text-slate-400 w-6 text-center">{rank}</span>
                <Avatar name={score.user_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isMe ? 'text-amber-600' : 'text-slate-800'}`}>
                    {score.user_name}
                    {isMe && <span className="ml-1.5 text-[10px] font-bold text-amber-400 uppercase">você</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <CreditCard size={10} /> {score.times_paid}x
                    </span>
                    {score.current_streak > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Flame size={10} /> {score.current_streak}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {score.score.toFixed(0)}
                  <span className="text-xs font-medium text-slate-400 ml-0.5">pts</span>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* If fewer than 4 users, show all in one list without podium separation */}
      {top3.length < 2 && sorted.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {sorted.map((score, index) => {
            const isMe = score.user_id === user?.id
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div
                key={score.user_id}
                className={`flex items-center gap-3 px-5 py-3.5 ${
                  index < sorted.length - 1 ? 'border-b border-slate-50' : ''
                } ${isMe ? 'bg-amber-50' : ''}`}
              >
                <span className="text-base w-6 text-center">
                  {index < 3 ? medals[index] : <span className="text-sm font-bold text-slate-400">{index + 1}</span>}
                </span>
                <Avatar name={score.user_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isMe ? 'text-amber-600' : 'text-slate-800'}`}>
                    {score.user_name}
                  </p>
                  <p className="text-xs text-slate-400">{score.times_paid}x pagou · streak {score.current_streak}</p>
                </div>
                <span className="bg-amber-100 text-amber-700 font-bold text-xs px-2.5 py-1 rounded-full">
                  {score.score.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <Trophy size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum score ainda</p>
        </div>
      )}
    </div>
  )
}
