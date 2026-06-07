import { useQuery } from '@tanstack/react-query'
import { getRotation } from '../api/rotation'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

export default function Rotation() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rotation'],
    queryFn: getRotation,
  })

  if (isLoading)
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  return (
    <div className="p-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Fila de Pagamento</h1>
      <ul className="space-y-2">
        {data?.members.map((member, index) => {
          const isCurrent = member.user_id === data.current_payer_id
          return (
            <li
              key={member.user_id}
              className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm ${
                isCurrent ? 'border-2 border-amber-400' : ''
              }`}
            >
              <span className="text-sm font-bold text-gray-400 w-5">{index + 1}</span>
              <span className="flex-1 text-sm font-medium text-gray-800 font-mono text-xs">{member.user_id}</span>
              {isCurrent && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Próximo
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
