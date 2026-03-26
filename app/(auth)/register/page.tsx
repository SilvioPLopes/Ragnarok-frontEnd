'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Sword, Shield, Sparkles, Users } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (username.length < 3) {
      toast.error('O usuario deve ter pelo menos 3 caracteres')
      return
    }

    setIsLoading(true)
    try {
      await register(username, email, password)
      toast.success('Conta criada com sucesso!')
      router.push('/select-character')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 opacity-10">
          <Sword className="w-32 h-32 text-primary" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-10">
          <Shield className="w-40 h-40 text-accent" />
        </div>
        <div className="absolute top-1/3 right-1/4 opacity-10">
          <Sparkles className="w-24 h-24 text-primary" />
        </div>
        <div className="absolute bottom-1/3 left-1/4 opacity-10">
          <Users className="w-28 h-28 text-accent" />
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-pixel)] text-2xl md:text-3xl text-primary mb-2 tracking-wider">
            RAGNAROK
          </h1>
          <p className="font-[family-name:var(--font-pixel-body)] text-xl text-muted-foreground">
            Criar Nova Conta
          </p>
        </div>

        {/* Register Card */}
        <div className="game-panel p-6 md:p-8">
          <h2 className="font-[family-name:var(--font-pixel)] text-sm text-center text-foreground mb-6">
            REGISTRO
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                Usuario
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="font-[family-name:var(--font-pixel-body)] text-lg h-12 bg-input border-2 border-border focus:border-primary"
                placeholder="Seu nome de usuario..."
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-[family-name:var(--font-pixel-body)] text-lg h-12 bg-input border-2 border-border focus:border-primary"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-[family-name:var(--font-pixel-body)] text-lg h-12 bg-input border-2 border-border focus:border-primary"
                placeholder="Minimo 6 caracteres..."
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                Confirmar Senha
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="font-[family-name:var(--font-pixel-body)] text-lg h-12 bg-input border-2 border-border focus:border-primary"
                placeholder="Repita sua senha..."
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 pixel-button font-[family-name:var(--font-pixel)] text-xs tracking-wide mt-2"
            >
              {isLoading ? 'CRIANDO...' : 'CRIAR CONTA'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
              Ja tem conta?{' '}
              <Link 
                href="/login" 
                className="text-primary hover:text-primary/80 underline underline-offset-4"
              >
                Faca login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
          Ao criar uma conta, voce concorda com os termos de servico
        </p>
      </div>
    </main>
  )
}
