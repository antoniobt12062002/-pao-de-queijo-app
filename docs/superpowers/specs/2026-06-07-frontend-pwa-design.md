# Design: Frontend PWA — Pão de Queijo App

**Data:** 2026-06-07
**Status:** Aprovado
**Repositório:** pao-de-queijo-app
**Consome:** https://github.com/antoniobt12062002/api-pao-de-queijo

---

## Visão Geral

PWA em React que consome a API Go do sistema de rodízio de pão de queijo. O time é misto (Android + iOS), distribuição interna sem App Store. Push notifications são essenciais — funcionam via Firebase Web SDK no Android e no iOS 16.4+ quando instalado como PWA via Safari.

---

## Contexto

- Time de devs, uso interno, grupo pequeno
- Android: maioria do time — instala o PWA pela tela inicial do Chrome
- iOS: apenas um usuário (o dev) — instala via Safari → "Adicionar à Tela Inicial"
- Sem Apple Developer Account, sem App Store, sem Play Store
- A API já prevê `platform: web` em `DeviceToken` e `channel: web` em `Notification`

---

## Arquitetura Técnica

### Stack

| Tecnologia | Uso |
|---|---|
| React + Vite | Framework + bundler |
| vite-plugin-pwa | Geração de service worker e manifest.json |
| React Query (TanStack Query) | Cache e sincronização com a API |
| React Router v6 | Navegação entre telas |
| Tailwind CSS | Estilização mobile-first |
| Firebase JS SDK | Registro de device token web e recebimento de push |
| Axios | Cliente HTTP com interceptor JWT |

### Estrutura de Pastas

```
src/
  api/          # funções que chamam a API (rounds, participation, scores...)
  components/   # componentes reutilizáveis (Button, Card, Badge...)
  pages/        # uma pasta por tela
  hooks/        # useRound, useParticipation, useAuth...
  store/        # estado global (auth token, usuário logado)
public/
  firebase-messaging-sw.js  # service worker do Firebase (deve estar na raiz)
```

**Nota sobre service workers:** `vite-plugin-pwa` gera seu próprio service worker para cache offline. O `firebase-messaging-sw.js` é um segundo service worker independente registrado na raiz. Para evitar conflito, o `firebase-messaging-sw.js` deve importar o manifest de precache do Workbox ou os dois workers devem ser combinados em um único arquivo antes do deploy.

### Autenticação

- JWT armazenado em `localStorage` — trade-off consciente: app interno, sem dados sensíveis de terceiros, sem necessidade de httpOnly cookie (a API não emite cookies). Mitigado por token de curta duração na API.
- Interceptor do Axios injeta `Authorization: Bearer <token>` em todas as requisições. Resposta `401` limpa o token e redireciona para `/login`.
- **GitHub OAuth flow:**
  1. Usuário clica "Entrar com GitHub" → redireciona para endpoint OAuth da API
  2. API autentica e redireciona para `<frontend-url>/auth/callback?token=<jwt>`
  3. O frontend na rota `/auth/callback` lê o parâmetro `token` da query string, salva em `localStorage`, e imediatamente chama `history.replaceState({}, '', '/')` para remover o token da URL (evitar que fique no histórico do browser)
  4. Redireciona para Home
- Rota protegida: usuário não autenticado é redirecionado para `/login`

---

## Telas e Navegação

Navegação principal via **bottom navigation bar** com 4 itens (5 para admin):

```
Home        Rotação     Placar      Perfil      Admin (só admin)
  🏠           🔄          🏆          👤           ⚙️
```

### Estados Globais de UI

Padrão aplicado em todas as telas:

| Estado | Comportamento |
|---|---|
| Carregando | Skeleton placeholder no lugar do conteúdo |
| Erro de rede / 5xx | Mensagem de erro inline + botão "Tentar novamente" |
| 404 (recurso não existe) | Mensagem contextual (ex: "Nenhuma rodada hoje") |
| 401 | Limpa token, redireciona para `/login` |

### Home — Rodada do Dia

Consome `GET /v1/rounds/today`. Caso retorne 404, exibe "Nenhuma rodada hoje".

| Estado da rodada | Interface | Endpoints acionados |
|---|---|---|
| `pending` (usuário é pagador) | Botões "Confirmar" e "Cancelar" | `POST /v1/rounds/:id/confirm`, `POST /v1/rounds/:id/cancel` |
| `pending` (usuário não é pagador) | Mensagem de aguarde | — |
| `open` | Botão "Participar" (campo de quantidade) + "Cancelar participação" | `POST /v1/rounds/:id/participate` `{ quantity }`, `DELETE /v1/rounds/:id/participate` |
| `closed` | Resumo: lista de participantes e quantidade total | `GET /v1/rounds/:id/participations` |
| `cancelled` | Aviso de rodada cancelada | — |

O campo `is_payer` retornado pela API determina se o usuário vê os botões de pagador.

### Rotação

Consome `GET /v1/rotation`.

- Lista ordenada da fila de pagadores com posição e nome
- Destaque visual em quem é o pagador atual (`current_pos`)

### Placar

Consome `GET /v1/scores`.

- Ranking de todos os usuários ordenado por `score DESC`
- Cada item exibe: nome e score numérico
- Badges **não** são exibidos na lista do placar — `GET /v1/scores` não os retorna e chamar `GET /v1/badges/:user_id` para cada usuário geraria N+1 requests. Os badges do usuário logado são visíveis na tela Perfil.

### Perfil

Consome `GET /v1/scores/:user_id` e `GET /v1/badges/:user_id`.

- Score e estatísticas do usuário logado (`times_paid`, `times_participated`, `current_streak`, `skip_count`)
- Badges conquistados com data
- Botão "Ativar notificações" → fluxo de registro FCM (ver seção Push Notifications)
- Botão de logout

### Admin *(visível apenas para role `admin`)*

Consome `GET /v1/config`, `PUT /v1/config`, `PUT /v1/rotation/order`, `POST /v1/rotation/skip`.

- Editar configurações: `notify_at`, `round_window_minutes`, `price_per_unit`
- Reordenar a fila de rotação
- Avançar posição na fila (skip)

---

## Push Notifications

### Fluxo de Registro

1. Usuário toca "Ativar notificações" na tela de Perfil
2. **Verificar contexto iOS primeiro:** se `window.navigator.standalone !== true`, exibir instrução de instalação em vez de solicitar permissão (ver Onboarding iOS abaixo)
3. Browser solicita permissão (`Notification.requestPermission()`)
4. Firebase JS SDK gera um token FCM web via `getToken(messaging, { vapidKey })`
5. App chama `POST /v1/devices` com `{ token, platform: "web" }`
6. API passa a enviar push para esse token via Firebase Admin SDK

### Atualização de Token (Token Refresh)

Tokens FCM podem ser rotacionados pelo SDK. No startup do app (e via `onTokenRefresh`), o app deve:
1. Chamar `getToken()` novamente
2. Comparar com o token salvo em `localStorage`
3. Se diferente, chamar `POST /v1/devices` com o novo token e atualizar o salvo

### Recebimento em Background

O arquivo `public/firebase-messaging-sw.js` roda como service worker. Recebe mensagens FCM mesmo com o app fechado e exibe a notificação nativa do SO. Ao clicar, abre o app na Home.

### Tipos de Notificação Recebidos

| Tipo | Gatilho | Destinatário |
|---|---|---|
| `round_announced` | Job diário cria a rodada | Pagador do dia |
| `participation_open` | Pagador confirma | Todo o time |
| `reminder` | 5 min antes de fechar | Participantes confirmados |
| `round_closed` | Rodada fecha | Pagador |

### Onboarding iOS

Push notifications no iOS exigem que o app esteja rodando em modo standalone (instalado na tela inicial). O fluxo:

1. Se o usuário abre no Safari e `window.navigator.standalone === false`: exibir banner de instrução — "Para ativar notificações, toque em Compartilhar no Safari e escolha 'Adicionar à Tela Inicial'. Depois abra o app pelo ícone."
2. Se `window.navigator.standalone === true`: o botão "Ativar notificações" executa o fluxo normal de registro FCM
3. `Notification.requestPermission()` só é chamado quando `standalone === true` — chamadas fora desse contexto falham silenciosamente no iOS

---

## PWA Configuration

### manifest.json

```json
{
  "name": "Pão de Queijo",
  "short_name": "PdQ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f59e0b",
  "icons": [...]
}
```

### Service Worker

Gerado automaticamente pelo `vite-plugin-pwa` com estratégia `NetworkFirst` para chamadas de API e `CacheFirst` para assets estáticos. Ver nota sobre coexistência com `firebase-messaging-sw.js` na seção de Arquitetura.

---

## Distribuição

| Plataforma | Como instalar | Push Notifications |
|---|---|---|
| Android | Chrome → "Adicionar à tela inicial" | ✅ Completo |
| iOS 16.4+ | Safari → Compartilhar → "Adicionar à Tela Inicial" | ✅ Apenas em modo standalone |

Não há App Store, Play Store nem builds nativos. A URL do app hospedado é compartilhada diretamente com o time.
