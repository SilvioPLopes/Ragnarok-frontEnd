// components/game/battle-skill-menu.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SkillRow } from '@/lib/types'

const PAGE_SIZE = 4

interface BattleSkillMenuProps {
  skills: SkillRow[]
  loading: boolean
  onUse: (skill: SkillRow) => void
  onBack: () => void
}

export function BattleSkillMenu({ skills, loading, onUse, onBack }: BattleSkillMenuProps) {
  const [page, setPage] = useState(0)

  const usable = skills.filter(s => s.currentLevel > 0)
  const totalPages = Math.max(1, Math.ceil(usable.length / PAGE_SIZE))
  const pageSkills = usable.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const slots: (SkillRow | null)[] = [
    ...pageSkills,
    ...Array(PAGE_SIZE - pageSkills.length).fill(null),
  ]

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-card border-t border-border">
      {/* 2×2 skill grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {slots.map((skill, i) =>
          skill ? (
            <Button
              key={skill.aegisName}
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => onUse(skill)}
              className="font-[family-name:var(--font-pixel)] text-[9px] border-violet-500/40 text-violet-300 hover:bg-violet-500/10 flex flex-col h-auto py-1.5 gap-0.5"
            >
              <span className="truncate w-full text-center">{skill.name}</span>
              <span className="text-[7px] text-muted-foreground">Lv {skill.currentLevel}</span>
            </Button>
          ) : (
            <div
              key={`empty-${i}`}
              className="border border-dashed border-border/20 rounded-md h-10"
            />
          )
        )}
      </div>

      {/* Pagination dots */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 py-0.5">
          {Array.from({ length: totalPages }, (_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === page ? 'bg-violet-400' : 'bg-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation row */}
      <div className="grid grid-cols-3 gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={onBack}
          className="font-[family-name:var(--font-pixel)] text-[9px] text-muted-foreground"
        >
          ✕ VOLTAR
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
          className="font-[family-name:var(--font-pixel)] text-[9px] border-violet-500/30 text-violet-400 disabled:opacity-30"
        >
          ‹ ANT
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages - 1}
          onClick={() => setPage(p => p + 1)}
          className="font-[family-name:var(--font-pixel)] text-[9px] border-violet-500/30 text-violet-400 disabled:opacity-30"
        >
          PRÓX ›
        </Button>
      </div>
    </div>
  )
}
