import { createContext, useContext, useState, type ReactNode } from 'react'

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

function isUser(v: unknown): v is User {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as User).id === 'string' &&
    typeof (v as User).name === 'string' &&
    typeof (v as User).email === 'string' &&
    typeof (v as User).role === 'string'
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user')
      if (!stored) return null
      const parsed = JSON.parse(stored) as unknown
      return isUser(parsed) ? parsed : null
    } catch {
      localStorage.removeItem('user')
      return null
    }
  })

  const login = (token: string, newUser: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(newUser))
    setUser(newUser)
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
