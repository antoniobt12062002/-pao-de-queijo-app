import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getRotation, skipRotation } from '../api/rotation'
import { getUsers } from '../api/users'
import { useAuth } from '../store/auth'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

export default function Rotation() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rotation'],
    queryFn: getRotation,
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const getUserName = (id: string) => users?.find((u) => u.id === id)?.name ?? id

  const skipMut = useMutation({
    mutationFn: skipRotation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rotation'] })
      toast.success('Posição avançada!')
    },
    onError: () => {
      toast.error('Erro ao avançar posição.')
    },
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
      <div className="flex items-center gap-2">
        <RotateCcw className="w-5 h-5 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-800">Fila de Pagamento</h1>
      </div>

      {user?.role === 'admin' && (
        <button
          onClick={() => skipMut.mutate()}
          disabled={skipMut.isPending}
          className="w-full border border-amber-400 text-amber-600 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-50 hover:bg-amber-50 transition-colors"
        >
          Avançar posição (skip)
        </button>
      )}

      <ul className="space-y-2">
        {data?.members.map((member, index) => {
          const isCurrent = member.user_id === data.current_payer_id
          const name = getUserName(member.user_id)
          return (
            <li
              key={member.user_id}
              className={`flex items-center gap-3 bg-white rounded-3xl px-4 py-3 shadow-md ${
                isCurrent ? 'border-2 border-amber-400' : ''
              }`}
            >
              <span className="text-sm font-bold text-gray-400 w-5">{index + 1}</span>
              <Avatar
                name={name}
                size="md"
                className={isCurrent ? 'ring-2 ring-amber-400' : ''}
              />
              <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                {name}
              </span>
              {isCurrent && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
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
