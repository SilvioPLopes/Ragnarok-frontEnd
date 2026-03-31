// components/game/battle-hud.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useGame } from '@/lib/game-context'
import { skillApi, inventoryApi } from '@/lib/api'
import { MonsterSprite } from './monster-sprite'
import { BattleMenu } from './battle-menu'
import { BattleItemOverlay } from './battle-item-overlay'
import { BattleVictoryOverlay } from './battle-victory-overlay'
import type { SkillRow, InventoryItem } from '@/lib/types'

type BattlePhase = 'fighting' | 'dying' | 'victory'

export function BattleHud() {
  const {
    playerId, player, currentEncounter, clearEncounter,
    attackMonster, flee, skills, inventory,
    refreshInventory, refreshPlayer, refreshMapInfo,
    battleLog, isLoading,
  } = useGame()

  const [phase, setPhase] = useState<BattlePhase>('fighting')
  const [victoryMessage, setVictoryMessage] = useState('')
  const [showItemOverlay, setShowItemOverlay] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const attackThrottle = useRef(false)

  const currentMessage = battleLog[battleLog.length - 1] ?? ''
  const historyMessages = battleLog.slice(0, -1)

  const handleAttack = useCallback(async () => {
    if (!currentEncounter || attackThrottle.current || isLoading || actionLoading) return
    attackThrottle.current = true
    try {
      const result = await attackMonster(currentEncounter.monsterId)
      if (!result) return

      // ⚠ BACKEND NEEDED: remover fallback após BattleResponseDTO expor playerDied/monsterDied
      const isVictory = result.monsterDied ?? result.message.includes('VITÓRIA')
      const isFatal   = result.playerDied  ?? result.message.includes('FATAL')

      if (isVictory) {
        setVictoryMessage(result.message)
        setPhase('victory')
      } else if (isFatal) {
        setPhase('dying')
        setTimeout(async () => {
          clearEncounter()
          await refreshPlayer()
          await refreshMapInfo()
        }, 1500)
      }
    } finally {
      setTimeout(() => { attackThrottle.current = false }, 500)
    }
  }, [currentEncounter, isLoading, actionLoading, attackMonster, clearEncounter, refreshPlayer])

  const handleUseSkill = useCallback(async (skill: SkillRow) => {
    if (!playerId || actionLoading) return
    setActionLoading(true)
    try {
      // Only pass monsterId for offensive/targetable skills; self-buffs must omit it
      const targetId = skill.targetable ? currentEncounter?.monsterId : undefined
      console.log('[handleUseSkill]', {
        aegisName: skill.aegisName,
        targetable: skill.targetable,
        currentEncounterId: currentEncounter?.monsterId,
        targetId,
      })
      const res = await skillApi.use(playerId, skill.aegisName, targetId)
      toast.success(res.message)
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar skill')
    } finally {
      setActionLoading(false)
    }
  }, [playerId, actionLoading, currentEncounter, refreshPlayer])

  const handleUseItem = useCallback(async (item: InventoryItem) => {
    if (!playerId || actionLoading) return
    setActionLoading(true)
    try {
      const res = await inventoryApi.use(playerId, item.id)
      toast.success(res.message)
      setShowItemOverlay(false)
      await refreshInventory()
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar item')
    } finally {
      setActionLoading(false)
    }
  }, [playerId, actionLoading, refreshInventory, refreshPlayer])

  const handleVictoryContinue = useCallback(() => {
    clearEncounter()
    setPhase('fighting')
    setVictoryMessage('')
    refreshMapInfo()
  }, [clearEncounter, refreshMapInfo])

  if (!currentEncounter) return null

  // Victory: full screen overlay
  if (phase === 'victory') {
    return (
      <div className="flex-1 flex flex-col">
        <BattleVictoryOverlay
          message={victoryMessage}
          onContinue={handleVictoryContinue}
        />
      </div>
    )
  }

  const loading = isLoading || actionLoading

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: '#1a1a2e' }}>
      {/* Battle scene — Pokémon layout */}
      <div className="relative h-44 bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#2d1b0e] flex-shrink-0">

        {/* Monster HP — top left */}
        <div className="absolute top-2 left-3 bg-background/80 border border-destructive/30 rounded-md px-2 py-1.5 min-w-[110px]">
          <p className="font-[family-name:var(--font-pixel)] text-[9px] text-destructive/80 truncate mb-1">
            {currentEncounter.monsterName}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-muted-foreground">HP</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, (currentEncounter.monsterHpCurrent / currentEncounter.monsterHpInitial) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Monster sprite — top right */}
        <div className="absolute top-2 right-3">
          <MonsterSprite
            id={currentEncounter.monsterId}
            name={currentEncounter.monsterName}
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Player sprite — bottom left */}
        <div className="absolute bottom-3 left-4 w-12 h-12 rounded border border-primary/20 bg-primary/5 flex items-center justify-center">
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-primary/40">CHAR</span>
        </div>

        {/* Player HP + SP — bottom right */}
        {player && (
          <div className="absolute bottom-3 right-3 bg-background/80 border border-primary/30 rounded-md px-2 py-1.5 min-w-[110px]">
            <p className="font-[family-name:var(--font-pixel)] text-[9px] text-primary/80 mb-1 truncate">
              {player.name}
            </p>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-[family-name:var(--font-pixel)] text-[7px] text-muted-foreground">HP</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.hpCurrent / player.hpMax) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-[family-name:var(--font-pixel)] text-[7px] text-muted-foreground">SP</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.spCurrent / player.spMax) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Item overlay — covers the scene */}
        {showItemOverlay && (
          <BattleItemOverlay
            items={inventory}
            monsterName={currentEncounter.monsterName}
            loading={loading}
            onUse={handleUseItem}
            onBack={() => setShowItemOverlay(false)}
          />
        )}
      </div>

      {/* Textbox */}
      <div className="bg-card border-t-2 border-border px-3 py-2 flex-shrink-0">
        {phase === 'dying' ? (
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-destructive">
            ⚠ GOLPE FATAL! Você foi derrotado.
          </p>
        ) : (
          <>
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-foreground">
              {currentMessage || 'Um encontro!'}
            </p>
            {historyMessages.length > 0 && (
              <>
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="flex items-center gap-1 mt-1 font-[family-name:var(--font-pixel)] text-[8px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showHistory
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronUp className="w-3 h-3" />}
                  {historyMessages.length} turno{historyMessages.length !== 1 ? 's' : ''} anterior{historyMessages.length !== 1 ? 'es' : ''}
                </button>
                {showHistory && (
                  <div
                    className="mt-1 max-h-24 overflow-y-auto space-y-0.5 border-t border-border/30 pt-1"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1e3a #0a0a18' }}
                  >
                    {historyMessages.map((msg, i) => (
                      <p key={i} className="font-[family-name:var(--font-pixel-body)] text-xs text-muted-foreground">
                        {msg}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Battle menu — hidden during dying phase */}
      {phase === 'fighting' && (
        <BattleMenu
          skills={skills}
          loading={loading}
          onAttack={handleAttack}
          onUseSkill={handleUseSkill}
          onOpenItems={() => setShowItemOverlay(true)}
          onFlee={flee}
        />
      )}
    </div>
  )
}
