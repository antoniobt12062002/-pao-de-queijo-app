import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, UserPlus, Trash2, ChevronUp, ChevronDown, Shield, User, AlertTriangle, XCircle, Calendar, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { getConfigs, updateConfig } from '../api/config'
import { getRotation, updateRotationOrder, skipRotation } from '../api/rotation'
import { getUsers, updateUserRole, deactivateUser } from '../api/users'
import { getTodayRound, adminCreateRound, adminForceCloseRound, adminChangePayer } from '../api/rounds'
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
  const [createDate, setCreateDate] = useState('')
  const [createPayerId, setCreatePayerId] = useState('')

  const { data: configs, isLoading: loadingConfig, isError, refetch } = useQuery({
    queryKey: ['config'],
    queryFn: getConfigs,
  })

  const { data: rotation, isLoading: loadingRotation, isError: isRotationError } = useQuery({
    queryKey: ['rotation'],
    queryFn: getRotation,
  })

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const { data: todayRound, isLoading: loadingToday } = useQuery({
    queryKey: ['round', 'today'],
    queryFn: getTodayRound,
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
  })

  // --- mutations ---
  const updateMut = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateConfig(key, value),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config'] }); setEditKey(null); toast.success('Configuração salva!') },
    onError: () => toast.error('Erro ao salvar configuração.'),
  })

  const updateRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'dev' }) => updateUserRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Papel atualizado!') },
    onError: () => toast.error('Erro ao atualizar papel.'),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuário desativado.') },
    onError: () => toast.error('Erro ao desativar usuário.'),
  })

  const updateOrderMut = useMutation({
    mutationFn: (userIds: string[]) => updateRotationOrder(userIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rotation'] }); toast.success('Rotação atualizada!') },
    onError: () => toast.error('Erro ao atualizar rotação.'),
  })

  const skipMut = useMutation({
    mutationFn: skipRotation,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rotation'] }); toast.success('Posição avançada!') },
    onError: () => toast.error('Erro ao avançar posição.'),
  })

  const forceCloseMut = useMutation({
    mutationFn: (id: string) => adminForceCloseRound(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['round', 'today'] }); toast.success('Rodada encerrada!') },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Erro ao encerrar rodada.'),
  })

  const changePayerMut = useMutation({
    mutationFn: ({ roundId, userId }: { roundId: string; userId: string }) => adminChangePayer(roundId, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['round', 'today'] }); toast.success('Pagador alterado!') },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Erro ao alterar pagador.'),
  })

  const createRoundMut = useMutation({
    mutationFn: () => adminCreateRound(createDate, createPayerId || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['round', 'today'] })
      qc.invalidateQueries({ queryKey: ['rounds'] })
      setCreateDate('')
      setCreatePayerId('')
      toast.success('Rodada criada!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Erro ao criar rodada.'),
  })

  if (loadingConfig || loadingRotation || loadingUsers)
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )

  if (isError || isRotationError) return <ErrorMessage onRetry={refetch} />

  const sortedMembers = (rotation?.members ?? []).slice().sort((a, b) => a.position - b.position)
  const memberIds = sortedMembers.map((m) => m.user_id)
  const activeUsers = (users ?? []).filter((u) => u.active)
  const getUserName = (id: string) => users?.find((u) => u.id === id)?.name ?? id
  const nonMembers = activeUsers.filter((u) => !memberIds.includes(u.id))

  const moveUp = (index: number) => {
    if (index === 0) return
    const next = [...memberIds];[next[index - 1], next[index]] = [next[index], next[index - 1]]
    updateOrderMut.mutate(next)
  }
  const moveDown = (index: number) => {
    if (index === memberIds.length - 1) return
    const next = [...memberIds];[next[index], next[index + 1]] = [next[index + 1], next[index]]
    updateOrderMut.mutate(next)
  }
  const addMember = (userId: string) => updateOrderMut.mutate([...memberIds, userId])
  const removeMember = (userId: string) => updateOrderMut.mutate(memberIds.filter((id) => id !== userId))

  return (
    <div className="p-4 pt-6 space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-800">Administração</h1>
      </div>

      {/* Configurações */}
      <section className="bg-white rounded-3xl shadow-md p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Configurações</h2>
        {configs?.map((c) => (
          <div key={c.key} className="space-y-1">
            <p className="text-xs text-gray-500">{configLabels[c.key] ?? c.key}</p>
            {editKey === c.key ? (
              <div className="flex gap-2">
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button onClick={() => updateMut.mutate({ key: editKey!, value: editValue })} disabled={updateMut.isPending}
                  className="text-sm bg-amber-500 text-white px-3 py-1 rounded-xl disabled:opacity-50 hover:bg-amber-600 transition-colors">
                  Salvar
                </button>
                <button onClick={() => setEditKey(null)} className="text-sm text-gray-400 px-2">✕</button>
              </div>
            ) : (
              <button onClick={() => { setEditKey(c.key); setEditValue(c.value) }}
                className="text-sm text-gray-800 hover:text-amber-500 text-left">
                {c.value}
              </button>
            )}
          </div>
        ))}
      </section>

      {/* Contingência: Rodada de hoje */}
      <section className="bg-white rounded-3xl shadow-md p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-700">Contingência — Rodada de hoje</h2>
        </div>

        {loadingToday ? (
          <Skeleton className="h-10 w-full" />
        ) : !todayRound ? (
          <p className="text-sm text-gray-400">Nenhuma rodada hoje.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Status: <span className="font-medium text-gray-700">{todayRound.status}</span>
              {' · '}Pagador: <span className="font-medium text-gray-700">{getUserName(todayRound.payer_id)}</span>
            </p>

            {/* Trocar pagador */}
            {(todayRound.status === 'pending' || todayRound.status === 'open') && (
              <div className="flex gap-2">
                <select
                  className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) changePayerMut.mutate({ roundId: todayRound.id, userId: e.target.value })
                    e.target.value = ''
                  }}
                >
                  <option value="" disabled>Trocar pagador…</option>
                  {activeUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <UserCheck className="w-5 h-5 text-gray-400 self-center flex-shrink-0" />
              </div>
            )}

            {/* Forçar encerramento */}
            {todayRound.status === 'open' && (
              <button
                onClick={() => forceCloseMut.mutate(todayRound.id)}
                disabled={forceCloseMut.isPending}
                className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-500 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-50 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {forceCloseMut.isPending ? 'Encerrando…' : 'Forçar encerramento'}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Contingência: Criar rodada para data específica */}
      <section className="bg-white rounded-3xl shadow-md p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-700">Criar rodada para data específica</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={createDate}
            onChange={(e) => setCreateDate(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <select
          value={createPayerId}
          onChange={(e) => setCreatePayerId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">Pagador: usar rotação atual</option>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <button
          onClick={() => createRoundMut.mutate()}
          disabled={!createDate || createRoundMut.isPending}
          className="w-full bg-blue-500 text-white py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors"
        >
          {createRoundMut.isPending ? 'Criando…' : 'Criar rodada'}
        </button>
      </section>

      {/* Fila de pagamento */}
      <section className="bg-white rounded-3xl shadow-md p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Fila de Pagamento</h2>

        {sortedMembers.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum membro na fila.</p>
        ) : (
          <ul className="space-y-2">
            {sortedMembers.map((m, i) => (
              <li key={m.user_id} className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
                <span className="flex-1 text-sm text-gray-800">{getUserName(m.user_id)}</span>
                <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 text-gray-400 disabled:opacity-20 hover:text-amber-500">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveDown(i)} disabled={i === sortedMembers.length - 1} className="p-1 text-gray-400 disabled:opacity-20 hover:text-amber-500">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => removeMember(m.user_id)} className="p-1 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => skipMut.mutate()}
          disabled={skipMut.isPending || sortedMembers.length === 0}
          className="w-full border border-amber-400 text-amber-600 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-50 hover:bg-amber-50 transition-colors"
        >
          Avançar posição (skip)
        </button>

        {nonMembers.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-500">Adicionar à fila</p>
            {nonMembers.map((u) => (
              <button key={u.id} onClick={() => addMember(u.id)} disabled={updateOrderMut.isPending}
                className="w-full flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-2xl px-3 py-2 hover:bg-amber-50 hover:border-amber-300 transition-colors disabled:opacity-50">
                <UserPlus className="w-4 h-4 text-amber-500" />
                {u.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Usuários */}
      <section className="bg-white rounded-3xl shadow-md p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Usuários</h2>
        {(users ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum usuário.</p>
        ) : (
          <ul className="space-y-2">
            {(users ?? []).map((u) => (
              <li key={u.id} className={`flex items-center gap-2 ${!u.active ? 'opacity-40' : ''}`}>
                <span className="flex-1 text-sm text-gray-800 truncate">{u.name}</span>
                <span className="text-xs text-gray-400 truncate max-w-[110px]">{u.email}</span>
                {u.active && (
                  <>
                    <button
                      onClick={() => updateRoleMut.mutate({ id: u.id, role: u.role === 'admin' ? 'dev' : 'admin' })}
                      disabled={updateRoleMut.isPending}
                      title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${u.role === 'admin' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Desativar ${u.name}?`)) deactivateMut.mutate(u.id) }}
                      disabled={deactivateMut.isPending}
                      title="Desativar usuário"
                      className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                {!u.active && <span className="text-xs text-red-400">Desativado</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
