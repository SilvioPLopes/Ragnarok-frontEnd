'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Sword, Shield, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Preencha todos os campos')
      return
    }

    setIsLoading(true)
    try {
      await login(username, password)
      toast.success('Login realizado com sucesso!')
      router.push('/select-character')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login')
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
      </div>

      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-pixel)] text-2xl md:text-3xl text-primary mb-2 tracking-wider">
            RAGNAROK
          </h1>
          <p className="font-[family-name:var(--font-pixel-body)] text-xl text-muted-foreground">
            Emulator
          </p>
        </div>

        {/* Login Card */}
        <div className="game-panel p-6 md:p-8">
          <h2 className="font-[family-name:var(--font-pixel)] text-sm text-center text-foreground mb-6">
            LOGIN
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                Usuario
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="font-[family-name:var(--font-pixel-body)] text-lg h-12 bg-input border-2 border-border focus:border-primary"
                placeholder="Digite seu usuario..."
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
                placeholder="Digite sua senha..."
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 pixel-button font-[family-name:var(--font-pixel)] text-xs tracking-wide"
            >
              {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
              Nao tem conta?{' '}
              <Link 
                href="/register" 
                className="text-primary hover:text-primary/80 underline underline-offset-4"
              >
                Registre-se
              </Link>
            </p>
          </div>

          {/* Demo Mode */}
          <div className="mt-6 pt-6 border-t-2 border-border">
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground text-center mb-3">
              Backend offline? Teste o frontend:
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                localStorage.setItem('demo_mode', 'true')
                localStorage.setItem('demo_user', JSON.stringify({ id: 1, username: 'demo', email: 'demo@test.com' }))
                toast.success('Modo Demo ativado!')
                router.push('/select-character')
              }}
              className="w-full h-10 font-[family-name:var(--font-pixel)] text-[10px] tracking-wide border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              ENTRAR EM MODO DEMO
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
          v1.0.0 - Frontend Demo
        </p>
        
        {/* Quick Navigation Guide */}
        <div className="mt-4 p-3 bg-muted/30 border border-border rounded text-center">
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
            Navegacao: Login → Selecao → Jogo (Mapa/Skills/Itens/Status/Classe)
          </p>
        </div>
      </div>
    </main>
  )
}
