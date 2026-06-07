import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Users, ChevronRight, CalendarDays } from 'lucide-react'
import {
  getTodayRound,
  confirmRound,
  cancelRound,
  participate,
  removeParticipation,
  getParticipations,
  getRounds,
} from '../api/rounds'
import { getUserScore } from '../api/scores'
import { useAuth } from '../store/auth'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'
import Avatar from '../components/Avatar'
import CountdownTimer from '../components/CountdownTimer'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const statusConfig = {
  pending: { label: 'Aguardando confirmação', color: 'bg-amber-100 text-amber-700' },
  open: { label: 'Aberta para participação', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Encerrada', color: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-500' },
}

const historyIcon = {
  closed: <CheckCircle size={14} className="text-green-500" />,
  cancelled: <XCircle size={14} className="text-red-400" />,
  open: <CheckCircle size={14} className="text-green-500" />,
  pending: <ChevronRight size={14} className="text-amber-400" />,
}

export default function Home() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [quantity, setQuantity] = useState(1)

  // Today's round
  const { data: round, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['round', 'today'],
    queryFn: getTodayRound,
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
    refetchInterval: (query) =>
      query.state.data?.status === 'open' ? 30_000 : false,
  })

  // Payer name (depends on round.payer_id)
  const { data: payerScore } = useQuery({
    queryKey: ['score', round?.payer_id],
    queryFn: () => getUserScore(round!.payer_id),
    enabled: !!round?.payer_id,
  })

  // User's own score
  const { data: myScore } = useQuery({
    queryKey: ['score', user!.id],
    queryFn: () => getUserScore(user!.id),
  })

  // Participations (open or closed)
  const { data: participations } = useQuery({
    queryKey: ['participations', round?.id],
    queryFn: () => getParticipations(round!.id),
    enabled: !!round?.id && (round.status === 'open' || round.status === 'closed'),
    refetchInterval: round?.status === 'open' ? 30_000 : false,
  })

  // Recent history (last 5)
  const { data: history } = useQuery({
    queryKey: ['rounds'],
    queryFn: getRounds,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['round', 'today'] })
    if (round?.id) qc.invalidateQueries({ queryKey: ['participations', round.id] })
  }

  const confirmMut = useMutation({
    mutationFn: () => confirmRound(round!.id),
    onSuccess: () => { invalidate(); toast.success('Rodada confirmada!') },
    onError: () => toast.error('Erro ao confirmar rodada.'),
  })
  const cancelMut = useMutation({
    mutationFn: () => cancelRound(round!.id),
    onSuccess: () => { invalidate(); toast.success('Rodada cancelada.') },
    onError: () => toast.error('Erro ao cancelar rodada.'),
  })
  const participateMut = useMutation({
    mutationFn: () => participate(round!.id, quantity),
    onSuccess: () => { invalidate(); toast.success('Participação confirmada! 🧀') },
    onError: () => toast.error('Erro ao participar.'),
  })
  const removeMut = useMutation({
    mutationFn: () => removeParticipation(round!.id),
    onSuccess: () => { invalidate(); toast.success('Participação removida.') },
    onError: () => toast.error('Erro ao remover participação.'),
  })

  const recentHistory = history
    ?.filter((r) => r.id !== round?.id)
    .slice(0, 5)

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-400 to-amber-500 px-4 pt-10 pb-6">
        <p className="text-amber-100 text-sm">{greeting()},</p>
        <h1 className="text-2xl font-bold text-white">{user?.name.split(' ')[0]} 👋</h1>
        {myScore && (
          <div className="mt-3 flex items-center gap-4">
            <div className="bg-white/20 rounded-2xl px-3 py-1.5 text-sm text-white">
              Score <strong>{myScore.score.toFixed(1)}</strong>
            </div>
            {myScore.current_streak > 0 && (
              <div className="bg-white/20 rounded-2xl px-3 py-1.5 text-sm text-white">
                🔥 {myScore.current_streak} em sequência
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Today's round card */}
        {isLoading && (
          <div className="bg-white rounded-3xl shadow-md p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {isError && (() => {
          const is404 = (error as any)?.response?.status === 404
          if (is404) return (
            <div className="bg-white rounded-3xl shadow-md p-6 text-center">
              <p className="text-4xl mb-2">🧀</p>
              <p className="font-medium text-gray-700">Nenhuma rodada hoje</p>
              <p className="text-sm text-gray-400 mt-1">Volte amanhã!</p>
            </div>
          )
          return <ErrorMessage onRetry={refetch} />
        })()}

        {round && (() => {
          const sc = statusConfig[round.status]
          const payerName = payerScore?.user_name ?? round.payer_id
          return (
            <div className="bg-white rounded-3xl shadow-md overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.color}`}>
                    {sc.label}
                  </span>
                  {round.status === 'open' && round.closes_at && (
                    <CountdownTimer closesAt={round.closes_at} />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Avatar name={payerName} size="lg" />
                  <div>
                    <p className="text-xs text-gray-500">Pagador de hoje</p>
                    <p className="font-semibold text-gray-900">{payerName}</p>
                    {round.is_payer && (
                      <p className="text-xs text-amber-600 font-medium">Você é o pagador! 🎉</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {round.status === 'pending' && round.is_payer && (
                <div className="px-4 pb-4 flex gap-3">
                  <button
                    onClick={() => confirmMut.mutate()}
                    disabled={confirmMut.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-2xl font-medium disabled:opacity-50 hover:bg-amber-600 transition-colors"
                  >
                    <CheckCircle size={18} /> Confirmar
                  </button>
                  <button
                    onClick={() => cancelMut.mutate()}
                    disabled={cancelMut.isPending}
                    className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-500 py-3 rounded-2xl font-medium disabled:opacity-50 hover:bg-red-50 transition-colors"
                  >
                    <XCircle size={18} /> Cancelar
                  </button>
                </div>
              )}

              {round.status === 'pending' && !round.is_payer && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-400 text-center py-2">
                    Aguardando confirmação do pagador…
                  </p>
                </div>
              )}

              {round.status === 'open' && (
                <div className="border-t border-gray-50 px-4 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <label htmlFor="qty" className="text-sm text-gray-600 whitespace-nowrap">Quantidade:</label>
                    <input
                      id="qty"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-16 border border-gray-200 rounded-xl px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    {participations && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                        <Users size={13} />
                        {participations.participations.length} participando
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => participateMut.mutate()}
                      disabled={participateMut.isPending}
                      className="flex-1 bg-amber-500 text-white py-3 rounded-2xl text-sm font-semibold disabled:opacity-50 hover:bg-amber-600 transition-colors"
                    >
                      Participar
                    </button>
                    <button
                      onClick={() => removeMut.mutate()}
                      disabled={removeMut.isPending}
                      className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}

              {round.status === 'cancelled' && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-400 text-center py-2">Rodada cancelada.</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Participants list (open or closed) */}
        {participations && participations.participations.length > 0 && (
          <div className="bg-white rounded-3xl shadow-md px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Participantes</p>
              <span className="text-xs text-gray-400">{participations.total_quantity} pãezinhos</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {participations.participations.map((p) => (
                <div key={p.user_id} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2.5 py-1">
                  <Avatar name={p.name} size="sm" />
                  <span className="text-xs text-gray-700">{p.name.split(' ')[0]}</span>
                  <span className="text-xs text-gray-400">×{p.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent history */}
        {recentHistory && recentHistory.length > 0 && (
          <div className="bg-white rounded-3xl shadow-md px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={15} className="text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">Histórico recente</p>
            </div>
            <ul className="space-y-2">
              {recentHistory.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {historyIcon[r.status]}
                    <span className="text-gray-600">
                      {new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{statusConfig[r.status]?.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
