// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { toast.error('Preencha todos os campos'); return }
    setIsLoading(true)
    try {
      await login(username, password)
      toast.success('Login realizado com sucesso!')
      router.push('/select-character')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login')
    } finally { setIsLoading(false) }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--ro-page-bg)' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '22px', color: 'var(--ro-text-accent)', marginBottom: '4px', letterSpacing: '2px' }}>
            RAGNAROK
          </h1>
          <p className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '16px', color: 'var(--ro-text-muted)' }}>
            Emulator
          </p>
        </div>

        <div className="ro-panel">
          <div className="ro-panel-header" style={{ justifyContent: 'center', fontSize: '11px', letterSpacing: '1px' }}>
            LOGIN
          </div>
          <div style={{ padding: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>
                  Usuário
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  placeholder="Digite seu usuário..."
                  className="font-[family-name:var(--font-pixel-body)]"
                  style={{
                    width: '100%', padding: '8px 10px', fontSize: '14px',
                    border: '1px solid var(--ro-border)', borderRadius: '7px',
                    background: '#fff', color: 'var(--ro-text)', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Digite sua senha..."
                  className="font-[family-name:var(--font-pixel-body)]"
                  style={{
                    width: '100%', padding: '8px 10px', fontSize: '14px',
                    border: '1px solid var(--ro-border)', borderRadius: '7px',
                    background: '#fff', color: 'var(--ro-text)', outline: 'none',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                style={{ width: '100%', padding: '10px', fontSize: '11px', letterSpacing: '1px' }}
              >
                {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)' }}>
                Não tem conta?{' '}
                <Link href="/register" style={{ color: 'var(--ro-text-accent)', textDecoration: 'underline' }}>
                  Registre-se
                </Link>
              </span>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--ro-border)' }}>
              <p style={{ fontSize: '10px', color: 'var(--ro-text-muted)', textAlign: 'center', marginBottom: '8px' }}>
                Backend offline? Teste o frontend:
              </p>
              <button
                type="button"
                className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                style={{ width: '100%', padding: '8px', fontSize: '9px', letterSpacing: '0.5px' }}
                onClick={() => {
                  localStorage.setItem('demo_mode', 'true')
                  localStorage.setItem('demo_user', JSON.stringify({ id: 1, username: 'demo', email: 'demo@test.com' }))
                  toast.success('Modo Demo ativado!')
                  router.push('/select-character')
                }}
              >
                ENTRAR EM MODO DEMO
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '10px', color: 'var(--ro-text-muted)' }}>
          v1.0.0 — Frontend Demo
        </p>
      </div>
    </main>
  )
}
