// components/game/player-hud.tsx
'use client'

import { useGame } from '@/lib/game-context'

function RoBar({ current, max, variant }: { current: number; max: number; variant: 'hp' | 'sp' | 'exp' }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="ro-bar-track w-full" style={{ height: '8px' }}>
      <div className={`ro-bar-fill ro-bar-${variant}`} style={{ width: `${pct}%`, height: '100%' }} />
    </div>
  )
}

export function PlayerHUD() {
  const { player } = useGame()

  if (!player) {
    return (
      <div className="ro-panel">
        <div className="ro-panel-header">⚔ Jogador</div>
        <div style={{ padding: '10px', fontSize: '10px', color: 'var(--ro-text-muted)' }}>Carregando...</div>
      </div>
    )
  }

  return (
    <div className="ro-panel">
      <div className="ro-panel-header">
        ⚔ {player.name}
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '8px', color: 'var(--ro-text-muted)', marginBottom: '6px' }}>
          {player.jobClass} · Base {player.baseLevel} · Job {player.jobLevel}
        </div>

        {/* HP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, width: '18px', textAlign: 'right', color: '#B02020' }}>HP</span>
          <RoBar current={player.hpCurrent} max={player.hpMax} variant="hp" />
          <span style={{ fontSize: '8px', color: 'var(--ro-text-muted)', minWidth: '56px', textAlign: 'right' }}>
            {player.hpCurrent}/{player.hpMax}
          </span>
        </div>

        {/* SP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, width: '18px', textAlign: 'right', color: '#2050D0' }}>SP</span>
          <RoBar current={player.spCurrent} max={player.spMax} variant="sp" />
          <span style={{ fontSize: '8px', color: 'var(--ro-text-muted)', minWidth: '56px', textAlign: 'right' }}>
            {player.spCurrent}/{player.spMax}
          </span>
        </div>

        {/* Zenny */}
        <div style={{ marginTop: '6px', paddingTop: '5px', borderTop: '1px solid #D4E4F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '8px', color: 'var(--ro-text-muted)' }}>Zenny</span>
          <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ro-zenny)' }}>
            {player.zenny.toLocaleString()} z
          </span>
        </div>
      </div>
    </div>
  )
}
