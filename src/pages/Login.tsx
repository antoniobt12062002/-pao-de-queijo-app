import { useState, type FormEvent } from 'react'
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
      const token = await loginWithEmail(email, password)
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(b64))
      login(token, {
        id: payload.sub,
        name: payload.name ?? '',
        email: payload.email ?? '',
        role: payload.role ?? 'member',
      })
      navigate('/')
    } catch {
      setError('Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Branded header strip */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 px-8 py-8 flex flex-col items-center gap-2">
          <span className="text-5xl" role="img" aria-label="pão de queijo">🧀</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pão de Queijo</h1>
          <p className="text-amber-100 text-sm">Gestão de rodadas</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
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
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-white py-2.5 rounded-2xl font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4">
            {(() => {
              const githubUrl = getGithubOAuthUrl()
              if (!githubUrl || githubUrl.startsWith('undefined')) return null
              return (
                <a
                  href={githubUrl}
                  aria-label="Entrar com GitHub"
                  className="flex items-center justify-center gap-2 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Entrar com GitHub
                </a>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
