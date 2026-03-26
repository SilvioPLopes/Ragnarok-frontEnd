// components/game/player-hud.tsx
'use client'

import { useGame } from '@/lib/game-context'

function Bar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="w-full bg-muted/50 h-3 border border-border">
      <div
        className={`h-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function PlayerHUD() {
  const { player } = useGame()

  if (!player) {
    return (
      <div className="p-3 text-center font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  return (
    <div className="game-panel p-3 space-y-2">
      {/* Name + class */}
      <div>
        <p className="font-[family-name:var(--font-pixel)] text-xs text-primary truncate">
          {player.name}
        </p>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
          {player.jobClass} — Lv {player.baseLevel} / Job {player.jobLevel}
        </p>
      </div>

      {/* HP bar */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span className="font-[family-name:var(--font-pixel)] text-[10px] text-red-400">HP</span>
          <span className="font-[family-name:var(--font-pixel-body)] text-xs text-muted-foreground">
            {player.hpCurrent} / {player.hpMax}
          </span>
        </div>
        <Bar current={player.hpCurrent} max={player.hpMax} color="bg-red-500" />
      </div>

      {/* SP bar */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span className="font-[family-name:var(--font-pixel)] text-[10px] text-blue-400">SP</span>
          <span className="font-[family-name:var(--font-pixel-body)] text-xs text-muted-foreground">
            {player.spCurrent} / {player.spMax}
          </span>
        </div>
        <Bar current={player.spCurrent} max={player.spMax} color="bg-blue-500" />
      </div>

      {/* Zenny */}
      <div className="flex justify-between items-center pt-1 border-t border-border">
        <span className="font-[family-name:var(--font-pixel)] text-[10px] text-yellow-400">ZENNY</span>
        <span className="font-[family-name:var(--font-pixel-body)] text-sm text-yellow-300">
          {player.zenny.toLocaleString()}z
        </span>
      </div>
    </div>
  )
}
