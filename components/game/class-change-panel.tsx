'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import type { JobClass } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ArrowUpCircle,
  Sword,
  Shield,
  Wand2,
  Target,
  Coins,
  Heart,
  Footprints,
  Sparkles,
} from 'lucide-react'

const CLASS_INFO: Record<JobClass, { icon: React.ReactNode; color: string; description: string }> = {
  NOVICE:     { icon: <Footprints className="w-6 h-6" />, color: 'text-muted-foreground', description: 'Classe inicial. Pode evoluir para qualquer primeira classe ao atingir Job Level 10.' },
  SWORDSMAN:  { icon: <Sword className="w-6 h-6" />,     color: 'text-destructive',      description: 'Guerreiro especializado em combate corpo a corpo com espadas.' },
  MAGE:       { icon: <Wand2 className="w-6 h-6" />,     color: 'text-blue-400',         description: 'Mago especializado em magias elementais devastadoras.' },
  ARCHER:     { icon: <Target className="w-6 h-6" />,    color: 'text-green-400',        description: 'Arqueiro com alta precisao e ataques a distancia.' },
  THIEF:      { icon: <Footprints className="w-6 h-6" />, color: 'text-purple-400',      description: 'Ladino agil com habilidades de furtividade e ataques rapidos.' },
  MERCHANT:   { icon: <Coins className="w-6 h-6" />,     color: 'text-primary',          description: 'Comerciante com habilidades economicas e de crafting.' },
  ACOLYTE:    { icon: <Heart className="w-6 h-6" />,     color: 'text-pink-400',         description: 'Clerigo com magias de cura e suporte.' },
  KNIGHT:     { icon: <Shield className="w-6 h-6" />,    color: 'text-destructive',      description: 'Cavaleiro blindado com alta defesa e ataques poderosos.' },
  WIZARD:     { icon: <Wand2 className="w-6 h-6" />,     color: 'text-blue-400',         description: 'Mago avancado com magias de area devastadoras.' },
  HUNTER:     { icon: <Target className="w-6 h-6" />,    color: 'text-green-400',        description: 'Cacador com armadilhas e um falcao companheiro.' },
  ASSASSIN:   { icon: <Footprints className="w-6 h-6" />, color: 'text-purple-400',      description: 'Assassino mortal com ataques criticos e venenos.' },
  BLACKSMITH: { icon: <Coins className="w-6 h-6" />,     color: 'text-primary',          description: 'Ferreiro capaz de forjar e aprimorar equipamentos.' },
  PRIEST:     { icon: <Heart className="w-6 h-6" />,     color: 'text-pink-400',         description: 'Sacerdote com curas poderosas e magias sagradas.' },
}

export function ClassChangePanel() {
  const { player, playerId, refreshPlayer } = useGame()
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (playerId && player?.jobClass) loadAvailableClasses()
  }, [playerId, player?.jobClass])

  const loadAvailableClasses = async () => {
    if (!playerId) return
    setIsLoading(true)
    try {
      const classes = await playerApi.listAvailableClasses(playerId)
      setAvailableClasses(classes)
    } catch {
      setAvailableClasses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeClass = async () => {
    if (!playerId || !selectedClass || isChanging) return
    setIsChanging(true)
    try {
      await playerApi.changeClass(playerId, selectedClass)
      await refreshPlayer()
      toast.success(`Classe alterada para ${selectedClass}!`)
      setSelectedClass(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao trocar classe')
    } finally {
      setIsChanging(false)
    }
  }

  if (!player) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
          Carregando...
        </p>
      </div>
    )
  }

  const currentClassInfo = CLASS_INFO[player.jobClass]

  return (
    <div className="h-full flex flex-col">
      {/* Current class header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-[family-name:var(--font-pixel)] text-sm text-foreground mb-4">
          MUDANCA DE CLASSE
        </h3>
        <div className="game-panel p-4">
          <div className="flex items-center gap-4">
            <div className={currentClassInfo.color}>{currentClassInfo.icon}</div>
            <div className="flex-1">
              <p className="font-[family-name:var(--font-pixel)] text-xs text-muted-foreground">CLASSE ATUAL</p>
              <p className="font-[family-name:var(--font-pixel-body)] text-xl text-foreground">{player.jobClass}</p>
              <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground mt-1">
                Job Level: {player.jobLevel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available classes list */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
              Carregando...
            </p>
          </div>
        ) : availableClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
              Nenhuma evolucao disponivel
            </p>
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground mt-2">
              {player.jobClass === 'NOVICE'
                ? 'Atinja Job Level 10 para evoluir'
                : 'Voce ja esta na classe mais avancada'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-[family-name:var(--font-pixel)] text-xs text-muted-foreground">
              EVOLUCOES DISPONIVEIS
            </h4>
            {availableClasses.map((className) => {
              const classInfo = CLASS_INFO[className as JobClass]
              if (!classInfo) return null
              return (
                <button
                  key={className}
                  onClick={() => setSelectedClass(className)}
                  className="w-full p-4 bg-muted/30 border border-border hover:border-primary transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className={classInfo.color}>{classInfo.icon}</div>
                    <div className="flex-1">
                      <p className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                        {className}
                      </p>
                      <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground mt-1">
                        {classInfo.description}
                      </p>
                    </div>
                    <ArrowUpCircle className="w-5 h-5 text-primary shrink-0" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Confirmation dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="bg-card border-border">
          {selectedClass && CLASS_INFO[selectedClass as JobClass] && (
            <>
              <DialogHeader>
                <DialogTitle className="font-[family-name:var(--font-pixel)] text-sm text-foreground flex items-center gap-2">
                  <div className={CLASS_INFO[selectedClass as JobClass].color}>
                    {CLASS_INFO[selectedClass as JobClass].icon}
                  </div>
                  {selectedClass}
                </DialogTitle>
                <DialogDescription className="font-[family-name:var(--font-pixel-body)] text-lg">
                  {CLASS_INFO[selectedClass as JobClass].description}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={handleChangeClass}
                  disabled={isChanging}
                  className="pixel-button font-[family-name:var(--font-pixel)] text-xs w-full"
                >
                  {isChanging ? 'EVOLUINDO...' : 'EVOLUIR CLASSE'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
