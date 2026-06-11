import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

  const githubUrl = getGithubOAuthUrl()
  const showGithub = githubUrl && !githubUrl.startsWith('undefined')

  return (
    <div className="min-h-screen flex lg:items-center justify-center bg-slate-50 lg:bg-white">
      {/* Desktop: split layout */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-1/2 bg-amber-500 items-center justify-center p-12">
        <div className="text-white text-center">
          <div className="text-7xl mb-6">🧀</div>
          <h1 className="text-4xl font-extrabold mb-2">Pão de Queijo</h1>
          <p className="text-amber-100 text-lg">Gestão de rodadas do grupo</p>
        </div>
      </div>

      {/* Form area */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🧀</div>
            <h1 className="text-2xl font-extrabold text-slate-900">Pão de Queijo</h1>
            <p className="text-slate-400 text-sm mt-1">Gestão de rodadas</p>
          </div>

          <div className="lg:block hidden mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900">Entrar</h2>
            <p className="text-slate-400 text-sm mt-1">Bem-vindo de volta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
              <input
                id="senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors active:scale-[0.98]"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {showGithub && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">ou</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <a
                href={githubUrl}
                className="flex items-center justify-center gap-2.5 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Entrar com GitHub
              </a>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            Não tem conta?{' '}
            <Link to="/signup" className="text-amber-600 font-bold hover:text-amber-700">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
