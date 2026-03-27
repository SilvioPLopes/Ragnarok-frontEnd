'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from './types'
import { authApi } from './api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        setUser(JSON.parse(stored) as User)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (username: string, password: string) => {
    const { token, accountId } = await authApi.login(username, password)
    const u: User = { id: accountId, username, email: '' }
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(u))
    localStorage.removeItem('demo_mode')
    localStorage.removeItem('demo_user')
    setUser(u)
  }

  const register = async (username: string, email: string, password: string) => {
    await authApi.register(username, password, email)
    // after register, log in to get token
    await login(username, password)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('demo_mode')
    localStorage.removeItem('demo_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
