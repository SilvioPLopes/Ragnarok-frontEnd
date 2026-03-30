// app/(game)/create-character/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function CreateCharacterPage() {
  const router = useRouter()
  const { setPlayerId } = useGame()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Digite um nome para o personagem')
      return
    }
    if (trimmed.length < 3) {
      toast.error('O nome deve ter pelo menos 3 caracteres')
      return
    }
    if (trimmed.length > 24) {
      toast.error('O nome deve ter no máximo 24 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const player = await playerApi.create(trimmed, 'NOVICE')
      setPlayerId(player.id)
      toast.success(`${player.name} criado com sucesso!`)
      router.push('/game')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar personagem')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="font-[family-name:var(--font-pixel-body)] text-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-pixel)] text-xl text-primary mb-2">
            CRIAR PERSONAGEM
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="game-panel p-6 mb-6 space-y-6">
            {/* Name */}
            <div>
              <label className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-2 block">
                NOME DO PERSONAGEM
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-[family-name:var(--font-pixel-body)] text-xl h-12 bg-input border-2 border-border focus:border-primary"
                placeholder="Digite o nome..."
                maxLength={24}
                disabled={isLoading}
              />
              <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground mt-1">
                {name.length}/24 caracteres (mín. 3)
              </p>
            </div>

            <div className="bg-muted/30 p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
                  STATS
                </span>
              </div>
              <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
                Distribua seus pontos de atributo em jogo, na aba Status.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || name.trim().length < 3}
            className="w-full h-14 pixel-button font-[family-name:var(--font-pixel)] text-sm"
          >
            {isLoading ? 'CRIANDO...' : 'CRIAR PERSONAGEM'}
          </Button>
        </form>
      </div>
    </main>
  )
}
