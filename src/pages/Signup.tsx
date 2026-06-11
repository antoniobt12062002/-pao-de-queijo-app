import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/users'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerUser(name, email, password)
      navigate('/login', { state: { registered: true } })
    } catch (err: any) {
      const msg = err?.response?.data?.error
      if (msg?.includes('already registered')) {
        setError('Este email já está cadastrado.')
      } else if (msg?.includes('8 characters')) {
        setError('A senha precisa ter pelo menos 8 caracteres.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

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
            <p className="text-slate-400 text-sm mt-1">Crie sua conta</p>
          </div>

          <div className="lg:block hidden mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900">Criar conta</h2>
            <p className="text-slate-400 text-sm mt-1">Junte-se ao grupo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">Nome</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Seu nome"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
              />
            </div>
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
                minLength={8}
                placeholder="Mínimo 8 caracteres"
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
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Já tem conta?{' '}
            <Link to="/login" className="text-amber-600 font-bold hover:text-amber-700">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
