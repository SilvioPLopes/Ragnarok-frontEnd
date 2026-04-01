// components/game/status-panel.tsx
'use client'

import { useState } from 'react'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import { toast } from 'sonner'

type StatKey = 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk'

const STATS: { label: string; field: keyof import('@/lib/types').PlayerResponse; apiKey: StatKey }[] = [
  { label: 'STR', field: 'str',          apiKey: 'str' },
  { label: 'AGI', field: 'agi',          apiKey: 'agi' },
  { label: 'VIT', field: 'vit',          apiKey: 'vit' },
  { label: 'INT', field: 'intelligence', apiKey: 'int' },
  { label: 'DEX', field: 'dex',          apiKey: 'dex' },
  { label: 'LUK', field: 'luk',          apiKey: 'luk' },
]

function RoBar({ current, max, variant }: { current: number; max: number; variant: 'hp' | 'sp' }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="ro-bar-track w-full" style={{ height: '8px' }}>
      <div className={`ro-bar-fill ro-bar-${variant}`} style={{ width: `${pct}%`, height: '100%' }} />
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
      toast.error(err instanceof Error ? err.message : 'Erro ao distribuir stat')
    } finally {
      setLoading(null)
    }
  }

  if (!player) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--ro-text-muted)', fontSize: '12px' }}>Carregando...</span>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px', overflowY: 'auto' }}>

      {/* Identity */}
      <div className="ro-panel">
        <div className="ro-panel-header">
          <span className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '10px' }}>
            {player.name}
          </span>
        </div>
        <div style={{ padding: '8px 10px' }}>
          <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text-muted)' }}>
            {player.jobClass}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--ro-text)' }}>Base Lv {player.baseLevel}</span>
            <span style={{ fontSize: '10px', color: 'var(--ro-text)' }}>Job Lv {player.jobLevel}</span>
            <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '12px', color: 'var(--ro-zenny)', fontWeight: 700 }}>
              {player.zenny.toLocaleString()} z
            </span>
          </div>
        </div>
      </div>

      {/* HP / SP */}
      <div className="ro-panel">
        <div className="ro-panel-header">Vida e Mana</div>
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#B02020' }}>HP</span>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '12px', color: 'var(--ro-text-muted)' }}>
                {player.hpCurrent} / {player.hpMax}
              </span>
            </div>
            <RoBar current={player.hpCurrent} max={player.hpMax} variant="hp" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#2050D0' }}>SP</span>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '12px', color: 'var(--ro-text-muted)' }}>
                {player.spCurrent} / {player.spMax}
              </span>
            </div>
            <RoBar current={player.spCurrent} max={player.spMax} variant="sp" />
          </div>
        </div>
      </div>

      {/* Stat points available */}
      {player.statPoints > 0 && (
        <div style={{ background: 'rgba(157,178,219,0.15)', border: '1px solid var(--ro-border)', borderRadius: '8px', padding: '6px 10px', textAlign: 'center' }}>
          <span className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '9px', color: 'var(--ro-text-accent)' }}>
            {player.statPoints} ponto{player.statPoints !== 1 ? 's' : ''} disponível{player.statPoints !== 1 ? 'is' : ''}
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div className="ro-panel">
        <div className="ro-panel-header">Atributos</div>
        <div style={{ padding: '6px 8px' }}>
          {STATS.map(({ label, field, apiKey }) => (
            <div key={apiKey} className="ro-stat-row">
              <span style={{ color: '#3A5A7A', fontWeight: 600, width: '32px' }}>{label}</span>
              <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '16px', color: 'var(--ro-text-accent)', fontWeight: 700, flex: 1, textAlign: 'center' }}>
                {player[field] as number}
              </span>
              {player.statPoints > 0 && (
                <button
                  style={{
                    width: '18px', height: '18px', borderRadius: '5px',
                    background: 'linear-gradient(180deg, var(--ro-header-light) 0%, var(--ro-header-dark) 100%)',
                    border: '1px solid var(--ro-border)',
                    fontSize: '12px', color: 'var(--ro-text)', fontWeight: 700,
                    cursor: loading === apiKey ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: loading === apiKey ? 0.5 : 1,
                  }}
                  disabled={loading === apiKey}
                  onClick={() => handleDistribute(apiKey)}
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skill points */}
      <div className="ro-panel">
        <div className="ro-panel-header">Pontos de Skill</div>
        <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>Disponíveis</span>
          <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ro-text-accent)' }}>
            {player.skillPoints}
          </span>
        </div>
      </div>
    </div>
  )
}
