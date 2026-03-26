# ragnarok-front Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the logic layer of the V0-generated Next.js frontend to correctly consume the ragnarok-core REST API, adding antifraude compliance while preserving all existing UI/visual code.

**Architecture:** Three sequential Phase-0 files (types → api → context) establish all contracts. Two parallel agent tracks (A: map/battle/hud, B: inventory/skills/status/create) then rewrite components independently. No test framework is configured — TypeScript compilation (`npx tsc --noEmit`) is used as the primary verification gate between tasks.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/Radix UI, Sonner (toasts), fetch (native), no Axios, no TanStack Query, no Zustand.

**Spec:** `docs/superpowers/specs/2026-03-25-ragnarok-front-refactor-design.md`

---

## File Map

| File | Action | Phase |
|------|--------|-------|
| `lib/types.ts` | Rewrite | 0 |
| `lib/api.ts` | Rewrite | 0 |
| `lib/game-context.tsx` | Rewrite | 0 |
| `app/(game)/layout.tsx` | Modify | 0 |
| `app/(game)/game/page.tsx` | Modify | 0 |
| `components/ui/captcha-modal.tsx` | Create | A |
| `components/game/player-hud.tsx` | Rewrite | A |
| `components/game/map-panel.tsx` | Rewrite | A |
| `components/game/battle-panel.tsx` | Rewrite | A |
| `app/(game)/create-character/page.tsx` | Rewrite | B |
| `components/game/inventory-panel.tsx` | Rewrite | B |
| `components/game/skill-panel.tsx` | Rewrite | B |
| `components/game/status-panel.tsx` | Rewrite | B |

**Do NOT touch:** `lib/auth-context.tsx`, `app/(auth)/**`, `class-change-panel.tsx`, all `components/ui/` except the new `captcha-modal.tsx`, `app/layout.tsx`.

---

## PHASE 0 — Sequential Foundation

> Complete all Phase 0 tasks before starting Agent A or B. Each task must pass `npx tsc --noEmit` before moving to the next.

---

### Task 1: Rewrite `lib/types.ts`

**Files:**
- Rewrite: `lib/types.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
// lib/types.ts

export interface PlayerResponse {
  id: number
  name: string
  jobClass: string
  baseLevel: number
  jobLevel: number
  hpCurrent: number
  hpMax: number
  spCurrent: number
  spMax: number
  str: number
  agi: number
  vit: number
  intelligence: number   // API returns "intelligence"; payload for PUT uses key "int"
  dex: number
  luk: number
  statPoints: number
  skillPoints: number
  zenny: number
  mapName: string
}

export interface SkillRow {
  aegisName: string       // used in API URLs — never use `name` in URLs
  name: string            // display only
  maxLevel: number
  currentLevel: number
  canLearn: boolean
  blockedReason?: string
}

export interface InventoryItem {
  id: string              // UUID
  name: string
  type: 'WEAPON' | 'ARMOR' | 'CONSUMABLE' | 'ETC'
  amount: number
  equipped: boolean
}

export interface MapInfo {
  mapName: string
  portals: string[]       // portal destination names
}

export interface WalkResult {
  encounterOccurred: boolean
  monsterId: number | null
  monsterName: string | null
  monsterHp: number | null   // HP at encounter start — does not update between rounds
  message: string
}

export interface BattleResult {
  message: string
  fraud?: FraudResponse
}

export interface Encounter {
  monsterId: number
  monsterName: string
  monsterHpInitial: number   // display only, does not change
}

export type Verdict = 'APPROVED' | 'BLOCKED' | 'CHALLENGE' | 'UNKNOWN'
export type RequiredAction =
  | 'NONE'
  | 'CANCEL_ACTION'
  | 'SHOW_CAPTCHA'
  | 'DROP_SESSION'
  | 'FLAG_FOR_REVIEW'
  | 'ALERT_ONLY'

export interface FraudResponse {
  verdict: Verdict
  requiredAction: RequiredAction
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason?: string
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:/Users/silve/IdeaProjects/ragnarok-simulator/ragnarok-front
npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only in `lib/api.ts` and `lib/game-context.tsx` (they import old types). No errors in `lib/types.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "refactor: rewrite types.ts with real ragnarok-core contracts"
```

---

### Task 2: Rewrite `lib/api.ts`

**Files:**
- Rewrite: `lib/api.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
// lib/api.ts
// No 'use client' — this module has no React hooks and must be importable from any context

import type {
  PlayerResponse, SkillRow, InventoryItem,
  MapInfo, WalkResult, BattleResult, FraudResponse, RequiredAction
} from './types'
import { toast } from 'sonner'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// ─── Fraud handler factory ────────────────────────────────────────────────────
// Needs router + showCaptcha injected at runtime (to avoid circular deps with context).
// Call configureFraudHandler() once inside GameProvider.

type FraudHandlerDeps = {
  push: (path: string) => void
  showCaptcha: () => void
}

let fraudHandlerDeps: FraudHandlerDeps | null = null

export function configureFraudHandler(deps: FraudHandlerDeps) {
  fraudHandlerDeps = deps
}

export function handleFraudResponse(fraud: FraudResponse): void {
  if (!fraudHandlerDeps) {
    console.warn('[antifraude] handler not configured', fraud)
    return
  }
  const { push, showCaptcha } = fraudHandlerDeps

  if (fraud.verdict === 'BLOCKED') {
    localStorage.removeItem('playerId')
    toast.error('Conta bloqueada')
    push('/')
    return
  }

  const action: RequiredAction = fraud.requiredAction
  switch (action) {
    case 'DROP_SESSION':
      localStorage.removeItem('playerId')
      push('/')
      break
    case 'SHOW_CAPTCHA':
      showCaptcha()
      break
    case 'CANCEL_ACTION':
      toast.error('Ação cancelada pelo sistema de segurança')
      console.warn('[antifraude] CANCEL_ACTION', fraud.reason)
      break
    case 'FLAG_FOR_REVIEW':
    case 'ALERT_ONLY':
      console.warn('[antifraude]', action, fraud)
      break
    case 'NONE':
    default:
      break
  }
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Action-Timestamp': Date.now().toString(),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const err = await res.json()
      message = err?.message ?? message
    } catch { /* no body */ }
    throw new Error(message)
  }

  // Handle void responses (e.g., travel returns 200 with no body)
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return undefined as T
  }

  const data = await res.json() as T & { fraud?: FraudResponse }
  if (data?.fraud) {
    handleFraudResponse(data.fraud)
  }
  return data
}

// ─── API namespaces ───────────────────────────────────────────────────────────

export const playerApi = {
  get(id: number): Promise<PlayerResponse> {
    return apiFetch<PlayerResponse>(`/api/players/${id}`)
  },

  create(name: string, jobClass: string): Promise<PlayerResponse> {
    return apiFetch<PlayerResponse>('/api/players', {
      method: 'POST',
      body: JSON.stringify({ name, jobClass }),
    })
  },

  /** stats keys use "int" (not "intelligence") per API contract */
  distributeStats(
    id: number,
    stats: Partial<Record<'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk', number>>
  ): Promise<PlayerResponse> {
    return apiFetch<PlayerResponse>(`/api/players/${id}/stats`, {
      method: 'PUT',
      body: JSON.stringify(stats),
    })
  },
}

export const battleApi = {
  attack(playerId: number, monsterId: number): Promise<BattleResult> {
    return apiFetch<BattleResult>('/api/battle/attack', {
      method: 'POST',
      body: JSON.stringify({ playerId, monsterId }),
    })
  },
}

export const skillApi = {
  list(playerId: number): Promise<SkillRow[]> {
    return apiFetch<SkillRow[]>(`/api/players/${playerId}/skills`)
  },

  /** skillName must be skill.aegisName, NOT skill.name */
  learn(playerId: number, aegisName: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(
      `/api/players/${playerId}/skills/${aegisName}/learn`,
      { method: 'POST' }
    )
  },

  /** skillName must be skill.aegisName, NOT skill.name */
  use(
    playerId: number,
    aegisName: string,
    monsterId?: number
  ): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(
      `/api/players/${playerId}/skills/${aegisName}/use`,
      {
        method: 'POST',
        body: monsterId !== undefined ? JSON.stringify({ monsterId }) : undefined,
      }
    )
  },
}

export const inventoryApi = {
  list(playerId: number): Promise<InventoryItem[]> {
    return apiFetch<InventoryItem[]>(`/api/players/${playerId}/inventory`)
  },

  use(playerId: number, itemId: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(
      `/api/players/${playerId}/inventory/${itemId}/use`,
      { method: 'POST' }
    )
  },
}

export const mapApi = {
  get(playerId: number): Promise<MapInfo> {
    return apiFetch<MapInfo>(`/api/players/${playerId}/map`)
  },

  walk(playerId: number): Promise<WalkResult> {
    return apiFetch<WalkResult>(`/api/players/${playerId}/map/walk`, {
      method: 'POST',
    })
  },

  /** Returns void — core responds 200 with no body */
  travel(playerId: number, destination: string): Promise<void> {
    return apiFetch<void>(`/api/players/${playerId}/map/travel`, {
      method: 'POST',
      body: JSON.stringify({ destination }),
    })
  },
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors only in `lib/game-context.tsx` (still uses old context shape). `lib/api.ts` should be clean.

- [ ] **Step 3: Commit**

```bash
git add lib/api.ts
git commit -m "refactor: rewrite api.ts with correct ragnarok-core endpoints and antifraude interceptor"
```

---

### Task 3: Rewrite `lib/game-context.tsx`

**Files:**
- Rewrite: `lib/game-context.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
// lib/game-context.tsx
'use client'

import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  playerApi, battleApi, skillApi, inventoryApi, mapApi,
  configureFraudHandler
} from './api'
import type {
  PlayerResponse, SkillRow, InventoryItem, MapInfo, Encounter
} from './types'

const MAX_BATTLE_LOG = 100

interface GameContextType {
  playerId: number | null
  setPlayerId: (id: number) => void
  player: PlayerResponse | null
  refreshPlayer: () => Promise<void>
  currentEncounter: Encounter | null
  clearEncounter: () => void
  walkMap: () => Promise<void>
  travelTo: (destination: string) => Promise<void>
  attackMonster: (monsterId: number) => Promise<void>
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

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [playerId, setPlayerIdState] = useState<number | null>(null)
  const [player, setPlayer] = useState<PlayerResponse | null>(null)
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [captchaVisible, setCaptchaVisible] = useState(false)

  const showCaptcha = useCallback(() => setCaptchaVisible(true), [])
  const hideCaptcha = useCallback(() => setCaptchaVisible(false), [])
  const clearEncounter = useCallback(() => setCurrentEncounter(null), [])
  const clearBattleLog = useCallback(() => setBattleLog([]), [])

  const appendLog = useCallback((message: string) => {
    setBattleLog(prev => {
      const next = [...prev, message]
      return next.length > MAX_BATTLE_LOG ? next.slice(-MAX_BATTLE_LOG) : next
    })
  }, [])

  // Configure fraud handler once (needs router + showCaptcha)
  const fraudConfigured = useRef(false)
  useEffect(() => {
    if (fraudConfigured.current) return
    fraudConfigured.current = true
    configureFraudHandler({ push: router.push, showCaptcha })
  }, [router.push, showCaptcha])

  // Restore playerId from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('playerId')
    if (stored) {
      const id = parseInt(stored, 10)
      if (!isNaN(id)) setPlayerIdState(id)
    }
  }, [])

  const setPlayerId = useCallback((id: number) => {
    localStorage.setItem('playerId', String(id))
    setPlayerIdState(id)
  }, [])

  const refreshPlayer = useCallback(async () => {
    if (!playerId) return
    try {
      const p = await playerApi.get(playerId)
      setPlayer(p)
    } catch (err) {
      console.error('refreshPlayer failed', err)
    }
  }, [playerId])

  // Load player when playerId becomes available
  useEffect(() => {
    if (playerId && !player) refreshPlayer()
  }, [playerId, player, refreshPlayer])

  const refreshInventory = useCallback(async () => {
    if (!playerId) return
    try {
      const items = await inventoryApi.list(playerId)
      setInventory(items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar inventário')
    }
  }, [playerId])

  const refreshSkills = useCallback(async () => {
    if (!playerId) return
    try {
      const rows = await skillApi.list(playerId)
      setSkills(rows)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar skills')
    }
  }, [playerId])

  const walkMap = useCallback(async () => {
    if (!playerId) return
    setIsLoading(true)
    try {
      const result = await mapApi.walk(playerId)
      appendLog(result.message)
      if (result.encounterOccurred && result.monsterId && result.monsterName && result.monsterHp) {
        setCurrentEncounter({
          monsterId: result.monsterId,
          monsterName: result.monsterName,
          monsterHpInitial: result.monsterHp,
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao andar')
    } finally {
      setIsLoading(false)
    }
  }, [playerId, appendLog])

  const travelTo = useCallback(async (destination: string) => {
    if (!playerId) return
    setIsLoading(true)
    try {
      await mapApi.travel(playerId, destination)
      clearBattleLog()
      clearEncounter()
      const info = await mapApi.get(playerId)
      setMapInfo(info)
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao viajar')
    } finally {
      setIsLoading(false)
    }
  }, [playerId, clearBattleLog, clearEncounter, refreshPlayer])

  const attackMonster = useCallback(async (monsterId: number) => {
    if (!playerId) return
    setIsLoading(true)
    try {
      const result = await battleApi.attack(playerId, monsterId)
      appendLog(result.message)
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atacar')
    } finally {
      clearEncounter()   // always clear — one attack per encounter
      setIsLoading(false)
    }
  }, [playerId, appendLog, refreshPlayer, clearEncounter])

  const refreshMapInfo = useCallback(async () => {
    if (!playerId) return
    try {
      const info = await mapApi.get(playerId)
      setMapInfo(info)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar mapa')
    }
  }, [playerId])

  return (
    <GameContext.Provider value={{
      playerId, setPlayerId,
      player, refreshPlayer,
      currentEncounter, clearEncounter,
      walkMap, travelTo, attackMonster,
      battleLog, clearBattleLog,
      mapInfo, refreshMapInfo,
      inventory, refreshInventory,
      skills, refreshSkills,
      isLoading, captchaVisible, showCaptcha, hideCaptcha,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -50
```

Expected: errors only in component files that import old context fields (`battleState`, `playerSkills`, `currentMap`, `mapMonsters`, `user` from auth). `lib/` itself should be clean.

- [ ] **Step 3: Commit**

```bash
git add lib/game-context.tsx
git commit -m "refactor: rewrite game-context.tsx with walk/encounter/attack model"
```

---

### Task 4: Clean up Layout and Game Page

**Files:**
- Modify: `app/(game)/layout.tsx`
- Modify: `app/(game)/game/page.tsx`

> These files must be updated now so the TS errors from removed context fields don't block Agent A/B.

- [ ] **Step 1: Update `app/(game)/layout.tsx`**

Replace the file content:

```tsx
// app/(game)/layout.tsx
import { GameProvider } from '@/lib/game-context'
import { CaptchaModal } from '@/components/ui/captcha-modal'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      {children}
      <CaptchaModal />
    </GameProvider>
  )
}
```

> Note: `CaptchaModal` doesn't exist yet — this will cause a TS error until Task A1. That is expected and tracked.

- [ ] **Step 2: Update `app/(game)/game/page.tsx`**

Replace the file content:

```tsx
// app/(game)/game/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/lib/game-context'
import { PlayerHUD } from '@/components/game/player-hud'
import { MapPanel } from '@/components/game/map-panel'
import { BattlePanel } from '@/components/game/battle-panel'
import { SkillPanel } from '@/components/game/skill-panel'
import { InventoryPanel } from '@/components/game/inventory-panel'
import { StatusPanel } from '@/components/game/status-panel'
import { ClassChangePanel } from '@/components/game/class-change-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Map, Sparkles, Backpack, User, ArrowUpCircle, Menu, Skull } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export default function GamePage() {
  const router = useRouter()
  const { player, playerId, refreshInventory, refreshSkills } = useGame()

  useEffect(() => {
    if (!playerId) {
      router.push('/')
      return
    }
    refreshInventory()
    refreshSkills()
  }, [playerId, router, refreshInventory, refreshSkills])

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-[family-name:var(--font-pixel-body)] text-xl text-muted-foreground">
          Carregando...
        </p>
      </div>
    )
  }

  // Death overlay
  if (player && player.hpCurrent === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <Skull className="w-16 h-16 text-destructive" />
        <h2 className="font-[family-name:var(--font-pixel)] text-2xl text-destructive">
          VOCÊ MORREU
        </h2>
        <Button
          disabled
          className="font-[family-name:var(--font-pixel)] text-sm opacity-50"
          title="Em breve"
        >
          RESSUSCITAR
          {/* TODO: aguardando endpoint core — POST /api/players/{id}/resurrect */}
        </Button>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-3 border-b border-border">
        <h1 className="font-[family-name:var(--font-pixel)] text-sm text-primary">RAGNAROK</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-card">
            <div className="space-y-4 py-4">
              <PlayerHUD />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 border-r border-border p-4 gap-4">
          <h1 className="font-[family-name:var(--font-pixel)] text-lg text-primary">RAGNAROK</h1>
          <PlayerHUD />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="map" className="flex-1 flex flex-col">
            <div className="flex-1 min-h-0">
              <TabsContent value="map" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <MapPanel />
              </TabsContent>
              <TabsContent value="skills" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <SkillPanel />
              </TabsContent>
              <TabsContent value="inventory" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <InventoryPanel />
              </TabsContent>
              <TabsContent value="status" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <StatusPanel />
              </TabsContent>
              <TabsContent value="class" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ClassChangePanel />
              </TabsContent>
            </div>
            <TabsList className="flex justify-around border-t border-border bg-card h-14 rounded-none">
              <TabsTrigger value="map" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <Map className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">MAPA</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <Sparkles className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">SKILLS</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <Backpack className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">ITENS</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <User className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">STATUS</span>
              </TabsTrigger>
              <TabsTrigger value="class" className="flex-1 flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/20">
                <ArrowUpCircle className="w-4 h-4" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px]">CLASSE</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify TypeScript (errors expected in components — check only lib/ and app/)**

```bash
npx tsc --noEmit 2>&1 | grep "^lib/\|^app/" | head -20
```

Expected: `lib/` has zero errors. `app/(game)/game/page.tsx` and `app/(game)/layout.tsx` may have errors due to components not yet rewritten — that is acceptable here.

- [ ] **Step 4: Commit**

```bash
git add app/\(game\)/layout.tsx app/\(game\)/game/page.tsx
git commit -m "refactor: remove auth dependency from game layout and page, add death overlay"
```

---

## PHASE A — Agent A: Map + Battle + HUD

> Start after all Phase 0 tasks are committed. Tasks A1–A4 can be done in any order.

---

### Task A1: Create `components/ui/captcha-modal.tsx`

**Files:**
- Create: `components/ui/captcha-modal.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/ui/captcha-modal.tsx
'use client'

import { useGame } from '@/lib/game-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

export function CaptchaModal() {
  const { captchaVisible, hideCaptcha } = useGame()

  return (
    <Dialog open={captchaVisible} onOpenChange={(open) => { if (!open) hideCaptcha() }}>
      <DialogContent className="sm:max-w-md bg-card border-2 border-primary">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle className="font-[family-name:var(--font-pixel)] text-sm text-primary">
              VERIFICAÇÃO DE SEGURANÇA
            </DialogTitle>
          </div>
          <DialogDescription className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
            O sistema de segurança detectou atividade incomum. Por favor, confirme que você é humano.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={hideCaptcha}
            className="w-full font-[family-name:var(--font-pixel)] text-sm pixel-button"
          >
            SOU HUMANO
          </Button>
        </DialogFooter>
        {/* TODO: integrar reCAPTCHA/hCaptcha — POST /api/antifraude/captcha/verify */}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "captcha-modal\|layout.tsx" | head -10
```

Expected: zero errors in `captcha-modal.tsx` and `layout.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/captcha-modal.tsx
git commit -m "feat: add CaptchaModal stub for antifraude SHOW_CAPTCHA action"
```

---

### Task A2: Rewrite `components/game/player-hud.tsx`

**Files:**
- Rewrite: `components/game/player-hud.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// components/game/player-hud.tsx
'use client'

import { useGame } from '@/lib/game-context'

function Bar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="w-full bg-muted/50 h-3 border border-border">
      <div
        className={`h-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function PlayerHUD() {
  const { player } = useGame()

  if (!player) {
    return (
      <div className="p-3 text-center font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  return (
    <div className="game-panel p-3 space-y-2">
      {/* Name + class */}
      <div>
        <p className="font-[family-name:var(--font-pixel)] text-xs text-primary truncate">
          {player.name}
        </p>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
          {player.jobClass} — Lv {player.baseLevel} / Job {player.jobLevel}
        </p>
      </div>

      {/* HP bar */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span className="font-[family-name:var(--font-pixel)] text-[10px] text-red-400">HP</span>
          <span className="font-[family-name:var(--font-pixel-body)] text-xs text-muted-foreground">
            {player.hpCurrent} / {player.hpMax}
          </span>
        </div>
        <Bar current={player.hpCurrent} max={player.hpMax} color="bg-red-500" />
      </div>

      {/* SP bar */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span className="font-[family-name:var(--font-pixel)] text-[10px] text-blue-400">SP</span>
          <span className="font-[family-name:var(--font-pixel-body)] text-xs text-muted-foreground">
            {player.spCurrent} / {player.spMax}
          </span>
        </div>
        <Bar current={player.spCurrent} max={player.spMax} color="bg-blue-500" />
      </div>

      {/* Zenny */}
      <div className="flex justify-between items-center pt-1 border-t border-border">
        <span className="font-[family-name:var(--font-pixel)] text-[10px] text-yellow-400">ZENNY</span>
        <span className="font-[family-name:var(--font-pixel-body)] text-sm text-yellow-300">
          {player.zenny.toLocaleString()}z
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "player-hud" | head -10
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/player-hud.tsx
git commit -m "refactor: rewrite player-hud with correct PlayerResponse fields"
```

---

### Task A3: Rewrite `components/game/map-panel.tsx`

**Files:**
- Rewrite: `components/game/map-panel.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// components/game/map-panel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'
import { Footprints, Swords, MapPin, ChevronRight } from 'lucide-react'

export function MapPanel() {
  const {
    playerId, mapInfo, refreshMapInfo, currentEncounter,
    walkMap, travelTo, attackMonster, isLoading
  } = useGame()

  // Throttle refs — 500ms per action (antifraude)
  const walkThrottle = useRef(false)
  const attackThrottle = useRef(false)

  // Seed map info on mount
  useEffect(() => {
    if (playerId && !mapInfo) refreshMapInfo()
  }, [playerId, mapInfo, refreshMapInfo])

  const handleWalk = () => {
    if (walkThrottle.current || isLoading) return
    walkThrottle.current = true
    walkMap().finally(() => {
      setTimeout(() => { walkThrottle.current = false }, 500)
    })
  }

  const handleAttack = () => {
    if (!currentEncounter || attackThrottle.current || isLoading) return
    attackThrottle.current = true
    attackMonster(currentEncounter.monsterId).finally(() => {
      setTimeout(() => { attackThrottle.current = false }, 500)
    })
  }

  const handleTravel = (destination: string) => {
    travelTo(destination)
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
          {mapInfo?.mapName ?? 'Prontera Field'}
        </p>
      </div>

      {/* Encounter Card */}
      {currentEncounter ? (
        <div className="game-panel p-4 border-2 border-destructive/50 bg-destructive/5">
          <p className="font-[family-name:var(--font-pixel)] text-xs text-destructive mb-2">
            ENCONTRO!
          </p>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-[family-name:var(--font-pixel-body)] text-xl text-foreground">
                {currentEncounter.monsterName}
              </p>
              <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
                HP: {currentEncounter.monsterHpInitial}
              </p>
            </div>
            <Swords className="w-8 h-8 text-destructive opacity-70" />
          </div>
          <Button
            onClick={handleAttack}
            disabled={isLoading}
            className="w-full font-[family-name:var(--font-pixel)] text-sm pixel-button bg-destructive hover:bg-destructive/80"
          >
            {isLoading ? 'ATACANDO...' : 'ATACAR'}
          </Button>
        </div>
      ) : (
        /* Walk Button */
        <Button
          onClick={handleWalk}
          disabled={isLoading}
          className="w-full h-14 font-[family-name:var(--font-pixel)] text-sm pixel-button"
        >
          <Footprints className="w-5 h-5 mr-2" />
          {isLoading ? 'ANDANDO...' : 'ANDAR'}
        </Button>
      )}

      {/* Portals */}
      {mapInfo && mapInfo.portals.length > 0 && (
        <div className="game-panel p-4">
          <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">
            PORTAIS DISPONÍVEIS
          </p>
          <div className="space-y-2">
            {mapInfo.portals.map((portal) => (
              <Button
                key={portal}
                variant="outline"
                onClick={() => handleTravel(portal)}
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

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "map-panel\|game-context" | head -10
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/map-panel.tsx
git commit -m "refactor: rewrite map-panel with walk/encounter/travel model"
```

---

### Task A4: Rewrite `components/game/battle-panel.tsx`

**Files:**
- Rewrite: `components/game/battle-panel.tsx`

- [ ] **Step 1: Replace the file**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "battle-panel" | head -10
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/battle-panel.tsx
git commit -m "refactor: rewrite battle-panel as simple battle log display"
```

---

## PHASE B — Agent B: Character Panels

> Start after all Phase 0 tasks are committed. Tasks B1–B4 can be done in any order.

---

### Task B1: Rewrite `app/(game)/create-character/page.tsx`

**Files:**
- Rewrite: `app/(game)/create-character/page.tsx`

> The V0 version had initial stat distribution (30 points). The core API only accepts `{name, jobClass}` — stat distribution is done in-game via StatusPanel. The new create-character page is simpler.

- [ ] **Step 1: Replace the file**

```tsx
// app/(game)/create-character/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles } from 'lucide-react'

const JOB_CLASSES = [
  'NOVICE',
  'SWORDSMAN',
  'MAGE',
  'ARCHER',
  'THIEF',
  'MERCHANT',
  'ACOLYTE',
] as const

export default function CreateCharacterPage() {
  const router = useRouter()
  const { setPlayerId } = useGame()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [jobClass, setJobClass] = useState<string>('NOVICE')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Digite um nome para o personagem')
      return
    }
    if (trimmed.length < 3) {
      toast.error('O nome deve ter pelo menos 3 caracteres')
      return
    }
    if (trimmed.length > 24) {
      toast.error('O nome deve ter no máximo 24 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const player = await playerApi.create(trimmed, jobClass)
      setPlayerId(player.id)
      toast.success(`${player.name} criado com sucesso!`)
      router.push('/game')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar personagem')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="font-[family-name:var(--font-pixel-body)] text-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-pixel)] text-xl text-primary mb-2">
            CRIAR PERSONAGEM
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="game-panel p-6 mb-6 space-y-6">
            {/* Name */}
            <div>
              <label className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-2 block">
                NOME DO PERSONAGEM
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-[family-name:var(--font-pixel-body)] text-xl h-12 bg-input border-2 border-border focus:border-primary"
                placeholder="Digite o nome..."
                maxLength={24}
                disabled={isLoading}
              />
              <p className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground mt-1">
                {name.length}/24 caracteres (mín. 3)
              </p>
            </div>

            {/* Job Class */}
            <div>
              <label className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-2 block">
                CLASSE
              </label>
              <Select value={jobClass} onValueChange={setJobClass} disabled={isLoading}>
                <SelectTrigger className="font-[family-name:var(--font-pixel-body)] text-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_CLASSES.map((cls) => (
                    <SelectItem
                      key={cls}
                      value={cls}
                      className="font-[family-name:var(--font-pixel-body)] text-lg"
                    >
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/30 p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
                  STATS
                </span>
              </div>
              <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
                Distribua seus pontos de atributo em jogo, na aba Status.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || name.trim().length < 3}
            className="w-full h-14 pixel-button font-[family-name:var(--font-pixel)] text-sm"
          >
            {isLoading ? 'CRIANDO...' : 'CRIAR PERSONAGEM'}
          </Button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "create-character" | head -10
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(game\)/create-character/page.tsx
git commit -m "refactor: simplify create-character page to name+jobClass only"
```

---

### Task B2: Rewrite `components/game/inventory-panel.tsx`

**Files:**
- Rewrite: `components/game/inventory-panel.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// components/game/inventory-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { inventoryApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Backpack } from 'lucide-react'
import type { InventoryItem } from '@/lib/types'

export function InventoryPanel() {
  const { playerId, inventory, refreshInventory, refreshPlayer } = useGame()
  const [loading, setLoading] = useState<string | null>(null) // itemId being processed

  useEffect(() => {
    if (playerId) refreshInventory()
  }, [playerId, refreshInventory])

  const handleUse = async (item: InventoryItem) => {
    if (!playerId || loading) return
    setLoading(item.id)
    try {
      const res = await inventoryApi.use(playerId, item.id)
      toast.success(res.message)
      await refreshInventory()
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar item')
    } finally {
      setLoading(null)
    }
  }

  if (inventory.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <Backpack className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
            Inventário vazio.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">
        INVENTÁRIO ({inventory.length} itens)
      </p>
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {inventory.map((item) => (
            <div
              key={item.id}
              className="game-panel p-3 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground truncate">
                    {item.name}
                  </span>
                  {item.equipped && (
                    <Badge variant="secondary" className="font-[family-name:var(--font-pixel)] text-[9px] shrink-0">
                      EQUIPADO
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-[family-name:var(--font-pixel)] text-[9px]">
                    {item.type}
                  </Badge>
                  <span className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
                    x{item.amount}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {item.type === 'CONSUMABLE' && (
                  <Button
                    size="sm"
                    onClick={() => handleUse(item)}
                    disabled={loading === item.id}
                    className="font-[family-name:var(--font-pixel)] text-[10px]"
                  >
                    {loading === item.id ? '...' : 'USAR'}
                  </Button>
                )}
                {(item.type === 'WEAPON' || item.type === 'ARMOR') && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    title="Aguardando implementação no servidor"
                    className="font-[family-name:var(--font-pixel)] text-[10px] opacity-40"
                  >
                    EQUIPAR
                    {/* TODO: aguardando endpoint core — POST /api/players/{id}/inventory/{uuid}/equip */}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "inventory-panel" | head -10
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/inventory-panel.tsx
git commit -m "refactor: rewrite inventory-panel with real API and equip stub"
```

---

### Task B3: Rewrite `components/game/skill-panel.tsx`

**Files:**
- Rewrite: `components/game/skill-panel.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// components/game/skill-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGame } from '@/lib/game-context'
import { skillApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { SkillRow } from '@/lib/types'

export function SkillPanel() {
  const { playerId, player, skills, refreshSkills, refreshPlayer } = useGame()
  const [loading, setLoading] = useState<string | null>(null) // aegisName being processed

  useEffect(() => {
    if (playerId) refreshSkills()
  }, [playerId, refreshSkills])

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
    } finally {
      setLoading(null)
    }
  }

  const handleUse = async (skill: SkillRow) => {
    if (!playerId || loading) return
    setLoading(skill.aegisName)
    try {
      const res = await skillApi.use(playerId, skill.aegisName)
      toast.success(res.message)
      await refreshPlayer()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao usar skill')
    } finally {
      setLoading(null)
    }
  }

  if (skills.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
            Nenhuma skill disponível.
          </p>
        </div>
      </div>
    )
  }

  const skillPoints = player?.skillPoints ?? 0

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
            SKILLS
          </p>
          <span className="font-[family-name:var(--font-pixel-body)] text-sm text-primary">
            {skillPoints} ponto{skillPoints !== 1 ? 's' : ''} disponível{skillPoints !== 1 ? 'is' : ''}
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {skills.map((skill) => (
              <div key={skill.aegisName} className="game-panel p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-[family-name:var(--font-pixel-body)] text-lg text-foreground">
                      {skill.name}
                    </p>
                    <p className="font-[family-name:var(--font-pixel)] text-[10px] text-muted-foreground">
                      Lv {skill.currentLevel} / {skill.maxLevel}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {/* Learn button */}
                    {skill.canLearn && skillPoints > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => handleLearn(skill)}
                        disabled={loading === skill.aegisName}
                        className="font-[family-name:var(--font-pixel)] text-[10px] bg-primary"
                      >
                        {loading === skill.aegisName ? '...' : 'APRENDER'}
                      </Button>
                    ) : !skill.canLearn && skill.blockedReason ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="font-[family-name:var(--font-pixel)] text-[10px] opacity-40"
                            >
                              APRENDER
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-[family-name:var(--font-pixel-body)] text-sm">
                            {skill.blockedReason}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}

                    {/* Use button — for skills with currentLevel > 0 */}
                    {skill.currentLevel > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUse(skill)}
                        disabled={loading === skill.aegisName}
                        className="font-[family-name:var(--font-pixel)] text-[10px]"
                      >
                        {loading === skill.aegisName ? '...' : 'USAR'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "skill-panel" | head -10
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/skill-panel.tsx
git commit -m "refactor: rewrite skill-panel with aegisName API calls and learn/use buttons"
```

---

### Task B4: Rewrite `components/game/status-panel.tsx`

**Files:**
- Rewrite: `components/game/status-panel.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// components/game/status-panel.tsx
'use client'

import { useState } from 'react'
import { useGame } from '@/lib/game-context'
import { playerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

type StatKey = 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk'

// Maps display label → PlayerResponse field → API payload key
const STATS: { label: string; field: keyof import('@/lib/types').PlayerResponse; apiKey: StatKey }[] = [
  { label: 'STR', field: 'str', apiKey: 'str' },
  { label: 'AGI', field: 'agi', apiKey: 'agi' },
  { label: 'VIT', field: 'vit', apiKey: 'vit' },
  { label: 'INT', field: 'intelligence', apiKey: 'int' }, // NOTE: field="intelligence", api payload key="int"
  { label: 'DEX', field: 'dex', apiKey: 'dex' },
  { label: 'LUK', field: 'luk', apiKey: 'luk' },
]

function Bar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div className="w-full bg-muted/50 h-2 border border-border">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
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
      toast.error(err instanceof Error ? err.message : 'Distribuição de stats não disponível ainda')
    } finally {
      setLoading(null)
    }
  }

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
          Carregando...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto gap-4">
      {/* Identity */}
      <div className="game-panel p-4">
        <p className="font-[family-name:var(--font-pixel)] text-lg text-primary">{player.name}</p>
        <p className="font-[family-name:var(--font-pixel-body)] text-lg text-muted-foreground">
          {player.jobClass}
        </p>
        <div className="flex gap-4 mt-2">
          <span className="font-[family-name:var(--font-pixel-body)] text-sm text-foreground">
            Base Lv {player.baseLevel}
          </span>
          <span className="font-[family-name:var(--font-pixel-body)] text-sm text-foreground">
            Job Lv {player.jobLevel}
          </span>
          <span className="font-[family-name:var(--font-pixel-body)] text-sm text-yellow-300">
            {player.zenny.toLocaleString()} z
          </span>
        </div>
      </div>

      {/* HP / SP */}
      <div className="game-panel p-4 space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-[family-name:var(--font-pixel)] text-[10px] text-red-400">HP</span>
            <span className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
              {player.hpCurrent} / {player.hpMax}
            </span>
          </div>
          <Bar current={player.hpCurrent} max={player.hpMax} color="bg-red-500" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-[family-name:var(--font-pixel)] text-[10px] text-blue-400">SP</span>
            <span className="font-[family-name:var(--font-pixel-body)] text-sm text-muted-foreground">
              {player.spCurrent} / {player.spMax}
            </span>
          </div>
          <Bar current={player.spCurrent} max={player.spMax} color="bg-blue-500" />
        </div>
      </div>

      {/* Points to distribute */}
      {player.statPoints > 0 && (
        <div className="bg-primary/10 border border-primary/30 p-3 text-center">
          <span className="font-[family-name:var(--font-pixel)] text-xs text-primary">
            {player.statPoints} ponto{player.statPoints !== 1 ? 's' : ''} de atributo disponível{player.statPoints !== 1 ? 'is' : ''}
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div className="game-panel p-4">
        <p className="font-[family-name:var(--font-pixel)] text-xs text-foreground mb-3">ATRIBUTOS</p>
        <div className="space-y-2">
          {STATS.map(({ label, field, apiKey }) => (
            <div key={apiKey} className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-pixel)] text-xs text-primary w-10">
                {label}
              </span>
              <span className="font-[family-name:var(--font-pixel)] text-lg text-foreground flex-1 text-center">
                {player[field] as number}
              </span>
              {player.statPoints > 0 && (
                <Button
                  size="icon"
                  variant="outline"
                  className="w-7 h-7"
                  disabled={loading === apiKey}
                  onClick={() => handleDistribute(apiKey)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skill points */}
      <div className="game-panel p-4">
        <div className="flex justify-between">
          <span className="font-[family-name:var(--font-pixel)] text-xs text-foreground">
            PONTOS DE SKILL
          </span>
          <span className="font-[family-name:var(--font-pixel)] text-lg text-primary">
            {player.skillPoints}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "status-panel" | head -10
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/game/status-panel.tsx
git commit -m "refactor: rewrite status-panel with correct PlayerResponse fields and stat distribution"
```

---

## PHASE FINAL — Build Verification

> Run after both Agent A and Agent B have committed all tasks.

---

### Task F1: Full TypeScript + Build Check

- [ ] **Step 1: Run full TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: zero errors. If errors remain, fix them before proceeding.

- [ ] **Step 2: Run Next.js build**

```bash
npm run build 2>&1
```

Expected: build completes successfully with no type errors. Warnings about unoptimized images are acceptable.

- [ ] **Step 3: Manual smoke test (requires backend running on port 8080)**

```
1. Open http://localhost:3000
2. Go to /create-character
3. Enter name "TestChar", select class NOVICE, click CRIAR PERSONAGEM
4. Should redirect to /game
5. Click ANDAR — should log a message in BattlePanel
6. If encounter: click ATACAR — should log attack message, encounter clears
7. Open Inventário tab — items should load
8. Open Skills tab — skills should load
9. Open Status tab — all stats visible
```

- [ ] **Step 4: Verify antifraude header**

Open DevTools → Network tab → make any API call → confirm `X-Action-Timestamp` header is present on all requests to `/api/*`.

- [ ] **Step 5: Commit final verification**

```bash
git add -A
git commit -m "refactor: ragnarok-front complete — aligned with ragnarok-core API"
```

---

## Known Stubs (for future integration)

| Feature | File | TODO comment |
|---------|------|-------------|
| Equipar item | `inventory-panel.tsx` | `POST /api/players/{id}/inventory/{uuid}/equip` |
| Class change API | `class-change-panel.tsx` (unchanged) | `POST /api/players/{id}/class/change` |
| Ressuscitar | `game/page.tsx` | `POST /api/players/{id}/resurrect` |
| Captcha verification | `captcha-modal.tsx` | `POST /api/antifraude/captcha/verify` |
| Auth JWT | `app/(auth)/login`, `app/(auth)/register` | `POST /api/auth/login`, `POST /api/auth/register` |
