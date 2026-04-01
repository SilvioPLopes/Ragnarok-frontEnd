// app/(game)/select-character/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import type { Player } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Play, LogOut } from 'lucide-react'

const DEMO_PLAYERS: Player[] = [
  { id: 1, name: 'DemoKnight', jobClass: 'SWORDSMAN', baseLevel: 25, jobLevel: 10, hpCurrent: 850, hpMax: 1200, spCurrent: 80, spMax: 150, str: 35, agi: 20, vit: 25, intelligence: 5, dex: 15, luk: 10, statPoints: 12, skillPoints: 5, zenny: 25000, mapName: 'prontera' },
  { id: 2, name: 'DemoMage',   jobClass: 'MAGE',      baseLevel: 18, jobLevel: 8,  hpCurrent: 380, hpMax: 500,  spCurrent: 450, spMax: 600, str: 5, agi: 10, vit: 10, intelligence: 40, dex: 25, luk: 15, statPoints: 8, skillPoints: 3, zenny: 18000, mapName: 'prontera' },
  { id: 3, name: 'DemoArcher', jobClass: 'ARCHER',    baseLevel: 22, jobLevel: 9,  hpCurrent: 650, hpMax: 800,  spCurrent: 150, spMax: 200, str: 15, agi: 35, vit: 15, intelligence: 10, dex: 40, luk: 20, statPoints: 10, skillPoints: 4, zenny: 32000, mapName: 'prontera' },
]

function RoBar({ current, max, variant }: { current: number; max: number; variant: 'hp' | 'sp' }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="ro-bar-track w-full" style={{ height: '10px' }}>
      <div className={`ro-bar-fill ro-bar-${variant}`} style={{ width: `${pct}%`, height: '100%' }} />
    </div>
  )
}

export default function SelectCharacterPage() {
  const router = useRouter()
  const { logout, user } = useAuth()
  const { setPlayerId } = useGame()
  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true'

  useEffect(() => { loadPlayers() }, [])

  const loadPlayers = async () => {
    setIsLoading(true)
    if (isDemoMode) {
      setTimeout(() => { setPlayers(DEMO_PLAYERS); setSelected(DEMO_PLAYERS[0]); setIsLoading(false) }, 400)
      return
    }
    try {
      const data = await playerApi.list()
      setPlayers(data)
      if (data.length > 0) setSelected(data[0])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar personagens')
    } finally { setIsLoading(false) }
  }

  const handlePlay = () => {
    if (!selected) { toast.error('Selecione um personagem'); return }
    setPlayerId(selected.id)
    router.push('/game')
  }

  const handleDelete = async () => {
    if (!selected) return
    setIsDeleting(true)
    if (isDemoMode) {
      setTimeout(() => {
        setPlayers(p => p.filter(x => x.id !== selected.id))
        setSelected(null)
        toast.success('Personagem removido (demo)')
        setIsDeleting(false)
      }, 300)
      return
    }
    try {
      // ⚠ BACKEND NEEDED: endpoint DELETE /api/players/{id} deve existir no core
      await playerApi.delete(selected.id)
      setPlayers(p => p.filter(x => x.id !== selected.id))
      setSelected(null)
      toast.success('Personagem removido')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover personagem')
    } finally { setIsDeleting(false) }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ro-page-bg)' }}>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ro-border)', background: 'var(--ro-panel-bg)' }}>
        <div>
          <h1 className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '14px', color: 'var(--ro-text-accent)' }}>RAGNAROK</h1>
          <p style={{ fontSize: '11px', color: 'var(--ro-text-muted)' }}>Bem-vindo, {user?.username ?? 'Aventureiro'}</p>
        </div>
        <button className="ro-btn-ghost" style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => { logout(); router.push('/login') }}>
          <LogOut style={{ width: '14px', height: '14px' }} />
          Sair
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>

          {/* Character list */}
          <div className="ro-panel" style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="ro-panel-header" style={{ justifyContent: 'space-between' }}>
              <span>Personagens</span>
              <Link href="/create-character">
                <button className="ro-btn-primary font-[family-name:var(--font-pixel)]" style={{ padding: '2px 8px', fontSize: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Plus style={{ width: '10px', height: '10px' }} /> NOVO
                </button>
              </Link>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ro-text-muted)', fontSize: '11px' }}>Carregando...</div>
              ) : players.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--ro-text-muted)', marginBottom: '10px' }}>Nenhum personagem</p>
                  <Link href="/create-character">
                    <button className="ro-btn-primary font-[family-name:var(--font-pixel)]" style={{ padding: '6px 12px', fontSize: '9px' }}>CRIAR</button>
                  </Link>
                </div>
              ) : (
                players.map((p) => (
                  <div
                    key={p.id}
                    className={`ro-list-item ${selected?.id === p.id ? 'selected' : ''}`}
                    style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
                    onClick={() => setSelected(p)}
                  >
                    <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px' }}>{p.name}</span>
                    <span style={{ fontSize: '9px', color: selected?.id === p.id ? '#1a3050' : 'var(--ro-text-muted)' }}>
                      Lv {p.baseLevel} {p.jobClass}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Character detail */}
          <div className="ro-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selected ? (
              <>
                <div className="ro-panel-header" style={{ justifyContent: 'space-between' }}>
                  <span className="font-[family-name:var(--font-pixel)]" style={{ fontSize: '10px' }}>{selected.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>{selected.jobClass} · Lv {selected.baseLevel}</span>
                </div>
                <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>

                  {/* Stats grid */}
                  <div className="ro-section-label">Atributos</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '12px' }}>
                    {[
                      ['STR', selected.str], ['AGI', selected.agi], ['VIT', selected.vit],
                      ['INT', selected.intelligence], ['DEX', selected.dex], ['LUK', selected.luk],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: 'rgba(157,178,219,0.1)', border: '1px solid var(--ro-border)', borderRadius: '6px', padding: '6px 8px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 600, color: 'var(--ro-text-muted)' }}>{label}</div>
                        <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ro-text-accent)' }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* HP / SP */}
                  <div className="ro-section-label">Vida e Mana</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#B02020' }}>HP</span>
                        <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)' }}>{selected.hpCurrent}/{selected.hpMax}</span>
                      </div>
                      <RoBar current={selected.hpCurrent} max={selected.hpMax} variant="hp" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#2050D0' }}>SP</span>
                        <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)' }}>{selected.spCurrent}/{selected.spMax}</span>
                      </div>
                      <RoBar current={selected.spCurrent} max={selected.spMax} variant="sp" />
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>Status Pts: <strong style={{ color: 'var(--ro-text-accent)' }}>{selected.statPoints}</strong></div>
                    <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>Skill Pts: <strong style={{ color: 'var(--ro-text-accent)' }}>{selected.skillPoints}</strong></div>
                    <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)' }}>Zenny: <strong style={{ color: 'var(--ro-zenny)' }}>{selected.zenny.toLocaleString()} z</strong></div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="ro-btn-primary font-[family-name:var(--font-pixel)]" style={{ flex: 1, padding: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handlePlay}>
                      <Play style={{ width: '14px', height: '14px' }} /> JOGAR
                    </button>
                    <button className="ro-btn-ghost" style={{ padding: '10px 14px', fontSize: '11px', color: '#B02020', borderColor: '#D09090' }} disabled={isDeleting} onClick={handleDelete}>
                      {isDeleting ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--ro-text-muted)' }}>Selecione um personagem</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
