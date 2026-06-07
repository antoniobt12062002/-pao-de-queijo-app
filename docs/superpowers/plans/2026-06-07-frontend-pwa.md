# Frontend PWA — Pão de Queijo App Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React PWA that consome a API do pão de queijo com JWT auth, Firebase push notifications e 5 telas (Home, Rotação, Placar, Perfil, Admin).

**Architecture:** SPA client-only. React Query gerencia server state. React Router v6 gerencia navegação. Dois service workers coexistem: Workbox SW (cache offline, gerado pelo vite-plugin-pwa) em `/sw.js` e Firebase SW (push em background) em `/firebase-messaging-sw.js`. Auth via JWT em localStorage com interceptor Axios.

**Tech Stack:** React 18, TypeScript, Vite, vite-plugin-pwa, TanStack Query v5, React Router v6, Tailwind CSS v3, Firebase JS SDK v10, Axios, Vitest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-06-07-frontend-pwa-design.md`

---

## File Map

```
src/
  api/
    client.ts           # axios instance com interceptor JWT + redirect 401
    auth.ts             # loginWithEmail, getGithubOAuthUrl
    rounds.ts           # getTodayRound, confirmRound, cancelRound, participate, removeParticipation, getParticipations
    rotation.ts         # getRotation, updateRotationOrder, skipRotation
    scores.ts           # getAllScores, getUserScore, getUserBadges
    config.ts           # getConfigs, updateConfig
    devices.ts          # registerDevice
  components/
    ProtectedRoute.tsx  # redireciona para /login se não autenticado
    AppLayout.tsx       # wrapper com Outlet + BottomNav
    BottomNav.tsx       # navegação inferior, item Admin só para role admin
    Skeleton.tsx        # placeholder animado de carregamento
    ErrorMessage.tsx    # estado de erro com botão retry
    NotificationButton.tsx  # ativa FCM, detecta iOS standalone
  pages/
    Login.tsx           # formulário email/senha + link GitHub OAuth
    AuthCallback.tsx    # lê ?token= da URL, limpa URL, redireciona
    Home.tsx            # rodada do dia com todos os estados
    Rotation.tsx        # fila de pagamento
    Scores.tsx          # ranking por score
    Profile.tsx         # score + badges do usuário logado
    Admin.tsx           # editar config + skip rotação
  store/
    auth.tsx            # AuthContext: user, isAuthenticated, login, logout
  lib/
    firebase.ts         # initializeApp, messaging, getToken, VAPID_KEY, envia config para SW
  test/
    setup.ts            # @testing-library/jest-dom
  App.tsx               # Routes completo
  main.tsx              # providers + refreshFcmToken na inicialização
public/
  firebase-messaging-sw.js  # SW Firebase para push em background
  icon-192.png
  icon-512.png
vite.config.ts          # React plugin + vite-plugin-pwa + Vitest config
tailwind.config.js
.env.example
```

---

## Chunk 1: Scaffold & Configuração

### Task 1: Inicializar Projeto

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` (via vite)
- Create: `tailwind.config.js`, `postcss.config.js`
- Create: `src/index.css`
- Create: `src/test/setup.ts`
- Create: `.env.example`
- Create: `public/firebase-messaging-sw.js`

- [ ] **Step 1: Scaffold Vite dentro do repo existente**

```powershell
cd C:\Users\Michels\Desktop\pao-de-queijo-app
npm create vite@latest . -- --template react-ts
```
Quando perguntado sobre diretório não vazio, escolha **Ignore files and continue** para manter a pasta `docs/`.

- [ ] **Step 2: Instalar dependências runtime**

```powershell
npm install
npm install @tanstack/react-query react-router-dom@6 axios firebase@10
```

> **Atenção:** Pinar `react-router-dom@6` (v7 tem breaking changes na API de rotas aninhadas) e `firebase@10` (deve coincidir com a versão do SDK CDN no `firebase-messaging-sw.js`).

- [ ] **Step 3: Instalar dependências de dev**

```powershell
npm install -D vite-plugin-pwa tailwindcss@3 postcss autoprefixer workbox-build workbox-window vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

> **Atenção:** Pinar `tailwindcss@3` (v4 é uma reescrita incompatível — não usa `tailwind.config.js` nem `@tailwind base`). `workbox-build` e `workbox-window` são peer deps obrigatórios do `vite-plugin-pwa` que o npm não instala automaticamente.

- [ ] **Step 4: Inicializar Tailwind**

```powershell
npx tailwindcss init -p
```

- [ ] **Step 5: Configurar `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 6: Substituir `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Configurar `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Pão de Queijo',
        short_name: 'PdQ',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#f59e0b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/v1/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 8: Criar `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 9: Adicionar scripts de test em `package.json`**

Dentro de `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run --reporter=verbose"
```

- [ ] **Step 10: Criar `.env.example`**

```
VITE_API_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

Criar `.env.local` copiando o exemplo e preenchendo com os valores do Firebase Console. Adicionar `.env.local` ao `.gitignore`.

- [ ] **Step 11: Criar `public/firebase-messaging-sw.js`**

```js
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

self.addEventListener('message', (event) => {
  if (event.data?.type === 'INIT_FIREBASE') {
    firebase.initializeApp(event.data.config)
    const messaging = firebase.messaging()
    messaging.onBackgroundMessage((payload) => {
      self.registration.showNotification(payload.notification?.title ?? 'Pão de Queijo', {
        body: payload.notification?.body,
        icon: '/icon-192.png',
        data: { url: '/' },
      })
    })
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'))
})
```

- [ ] **Step 12: Adicionar ícones placeholder**

Colocar qualquer imagem 192×192 em `public/icon-192.png` e 512×512 em `public/icon-512.png`.

- [ ] **Step 13: Verificar que o dev server sobe**

```powershell
npm run dev
```
Esperado: Vite inicia em `http://localhost:5173`, browser mostra o boilerplate do Vite sem erros no console.

- [ ] **Step 14: Rodar testes (suite vazia)**

```powershell
npm run test:run
```
Esperado: Vitest pode exibir "No test files found" e sair com código 1 — isso é normal neste ponto. O ambiente está correto se o comando é reconhecido e a mensagem menciona Vitest.

- [ ] **Step 15: Commit**

```powershell
git add -A
git commit -m "chore: scaffold PWA com Vite React TS, Tailwind, Firebase, vite-plugin-pwa"
```

---

## Chunk 2: API Client & Auth

### Task 2: Axios Client com Interceptor JWT

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/client.test.ts`

- [ ] **Step 1: Escrever testes que falham**

`src/api/client.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('exporta apiClient com métodos HTTP', async () => {
    const { apiClient } = await import('./client')
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
  })

  it('interceptor de request adiciona Authorization quando há token', async () => {
    localStorage.setItem('token', 'test-jwt')
    const { apiClient } = await import('./client')
    const handler = (apiClient.interceptors.request as any).handlers[0]
    const config = { headers: new axios.AxiosHeaders() }
    const result = await handler.fulfilled(config)
    expect(result.headers.get('Authorization')).toBe('Bearer test-jwt')
  })

  it('interceptor de response limpa localStorage em 401', async () => {
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', '{}')
    const { apiClient } = await import('./client')
    const handler = (apiClient.interceptors.response as any).handlers[0]
    await handler.rejected({ response: { status: 401 } }).catch(() => {})
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/api/client.test.ts
```

- [ ] **Step 3: Criar `src/api/client.ts`**

```ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/api/client.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/api/client.ts src/api/client.test.ts
git commit -m "feat: add axios API client com interceptor JWT"
```

### Task 3: Auth Context

**Files:**
- Create: `src/store/auth.tsx`
- Create: `src/store/auth.test.tsx`

- [ ] **Step 1: Escrever testes que falham**

`src/store/auth.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  beforeEach(() => localStorage.clear())

  it('retorna user null quando não há token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('login salva token e user no localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'member' }

    act(() => result.current.login('mytoken', user))

    expect(localStorage.getItem('token')).toBe('mytoken')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.name).toBe('Test')
  })

  it('logout limpa token e user', () => {
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'A', email: 'a@a.com', role: 'member' }))
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => result.current.logout())

    expect(localStorage.getItem('token')).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/store/auth.test.tsx
```

- [ ] **Step 3: Criar `src/store/auth.tsx`**

```tsx
import { createContext, useContext, useState, ReactNode } from 'react'

export type User = {
  id: string
  name: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/store/auth.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add src/store/
git commit -m "feat: add auth context com persistência em localStorage"
```

### Task 4: API de Auth

**Files:**
- Create: `src/api/auth.ts`
- Create: `src/api/auth.test.ts`

- [ ] **Step 1: Escrever teste que falha**

`src/api/auth.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './client'
import { loginWithEmail } from './auth'

vi.mock('./client', () => ({ apiClient: { post: vi.fn() } }))

describe('loginWithEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('faz POST /auth/login e retorna token e user', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { token: 'abc', user: { id: '1', name: 'A', email: 'a@a.com', role: 'member' } },
    })

    const result = await loginWithEmail('a@a.com', 'pass')

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'a@a.com', password: 'pass' })
    expect(result.token).toBe('abc')
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/api/auth.test.ts
```

- [ ] **Step 3: Criar `src/api/auth.ts`**

```ts
import { apiClient } from './client'
import type { User } from '../store/auth'

type LoginResponse = { token: string; user: User }

export async function loginWithEmail(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export function getGithubOAuthUrl(): string {
  return `${import.meta.env.VITE_API_URL}/v1/auth/github`
}
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/api/auth.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/api/auth.ts src/api/auth.test.ts
git commit -m "feat: add auth API functions (email login, GitHub OAuth URL)"
```

### Task 5: Login Page

**Files:**
- Create: `src/pages/Login.tsx`
- Create: `src/pages/Login.test.tsx`

- [ ] **Step 1: Escrever testes que falham**

`src/pages/Login.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../store/auth'
import Login from './Login'

vi.mock('../api/auth', () => ({
  loginWithEmail: vi.fn().mockResolvedValue({
    token: 'tok',
    user: { id: '1', name: 'A', email: 'a@a.com', role: 'member' },
  }),
  getGithubOAuthUrl: vi.fn().mockReturnValue('http://api/auth/github'),
}))

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )

describe('Login', () => {
  it('renderiza campos de email e senha', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
  })

  it('renderiza link do GitHub', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument()
  })

  it('chama loginWithEmail ao submeter', async () => {
    const { loginWithEmail } = await import('../api/auth')
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(loginWithEmail).toHaveBeenCalledWith('a@a.com', 'pass'))
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/pages/Login.test.tsx
```

- [ ] **Step 3: Criar `src/pages/Login.tsx`**

```tsx
import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithEmail, getGithubOAuthUrl } from '../api/auth'
import { useAuth } from '../store/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await loginWithEmail(email, password)
      login(token, user)
      navigate('/')
    } catch {
      setError('Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-amber-600 text-center mb-6">🧀 Pão de Queijo</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              id="senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-white py-2 rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <div className="mt-4">
          <a
            href={getGithubOAuthUrl()}
            aria-label="Entrar com GitHub"
            className="flex items-center justify-center gap-2 border rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Entrar com GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/pages/Login.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add src/pages/Login.tsx src/pages/Login.test.tsx
git commit -m "feat: add Login page com email e GitHub OAuth"
```

### Task 6: OAuth Callback Handler

**Files:**
- Create: `src/pages/AuthCallback.tsx`
- Create: `src/pages/AuthCallback.test.tsx`

- [ ] **Step 1: Escrever teste que falha**

`src/pages/AuthCallback.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../store/auth'
import AuthCallback from './AuthCallback'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('AuthCallback', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  it('lê token da URL, salva e redireciona para /', () => {
    // JWT payload: { sub: '1', name: 'Test', email: 't@t.com', role: 'member' }
    const payload = btoa(JSON.stringify({ sub: '1', name: 'Test', email: 't@t.com', role: 'member' }))
    const token = `header.${payload}.sig`

    render(
      <MemoryRouter initialEntries={[`/auth/callback?token=${token}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    expect(localStorage.getItem('token')).toBe(token)
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/')
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/pages/AuthCallback.test.tsx
```

- [ ] **Step 3: Criar `src/pages/AuthCallback.tsx`**

```tsx
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/auth'

export default function AuthCallback() {
  const [params] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      try {
        // JWT base64url → base64 standard antes de decodificar
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(b64))
        login(token, {
          id: payload.sub,
          name: payload.name ?? '',
          email: payload.email ?? '',
          role: payload.role ?? 'member',
        })
      } catch {
        navigate('/login', { replace: true })
        return
      }
    }
    window.history.replaceState({}, '', '/')
    navigate('/', { replace: true })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Autenticando…</p>
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/pages/AuthCallback.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add src/pages/AuthCallback.tsx src/pages/AuthCallback.test.tsx
git commit -m "feat: add OAuth callback com extração e limpeza de token da URL"
```

---

## Chunk 3: App Shell & Navegação

### Task 7: ProtectedRoute & Routing Principal

**Files:**
- Create: `src/components/ProtectedRoute.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Criar `src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/auth'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
```

- [ ] **Step 2: Criar páginas placeholder para evitar erros de import**

```powershell
New-Item -Path src/pages/Home.tsx -ItemType File -Force
New-Item -Path src/pages/Rotation.tsx -ItemType File -Force
New-Item -Path src/pages/Scores.tsx -ItemType File -Force
New-Item -Path src/pages/Profile.tsx -ItemType File -Force
New-Item -Path src/pages/Admin.tsx -ItemType File -Force
```

Conteúdo de cada um (repetir para cada arquivo):
```tsx
export default function NomeDaTela() { return <div className="p-4">Em construção</div> }
```

- [ ] **Step 3: Criar `src/components/AppLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Outlet />
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Atualizar `src/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Home from './pages/Home'
import Rotation from './pages/Rotation'
import Scores from './pages/Scores'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rotation" element={<Rotation />} />
          <Route path="/scores" element={<Scores />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
    </Routes>
  )
}
```

> A rota `/admin` existe sempre — o guard de role fica dentro do próprio `Admin.tsx` (ver Task 16).

- [ ] **Step 5: Atualizar `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './store/auth'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 6: Commit**

```powershell
git add src/
git commit -m "feat: add routing, ProtectedRoute e app shell"
```

### Task 8: BottomNav & Componentes Compartilhados

**Files:**
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/BottomNav.test.tsx`
- Create: `src/components/Skeleton.tsx`
- Create: `src/components/ErrorMessage.tsx`

- [ ] **Step 1: Escrever teste que falha para BottomNav**

`src/components/BottomNav.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../store/auth'
import BottomNav from './BottomNav'

const renderNav = (role = 'member') => {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'A', email: 'a@a.com', role }))
  return render(
    <MemoryRouter>
      <AuthProvider>
        <BottomNav />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('BottomNav', () => {
  beforeEach(() => localStorage.clear())

  it('mostra 4 itens para usuário comum', () => {
    renderNav('member')
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rotação/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /placar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /perfil/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument()
  })

  it('mostra link Admin para role admin', () => {
    renderNav('admin')
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/components/BottomNav.test.tsx
```

- [ ] **Step 3: Criar `src/components/BottomNav.tsx`**

```tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../store/auth'

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/rotation', label: 'Rotação', icon: '🔄' },
  { to: '/scores', label: 'Placar', icon: '🏆' },
  { to: '/profile', label: 'Perfil', icon: '👤' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const items =
    user?.role === 'admin'
      ? [...navItems, { to: '/admin', label: 'Admin', icon: '⚙️' }]
      : navItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
      {items.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          aria-label={label}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs gap-1 px-3 py-1 rounded-lg ${
              isActive ? 'text-amber-500' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/components/BottomNav.test.tsx
```

- [ ] **Step 5: Criar `src/components/Skeleton.tsx`**

```tsx
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}
```

- [ ] **Step 6: Criar `src/components/ErrorMessage.tsx`**

```tsx
type Props = { message?: string; onRetry?: () => void }

export default function ErrorMessage({
  message = 'Algo deu errado.',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
      <p className="text-gray-600 text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-amber-500 text-sm font-medium underline">
          Tentar novamente
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```powershell
git add src/components/
git commit -m "feat: add BottomNav, Skeleton e ErrorMessage"
```

---

## Chunk 4: Home Screen

### Task 9: API de Rounds

**Files:**
- Create: `src/api/rounds.ts`
- Create: `src/api/rounds.test.ts`

- [ ] **Step 1: Escrever testes que falham**

`src/api/rounds.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './client'
import {
  getTodayRound,
  confirmRound,
  cancelRound,
  participate,
  removeParticipation,
  getParticipations,
} from './rounds'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

describe('rounds API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getTodayRound chama GET /rounds/today', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: '1', status: 'open' } })
    const result = await getTodayRound()
    expect(apiClient.get).toHaveBeenCalledWith('/rounds/today')
    expect(result.id).toBe('1')
  })

  it('confirmRound chama POST /rounds/:id/confirm', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} })
    await confirmRound('abc')
    expect(apiClient.post).toHaveBeenCalledWith('/rounds/abc/confirm')
  })

  it('cancelRound chama POST /rounds/:id/cancel', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} })
    await cancelRound('abc')
    expect(apiClient.post).toHaveBeenCalledWith('/rounds/abc/cancel')
  })

  it('participate chama POST com quantity', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} })
    await participate('abc', 2)
    expect(apiClient.post).toHaveBeenCalledWith('/rounds/abc/participate', { quantity: 2 })
  })

  it('removeParticipation chama DELETE', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} })
    await removeParticipation('abc')
    expect(apiClient.delete).toHaveBeenCalledWith('/rounds/abc/participate')
  })

  it('getParticipations chama GET /rounds/:id/participations', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { participations: [], total_quantity: 0 },
    })
    const result = await getParticipations('abc')
    expect(apiClient.get).toHaveBeenCalledWith('/rounds/abc/participations')
    expect(result.total_quantity).toBe(0)
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/api/rounds.test.ts
```

- [ ] **Step 3: Criar `src/api/rounds.ts`**

```ts
import { apiClient } from './client'

export type RoundStatus = 'pending' | 'open' | 'closed' | 'cancelled'

export type Round = {
  id: string
  date: string
  payer_id: string
  status: RoundStatus
  notify_at: string
  closes_at: string
  is_payer?: boolean
}

export type Participation = {
  user_id: string
  name: string
  quantity: number
}

export type ParticipationsResponse = {
  participations: Participation[]
  total_quantity: number
}

export async function getTodayRound(): Promise<Round> {
  const { data } = await apiClient.get<Round>('/rounds/today')
  return data
}

export async function confirmRound(id: string): Promise<void> {
  await apiClient.post(`/rounds/${id}/confirm`)
}

export async function cancelRound(id: string): Promise<void> {
  await apiClient.post(`/rounds/${id}/cancel`)
}

export async function getParticipations(roundId: string): Promise<ParticipationsResponse> {
  const { data } = await apiClient.get<ParticipationsResponse>(`/rounds/${roundId}/participations`)
  return data
}

export async function participate(roundId: string, quantity: number): Promise<void> {
  await apiClient.post(`/rounds/${roundId}/participate`, { quantity })
}

export async function removeParticipation(roundId: string): Promise<void> {
  await apiClient.delete(`/rounds/${roundId}/participate`)
}
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/api/rounds.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/api/rounds.ts src/api/rounds.test.ts
git commit -m "feat: add rounds API functions"
```

### Task 10: Home Page

**Files:**
- Modify: `src/pages/Home.tsx`
- Create: `src/pages/Home.test.tsx`

- [ ] **Step 1: Escrever testes que falham**

`src/pages/Home.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../store/auth'
import Home from './Home'
import * as roundsApi from '../api/rounds'

vi.mock('../api/rounds')

const renderHome = () => {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'A', email: 'a@a.com', role: 'member' }))
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>
          <Home />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Home', () => {
  it('mostra mensagem quando API retorna 404', async () => {
    vi.mocked(roundsApi.getTodayRound).mockRejectedValueOnce({ response: { status: 404 } })
    renderHome()
    await waitFor(() => expect(screen.getByText(/nenhuma rodada hoje/i)).toBeInTheDocument())
  })

  it('mostra botões confirmar/cancelar para o pagador em pending', async () => {
    vi.mocked(roundsApi.getTodayRound).mockResolvedValueOnce({
      id: '1', date: '2026-06-07', payer_id: '1', status: 'pending',
      notify_at: '', closes_at: '', is_payer: true,
    })
    renderHome()
    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('mostra mensagem de aguarde para não-pagador em pending', async () => {
    vi.mocked(roundsApi.getTodayRound).mockResolvedValueOnce({
      id: '1', date: '2026-06-07', payer_id: '99', status: 'pending',
      notify_at: '', closes_at: '', is_payer: false,
    })
    renderHome()
    await waitFor(() => expect(screen.getByText(/aguardando/i)).toBeInTheDocument())
  })

  it('mostra botão participar quando status é open', async () => {
    vi.mocked(roundsApi.getTodayRound).mockResolvedValueOnce({
      id: '1', date: '2026-06-07', payer_id: '99', status: 'open',
      notify_at: '', closes_at: '', is_payer: false,
    })
    renderHome()
    await waitFor(() => expect(screen.getByRole('button', { name: /participar/i })).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/pages/Home.test.tsx
```

- [ ] **Step 3: Implementar `src/pages/Home.tsx`**

```tsx
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
    pending: 'Aguardando confirmação',
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
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/pages/Home.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add src/pages/Home.tsx src/pages/Home.test.tsx
git commit -m "feat: add Home screen com todos os estados da rodada"
```

---

## Chunk 5: Rotação & Placar

### Task 11: Rotação Screen

**Files:**
- Create: `src/api/rotation.ts`
- Modify: `src/pages/Rotation.tsx`

- [ ] **Step 1: Criar `src/api/rotation.ts`**

```ts
import { apiClient } from './client'

export type RotationMember = {
  user_id: string
  name: string
  position: number
}

export type Rotation = {
  current_pos: number
  members: RotationMember[]
}

export async function getRotation(): Promise<Rotation> {
  const { data } = await apiClient.get<Rotation>('/rotation')
  return data
}

export async function updateRotationOrder(userIds: string[]): Promise<void> {
  await apiClient.put('/rotation/order', { user_ids: userIds })
}

export async function skipRotation(): Promise<void> {
  await apiClient.post('/rotation/skip')
}
```

- [ ] **Step 2: Implementar `src/pages/Rotation.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query'
import { getRotation } from '../api/rotation'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

export default function Rotation() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rotation'],
    queryFn: getRotation,
  })

  if (isLoading)
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  return (
    <div className="p-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Fila de Pagamento</h1>
      <ul className="space-y-2">
        {data?.members.map((member, index) => {
          const isCurrent = index === data.current_pos
          return (
            <li
              key={member.user_id}
              className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm ${
                isCurrent ? 'border-2 border-amber-400' : ''
              }`}
            >
              <span className="text-sm font-bold text-gray-400 w-5">{index + 1}</span>
              <span className="flex-1 text-sm font-medium text-gray-800">{member.name}</span>
              {isCurrent && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Próximo
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/api/rotation.ts src/pages/Rotation.tsx
git commit -m "feat: add Rotation screen com fila de pagamento"
```

### Task 12: Placar Screen

**Files:**
- Create: `src/api/scores.ts`
- Modify: `src/pages/Scores.tsx`

- [ ] **Step 1: Criar `src/api/scores.ts`**

```ts
import { apiClient } from './client'

export type Score = {
  user_id: string
  name: string
  email: string
  score: number
  times_paid: number
  times_participated: number
  current_streak: number
  skip_count: number
  total_amount_spent: number
}

export type Badge = {
  id: string
  user_id: string
  type: string
  period: string | null
  earned_at: string
}

export async function getAllScores(): Promise<Score[]> {
  const { data } = await apiClient.get<Score[]>('/scores')
  return data
}

export async function getUserScore(userId: string): Promise<Score> {
  const { data } = await apiClient.get<Score>(`/scores/${userId}`)
  return data
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const { data } = await apiClient.get<Badge[]>(`/badges/${userId}`)
  return data
}
```

- [ ] **Step 2: Implementar `src/pages/Scores.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query'
import { getAllScores } from '../api/scores'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'

export default function Scores() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['scores'],
    queryFn: getAllScores,
  })

  if (isLoading)
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  return (
    <div className="p-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Placar</h1>
      <ul className="space-y-2">
        {data?.map((score, index) => (
          <li
            key={score.user_id}
            className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3"
          >
            <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{score.name}</p>
              <p className="text-xs text-gray-400">
                {score.times_paid}x pagou · streak {score.current_streak}
              </p>
            </div>
            <span className="text-amber-600 font-bold text-sm">{score.score.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/api/scores.ts src/pages/Scores.tsx
git commit -m "feat: add Scores screen com ranking"
```

---

## Chunk 6: Perfil & Push Notifications

### Task 13: Firebase & Devices API

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `src/api/devices.ts`

- [ ] **Step 1: Criar `src/lib/firebase.ts`**

```ts
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export { getToken, onMessage }
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// getMessaging() requer contexto de browser — inicialização lazy para não quebrar em testes
let _messaging: ReturnType<typeof getMessaging> | null = null
export function getFirebaseMessaging() {
  if (!_messaging) _messaging = getMessaging(app)
  return _messaging
}

// Envia config para firebase-messaging-sw.js inicializar o Firebase em background
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({ type: 'INIT_FIREBASE', config: firebaseConfig })
  })
}
```

> **Nota:** Todos os locais que usavam `messaging` diretamente agora chamam `getFirebaseMessaging()`. Atualizar `NotificationButton.tsx` e `main.tsx` de acordo.

- [ ] **Step 2: Criar `src/api/devices.ts`**

```ts
import { apiClient } from './client'

export async function registerDevice(token: string): Promise<void> {
  await apiClient.post('/devices', { token, platform: 'web' })
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/lib/firebase.ts src/api/devices.ts
git commit -m "feat: add Firebase lib e devices API"
```

### Task 14: NotificationButton

**Files:**
- Create: `src/components/NotificationButton.tsx`
- Create: `src/components/NotificationButton.test.tsx`

- [ ] **Step 1: Escrever testes que falham**

`src/components/NotificationButton.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotificationButton from './NotificationButton'

vi.mock('../lib/firebase', () => ({
  getFirebaseMessaging: vi.fn().mockReturnValue({}),
  getToken: vi.fn(),
  VAPID_KEY: 'key',
}))
vi.mock('../api/devices', () => ({ registerDevice: vi.fn() }))

describe('NotificationButton', () => {
  it('mostra instrução de instalação no iOS fora do modo standalone', () => {
    Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    })
    render(<NotificationButton />)
    expect(screen.getByText(/adicione à tela inicial/i)).toBeInTheDocument()
  })

  it('mostra botão ativar quando permissão não foi concedida', () => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    Object.defineProperty(navigator, 'userAgent', { value: 'Chrome', configurable: true })
    Object.defineProperty(Notification, 'permission', { value: 'default', configurable: true })
    render(<NotificationButton />)
    expect(screen.getByRole('button', { name: /ativar notificações/i })).toBeInTheDocument()
  })

  it('mostra mensagem de ativo quando permissão já foi concedida', () => {
    Object.defineProperty(Notification, 'permission', { value: 'granted', configurable: true })
    render(<NotificationButton />)
    expect(screen.getByText(/notificações ativas/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar — esperado FAIL**

```powershell
npm run test:run -- src/components/NotificationButton.test.tsx
```

- [ ] **Step 3: Criar `src/components/NotificationButton.tsx`**

```tsx
import { useState } from 'react'
import { getFirebaseMessaging, getToken, VAPID_KEY } from '../lib/firebase'
import { registerDevice } from '../api/devices'

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const isStandalone = () => (navigator as any).standalone === true

export default function NotificationButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  if (isIOS() && !isStandalone()) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        Para ativar notificações, abra no Safari, toque em{' '}
        <strong>Compartilhar</strong> e escolha{' '}
        <strong>"Adicione à Tela Inicial"</strong>. Depois abra o app pelo ícone.
      </div>
    )
  }

  if (Notification.permission === 'granted') {
    return <p className="text-sm text-green-600 text-center py-2">✅ Notificações ativas</p>
  }

  if (Notification.permission === 'denied') {
    return (
      <p className="text-sm text-red-500 text-center py-2">
        Notificações bloqueadas. Habilite nas configurações do browser.
      </p>
    )
  }

  const activate = async () => {
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('idle')
        return
      }
      const token = await getToken(getFirebaseMessaging(), { vapidKey: VAPID_KEY })
      const saved = localStorage.getItem('fcm_token')
      if (token !== saved) {
        await registerDevice(token)
        localStorage.setItem('fcm_token', token)
      }
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={activate}
        disabled={status === 'loading'}
        className="w-full bg-amber-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
      >
        {status === 'loading' ? 'Ativando…' : 'Ativar notificações'}
      </button>
      {status === 'done' && <p className="text-sm text-green-600 text-center">✅ Notificações ativas</p>}
      {status === 'error' && (
        <p className="text-sm text-red-500 text-center">Erro ao ativar. Tente novamente.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rodar — esperado PASS**

```powershell
npm run test:run -- src/components/NotificationButton.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add src/components/NotificationButton.tsx src/components/NotificationButton.test.tsx
git commit -m "feat: add NotificationButton com verificação iOS standalone"
```

### Task 15: Profile Page & Token Refresh

**Files:**
- Modify: `src/pages/Profile.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Implementar `src/pages/Profile.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/auth'
import { getUserScore, getUserBadges } from '../api/scores'
import Skeleton from '../components/Skeleton'
import ErrorMessage from '../components/ErrorMessage'
import NotificationButton from '../components/NotificationButton'

const badgeLabels: Record<string, string> = {
  novo_na_fila: 'Novo na Fila 🆕',
  nunca_foge: 'Nunca Foge 💪',
  queijeiro_fiel: 'Queijeiro Fiel 🧀',
  papai_noel: 'Papai Noel 🎅',
  big_spender: 'Big Spender 💸',
}

export default function Profile() {
  const { user, logout } = useAuth()

  const { data: score, isLoading: loadingScore, isError, refetch } = useQuery({
    queryKey: ['score', user!.id],
    queryFn: () => getUserScore(user!.id),
  })

  const { data: badges, isLoading: loadingBadges } = useQuery({
    queryKey: ['badges', user!.id],
    queryFn: () => getUserBadges(user!.id),
  })

  if (loadingScore || loadingBadges)
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )

  if (isError) return <ErrorMessage onRetry={refetch} />

  return (
    <div className="p-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{user?.name}</h1>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-red-400">
          Sair
        </button>
      </div>

      {score && (
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Score</span>
            <span className="text-2xl font-bold text-amber-500">{score.score.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>Pagou: <strong>{score.times_paid}x</strong></div>
            <div>Participou: <strong>{score.times_participated}x</strong></div>
            <div>Streak: <strong>{score.current_streak}</strong></div>
            <div>Skips: <strong>{score.skip_count}</strong></div>
          </div>
        </div>
      )}

      {badges && badges.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Badges</p>
          <ul className="space-y-1">
            {badges.map((b) => (
              <li key={b.id} className="flex justify-between text-sm">
                <span>{badgeLabels[b.type] ?? b.type}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(b.earned_at).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NotificationButton />
    </div>
  )
}
```

- [ ] **Step 2: Adicionar refresh de token FCM no startup em `src/main.tsx`**

Adicionar logo antes do `ReactDOM.createRoot(...)`:
```ts
async function refreshFcmToken() {
  if (Notification.permission !== 'granted') return
  try {
    // Import dinâmico para evitar que erro de Firebase (env vars ausentes) quebre o app inteiro
    const { getFirebaseMessaging, getToken, VAPID_KEY } = await import('./lib/firebase')
    const { registerDevice } = await import('./api/devices')
    const token = await getToken(getFirebaseMessaging(), { vapidKey: VAPID_KEY })
    const saved = localStorage.getItem('fcm_token')
    if (token && token !== saved) {
      await registerDevice(token)
      localStorage.setItem('fcm_token', token)
    }
  } catch {
    // Silencioso — Firebase pode não estar configurado ou permissão não concedida
  }
}

refreshFcmToken()
```

- [ ] **Step 3: Commit**

```powershell
git add src/pages/Profile.tsx src/main.tsx
git commit -m "feat: add Profile screen e FCM token refresh no startup"
```

---

## Chunk 7: Admin Screen

### Task 16: Config API & Admin Page

**Files:**
- Create: `src/api/config.ts`
- Modify: `src/pages/Admin.tsx`

- [ ] **Step 1: Criar `src/api/config.ts`**

```ts
import { apiClient } from './client'

export type Config = {
  key: string
  value: string
}

export async function getConfigs(): Promise<Config[]> {
  const { data } = await apiClient.get<Config[]>('/config')
  return data
}

export async function updateConfig(key: string, value: string): Promise<void> {
  await apiClient.put('/config', { key, value })
}
```

- [ ] **Step 2: Implementar `src/pages/Admin.tsx`**

```tsx
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

  const { data: configs, isLoading: loadingConfig, isError } = useQuery({
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

  if (isError) return <ErrorMessage />

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
              <span className="text-gray-400">{i + 1}.</span> {m.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/api/config.ts src/pages/Admin.tsx
git commit -m "feat: add Admin screen com edição de config e skip de rotação"
```

---

## Chunk 8: Verificação Final

### Task 17: Build & Verificação

- [ ] **Step 1: Rodar todos os testes**

```powershell
npm run test:run
```
Esperado: todos os testes passam.

- [ ] **Step 2: Build de produção**

```powershell
npm run build
```
Esperado: build sem erros, pasta `dist/` gerada.

- [ ] **Step 3: Preview do build**

```powershell
npm run preview
```
Abrir `http://localhost:4173`. Verificar:
- Página de login renderiza
- Botão GitHub é um link clicável
- Sem erros no console
- DevTools → Application → Manifest: nome "Pão de Queijo", ícones presentes

- [ ] **Step 4: Commit final**

```powershell
git add -A
git commit -m "chore: verify build e PWA manifest"
```
