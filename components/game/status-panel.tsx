// components/game/status-panel.tsx
'use client'

import { useState } from 'react'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

type StatKey = 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk'

// Maps display label → PlayerResponse field → API payload key
const STATS: { label: string; field: keyof import('@/lib/types').PlayerResponse; apiKey: StatKey }[] = [
  { label: 'STR', field: 'str', apiKey: 'str' },
  { label: 'AGI', field: 'agi', apiKey: 'agi' },
  { label: 'VIT', field: 'vit', apiKey: 'vit' },
  { label: 'INT', field: 'intelligence', apiKey: 'int' }, // NOTE: field="intelligence", api payload key="int"
  { label: 'DEX', field: 'dex', apiKey: 'dex' },
  { label: 'LUK', field: 'luk', apiKey: 'luk' },
]

function Bar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="w-full bg-muted/50 h-2 border border-border">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function StatusPanel() {
  const { player, playerId, refreshPlayer } = useGame()
  const [loading, setLoading] = useState<StatKey | null>(null)

  const handleDistribute = async (apiKey: StatKey) => {
    if (!playerId || !player || player.statPoints <= 0 || loading) return
    setLoading(apiKey)
    try {
      await playerApi.distributeStats(playerId, { [apiKey]: 1 })
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Distribuição de stats não disponível ainda')
    } finally {
      setLoading(null)
    }
  }

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
          Carregando...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto gap-4">
      {/* Identity */}
      <div className="game-panel p-4">
        <p className="font-[family-name:var(--font-pixel)] text-lg text-primary">{player.name}</p>
        <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
          {player.jobClass}
        </p>
        <div className="flex gap-4 mt-2">
          <span className="font-[family-name:var(--font-pixel-body)] text-sm text-foreground">
            Base Lv {player.baseLevel}
          </span>
          <span className="font-[family-name:var(--font-pixel-body)] text-sm text-foreground">
            Job Lv {player.jobLevel}
          </span>
          <span className="font-[family-name:var(--font-pixel-body)] text-sm text-yellow-300">
            {player.zenny.toLocaleString()} z
          </span>
        </div>
      </div>

      {/* HP / SP */}
      <div className="game-panel p-4 space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-[family-name:var(--font-pixel)] text-[10px] text-red-400">HP</span>
            <span className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
              {player.hpCurrent} / {player.hpMax}
            </span>
          </div>
          <Bar current={player.hpCurrent} max={player.hpMax} color="bg-red-500" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-[family-name:var(--font-pixel)] text-[10px] text-blue-400">SP</span>
            <span className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
              {player.spCurrent} / {player.spMax}
            </span>
          </div>
          <Bar current={player.spCurrent} max={player.spMax} color="bg-blue-500" />
        </div>
      </div>

      {/* Points to distribute */}
      {player.statPoints > 0 && (
        <div className="bg-primary/10 border border-primary/30 p-3 text-center">
          <span className="font-[family-name:var(--font-pixel)] text-xs text-primary">
            {player.statPoints} ponto{player.statPoints !== 1 ? 's' : ''} de atributo disponível{player.statPoints !== 1 ? 'is' : ''}
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div className="game-panel p-4">
        <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">ATRIBUTOS</p>
        <div className="space-y-2">
          {STATS.map(({ label, field, apiKey }) => (
            <div key={apiKey} className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-pixel)] text-xs text-primary w-10">
                {label}
              </span>
              <span className="font-[family-name:var(--font-pixel)] text-lg text-foreground flex-1 text-center">
                {player[field] as number}
              </span>
              {player.statPoints > 0 && (
                <Button
                  size="icon"
                  variant="outline"
                  className="w-7 h-7"
                  disabled={loading === apiKey}
                  onClick={() => handleDistribute(apiKey)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skill points */}
      <div className="game-panel p-4">
        <div className="flex justify-between">
          <span className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
            PONTOS DE SKILL
          </span>
          <span className="font-[family-name:var(--font-pixel)] text-lg text-primary">
            {player.skillPoints}
          </span>
        </div>
      </div>
    </div>
  )
}
