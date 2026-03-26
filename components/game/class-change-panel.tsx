'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { api } from '@/lib/api'
import type { ClassChangeRequirement, JobClass } from '@/lib/types'
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
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react'

const CLASS_INFO: Record<JobClass, { icon: React.ReactNode; color: string; description: string }> = {
  NOVICE: { 
    icon: <Footprints className="w-6 h-6" />, 
    color: 'text-muted-foreground',
    description: 'Classe inicial. Pode evoluir para qualquer primeira classe ao atingir Job Level 10.'
  },
  SWORDSMAN: { 
    icon: <Sword className="w-6 h-6" />, 
    color: 'text-destructive',
    description: 'Guerreiro especializado em combate corpo a corpo com espadas.'
  },
  MAGE: { 
    icon: <Wand2 className="w-6 h-6" />, 
    color: 'text-blue-400',
    description: 'Mago especializado em magias elementais devastadoras.'
  },
  ARCHER: { 
    icon: <Target className="w-6 h-6" />, 
    color: 'text-green-400',
    description: 'Arqueiro com alta precisao e ataques a distancia.'
  },
  THIEF: { 
    icon: <Footprints className="w-6 h-6" />, 
    color: 'text-purple-400',
    description: 'Ladino agil com habilidades de furtividade e ataques rapidos.'
  },
  MERCHANT: { 
    icon: <Coins className="w-6 h-6" />, 
    color: 'text-primary',
    description: 'Comerciante com habilidades economicas e de crafting.'
  },
  ACOLYTE: { 
    icon: <Heart className="w-6 h-6" />, 
    color: 'text-pink-400',
    description: 'Clerigo com magias de cura e suporte.'
  },
  KNIGHT: { 
    icon: <Shield className="w-6 h-6" />, 
    color: 'text-destructive',
    description: 'Cavaleiro blindado com alta defesa e ataques poderosos.'
  },
  WIZARD: { 
    icon: <Wand2 className="w-6 h-6" />, 
    color: 'text-blue-400',
    description: 'Mago avancado com magias de area devastadoras.'
  },
  HUNTER: { 
    icon: <Target className="w-6 h-6" />, 
    color: 'text-green-400',
    description: 'Cacador com armadilhas e um falcao companheiro.'
  },
  ASSASSIN: { 
    icon: <Footprints className="w-6 h-6" />, 
    color: 'text-purple-400',
    description: 'Assassino mortal com ataques criticos e venenos.'
  },
  BLACKSMITH: { 
    icon: <Coins className="w-6 h-6" />, 
    color: 'text-primary',
    description: 'Ferreiro capaz de forjar e aprimorar equipamentos.'
  },
  PRIEST: { 
    icon: <Heart className="w-6 h-6" />, 
    color: 'text-pink-400',
    description: 'Sacerdote com curas poderosas e magias sagradas.'
  },
}

export function ClassChangePanel() {
  const { player, setPlayer, refreshPlayer } = useGame()
  const [requirements, setRequirements] = useState<ClassChangeRequirement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassChangeRequirement | null>(null)
  const [eligibility, setEligibility] = useState<{ eligible: boolean; message: string } | null>(null)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (player?.jobClass) {
      loadRequirements()
    }
  }, [player?.jobClass])

  const loadRequirements = async () => {
    if (!player) return
    
    setIsLoading(true)
    try {
      const reqs = await api.getClassChangeRequirements(player.jobClass)
      setRequirements(reqs)
    } catch (error) {
      console.error('Failed to load class requirements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectClass = async (req: ClassChangeRequirement) => {
    if (!player) return
    
    setSelectedClass(req)
    
    try {
      const result = await api.checkClassChangeEligibility(player.id, req.targetClass)
      setEligibility(result)
    } catch (error) {
      setEligibility({ eligible: false, message: 'Erro ao verificar elegibilidade' })
    }
  }

  const handleChangeClass = async () => {
    if (!player || !selectedClass || !eligibility?.eligible) return
    
    setIsChanging(true)
    try {
      const result = await api.changeClass(player.id, selectedClass.targetClass)
      
      if (result.success) {
        toast.success(`Parabens! Voce agora e um ${selectedClass.targetClass}!`)
        if (result.player) {
          setPlayer(result.player)
        } else {
          refreshPlayer()
        }
        setSelectedClass(null)
        setEligibility(null)
        loadRequirements()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao mudar de classe')
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
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-[family-name:var(--font-pixel)] text-sm text-foreground mb-4">
          MUDANCA DE CLASSE
        </h3>
        
        {/* Current Class */}
        <div className="game-panel p-4">
          <div className="flex items-center gap-4">
            <div className={`${currentClassInfo.color}`}>
              {currentClassInfo.icon}
            </div>
            <div className="flex-1">
              <p className="font-[family-name:var(--font-pixel)] text-xs text-muted-foreground">
                CLASSE ATUAL
              </p>
              <p className="font-[family-name:var(--font-pixel-body)] text-xl text-foreground">
                {player.jobClass}
              </p>
              <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground mt-1">
                Job Level: {player.level} | Job EXP: {player.jobExp.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Classes */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
              Carregando...
            </p>
          </div>
        ) : requirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
              Nenhuma evolucao disponivel
            </p>
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground mt-2">
              {player.jobClass === 'NOVICE' 
                ? 'Atinja Job Level 10 para evoluir'
                : player.jobClass.includes('KNIGHT') || player.jobClass.includes('WIZARD') || player.jobClass.includes('HUNTER') || player.jobClass.includes('ASSASSIN') || player.jobClass.includes('BLACKSMITH') || player.jobClass.includes('PRIEST')
                  ? 'Voce ja esta na classe mais avancada'
                  : 'Atinja Job Level 40 para evoluir para classe 2'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-[family-name:var(--font-pixel)] text-xs text-muted-foreground">
              EVOLUCOES DISPONIVEIS
            </h4>
            {requirements.map((req) => {
              const classInfo = CLASS_INFO[req.targetClass]
              
              return (
                <button
                  key={req.targetClass}
                  onClick={() => handleSelectClass(req)}
                  className="w-full p-4 bg-muted/30 border border-border hover:border-primary transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${classInfo.color}`}>
                      {classInfo.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                        {req.targetClass}
                      </p>
                      <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground mt-1">
                        {classInfo.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="font-[family-name:var(--font-pixel-body)] text-xs text-primary">
                          Job Lv.{req.requiredJobLevel} necessario
                        </span>
                        {req.requiredZeny && (
                          <span className="font-[family-name:var(--font-pixel-body)] text-xs text-primary">
                            {req.requiredZeny.toLocaleString()} Zeny
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowUpCircle className="w-5 h-5 text-primary" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Class Change Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => { setSelectedClass(null); setEligibility(null) }}>
        <DialogContent className="bg-card border-border">
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle className="font-[family-name:var(--font-pixel)] text-sm text-foreground flex items-center gap-2">
                  <div className={CLASS_INFO[selectedClass.targetClass].color}>
                    {CLASS_INFO[selectedClass.targetClass].icon}
                  </div>
                  {selectedClass.targetClass}
                </DialogTitle>
                <DialogDescription className="font-[family-name:var(--font-pixel-body)] text-lg">
                  {CLASS_INFO[selectedClass.targetClass].description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <h4 className="font-[family-name:var(--font-pixel)] text-xs text-muted-foreground">
                  REQUISITOS
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {player.level >= selectedClass.requiredJobLevel ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="font-[family-name:var(--font-pixel-body)] text-lg">
                      Job Level {selectedClass.requiredJobLevel}
                    </span>
                  </div>
                  
                  {selectedClass.requiredZeny && (
                    <div className="flex items-center gap-2">
                      {player.zeny >= selectedClass.requiredZeny ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="font-[family-name:var(--font-pixel-body)] text-lg">
                        {selectedClass.requiredZeny.toLocaleString()} Zeny
                      </span>
                    </div>
                  )}
                  
                  {selectedClass.requiredItems?.map((reqItem, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
                        Item #{reqItem.itemId} x{reqItem.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {eligibility && (
                  <div className={`p-3 border ${eligibility.eligible ? 'border-green-400 bg-green-400/10' : 'border-destructive bg-destructive/10'}`}>
                    <p className={`font-[family-name:var(--font-pixel-body)] text-sm ${eligibility.eligible ? 'text-green-400' : 'text-destructive'}`}>
                      {eligibility.message}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleChangeClass}
                  disabled={!eligibility?.eligible || isChanging}
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
