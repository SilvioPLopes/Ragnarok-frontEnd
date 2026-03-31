// components/game/class-change-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import type { JobClass } from '@/lib/types'
import { toast } from 'sonner'
import { ArrowUpCircle, Sparkles } from 'lucide-react'

const CLASS_DESCRIPTIONS: Record<JobClass, string> = {
  NOVICE:     'Classe inicial. Pode evoluir para qualquer primeira classe.',
  SWORDSMAN:  'Guerreiro especializado em combate corpo a corpo com espadas.',
  MAGE:       'Mago especializado em magias elementais devastadoras.',
  ARCHER:     'Arqueiro com alta precisão e ataques a distância.',
  THIEF:      'Ladino ágil com habilidades de furtividade e ataques rápidos.',
  MERCHANT:   'Comerciante com habilidades econômicas e de crafting.',
  ACOLYTE:    'Clérigo com magias de cura e suporte.',
  KNIGHT:     'Cavaleiro blindado com alta defesa e ataques poderosos.',
  WIZARD:     'Mago avançado com magias de área devastadoras.',
  HUNTER:     'Caçador com armadilhas e um falcão companheiro.',
  ASSASSIN:   'Assassino mortal com ataques críticos e venenos.',
  BLACKSMITH: 'Ferreiro capaz de forjar e aprimorar equipamentos.',
  PRIEST:     'Sacerdote com curas poderosas e magias sagradas.',
}

export function ClassChangePanel() {
  const { player, playerId, refreshPlayer } = useGame()
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  // ⚠ BACKEND NEEDED: GET /api/players/{id}/class-change deve retornar `blockedReason: string | null`
  // quando não há classes disponíveis. Por enquanto o frontend mostra mensagem genérica.
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (playerId && player?.jobClass) loadClasses()
  }, [playerId, player?.jobClass])

  const loadClasses = async () => {
    if (!playerId) return
    setIsLoading(true)
    try {
      const classes = await playerApi.listAvailableClasses(playerId)
      setAvailableClasses(classes)
    } catch {
      setAvailableClasses([])
    } finally { setIsLoading(false) }
  }

  const handleChangeClass = async () => {
    if (!playerId || !selectedClass || isChanging) return
    setIsChanging(true)
    try {
      await playerApi.changeClass(playerId, selectedClass)
      await refreshPlayer()
      toast.success(`Classe alterada para ${selectedClass}!`)
      setSelectedClass(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao trocar classe')
    } finally { setIsChanging(false) }
  }

  if (!player) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--ro-text-muted)', fontSize: '12px' }}>Carregando...</span>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px', overflowY: 'auto' }}>

      {/* Current class */}
      <div className="ro-panel">
        <div className="ro-panel-header">Classe Atual</div>
        <div style={{ padding: '8px 10px' }}>
          <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '18px', color: 'var(--ro-text-accent)', fontWeight: 700 }}>
            {player.jobClass}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--ro-text-muted)', marginTop: '2px' }}>
            Job Level: {player.jobLevel}
          </div>
        </div>
      </div>

      {/* Available classes */}
      <div>
        <div className="ro-section-label">Evoluções Disponíveis</div>
        {isLoading ? (
          <span style={{ fontSize: '11px', color: 'var(--ro-text-muted)' }}>Carregando...</span>
        ) : availableClasses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '24px 0' }}>
            <Sparkles style={{ width: '28px', height: '28px', color: 'var(--ro-text-muted)' }} />
            <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '13px', color: 'var(--ro-text-muted)', textAlign: 'center' }}>
              {/* ⚠ BACKEND NEEDED: exibir blockedReason da API aqui */}
              Nenhuma evolução disponível no momento.
            </span>
          </div>
        ) : (
          availableClasses.map((cls) => (
            <div
              key={cls}
              className="ro-list-item"
              style={{ cursor: 'pointer', marginBottom: '4px' }}
              onClick={() => setSelectedClass(cls)}
            >
              <div style={{ flex: 1 }}>
                <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '15px', fontWeight: 600 }}>
                  {cls}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--ro-text-muted)', marginTop: '2px' }}>
                  {CLASS_DESCRIPTIONS[cls as JobClass] ?? ''}
                </div>
              </div>
              <ArrowUpCircle style={{ width: '16px', height: '16px', color: 'var(--ro-text-accent)', flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>

      {/* Confirmation dialog */}
      {selectedClass && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="ro-panel" style={{ width: '320px', borderRadius: '12px' }}>
            <div className="ro-panel-header">Confirmar Evolução</div>
            <div style={{ padding: '14px' }}>
              <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ro-text-accent)', marginBottom: '6px' }}>
                {selectedClass}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ro-text-muted)', marginBottom: '14px' }}>
                {CLASS_DESCRIPTIONS[selectedClass as JobClass] ?? ''}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                  style={{ flex: 1, padding: '8px', fontSize: '10px' }}
                  disabled={isChanging}
                  onClick={handleChangeClass}
                >
                  {isChanging ? 'EVOLUINDO...' : 'CONFIRMAR'}
                </button>
                <button
                  className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                  style={{ padding: '8px 14px', fontSize: '10px' }}
                  onClick={() => setSelectedClass(null)}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
