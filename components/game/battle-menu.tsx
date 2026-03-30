// components/game/battle-menu.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BattleSkillMenu } from './battle-skill-menu'
import type { SkillRow } from '@/lib/types'

type MenuMode = 'main' | 'skill'

interface BattleMenuProps {
  skills: SkillRow[]
  loading: boolean
  onAttack: () => void
  onUseSkill: (skill: SkillRow) => void
  onOpenItems: () => void
  onFlee: () => void
}

export function BattleMenu({
  skills, loading,
  onAttack, onUseSkill, onOpenItems, onFlee,
}: BattleMenuProps) {
  const [mode, setMode] = useState<MenuMode>('main')

  if (mode === 'skill') {
    return (
      <BattleSkillMenu
        skills={skills}
        loading={loading}
        onUse={(skill) => {
          setMode('main')
          onUseSkill(skill)
        }}
        onBack={() => setMode('main')}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-1.5 p-2 bg-card border-t border-border flex-shrink-0">
      <Button
        onClick={onAttack}
        disabled={loading}
        className="font-[family-name:var(--font-pixel)] text-[10px] pixel-button bg-destructive hover:bg-destructive/80"
      >
        {loading ? '...' : '⚔ ATACAR'}
      </Button>
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => setMode('skill')}
        className="font-[family-name:var(--font-pixel)] text-[10px] border-violet-500/50 text-violet-300 hover:bg-violet-500/10"
      >
        ✦ SKILL
      </Button>
      <Button
        variant="outline"
        disabled={loading}
        onClick={onOpenItems}
        className="font-[family-name:var(--font-pixel)] text-[10px] border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
      >
        🎒 ITEM
      </Button>
      <Button
        variant="outline"
        disabled={loading}
        onClick={onFlee}
        className="font-[family-name:var(--font-pixel)] text-[10px] border-muted-foreground/40 text-muted-foreground hover:bg-muted/10"
      >
        ↩ FUGIR
      </Button>
    </div>
  )
}
