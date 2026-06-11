import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { getRotation, skipRotation } from '../api/rotation'
import { getUsers } from '../api/users'
import { useAuth } from '../store/auth'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'
import PullToRefresh from '../components/PullToRefresh'

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
    onError: () => toast.error('Erro ao avançar posição.'),
  })

  const handleRefresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['rotation'] }),
      qc.invalidateQueries({ queryKey: ['users'] }),
    ])
  }

  if (isLoading)
    return (
      <div className="px-4 pt-6 space-y-3">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  const currentIdx = data?.members.findIndex((m) => m.user_id === data.current_payer_id) ?? -1

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="px-4 pt-6 pb-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fila de Pagamento</h1>
            <p className="text-sm text-slate-400 mt-0.5">{data?.members.length ?? 0} membros na rotação</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => skipMut.mutate()}
              disabled={skipMut.isPending}
              className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} />
              Skip
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {data?.members.map((member, index) => {
            const isCurrent = member.user_id === data.current_payer_id
            const isPast = currentIdx !== -1 && index < currentIdx
            const name = getUserName(member.user_id)
            const isMe = member.user_id === user?.id

            return (
              <div
                key={member.user_id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  index < (data?.members.length ?? 0) - 1 ? 'border-b border-slate-50' : ''
                } ${isCurrent ? 'bg-amber-50' : isPast ? 'opacity-50' : ''}`}
              >
                <span className={`text-sm font-bold w-5 text-center ${
                  isCurrent ? 'text-amber-500' : 'text-slate-300'
                }`}>
                  {index + 1}
                </span>
                <Avatar
                  name={name}
                  size="md"
                  className={isCurrent ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    isCurrent ? 'text-amber-700' : isMe ? 'text-slate-900' : 'text-slate-700'
                  }`}>
                    {name}
                    {isMe && <span className="ml-2 text-[10px] font-bold text-amber-400 uppercase">você</span>}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-amber-500 font-medium mt-0.5">Na vez agora</p>
                  )}
                </div>
                {isCurrent && (
                  <ChevronRight size={16} className="text-amber-400" />
                )}
              </div>
            )
          })}

          {(!data?.members || data.members.length === 0) && (
            <div className="px-5 py-8 text-center">
              <p className="text-slate-400 text-sm">Nenhum membro na rotação.</p>
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  )
}
