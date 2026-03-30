# Battle Experience Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rudimentary battle card in MapPanel with a full Pokémon-style battle UI: 2×2 action menu, skill submenu with pagination, consumable item overlay, flee action, victory overlay with reward display, and death flow bug fix.

**Architecture:** A new `BattleHud` component renders the full Pokémon layout when `currentEncounter !== null` in `MapPanel`. `BattleHud` owns local `phase` state (`fighting | dying | victory`) and delegates to specialized subcomponents. `game-context.tsx` is minimally modified: `attackMonster` now returns `BattleResult | null` so `BattleHud` can react to outcomes, and a new `flee()` function is added to the context.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7 strict, Tailwind CSS 4, shadcn/ui Button, Lucide React. Type check: `npx tsc --noEmit`. Dev server: `pnpm dev`.

---

### Task 1: Modify game-context.tsx — attackMonster returns result + add flee

**Files:**
- Modify: `lib/game-context.tsx`

- [ ] **Step 1: Add BattleResult to imports**

In `lib/game-context.tsx` line 15, update the type import:

```ts
import type {
  PlayerResponse, SkillRow, InventoryItem, MapInfo, Encounter, BattleResult
} from './types'
```

- [ ] **Step 2: Update GameContextType interface**

Replace the existing `GameContextType` interface (lines 20–42) with:

```ts
interface GameContextType {
  playerId: number | null
  setPlayerId: (id: number) => void
  player: PlayerResponse | null
  refreshPlayer: () => Promise<void>
  currentEncounter: Encounter | null
  clearEncounter: () => void
  walkMap: () => Promise<void>
  travelTo: (destination: string) => Promise<void>
  attackMonster: (monsterId: number) => Promise<BattleResult | null>
  flee: () => void
  battleLog: string[]
  clearBattleLog: () => void
  mapInfo: MapInfo | null
  inventory: InventoryItem[]
  refreshInventory: () => Promise<void>
  skills: SkillRow[]
  refreshSkills: () => Promise<void>
  refreshMapInfo: () => Promise<void>
  isLoading: boolean
  captchaVisible: boolean
  showCaptcha: () => void
  hideCaptcha: () => void
}
```

- [ ] **Step 3: Rewrite attackMonster**

Replace the existing `attackMonster` implementation (lines 165–185) with:

```ts
const attackMonster = useCallback(async (monsterId: number): Promise<BattleResult | null> => {
  if (!playerId) return null
  setIsLoading(true)
  try {
    const result = await battleApi.attack(playerId, monsterId)
    appendLog(result.message)

    const isFatal = result.message.includes('FATAL')
    const isVictory = result.message.includes('VITÓRIA')

    // Update monster HP for normal rounds (BattleHud handles victory/fatal)
    if (!isFatal && !isVictory && result.monsterHpRemaining != null) {
      setCurrentEncounter(prev =>
        prev ? { ...prev, monsterHpCurrent: result.monsterHpRemaining! } : null
      )
    }

    // For fatal: BattleHud handles the 1500ms delay, clearEncounter, and refreshPlayer
    if (!isFatal) {
      await refreshPlayer()
    }

    return result
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao atacar')
    clearEncounter()
    return null
  } finally {
    setIsLoading(false)
  }
}, [playerId, appendLog, refreshPlayer, clearEncounter])
```

- [ ] **Step 4: Add flee function**

After the `attackMonster` implementation, add:

```ts
const flee = useCallback(() => {
  clearEncounter()
  setBattleLog(prev => {
    const next = [...prev, 'Você conseguiu escapar!']
    return next.length > MAX_BATTLE_LOG ? next.slice(-MAX_BATTLE_LOG) : next
  })
}, [clearEncounter])
```

- [ ] **Step 5: Add flee to context Provider value**

In the `GameContext.Provider` value prop (around line 198), add `flee`:

```ts
<GameContext.Provider value={{
  playerId, setPlayerId,
  player, refreshPlayer,
  currentEncounter, clearEncounter,
  walkMap, travelTo, attackMonster, flee,
  battleLog, clearBattleLog,
  mapInfo, refreshMapInfo,
  inventory, refreshInventory,
  skills, refreshSkills,
  isLoading, captchaVisible, showCaptcha, hideCaptcha,
}}>
```

- [ ] **Step 6: Type check**

```bash
cd "C:/Users/silve/IdeaProjects/ragnarok-simulator/ragnarok-front"
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/game-context.tsx
git commit -m "feat(battle): attackMonster returns BattleResult, add flee to context"
```

---

### Task 2: Create battle-victory-overlay.tsx

**Files:**
- Create: `components/game/battle-victory-overlay.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
    .split(/(?<=[.!])\s+/)
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
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/battle-victory-overlay.tsx
git commit -m "feat(battle): add BattleVictoryOverlay with reward parser"
```

---

### Task 3: Create battle-skill-menu.tsx

**Files:**
- Create: `components/game/battle-skill-menu.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/battle-skill-menu.tsx
git commit -m "feat(battle): add BattleSkillMenu with 2x2 grid and pagination"
```

---

### Task 4: Create battle-item-overlay.tsx

**Files:**
- Create: `components/game/battle-item-overlay.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/game/battle-item-overlay.tsx
'use client'

import type { InventoryItem } from '@/lib/types'

interface BattleItemOverlayProps {
  items: InventoryItem[]
  monsterName: string
  loading: boolean
  onUse: (item: InventoryItem) => void
  onBack: () => void
}

export function BattleItemOverlay({
  items, monsterName, loading, onUse, onBack,
}: BattleItemOverlayProps) {
  const consumables = items.filter(i => i.type === 'CONSUMABLE')

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-background border-b-2 border-emerald-500/30">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 flex-shrink-0">
        <span className="font-[family-name:var(--font-pixel)] text-[9px] text-emerald-400 tracking-wider">
          🎒 CONSUMÍVEIS
        </span>
        <span className="font-[family-name:var(--font-pixel-body)] text-xs text-muted-foreground">
          {monsterName}
        </span>
      </div>

      {/* Scrollable list */}
      <div
        className="flex-1 overflow-y-auto min-h-0"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e3a2a #0a0a18' }}
      >
        {consumables.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground text-center">
              Nenhum consumível no inventário.
            </p>
          </div>
        ) : (
          consumables.map(item => (
            <button
              key={item.id}
              disabled={loading}
              onClick={() => onUse(item)}
              className="w-full flex items-center justify-between px-3 py-2.5 border-b border-border/20 text-left hover:bg-emerald-500/5 transition-colors disabled:opacity-50"
            >
              <span className="font-[family-name:var(--font-pixel-body)] text-sm text-emerald-300">
                {item.name}
              </span>
              <span className={`font-[family-name:var(--font-pixel)] text-[9px] px-2 py-0.5 rounded border font-bold flex-shrink-0 ${
                item.amount === 1
                  ? 'bg-orange-900/40 border-orange-500/40 text-orange-300'
                  : 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300'
              }`}>
                x{item.amount}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full py-2.5 border-t border-border/50 font-[family-name:var(--font-pixel)] text-[9px] text-muted-foreground hover:text-foreground transition-colors bg-card flex-shrink-0"
      >
        ✕ VOLTAR AO COMBATE
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/battle-item-overlay.tsx
git commit -m "feat(battle): add BattleItemOverlay with consumables list and dark scrollbar"
```

---

### Task 5: Create battle-menu.tsx

**Files:**
- Create: `components/game/battle-menu.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/game/battle-menu.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BattleSkillMenu } from './battle-skill-menu'
import type { SkillRow, InventoryItem } from '@/lib/types'

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
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/battle-menu.tsx
git commit -m "feat(battle): add BattleMenu 2x2 with skill submenu integration"
```

---

### Task 6: Create battle-hud.tsx

**Files:**
- Create: `components/game/battle-hud.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/game/battle-hud.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useGame } from '@/lib/game-context'
import { skillApi, inventoryApi } from '@/lib/api'
import { MonsterSprite } from './monster-sprite'
import { BattleMenu } from './battle-menu'
import { BattleItemOverlay } from './battle-item-overlay'
import { BattleVictoryOverlay } from './battle-victory-overlay'
import type { SkillRow, InventoryItem } from '@/lib/types'

type BattlePhase = 'fighting' | 'dying' | 'victory'

export function BattleHud() {
  const {
    playerId, player, currentEncounter, clearEncounter,
    attackMonster, flee, skills, inventory,
    refreshInventory, refreshPlayer,
    battleLog, isLoading,
  } = useGame()

  const [phase, setPhase] = useState<BattlePhase>('fighting')
  const [victoryMessage, setVictoryMessage] = useState('')
  const [showItemOverlay, setShowItemOverlay] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const attackThrottle = useRef(false)

  const currentMessage = battleLog[battleLog.length - 1] ?? ''
  const historyMessages = battleLog.slice(0, -1)

  const handleAttack = useCallback(async () => {
    if (!currentEncounter || attackThrottle.current || isLoading || actionLoading) return
    attackThrottle.current = true
    try {
      const result = await attackMonster(currentEncounter.monsterId)
      if (!result) return

      if (result.message.includes('VITÓRIA')) {
        setVictoryMessage(result.message)
        setPhase('victory')
      } else if (result.message.includes('FATAL')) {
        setPhase('dying')
        setTimeout(async () => {
          clearEncounter()
          await refreshPlayer()
        }, 1500)
      }
    } finally {
      setTimeout(() => { attackThrottle.current = false }, 500)
    }
  }, [currentEncounter, isLoading, actionLoading, attackMonster, clearEncounter, refreshPlayer])

  const handleUseSkill = useCallback(async (skill: SkillRow) => {
    if (!playerId || actionLoading) return
    setActionLoading(true)
    try {
      const res = await skillApi.use(playerId, skill.aegisName, currentEncounter?.monsterId)
      toast.success(res.message)
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar skill')
    } finally {
      setActionLoading(false)
    }
  }, [playerId, actionLoading, currentEncounter, refreshPlayer])

  const handleUseItem = useCallback(async (item: InventoryItem) => {
    if (!playerId || actionLoading) return
    setActionLoading(true)
    try {
      const res = await inventoryApi.use(playerId, item.id)
      toast.success(res.message)
      setShowItemOverlay(false)
      await refreshInventory()
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar item')
    } finally {
      setActionLoading(false)
    }
  }, [playerId, actionLoading, refreshInventory, refreshPlayer])

  const handleVictoryContinue = useCallback(() => {
    clearEncounter()
    setPhase('fighting')
    setVictoryMessage('')
  }, [clearEncounter])

  if (!currentEncounter) return null

  // Victory: full screen overlay
  if (phase === 'victory') {
    return (
      <div className="flex-1 flex flex-col">
        <BattleVictoryOverlay
          message={victoryMessage}
          onContinue={handleVictoryContinue}
        />
      </div>
    )
  }

  const loading = isLoading || actionLoading

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Battle scene — Pokémon layout */}
      <div className="relative h-44 bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#2d1b0e] flex-shrink-0">

        {/* Monster HP — top left */}
        <div className="absolute top-2 left-3 bg-background/80 border border-destructive/30 rounded-md px-2 py-1.5 min-w-[110px]">
          <p className="font-[family-name:var(--font-pixel)] text-[9px] text-destructive/80 truncate mb-1">
            {currentEncounter.monsterName}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-muted-foreground">HP</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, (currentEncounter.monsterHpCurrent / currentEncounter.monsterHpInitial) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Monster sprite — top right */}
        <div className="absolute top-2 right-3">
          <MonsterSprite
            id={currentEncounter.monsterId}
            name={currentEncounter.monsterName}
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Player sprite — bottom left */}
        <div className="absolute bottom-3 left-4 w-12 h-12 rounded border border-primary/20 bg-primary/5 flex items-center justify-center">
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-primary/40">CHAR</span>
        </div>

        {/* Player HP + SP — bottom right */}
        {player && (
          <div className="absolute bottom-3 right-3 bg-background/80 border border-primary/30 rounded-md px-2 py-1.5 min-w-[110px]">
            <p className="font-[family-name:var(--font-pixel)] text-[9px] text-primary/80 mb-1 truncate">
              {player.name}
            </p>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-[family-name:var(--font-pixel)] text-[7px] text-muted-foreground">HP</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.hpCurrent / player.hpMax) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-[family-name:var(--font-pixel)] text-[7px] text-muted-foreground">SP</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.spCurrent / player.spMax) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Item overlay — covers the scene */}
        {showItemOverlay && (
          <BattleItemOverlay
            items={inventory}
            monsterName={currentEncounter.monsterName}
            loading={loading}
            onUse={handleUseItem}
            onBack={() => setShowItemOverlay(false)}
          />
        )}
      </div>

      {/* Textbox */}
      <div className="bg-card border-t-2 border-border px-3 py-2 flex-shrink-0">
        {phase === 'dying' ? (
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-destructive">
            ⚠ GOLPE FATAL! Você foi derrotado.
          </p>
        ) : (
          <>
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-foreground">
              {currentMessage || 'Um encontro!'}
            </p>
            {historyMessages.length > 0 && (
              <>
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="flex items-center gap-1 mt-1 font-[family-name:var(--font-pixel)] text-[8px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showHistory
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronUp className="w-3 h-3" />}
                  {historyMessages.length} turno{historyMessages.length !== 1 ? 's' : ''} anterior{historyMessages.length !== 1 ? 'es' : ''}
                </button>
                {showHistory && (
                  <div
                    className="mt-1 max-h-24 overflow-y-auto space-y-0.5 border-t border-border/30 pt-1"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1e3a #0a0a18' }}
                  >
                    {historyMessages.map((msg, i) => (
                      <p key={i} className="font-[family-name:var(--font-pixel-body)] text-xs text-muted-foreground">
                        {msg}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Battle menu — hidden during dying phase */}
      {phase === 'fighting' && (
        <BattleMenu
          skills={skills}
          loading={loading}
          onAttack={handleAttack}
          onUseSkill={handleUseSkill}
          onOpenItems={() => setShowItemOverlay(true)}
          onFlee={flee}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/battle-hud.tsx
git commit -m "feat(battle): add BattleHud Pokémon layout orchestrating all battle actions"
```

---

### Task 7: Modify map-panel.tsx — delegate to BattleHud during encounters

**Files:**
- Modify: `components/game/map-panel.tsx`

- [ ] **Step 1: Replace map-panel.tsx**

```tsx
// components/game/map-panel.tsx
'use client'

import { useEffect } from 'react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'
import { Footprints, MapPin, ChevronRight } from 'lucide-react'
import { BattleHud } from '@/components/game/battle-hud'

export function MapPanel() {
  const {
    playerId, mapInfo, refreshMapInfo, currentEncounter,
    walkMap, travelTo, isLoading,
  } = useGame()

  useEffect(() => {
    if (playerId && !mapInfo) refreshMapInfo()
  }, [playerId, mapInfo, refreshMapInfo])

  // During encounter: hand off entirely to BattleHud
  if (currentEncounter) {
    return <BattleHud />
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      {/* Map Info */}
      <div className="game-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
            LOCALIZAÇÃO ATUAL
          </span>
        </div>
        <p className="font-[family-name:var(--font-pixel-body)] text-xl text-primary">
          {mapInfo?.currentMap ?? 'Prontera Field'}
        </p>
      </div>

      {/* Walk Button */}
      <Button
        onClick={() => { if (!isLoading) walkMap() }}
        disabled={isLoading}
        className="w-full h-14 font-[family-name:var(--font-pixel)] text-sm pixel-button"
      >
        <Footprints className="w-5 h-5 mr-2" />
        {isLoading ? 'ANDANDO...' : 'ANDAR'}
      </Button>

      {/* Portals */}
      {mapInfo && mapInfo.availablePortals?.length > 0 && (
        <div className="game-panel p-4">
          <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">
            PORTAIS DISPONÍVEIS
          </p>
          <div className="space-y-2">
            {mapInfo.availablePortals.map((portal) => (
              <Button
                key={portal}
                variant="outline"
                onClick={() => travelTo(portal)}
                disabled={isLoading}
                className="w-full justify-between font-[family-name:var(--font-pixel-body)] text-lg"
              >
                {portal}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual test in browser**

```bash
pnpm dev
```

Test checklist:
1. Walk until encounter → BattleHud replaces walk view with Pokémon layout
2. Monster HP top-left, sprite top-right, CHAR bottom-left, player HP+SP bottom-right
3. ATACAR works: textbox updates, monster HP bar shrinks, history expandable with `↑`
4. SKILL button → skill grid 2×2 appears with ANTERIOR/PRÓXIMO/VOLTAR
5. Clicking a skill uses it and returns to main 2×2 menu
6. ITEM → overlay covers battle scene, shows consumables with quantity badges
7. Using item closes overlay, player HP updates
8. FUGIR → encounter clears, textbox shows "Você conseguiu escapar!", walk view returns
9. Dying → textbox shows "⚠ GOLPE FATAL!", after 1.5s death overlay appears
10. Winning → victory overlay with 🏆 VITÓRIA!, CONTINUAR returns to walk view

- [ ] **Step 4: Commit**

```bash
git add components/game/map-panel.tsx
git commit -m "feat(battle): MapPanel delegates to BattleHud during encounters"
```
