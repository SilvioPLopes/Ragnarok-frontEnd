// components/game/battle-victory-overlay.tsx
'use client'

import { Button } from '@/components/ui/button'

interface VictoryOverlayProps {
  message: string
  onContinue: () => void
}

function parseVictoryMessage(message: string): {
  hasLevelUp: boolean
  lines: Array<{ text: string; colorClass: string }>
} {
  const hasLevelUp = /level\s*up|subiu\s*de\s*n[íi]vel/i.test(message)

  const lines = message
    .split(/[.!]\s+/)
    .filter(Boolean)
    .map((segment) => {
      if (/vitória|venceu/i.test(segment))
        return { text: segment, colorClass: 'text-yellow-400' }
      if (/exp|experiência/i.test(segment))
        return { text: segment, colorClass: 'text-violet-400' }
      if (/drop|item|obteve/i.test(segment))
        return { text: segment, colorClass: 'text-emerald-400' }
      if (/level\s*up|subiu\s*de\s*n[íi]vel/i.test(segment))
        return { text: segment, colorClass: 'text-yellow-300 font-bold' }
      return { text: segment, colorClass: 'text-foreground' }
    })

  return { hasLevelUp, lines }
}

export function BattleVictoryOverlay({ message, onContinue }: VictoryOverlayProps) {
  const { hasLevelUp, lines } = parseVictoryMessage(message)

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-background text-center">
      <span className="text-4xl">🏆</span>
      <h2 className="font-[family-name:var(--font-pixel)] text-xl text-yellow-400 tracking-widest">
        VITÓRIA!
      </h2>
      {hasLevelUp && (
        <div className="font-[family-name:var(--font-pixel)] text-sm text-yellow-300 border border-yellow-400/40 bg-yellow-400/10 rounded-full px-4 py-1">
          ⬆ LEVEL UP!
        </div>
      )}
      <div className="w-full bg-card border border-border rounded-lg p-3 text-left space-y-1">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`font-[family-name:var(--font-pixel-body)] text-sm ${line.colorClass}`}
          >
            {line.text}
          </p>
        ))}
      </div>
      <Button
        onClick={onContinue}
        className="w-full font-[family-name:var(--font-pixel)] text-sm pixel-button"
      >
        ▶ CONTINUAR
      </Button>
    </div>
  )
}
