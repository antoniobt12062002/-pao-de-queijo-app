import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings, UserPlus, Trash2, ChevronUp, ChevronDown, Shield, User,
  AlertTriangle, XCircle, Calendar, UserCheck, Bell, RefreshCw,
  History, CheckCircle2, Clock, Ban, UserX, UserCheck2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getConfigs, updateConfig } from '../api/config'
import { getRotation, updateRotationOrder, skipRotation } from '../api/rotation'
import { getUsers, updateUserRole, deactivateUser, activateUser } from '../api/users'
import { getTodayRound, adminCreateRound, adminForceCloseRound, adminChangePayer, adminTriggerRound, getRoundsAdmin } from '../api/rounds'
import { adminSendNotification } from '../api/admin'
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

const statusConfig = {
  pending:   { label: 'Aguardando', icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50' },
  open:      { label: 'Aberta',     icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  closed:    { label: 'Encerrada',  icon: CheckCircle2,  color: 'text-slate-500',   bg: 'bg-slate-50' },
  cancelled: { label: 'Cancelada',  icon: Ban,           color: 'text-red-500',     bg: 'bg-red-50' },
} as const

function Section({ title, icon: Icon, iconColor, children }: {
  title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
        <Icon size={15} className={iconColor} />
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </section>
  )
}

function AdminContent() {
  const qc = useQueryClient()
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [createDate, setCreateDate] = useState('')
  const [createTime, setCreateTime] = useState('')
  const [createPayerId, setCreatePayerId] = useState('')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [notifTargets, setNotifTargets] = useState<string[]>([])
  const [historyFilter, setHistoryFilter] = useState('all')

  const { data: configs, isLoading: loadingConfig, isError, refetch } = useQuery({ queryKey: ['config'], queryFn: getConfigs })
  const { data: rotation, isLoading: loadingRotation } = useQuery({ queryKey: ['rotation'], queryFn: getRotation })
  const { data: users, isLoading: loadingUsers } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const { data: todayRound, isLoading: loadingToday } = useQuery({
    queryKey: ['round', 'today'], queryFn: getTodayRound,
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
  })
  const { data: roundsData } = useQuery({ queryKey: ['rounds', 'admin'], queryFn: () => getRoundsAdmin(1, 50) })

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
  const activateMut = useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuário reativado!') },
    onError: () => toast.error('Erro ao reativar usuário.'),
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
  const triggerMut = useMutation({
    mutationFn: adminTriggerRound,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['round', 'today'] }); toast.success('Cron disparado!') },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Erro ao disparar cron.'),
  })
  const forceCloseMut = useMutation({
    mutationFn: (id: string) => adminForceCloseRound(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['round', 'today'] })
      qc.invalidateQueries({ queryKey: ['rounds', 'admin'] })
      toast.success('Rodada encerrada!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Erro ao encerrar rodada.'),
  })
  const changePayerMut = useMutation({
    mutationFn: ({ roundId, userId }: { roundId: string; userId: string }) => adminChangePayer(roundId, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['round', 'today'] }); toast.success('Pagador alterado!') },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Erro ao alterar pagador.'),
  })
  const createRoundMut = useMutation({
    mutationFn: () => {
      const dateTime = createTime ? `${createDate}T${createTime}` : createDate
      return adminCreateRound(createDate, createPayerId || undefined, dateTime)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['round', 'today'] })
      qc.invalidateQueries({ queryKey: ['rounds', 'admin'] })
      setCreateDate(''); setCreateTime(''); setCreatePayerId('')
      toast.success('Rodada criada!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Erro ao criar rodada.'),
  })
  const sendNotifMut = useMutation({
    mutationFn: () => adminSendNotification(notifTargets, notifTitle, notifBody),
    onSuccess: (res) => {
      toast.success(`Notificação enviada para ${res.recipients} usuário(s)!`)
      setNotifTitle(''); setNotifBody(''); setNotifTargets([])
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Erro ao enviar notificação.'),
  })

  if (loadingConfig || loadingRotation || loadingUsers)
    return <div className="p-4 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /></div>
  if (isError) return <ErrorMessage onRetry={refetch} />

  const sortedMembers = (rotation?.members ?? []).slice().sort((a, b) => a.position - b.position)
  const memberIds = sortedMembers.map((m) => m.user_id)
  const activeUsers = (users ?? []).filter((u) => u.active)
  const inactiveUsers = (users ?? []).filter((u) => !u.active)
  const getUserName = (id: string) => users?.find((u) => u.id === id)?.name ?? id
  const nonMembers = activeUsers.filter((u) => !memberIds.includes(u.id))

  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...memberIds];[next[i - 1], next[i]] = [next[i], next[i - 1]]
    updateOrderMut.mutate(next)
  }
  const moveDown = (i: number) => {
    if (i === memberIds.length - 1) return
    const next = [...memberIds];[next[i], next[i + 1]] = [next[i + 1], next[i]]
    updateOrderMut.mutate(next)
  }
  const addMember = (id: string) => updateOrderMut.mutate([...memberIds, id])
  const removeMember = (id: string) => updateOrderMut.mutate(memberIds.filter((x) => x !== id))
  const toggleTarget = (id: string) =>
    setNotifTargets((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const filteredRounds = (roundsData?.data ?? []).filter(
    (r) => historyFilter === 'all' || r.status === historyFilter
  )

  return (
    <div className="px-4 pt-6 pb-24 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Administração</h1>
        <Settings size={18} className="text-amber-500" />
      </div>

      {/* Notificação manual */}
      <Section title="Enviar Notificação" icon={Bell} iconColor="text-violet-500">
        <input
          placeholder="Título"
          value={notifTitle}
          onChange={(e) => setNotifTitle(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
        <textarea
          placeholder="Mensagem"
          value={notifBody}
          onChange={(e) => setNotifBody(e.target.value)}
          rows={2}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
        />
        <div>
          <p className="text-xs text-slate-400 mb-2">
            Destinatários {notifTargets.length === 0 ? '(todos os ativos)' : `(${notifTargets.length} selecionado(s))`}
          </p>
          <div className="flex flex-wrap gap-2">
            {activeUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => toggleTarget(u.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  notifTargets.includes(u.id)
                    ? 'bg-violet-500 text-white border-violet-500'
                    : 'border-slate-200 text-slate-600 hover:border-violet-300'
                }`}
              >
                {u.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => sendNotifMut.mutate()}
          disabled={!notifTitle || !notifBody || sendNotifMut.isPending}
          className="w-full bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-violet-600 transition-colors"
        >
          {sendNotifMut.isPending ? 'Enviando…' : 'Enviar notificação'}
        </button>
      </Section>

      {/* Contingência */}
      <Section title="Contingência — Rodada de hoje" icon={AlertTriangle} iconColor="text-orange-500">
        <button
          onClick={() => triggerMut.mutate()}
          disabled={triggerMut.isPending}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} className={triggerMut.isPending ? 'animate-spin' : ''} />
          Disparar cron agora
        </button>

        {loadingToday ? <Skeleton className="h-10 w-full" /> : !todayRound ? (
          <p className="text-sm text-slate-400">Nenhuma rodada hoje.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Status: <span className="font-semibold text-slate-700">{todayRound.status}</span>
              {' · '}Pagador: <span className="font-semibold text-slate-700">{getUserName(todayRound.payer_id)}</span>
            </p>
            {(todayRound.status === 'pending' || todayRound.status === 'open') && (
              <div className="flex gap-2">
                <select
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) changePayerMut.mutate({ roundId: todayRound.id, userId: e.target.value })
                    e.target.value = ''
                  }}
                >
                  <option value="" disabled>Trocar pagador…</option>
                  {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <UserCheck size={18} className="text-slate-400 self-center flex-shrink-0" />
              </div>
            )}
            {todayRound.status === 'open' && (
              <button
                onClick={() => forceCloseMut.mutate(todayRound.id)}
                disabled={forceCloseMut.isPending}
                className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-red-50 transition-colors"
              >
                <XCircle size={14} />
                {forceCloseMut.isPending ? 'Encerrando…' : 'Forçar encerramento'}
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Criar rodada */}
      <Section title="Criar rodada para data específica" icon={Calendar} iconColor="text-blue-500">
        <div className="flex gap-2">
          <input
            type="date"
            value={createDate}
            onChange={(e) => setCreateDate(e.target.value)}
            className="flex-1 min-w-0 h-11 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <input
            type="time"
            value={createTime}
            onChange={(e) => setCreateTime(e.target.value)}
            className="w-28 h-11 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <select
          value={createPayerId}
          onChange={(e) => setCreatePayerId(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">Pagador: usar rotação atual</option>
          {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <button
          onClick={() => createRoundMut.mutate()}
          disabled={!createDate || createRoundMut.isPending}
          className="w-full bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors"
        >
          {createRoundMut.isPending ? 'Criando…' : 'Criar rodada'}
        </button>
      </Section>

      {/* Histórico de rodadas */}
      <Section title="Histórico de rodadas" icon={History} iconColor="text-slate-500">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'open', 'closed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setHistoryFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                historyFilter === f
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              {f === 'all' ? 'Todas' : statusConfig[f].label}
            </button>
          ))}
        </div>
        <div className="space-y-0 max-h-72 overflow-y-auto">
          {filteredRounds.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">Nenhuma rodada.</p>
          ) : filteredRounds.map((r, i) => {
            const sc = statusConfig[r.status]
            const Icon = sc.icon
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between py-2.5 ${i < filteredRounds.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(r.date.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-xs text-slate-400">{getUserName(r.payer_id)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.actual_cost != null && (
                    <span className="text-xs font-semibold text-amber-600">R$ {r.actual_cost.toFixed(2)}</span>
                  )}
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                    <Icon size={10} />
                    {sc.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 text-right">Total: {roundsData?.total ?? 0} rodadas</p>
      </Section>

      {/* Fila de pagamento */}
      <Section title="Fila de Pagamento" icon={RefreshCw} iconColor="text-amber-500">
        {sortedMembers.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum membro na fila.</p>
        ) : (
          <ul className="space-y-2">
            {sortedMembers.map((m, i) => (
              <li key={m.user_id} className="flex items-center gap-2">
                <span className="text-slate-400 text-xs w-4">{i + 1}.</span>
                <span className="flex-1 text-sm text-slate-800">{getUserName(m.user_id)}</span>
                <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 text-slate-400 disabled:opacity-20 hover:text-amber-500">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveDown(i)} disabled={i === sortedMembers.length - 1} className="p-1 text-slate-400 disabled:opacity-20 hover:text-amber-500">
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => removeMember(m.user_id)} className="p-1 text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => skipMut.mutate()}
          disabled={skipMut.isPending || sortedMembers.length === 0}
          className="w-full border border-amber-300 text-amber-600 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-amber-50 transition-colors"
        >
          Avançar posição (skip)
        </button>
        {nonMembers.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xs text-slate-400">Adicionar à fila</p>
            {nonMembers.map((u) => (
              <button
                key={u.id}
                onClick={() => addMember(u.id)}
                disabled={updateOrderMut.isPending}
                className="w-full flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-2 hover:bg-amber-50 hover:border-amber-300 transition-colors disabled:opacity-50"
              >
                <UserPlus size={14} className="text-amber-500" />
                {u.name}
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* Usuários */}
      <Section title="Usuários" icon={User} iconColor="text-slate-500">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Ativos</p>
        <ul className="space-y-2">
          {activeUsers.map((u) => (
            <li key={u.id} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-slate-800 truncate">{u.name}</span>
              <span className="text-xs text-slate-400 truncate max-w-[100px] hidden sm:block">{u.email}</span>
              <button
                onClick={() => updateRoleMut.mutate({ id: u.id, role: u.role === 'admin' ? 'dev' : 'admin' })}
                disabled={updateRoleMut.isPending}
                title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  u.role === 'admin' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {u.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
              </button>
              <button
                onClick={() => { if (confirm(`Desativar ${u.name}?`)) deactivateMut.mutate(u.id) }}
                disabled={deactivateMut.isPending}
                title="Desativar usuário"
                className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <UserX size={14} />
              </button>
            </li>
          ))}
        </ul>
        {inactiveUsers.length > 0 && (
          <>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide pt-2 border-t border-slate-50">Desativados</p>
            <ul className="space-y-2">
              {inactiveUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-2 opacity-60">
                  <span className="flex-1 text-sm text-slate-600 truncate">{u.name}</span>
                  <button
                    onClick={() => activateMut.mutate(u.id)}
                    disabled={activateMut.isPending}
                    title="Reativar usuário"
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <UserCheck2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      {/* Configurações */}
      <Section title="Configurações do sistema" icon={Settings} iconColor="text-slate-500">
        {configs?.map((c) => (
          <div key={c.key} className="space-y-1">
            <p className="text-xs text-slate-400">{configLabels[c.key] ?? c.key}</p>
            {editKey === c.key ? (
              <div className="flex gap-2">
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  onClick={() => updateMut.mutate({ key: editKey!, value: editValue })}
                  disabled={updateMut.isPending}
                  className="text-sm bg-amber-500 text-white px-3 py-1.5 rounded-xl disabled:opacity-50 hover:bg-amber-600 transition-colors"
                >
                  Salvar
                </button>
                <button onClick={() => setEditKey(null)} className="text-sm text-slate-400 px-2">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditKey(c.key); setEditValue(c.value) }}
                className="text-sm text-slate-800 hover:text-amber-500 text-left font-medium"
              >
                {c.value}
              </button>
            )}
          </div>
        ))}
      </Section>
    </div>
  )
}
