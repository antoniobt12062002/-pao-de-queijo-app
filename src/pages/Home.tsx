import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Users, CalendarDays, Trophy, RotateCcw, ChevronRight } from 'lucide-react'
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
import { getRotation } from '../api/rotation'
import { getUsers } from '../api/users'
import { useAuth } from '../store/auth'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'
import Avatar from '../components/Avatar'
import CountdownTimer from '../components/CountdownTimer'
import PullToRefresh from '../components/PullToRefresh'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const statusConfig = {
  pending: { label: 'Aguardando confirmação', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', border: 'border-l-amber-400' },
  open: { label: 'Aberta para participação', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400', border: 'border-l-emerald-400' },
  closed: { label: 'Encerrada', bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300', border: 'border-l-slate-300' },
  cancelled: { label: 'Cancelada', bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400', border: 'border-l-red-400' },
}

export default function Home() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const { data: round, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['round', 'today'],
    queryFn: getTodayRound,
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
    refetchInterval: (query) =>
      query.state.data?.status === 'open' ? 30_000 : false,
  })

  const { data: payerScore } = useQuery({
    queryKey: ['score', round?.payer_id],
    queryFn: () => getUserScore(round!.payer_id),
    enabled: !!round?.payer_id,
  })

  const { data: myScore } = useQuery({
    queryKey: ['score', user!.id],
    queryFn: () => getUserScore(user!.id),
  })

  const { data: participations } = useQuery({
    queryKey: ['participations', round?.id],
    queryFn: () => getParticipations(round!.id),
    enabled: !!round?.id && (round.status === 'open' || round.status === 'closed'),
    refetchInterval: round?.status === 'open' ? 30_000 : false,
  })

  const { data: history } = useQuery({
    queryKey: ['rounds'],
    queryFn: getRounds,
  })

  const { data: rotation } = useQuery({
    queryKey: ['rotation'],
    queryFn: getRotation,
  })
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const getUserName = (id: string) => users?.find((u) => u.id === id)?.name ?? id

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
  const recentHistory = history?.filter((r) => r.id !== round?.id).slice(0, 5)

  const handleRefresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['round', 'today'] }),
      qc.invalidateQueries({ queryKey: ['rounds'] }),
      qc.invalidateQueries({ queryKey: ['rotation'] }),
      qc.invalidateQueries({ queryKey: ['score', user!.id] }),
    ])
  }

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="px-4 pt-6 pb-4 space-y-4 animate-fade-in">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium capitalize">{today}</p>
            <h1 className="text-xl font-bold text-slate-900">{greeting()}, {user?.name.split(' ')[0]}</h1>
          </div>
          {myScore && (
            <div className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <Trophy size={11} />
              {myScore.score.toFixed(0)} pts
            </div>
          )}
        </div>

        {/* Today's round */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {isError && (() => {
          const is404 = (error as any)?.response?.status === 404
          if (is404) return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🧀</div>
              <p className="font-semibold text-slate-700">Nenhuma rodada hoje</p>
              <p className="text-sm text-slate-400 mt-1">Volte amanhã!</p>
            </div>
          )
          return <ErrorMessage onRetry={refetch} />
        })()}

        {round && (() => {
          const sc = statusConfig[round.status]
          const payerName = payerScore?.user_name ?? round.payer_id
          return (
            <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-l-4 ${sc.border}`}>
              <div className="px-5 pt-5 pb-4">
                {/* Status + countdown */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                  {round.status === 'open' && round.closes_at && (
                    <CountdownTimer closesAt={round.closes_at} />
                  )}
                </div>

                {/* Payer */}
                <div className="flex items-center gap-4">
                  <Avatar name={payerName} size="lg" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Pagador</p>
                    <p className="font-bold text-slate-900 text-base">{payerName}</p>
                    {round.is_payer && (
                      <p className="text-xs text-amber-500 font-semibold mt-0.5">Você é o pagador hoje 🎉</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {round.status === 'pending' && round.is_payer && (
                <div className="px-5 pb-5 flex gap-3">
                  <button
                    onClick={() => confirmMut.mutate()}
                    disabled={confirmMut.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-amber-600 transition-colors active:scale-[0.98]"
                  >
                    <CheckCircle size={16} /> Confirmar pagamento
                  </button>
                  <button
                    onClick={() => cancelMut.mutate()}
                    disabled={cancelMut.isPending}
                    className="flex items-center justify-center gap-2 border border-slate-200 text-slate-500 px-4 py-3 rounded-xl font-medium text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors active:scale-[0.98]"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}

              {round.status === 'pending' && !round.is_payer && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-400 text-center py-1">Aguardando confirmação do pagador…</p>
                </div>
              )}

              {round.status === 'open' && (
                <div className="border-t border-slate-50 px-5 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-500 font-medium">Qtd</span>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-10 bg-transparent text-center text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    {participations && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
                        <Users size={12} />
                        {participations.participations.length} participando · {participations.total_quantity} pãezinhos
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => participateMut.mutate()}
                      disabled={participateMut.isPending}
                      className="flex-1 bg-amber-500 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-amber-600 transition-colors active:scale-[0.98]"
                    >
                      Participar
                    </button>
                    <button
                      onClick={() => removeMut.mutate()}
                      disabled={removeMut.isPending}
                      className="px-4 border border-slate-200 text-slate-500 py-3 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors active:scale-[0.98]"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}

              {round.status === 'cancelled' && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-400 text-center py-1">Rodada cancelada.</p>
                </div>
              )}

              {round.status === 'closed' && round.actual_cost != null && (
                <div className="border-t border-slate-50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Custo total</span>
                    <span className="font-bold text-amber-600">R$ {round.actual_cost.toFixed(2)}</span>
                  </div>
                </div>
              )}

            </div>
          )
        })()}

        {/* Participations list */}
        {participations && participations.participations.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Participantes</p>
            <div className="flex flex-wrap gap-2">
              {participations.participations.map((p) => (
                <div key={p.user_id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5">
                  <Avatar name={p.name} size="sm" />
                  <span className="text-xs font-medium text-slate-700">{p.name.split(' ')[0]}</span>
                  <span className="text-xs text-slate-400 font-medium">×{p.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent history */}
        {recentHistory && recentHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Histórico recente</p>
            </div>
            <ul className="space-y-0">
              {recentHistory.map((r, i) => {
                const sc = statusConfig[r.status]
                return (
                  <li
                    key={r.id}
                    className={`flex items-center justify-between py-2.5 ${i < recentHistory.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                      <span className="text-sm text-slate-700 font-medium">
                        {new Date(r.date.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.actual_cost != null && (
                        <span className="text-xs font-semibold text-amber-600">R$ {r.actual_cost.toFixed(2)}</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !round && (!recentHistory || recentHistory.length === 0) && (
          <div className="space-y-3">
            {rotation && rotation.current_payer_id && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw size={14} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Próximo pagador</p>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar name={getUserName(rotation.current_payer_id)} size="lg" />
                  <div>
                    <p className="font-bold text-slate-900">{getUserName(rotation.current_payer_id)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Na vez quando a rodada abrir</p>
                  </div>
                </div>
              </div>
            )}

            {myScore && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy size={14} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Suas estatísticas</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: myScore.times_paid, label: 'Pagou' },
                    { value: myScore.times_participated, label: 'Participou' },
                    { value: myScore.score.toFixed(0), label: 'Score' },
                  ].map(({ value, label }) => (
                    <div key={label} className="bg-slate-50 rounded-xl py-3 text-center">
                      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-sm text-slate-400">Nenhuma rodada registrada ainda.</p>
              <ChevronRight size={14} className="text-slate-300 mx-auto mt-1" />
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}
