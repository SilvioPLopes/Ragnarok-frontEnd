// components/game/skill-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { skillApi } from '@/lib/api'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { SkillRow } from '@/lib/types'

export function SkillPanel() {
  const { playerId, player, skills, refreshSkills, refreshPlayer, currentEncounter } = useGame()
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => { if (playerId) refreshSkills() }, [playerId, refreshSkills])

  const handleLearn = async (skill: SkillRow) => {
    if (!playerId || loading) return
    setLoading(skill.aegisName)
    try {
      const res = await skillApi.learn(playerId, skill.aegisName)
      toast.success(res.message)
      await refreshSkills()
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprender skill')
    } finally { setLoading(null) }
  }

  const handleUse = async (skill: SkillRow) => {
    if (!playerId || loading) return
    setLoading(skill.aegisName)
    try {
      const res = await skillApi.use(playerId, skill.aegisName, currentEncounter?.monsterId ?? undefined)
      toast.success(res.message)
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar skill')
    } finally { setLoading(null) }
  }

  if (skills.length === 0) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px' }}>
      <Sparkles style={{ width: '32px', height: '32px', color: 'var(--ro-text-muted)' }} />
      <span className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text-muted)' }}>
        Nenhuma skill disponível.
      </span>
    </div>
  )

  const skillPoints = player?.skillPoints ?? 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '6px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div className="ro-section-label" style={{ marginBottom: 0 }}>Skills</div>
        <span style={{ fontSize: '10px', color: 'var(--ro-text-accent)', fontWeight: 600 }}>
          {skillPoints} ponto{skillPoints !== 1 ? 's' : ''}
        </span>
      </div>

      {skills.map((skill) => (
        <div key={skill.aegisName} className="ro-panel">
          <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-[family-name:var(--font-pixel-body)]" style={{ fontSize: '14px', color: 'var(--ro-text)' }}>
                {skill.name}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--ro-text-muted)' }}>
                Lv {skill.currentLevel} / {skill.maxLevel}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {skill.canLearn && skillPoints > 0 && (
                <button
                  className="ro-btn-primary font-[family-name:var(--font-pixel)]"
                  style={{ padding: '4px 10px', fontSize: '9px' }}
                  disabled={loading === skill.aegisName}
                  onClick={() => handleLearn(skill)}
                >
                  {loading === skill.aegisName ? '...' : 'APRENDER'}
                </button>
              )}
              {!skill.canLearn && skill.blockedReason && (
                <span title={skill.blockedReason}>
                  <button
                    className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                    style={{ padding: '4px 10px', fontSize: '9px', opacity: 0.45 }}
                    disabled
                  >
                    APRENDER
                  </button>
                </span>
              )}
              {skill.currentLevel > 0 && (
                <button
                  className="ro-btn-ghost font-[family-name:var(--font-pixel)]"
                  style={{ padding: '4px 10px', fontSize: '9px' }}
                  disabled={loading === skill.aegisName}
                  onClick={() => handleUse(skill)}
                >
                  {loading === skill.aegisName ? '...' : 'USAR'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
