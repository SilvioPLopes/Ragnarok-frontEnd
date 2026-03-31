// components/game/battle-panel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/game-context'

function classifyLogEntry(msg: string): 'dmg' | 'exp' | 'info' {
  const lower = msg.toLowerCase()
  // Colorização de apresentação apenas — não é regra de negócio
  if (lower.includes('fatal') || lower.includes('dano') || lower.includes('atacou') || lower.includes('derrotado')) return 'dmg'
  if (lower.includes('exp') || lower.includes('vitória') || lower.includes('escapou')) return 'exp'
  return 'info'
}

export function BattlePanel() {
  const { battleLog } = useGame()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [battleLog])

  if (battleLog.length === 0) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
      <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text-muted)' }}>
        Ande pelo mapa para encontrar monstros.
      </span>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', overflowY: 'auto' }}>
      <div className="ro-section-label">Log de Batalha</div>
      <div className="ro-log-box" style={{ flex: 1 }}>
        {battleLog.map((msg, i) => {
          const type = classifyLogEntry(msg)
          return (
            <div
              key={i}
              className={`ro-log-${type} font-[family-name:var(--font-pixel-body)]`}
              style={{ fontSize: '13px', padding: '3px 0', borderBottom: '1px solid #EAF0F8' }}
            >
              {msg}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
