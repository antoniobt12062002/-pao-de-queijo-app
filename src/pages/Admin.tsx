import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfigs, updateConfig } from '../api/config'
import { getRotation, skipRotation } from '../api/rotation'
import { useAuth } from '../store/auth'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

export default function Admin() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  return <AdminContent />
}

const configLabels: Record<string, string> = {
  notify_at: 'Horário de notificação (HH:MM)',
  round_window_minutes: 'Janela de participação (minutos)',
  price_per_unit: 'Preço por unidade (R$)',
}

function AdminContent() {
  const qc = useQueryClient()
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data: configs, isLoading: loadingConfig, isError, refetch } = useQuery({
    queryKey: ['config'],
    queryFn: getConfigs,
  })

  const { data: rotation, isLoading: loadingRotation } = useQuery({
    queryKey: ['rotation'],
    queryFn: getRotation,
  })

  const updateMut = useMutation({
    mutationFn: () => updateConfig(editKey!, editValue),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config'] })
      setEditKey(null)
    },
  })

  const skipMut = useMutation({
    mutationFn: skipRotation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rotation'] }),
  })

  if (loadingConfig || loadingRotation)
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  return (
    <div className="p-4 pt-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Administração</h1>

      <section className="bg-white rounded-2xl shadow p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Configurações</h2>
        {configs?.map((c) => (
          <div key={c.key} className="space-y-1">
            <p className="text-xs text-gray-500">{configLabels[c.key] ?? c.key}</p>
            {editKey === c.key ? (
              <div className="flex gap-2">
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 border rounded-lg px-2 py-1 text-sm"
                />
                <button
                  onClick={() => updateMut.mutate()}
                  disabled={updateMut.isPending}
                  className="text-sm bg-amber-500 text-white px-3 py-1 rounded-lg disabled:opacity-50"
                >
                  Salvar
                </button>
                <button onClick={() => setEditKey(null)} className="text-sm text-gray-400 px-2">
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditKey(c.key); setEditValue(c.value) }}
                className="text-sm text-gray-800 hover:text-amber-500 text-left"
              >
                {c.value}
              </button>
            )}
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl shadow p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Fila de Pagamento</h2>
        <button
          onClick={() => skipMut.mutate()}
          disabled={skipMut.isPending}
          className="w-full border border-amber-400 text-amber-600 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
        >
          Avançar posição (skip)
        </button>
        <ul className="space-y-1 pt-1">
          {rotation?.members.map((m, i) => (
            <li key={m.user_id} className="text-sm text-gray-600 flex gap-2">
              <span className="text-gray-400">{i + 1}.</span> {m.user_id}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
