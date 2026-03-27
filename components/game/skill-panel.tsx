// components/game/skill-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { skillApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { SkillRow } from '@/lib/types'

export function SkillPanel() {
  const { playerId, player, skills, refreshSkills, refreshPlayer, currentEncounter } = useGame()
  const [loading, setLoading] = useState<string | null>(null) // aegisName being processed

  useEffect(() => {
    if (playerId) refreshSkills()
  }, [playerId, refreshSkills])

  const handleLearn = async (skill: SkillRow) => {
    if (!playerId || loading) return
    setLoading(skill.aegisName)
    try {
      const res = await skillApi.learn(playerId, skill.aegisName)
      toast.success(res.message)
      await refreshSkills()
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprender skill')
    } finally {
      setLoading(null)
    }
  }

  const handleUse = async (skill: SkillRow) => {
    if (!playerId || loading) return
    setLoading(skill.aegisName)
    try {
      const res = await skillApi.use(playerId, skill.aegisName, currentEncounter?.monsterId ?? undefined)
      toast.success(res.message)
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar skill')
    } finally {
      setLoading(null)
    }
  }

  if (skills.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
            Nenhuma skill disponível.
          </p>
        </div>
      </div>
    )
  }

  const skillPoints = player?.skillPoints ?? 0

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
            SKILLS
          </p>
          <span className="font-[family-name:var(--font-pixel-body)] text-sm text-primary">
            {skillPoints} ponto{skillPoints !== 1 ? 's' : ''} disponível{skillPoints !== 1 ? 'is' : ''}
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {skills.map((skill) => (
              <div key={skill.aegisName} className="game-panel p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                      {skill.name}
                    </p>
                    <p className="font-[family-name:var(--font-pixel)] text-[10px] text-muted-foreground">
                      Lv {skill.currentLevel} / {skill.maxLevel}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {/* Learn button */}
                    {skill.canLearn && skillPoints > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => handleLearn(skill)}
                        disabled={loading === skill.aegisName}
                        className="font-[family-name:var(--font-pixel)] text-[10px] bg-primary"
                      >
                        {loading === skill.aegisName ? '...' : 'APRENDER'}
                      </Button>
                    ) : !skill.canLearn && skill.blockedReason ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="font-[family-name:var(--font-pixel)] text-[10px] opacity-40"
                            >
                              APRENDER
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-[family-name:var(--font-pixel-body)] text-sm">
                            {skill.blockedReason}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}

                    {/* Use button — for skills with currentLevel > 0 */}
                    {skill.currentLevel > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUse(skill)}
                        disabled={loading === skill.aegisName}
                        className="font-[family-name:var(--font-pixel)] text-[10px]"
                      >
                        {loading === skill.aegisName ? '...' : 'USAR'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
