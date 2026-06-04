# Design: Frontend PWA — Pão de Queijo

**Data:** 2026-06-04
**Status:** Aprovado
**Repositório:** novo projeto separado (ex: `pao-de-queijo-app`)
**API base:** `http://localhost:8080/v1` (configurável via env)

---

## Visão Geral

Progressive Web App (PWA) mobile-first para consumir a API Pão de Queijo. Permite que membros do time visualizem e interajam com as rodadas diárias, participem, acompanhem o ranking de justiça e gerenciem configurações. Funciona em iOS (Safari + Add to Home Screen) e Android (Chrome/Firefox). Sempre online — sem suporte offline.

---

## Tech Stack

| Tecnologia | Uso |
|-----------|-----|
| Vite + React + TypeScript | Base do projeto |
| React Router v6 | Navegação SPA |
| Tanstack Query (React Query) | Cache e estado servidor |
| TailwindCSS + shadcn/ui | Estilo e componentes |
| Axios | HTTP client |
| vite-plugin-pwa + Workbox | Service worker, manifest, instalação |
| Firebase JS SDK | Web Push / FCM token registration |

---

## Autenticação

JWT armazenado em `localStorage`. Axios interceptor injeta `Authorization: Bearer <token>` em todas as requisições autenticadas. Em resposta `401`, limpa o token e redireciona para `/login`.

No login com sucesso, o app solicita permissão de notificação e registra o token FCM via `POST /v1/devices` com `platform: "web"`.

GitHub OAuth: botão redireciona para `GET /v1/auth/github`. O callback retorna o JWT que é salvo no `localStorage`.

---

## Estrutura de Pastas

```
src/
  api/
    auth.ts          — login, githubLogin
    rounds.ts        — getToday, getAll, confirm, cancel
    participations.ts — participate, withdraw, getParticipations
    scores.ts        — getRanking, getUserScore, getUserBadges
    devices.ts       — registerDevice
    config.ts        — getConfig, updateConfig
    rotation.ts      — getRotation, updateOrder, skip
  components/
    ui/              — shadcn/ui (Button, Card, Badge, etc.)
    RoundCard.tsx    — card da rodada do dia
    ParticipantList.tsx
    ScoreRow.tsx
    BadgeChip.tsx
    InstallPrompt.tsx — banner iOS "adicione à tela inicial"
    ProtectedRoute.tsx
    AdminRoute.tsx
  pages/
    Login/
    Home/            — rodada de hoje
    Rounds/          — histórico
    Ranking/         — scores + badges inline
    Profile/         — score detalhado + todos os badges
    admin/
      Config/
      Rotation/
  hooks/
    useAuth.ts
    useToday.ts
    useRanking.ts
    usePushNotifications.ts
  lib/
    axios.ts         — instance + interceptors
    queryClient.ts
    utils.ts
  main.tsx
  App.tsx            — router + providers
```

---

## Rotas

| Path | Componente | Auth | Role |
|------|-----------|------|------|
| `/login` | Login | — | — |
| `/` | Home | ✓ | qualquer |
| `/rounds` | Rounds | ✓ | qualquer |
| `/ranking` | Ranking | ✓ | qualquer |
| `/profile/:user_id` | Profile | ✓ | qualquer |
| `/admin/config` | Config | ✓ | admin |
| `/admin/rotation` | Rotation | ✓ | admin |

Rotas autenticadas usam `<ProtectedRoute>`. Rotas admin usam `<AdminRoute>` (verifica `role === "admin"` no JWT).

---

## Telas

### Login (`/login`)
- Formulário email + senha → `POST /v1/auth/login`
- Botão "Entrar com GitHub" → `GET /v1/auth/github`
- Redireciona para `/` após sucesso

### Home (`/`)
- Card da rodada de hoje via `GET /v1/rounds/today`
- Se não há rodada: mensagem "Nenhuma rodada hoje"
- Status badge: `pending` | `open` | `closed` | `cancelled`
- Se `open`: botão Participar / Retirar participação + campo quantidade
- Lista de participantes com quantidade
- Se usuário é o pagador: botões Confirmar (pending) / Cancelar (pending)

### Rounds (`/rounds`)
- Lista paginada via `GET /v1/rounds?page=1&limit=20`
- Card por rodada: data, pagador, status, total participantes
- Clique abre modal com participações detalhadas

### Ranking (`/ranking`)
- Lista via `GET /v1/scores` (já vem ordenada por score DESC)
- Cada linha: posição, nome, score, badges conquistados (chips)
- Clique em usuário → `/profile/:user_id`

### Profile (`/profile/:user_id`)
- Score detalhado: times_paid, times_participated, total_amount_spent, skip_count, current_streak, score
- Grade de badges com earned_at

### Admin Config (`/admin/config`)
- Formulário com `notify_at`, `price_per_unit`, `round_window_minutes`
- `PUT /v1/config`

### Admin Rotation (`/admin/rotation`)
- Lista drag-and-drop da fila atual
- Botão "Pular vez" → `POST /v1/rotation/skip`
- Salvar nova ordem → `PUT /v1/rotation/order`

---

## Notificações Push

1. Após login, `usePushNotifications` solicita permissão (`Notification.requestPermission()`)
2. Registra service worker FCM
3. Obtém token FCM web via Firebase JS SDK
4. Envia token via `POST /v1/devices` com `platform: "web"`
5. Se iOS e app não instalado: mostra `<InstallPrompt>` com instrução "Adicione à tela inicial pelo Safari para receber notificações"

---

## PWA

`vite-plugin-pwa` gera:
- `manifest.webmanifest` — nome, ícones, `display: standalone`, `theme_color`
- Service worker via Workbox — cache de assets estáticos (shell), network-first para API

---

## Variáveis de Ambiente

```
VITE_API_URL=http://localhost:8080/v1
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

---

## Deploy

Arquivos estáticos gerados por `vite build`. Pode ser servido por Vercel, Netlify, Nginx, ou qualquer host de arquivos estáticos. Requer HTTPS para PWA e notificações push.
