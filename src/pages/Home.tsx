import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTodayRound,
  confirmRound,
  cancelRound,
  participate,
  removeParticipation,
  getParticipations,
} from '../api/rounds'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

export default function Home() {
  const qc = useQueryClient()
  const [quantity, setQuantity] = useState(1)

  const {
    data: round,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['round', 'today'],
    queryFn: getTodayRound,
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
  })

  const { data: participations } = useQuery({
    queryKey: ['participations', round?.id],
    queryFn: () => getParticipations(round!.id),
    enabled: round?.status === 'closed' || round?.status === 'open',
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['round', 'today'] })
  const confirmMut = useMutation({ mutationFn: () => confirmRound(round!.id), onSuccess: invalidate })
  const cancelMut = useMutation({ mutationFn: () => cancelRound(round!.id), onSuccess: invalidate })
  const participateMut = useMutation({ mutationFn: () => participate(round!.id, quantity), onSuccess: invalidate })
  const removeMut = useMutation({ mutationFn: () => removeParticipation(round!.id), onSuccess: invalidate })

  if (isLoading)
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )

  if (isError) {
    const is404 = (error as any)?.response?.status === 404
    if (is404)
      return (
        <div className="p-4 pt-8 text-center">
          <p className="text-4xl mb-2">🧀</p>
          <p className="text-gray-600">Nenhuma rodada hoje.</p>
        </div>
      )
    return <ErrorMessage onRetry={refetch} />
  }

  if (!round) return null

  const statusLabel: Record<string, string> = {
    pending: 'Pendente',
    open: 'Aberta para participação',
    closed: 'Encerrada',
    cancelled: 'Cancelada',
  }

  return (
    <div className="p-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Rodada de hoje</h1>

      <div className="bg-white rounded-2xl shadow p-4 space-y-2">
        <span className="inline-block text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
          {statusLabel[round.status]}
        </span>
        {round.closes_at && (
          <p className="text-xs text-gray-400">
            Fecha às{' '}
            {new Date(round.closes_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {round.status === 'pending' && round.is_payer && (
        <div className="flex gap-3">
          <button
            onClick={() => confirmMut.mutate()}
            disabled={confirmMut.isPending}
            className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
          >
            Confirmar
          </button>
          <button
            onClick={() => cancelMut.mutate()}
            disabled={cancelMut.isPending}
            className="flex-1 border border-red-400 text-red-500 py-3 rounded-xl font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {round.status === 'pending' && !round.is_payer && (
        <p className="text-gray-500 text-sm text-center py-4">
          Aguardando o pagador confirmar…
        </p>
      )}

      {round.status === 'open' && (
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Sua participação</p>
          <div className="flex items-center gap-3">
            <label htmlFor="qty" className="text-sm text-gray-600">Quantidade:</label>
            <input
              id="qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-16 border rounded-lg px-2 py-1 text-center text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => participateMut.mutate()}
              disabled={participateMut.isPending}
              className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              Participar
            </button>
            <button
              onClick={() => removeMut.mutate()}
              disabled={removeMut.isPending}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              Cancelar participação
            </button>
          </div>
        </div>
      )}

      {round.status === 'closed' && participations && (
        <div className="bg-white rounded-2xl shadow p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Participantes ({participations.total_quantity} pãezinhos)
          </p>
          <ul className="space-y-1">
            {participations.participations.map((p) => (
              <li key={p.user_id} className="flex justify-between text-sm text-gray-600">
                <span>{p.name}</span>
                <span>{p.quantity}x</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {round.status === 'cancelled' && (
        <p className="text-center text-gray-500 text-sm py-4">Rodada cancelada.</p>
      )}
    </div>
  )
}
