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
