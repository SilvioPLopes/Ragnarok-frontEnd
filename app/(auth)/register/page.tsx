// app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) { toast.error('Preencha todos os campos'); return }
    setIsLoading(true)
    try {
      await register(username, password, email)
      toast.success('Conta criada com sucesso!')
      router.push('/select-character')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar')
    } finally { setIsLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--ro-border)', borderRadius: '7px',
    background: '#fff', color: 'var(--ro-text)', outline: 'none',
  } as React.CSSProperties

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--ro-page-bg)' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '22px', color: 'var(--ro-text-accent)', marginBottom: '4px', letterSpacing: '2px' }}>
            RAGNAROK
          </h1>
          <p className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '16px', color: 'var(--ro-text-muted)' }}>
            Criar Conta
          </p>
        </div>

        <div className="ro-panel">
          <div className="ro-panel-header" style={{ justifyContent: 'center', fontSize: '11px', letterSpacing: '1px' }}>
            REGISTRO
          </div>
          <div style={{ padding: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>Usuário</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} placeholder="Escolha um nome..." className="font-[family-name:var(--font-pixel-body)]" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} placeholder="seu@email.com" className="font-[family-name:var(--font-pixel-body)]" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ro-text-muted)', marginBottom: '5px' }}>Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} placeholder="Escolha uma senha..." className="font-[family-name:var(--font-pixel-body)]" style={inputStyle} />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                style={{ width: '100%', padding: '10px', fontSize: '11px', letterSpacing: '1px' }}
              >
                {isLoading ? 'CRIANDO...' : 'CRIAR CONTA'}
              </button>
            </form>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)' }}>
                Já tem conta?{' '}
                <Link href="/login" style={{ color: 'var(--ro-text-accent)', textDecoration: 'underline' }}>
                  Entrar
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
