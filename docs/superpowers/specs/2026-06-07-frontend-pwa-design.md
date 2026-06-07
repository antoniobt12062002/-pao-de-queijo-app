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
  sw/           # lógica do service worker (push notifications)
public/
  firebase-messaging-sw.js  # service worker do Firebase (deve estar na raiz)
```

### Autenticação

- JWT armazenado em `localStorage`
- Interceptor do Axios injeta `Authorization: Bearer <token>` em todas as requisições
- GitHub OAuth: redireciona para a URL da API e recebe o token de volta via query string
- Rota protegida: usuário não autenticado é redirecionado para `/login`

---

## Telas e Navegação

Navegação principal via **bottom navigation bar** com 4 itens (5 para admin):

```
Home        Rotação     Placar      Perfil      Admin (só admin)
  🏠           🔄          🏆          👤           ⚙️
```

### Home — Rodada do Dia

Consome `GET /v1/rounds/today`.

| Estado da rodada | Interface |
|---|---|
| `pending` (usuário é pagador) | Botões "Confirmar" e "Cancelar" |
| `pending` (usuário não é pagador) | Mensagem de aguarde |
| `open` | Botão "Participar" (campo de quantidade) + "Cancelar participação" |
| `closed` | Resumo: quem participou, quantidade total |
| `cancelled` | Aviso de rodada cancelada |

O campo `is_payer` retornado pela API determina se o usuário vê os botões de pagador.

### Rotação

Consome `GET /v1/rotation`.

- Lista ordenada da fila de pagadores com posição e nome
- Destaque visual em quem é o pagador atual (`current_pos`)

### Placar

Consome `GET /v1/scores`.

- Ranking de todos os usuários ordenado por `score DESC`
- Cada item exibe: nome, score numérico, badges conquistados

### Perfil

Consome `GET /v1/scores/:user_id` e `GET /v1/badges/:user_id`.

- Score e estatísticas do usuário logado (`times_paid`, `times_participated`, `current_streak`, `skip_count`)
- Badges conquistados com data
- Botão "Ativar notificações" → fluxo de registro FCM
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
2. Browser solicita permissão (`Notification.requestPermission()`)
3. Firebase JS SDK gera um token FCM web via `getToken(messaging, { vapidKey })`
4. App chama `POST /v1/devices` com `{ token, platform: "web" }`
5. API passa a enviar push para esse token via Firebase Admin SDK

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

Na primeira abertura via Safari no iOS, exibir um banner explicando: "Para ativar notificações, adicione este app à Tela Inicial pelo botão de compartilhamento do Safari."

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

Gerado automaticamente pelo `vite-plugin-pwa` com estratégia `NetworkFirst` para chamadas de API e `CacheFirst` para assets estáticos.

---

## Distribuição

| Plataforma | Como instalar | Push Notifications |
|---|---|---|
| Android | Chrome → "Adicionar à tela inicial" | ✅ Completo |
| iOS 16.4+ | Safari → Compartilhar → "Adicionar à Tela Inicial" | ✅ Após instalação |

Não há App Store, Play Store nem builds nativos. A URL do app hospedado é compartilhada diretamente com o time.
