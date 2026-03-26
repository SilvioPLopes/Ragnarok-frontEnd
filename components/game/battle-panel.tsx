// components/game/battle-panel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/game-context'
import { ScrollArea } from '@/components/ui/scroll-area'

export function BattlePanel() {
  const { battleLog } = useGame()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [battleLog])

  if (battleLog.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
          Ande pelo mapa para encontrar monstros.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">
        LOG DE BATALHA
      </p>
      <ScrollArea className="flex-1 game-panel p-3">
        <div className="space-y-1">
          {battleLog.map((msg, i) => (
            <p
              key={i}
              className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground border-b border-border/30 pb-1 last:border-0"
            >
              {msg}
            </p>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
